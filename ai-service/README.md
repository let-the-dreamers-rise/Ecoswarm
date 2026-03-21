# EcoSwarm AI Portfolio Optimizer

AI microservice for optimizing climate portfolio allocation based on impact scores.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Configure environment variables in `../.env`:
   - AI_SERVICE_PORT (default: 8000)

3. Run development server:
   ```bash
   python main.py
   ```

4. Run tests:
   ```bash
   pytest
   ```

## API Endpoints

- `GET /health` - Health check endpoint
- `POST /optimize` - Calculate optimal portfolio allocation based on recent event performance

### POST /optimize

Accepts:
```json
{
  "current_allocation": {
    "Solar": 25.0,
    "River_Cleanup": 25.0,
    "Reforestation": 25.0,
    "Carbon_Capture": 25.0
  },
  "recent_events": [
    {"event_type": "Solar", "impact_score": 100.0},
    {"event_type": "River_Cleanup", "impact_score": 50.0}
  ]
}
```

Returns:
```json
{
  "recommended_allocation": {
    "Solar": 35.0,
    "River_Cleanup": 21.67,
    "Reforestation": 21.67,
    "Carbon_Capture": 21.67
  },
  "decision_logic": "Rebalancing recommended. Solar shows superior performance...",
  "impact_per_dollar_ratios": {
    "Solar": 100.0,
    "River_Cleanup": 50.0,
    "Reforestation": 0.0,
    "Carbon_Capture": 0.0
  },
  "rebalancing_needed": true
}
```

## Dependencies

- FastAPI: Web framework
- Uvicorn: ASGI server
- NumPy: Numerical calculations
- Pydantic: Data validation
- python-dotenv: Environment variable management
