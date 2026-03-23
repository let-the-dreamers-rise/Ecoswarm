from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any
import numpy as np
import os
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv('../.env')

app = FastAPI(title="EcoSwarm AI Portfolio Optimizer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class OptimizeRequest(BaseModel):
    current_allocation: Dict[str, float]
    recent_events: List[Dict[str, Any]]

class OptimizeResponse(BaseModel):
    recommended_allocation: Dict[str, float]
    decision_logic: str
    impact_per_dollar_ratios: Dict[str, float]
    rebalancing_needed: bool

URGENCY_MULTIPLIERS = {
    "stable": 1.0,
    "elevated": 1.15,
    "critical": 1.3,
}

READINESS_MULTIPLIERS = {
    "hold": 0.82,
    "review": 1.04,
    "release": 1.18,
}

def calculate_weighted_impact(event: Dict[str, Any]) -> float:
    impact_score = float(event.get("impact_score") or 0.0)
    urgency_level = str(event.get("urgency_level") or "stable")
    verification_confidence = float(event.get("verification_confidence") or 1.0)
    households_supported = max(float(event.get("households_supported") or 0.0), 0.0)
    cost_per_impact_unit = max(float(event.get("cost_per_impact_unit_usd") or 1.0), 1.0)
    release_readiness = str(event.get("release_readiness") or "hold")
    payout_recommendation_usd = max(float(event.get("payout_recommendation_usd") or 0.0), 1.0)
    upfront_release_usd = max(float(event.get("upfront_release_usd") or 0.0), 0.0)
    risk_flag_count = max(float(event.get("risk_flag_count") or 0.0), 0.0)

    urgency_multiplier = URGENCY_MULTIPLIERS.get(urgency_level, 1.0)
    verification_multiplier = 0.75 + (min(max(verification_confidence, 0.0), 1.0) * 0.25)
    community_multiplier = 1.0 + min(households_supported / 400.0, 0.35)
    readiness_multiplier = READINESS_MULTIPLIERS.get(release_readiness, 0.82)
    treasury_velocity = 1.0 + min((upfront_release_usd / payout_recommendation_usd) * 0.2, 0.12)
    risk_penalty = max(0.82, 1.0 - min(risk_flag_count * 0.04, 0.18))

    return (
        impact_score
        * urgency_multiplier
        * verification_multiplier
        * community_multiplier
        * readiness_multiplier
        * treasury_velocity
        * risk_penalty
        / cost_per_impact_unit
    )

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ecoswarm-ai-optimizer"}

@app.post("/optimize")
async def optimize(request: OptimizeRequest) -> OptimizeResponse:
    """
    Calculate optimal portfolio allocation based on recent event performance.
    Favors categories with at least 20% higher average impact scores.
    """
    # Calculate average impact score per category
    category_scores: Dict[str, List[float]] = {}
    
    for event in request.recent_events:
        event_type = event.get('event_type')
        weighted_impact = calculate_weighted_impact(event)
        
        if event_type and weighted_impact is not None:
            if event_type not in category_scores:
                category_scores[event_type] = []
            category_scores[event_type].append(weighted_impact)
    
    # Calculate average impact per category (impact-per-dollar ratio)
    impact_per_dollar_ratios: Dict[str, float] = {}
    for category, scores in category_scores.items():
        impact_per_dollar_ratios[category] = np.mean(scores) if scores else 0.0
    
    # Ensure all categories from current allocation are represented
    for category in request.current_allocation.keys():
        if category not in impact_per_dollar_ratios:
            impact_per_dollar_ratios[category] = 0.0
    
    # Determine if any category has 20%+ higher average than others
    if not impact_per_dollar_ratios or all(v == 0 for v in impact_per_dollar_ratios.values()):
        # No data or all zeros - keep current allocation
        return OptimizeResponse(
            recommended_allocation=request.current_allocation,
            decision_logic="Insufficient data to optimize. Maintaining current allocation.",
            impact_per_dollar_ratios=impact_per_dollar_ratios,
            rebalancing_needed=False
        )
    
    # Find max and average impact ratios
    max_ratio = max(impact_per_dollar_ratios.values())
    avg_ratio = np.mean(list(impact_per_dollar_ratios.values()))
    
    # Check if max is at least 20% higher than average
    threshold = avg_ratio * 1.2
    rebalancing_needed = max_ratio >= threshold
    
    if not rebalancing_needed:
        return OptimizeResponse(
            recommended_allocation=request.current_allocation,
            decision_logic=f"No significant performance difference detected. Max ratio {max_ratio:.2f} is less than 20% above average {avg_ratio:.2f}. Maintaining current allocation.",
            impact_per_dollar_ratios=impact_per_dollar_ratios,
            rebalancing_needed=False
        )
    
    # Find the best performing category
    best_category = max(impact_per_dollar_ratios, key=impact_per_dollar_ratios.get)
    
    # Calculate new allocation - increase best performer, decrease others proportionally
    new_allocation = request.current_allocation.copy()
    
    # Increase best category by 10 percentage points (or to max 40%)
    current_best = new_allocation.get(best_category, 25.0)
    increase_amount = min(10.0, 40.0 - current_best)
    new_allocation[best_category] = current_best + increase_amount
    
    # Decrease other categories proportionally
    other_categories = [cat for cat in new_allocation.keys() if cat != best_category]
    if other_categories:
        decrease_per_category = increase_amount / len(other_categories)
        for cat in other_categories:
            new_allocation[cat] = max(10.0, new_allocation[cat] - decrease_per_category)
    
    # Normalize to ensure sum is exactly 100%
    total = sum(new_allocation.values())
    new_allocation = {cat: (val / total) * 100 for cat, val in new_allocation.items()}
    
    decision_logic = (
        f"Rebalancing recommended. {best_category} now delivers the strongest deployable impact-per-dollar "
        f"({impact_per_dollar_ratios[best_category]:.2f}) after factoring urgency, proof confidence, "
        f"community reach, payout readiness, treasury velocity, and delivery cost. This is "
        f"{((impact_per_dollar_ratios[best_category] / avg_ratio - 1) * 100):.1f}% above portfolio average, "
        f"so allocation increases from {current_best:.1f}% to {new_allocation[best_category]:.1f}%."
    )
    
    return OptimizeResponse(
        recommended_allocation=new_allocation,
        decision_logic=decision_logic,
        impact_per_dollar_ratios=impact_per_dollar_ratios,
        rebalancing_needed=True
    )

# ──────────────── Gemini LLM Analysis Endpoint ────────────────

class AnalyzeRequest(BaseModel):
    project_name: str
    event_type: str
    impact_score: float = 0.0
    urgency_level: str = "stable"
    verification_confidence: float = 0.0
    households_supported: int = 0
    cost_per_impact_unit_usd: float = 1.0
    release_readiness: str = "hold"
    payout_recommendation_usd: float = 0.0
    proof_hash: str = ""
    sponsor_name: str = ""
    verifier_name: str = ""
    local_operator_name: str = ""
    risk_flags: list = []
    location_label: str = ""

class AnalyzeResponse(BaseModel):
    risk_assessment: str
    impact_analysis: str
    funding_recommendation: str
    confidence_score: float
    key_considerations: list
    ai_model: str
    generated_at: str

def build_analysis_prompt(req: AnalyzeRequest) -> str:
    return f"""You are a climate finance analyst evaluating a sustainability project for milestone-based funding release.

PROJECT DETAILS:
- Name: {req.project_name}
- Type: {req.event_type}
- Location: {req.location_label}
- Impact Score: {req.impact_score}/100
- Urgency Level: {req.urgency_level}
- Verification Confidence: {req.verification_confidence * 100:.0f}%
- Households Supported: {req.households_supported}
- Cost per Impact Unit: ${req.cost_per_impact_unit_usd}
- Release Readiness: {req.release_readiness}
- Payout Recommendation: ${req.payout_recommendation_usd:,.0f}
- Sponsor: {req.sponsor_name or 'Not assigned'}
- Verifier: {req.verifier_name or 'Not assigned'}
- Local Operator: {req.local_operator_name or 'Not assigned'}
- Proof Hash: {req.proof_hash or 'None'}
- Risk Flags: {', '.join(req.risk_flags) if req.risk_flags else 'None'}

Provide your analysis in EXACTLY this JSON format (no markdown, no code blocks):
{{
  "risk_assessment": "2-3 sentence risk assessment of this project for funding release",
  "impact_analysis": "2-3 sentence analysis of the environmental and social impact potential",
  "funding_recommendation": "Clear recommendation: APPROVE, HOLD, or REJECT with 1-2 sentence justification",
  "confidence_score": 0.85,
  "key_considerations": ["consideration 1", "consideration 2", "consideration 3"]
}}"""


@app.post("/analyze")
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """
    Use Gemini LLM to produce a qualitative risk assessment, impact analysis,
    and funding recommendation for a sustainability project case.
    Falls back to rule-based analysis if Gemini API key is not available.
    """
    import json
    from datetime import datetime

    gemini_key = os.getenv("GEMINI_API_KEY")
    ai_model = "gemini-2.0-flash"

    if gemini_key:
        try:
            from google import genai

            client = genai.Client(api_key=gemini_key)
            prompt = build_analysis_prompt(request)

            response = client.models.generate_content(
                model=ai_model,
                contents=prompt
            )

            raw = response.text.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()

            parsed = json.loads(raw)

            return AnalyzeResponse(
                risk_assessment=parsed.get("risk_assessment", "Analysis unavailable"),
                impact_analysis=parsed.get("impact_analysis", "Analysis unavailable"),
                funding_recommendation=parsed.get("funding_recommendation", "HOLD — insufficient data"),
                confidence_score=float(parsed.get("confidence_score", 0.5)),
                key_considerations=parsed.get("key_considerations", []),
                ai_model=ai_model,
                generated_at=datetime.utcnow().isoformat() + "Z"
            )
        except Exception as e:
            print(f"[AI] Gemini analysis failed, falling back to rule-based: {e}")

    # ── Rule-based fallback ──
    risk_level = "LOW"
    if request.risk_flags:
        risk_level = "HIGH" if len(request.risk_flags) >= 2 else "MEDIUM"

    rec = "APPROVE" if request.release_readiness == "release" and request.verification_confidence > 0.7 else "HOLD"

    return AnalyzeResponse(
        risk_assessment=f"Project {request.project_name} has {risk_level} risk based on {len(request.risk_flags)} flag(s). "
                        f"Verification confidence is {request.verification_confidence * 100:.0f}%. "
                        f"{'Urgency is elevated, requiring faster review.' if request.urgency_level != 'stable' else 'Standard review timeline applies.'}",
        impact_analysis=f"This {request.event_type} project supports {request.households_supported} households at "
                        f"${request.cost_per_impact_unit_usd}/impact unit. Impact score of {request.impact_score:.1f}/100 "
                        f"{'exceeds the portfolio average' if request.impact_score > 50 else 'is below the portfolio average'}.",
        funding_recommendation=f"{rec} — {'Release readiness confirmed with strong verification' if rec == 'APPROVE' else 'Awaiting higher verification confidence or release readiness upgrade'}.",
        confidence_score=min(request.verification_confidence * 0.8 + 0.2, 1.0),
        key_considerations=[
            f"Verification confidence: {request.verification_confidence * 100:.0f}%",
            f"Risk flags: {len(request.risk_flags)}",
            f"Cost efficiency: ${request.cost_per_impact_unit_usd}/unit",
            f"Community reach: {request.households_supported} households",
            f"Payout recommendation: ${request.payout_recommendation_usd:,.0f}"
        ],
        ai_model="rule-based-fallback",
        generated_at=datetime.utcnow().isoformat() + "Z"
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
