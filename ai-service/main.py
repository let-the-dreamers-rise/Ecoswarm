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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
