"""
Example usage of the /optimize endpoint
This demonstrates how the backend will call the AI service
"""

import requests
import json

# Example 1: No rebalancing needed (similar performance)
print("Example 1: Similar performance across categories")
print("=" * 60)

request_data = {
    "current_allocation": {
        "Solar": 25.0,
        "River_Cleanup": 25.0,
        "Reforestation": 25.0,
        "Carbon_Capture": 25.0
    },
    "recent_events": [
        {"event_type": "Solar", "impact_score": 70.0},
        {"event_type": "River_Cleanup", "impact_score": 72.0},
        {"event_type": "Reforestation", "impact_score": 68.0},
        {"event_type": "Carbon_Capture", "impact_score": 71.0}
    ]
}

print("Request:")
print(json.dumps(request_data, indent=2))
print("\nExpected Response:")
print("  - rebalancing_needed: False")
print("  - recommended_allocation: Same as current")
print("  - decision_logic: No significant performance difference")

# Example 2: Rebalancing needed (Solar performing 20%+ better)
print("\n\nExample 2: Solar performing significantly better")
print("=" * 60)

request_data = {
    "current_allocation": {
        "Solar": 25.0,
        "River_Cleanup": 25.0,
        "Reforestation": 25.0,
        "Carbon_Capture": 25.0
    },
    "recent_events": [
        {"event_type": "Solar", "impact_score": 100.0},
        {"event_type": "Solar", "impact_score": 120.0},
        {"event_type": "Solar", "impact_score": 110.0},
        {"event_type": "River_Cleanup", "impact_score": 50.0},
        {"event_type": "Reforestation", "impact_score": 45.0},
        {"event_type": "Carbon_Capture", "impact_score": 48.0}
    ]
}

print("Request:")
print(json.dumps(request_data, indent=2))
print("\nExpected Response:")
print("  - rebalancing_needed: True")
print("  - recommended_allocation: Solar increased to ~35%")
print("  - impact_per_dollar_ratios: Solar ~110, others ~45-50")
print("  - decision_logic: Explains Solar's superior performance")

# Example 3: No events (insufficient data)
print("\n\nExample 3: No recent events")
print("=" * 60)

request_data = {
    "current_allocation": {
        "Solar": 25.0,
        "River_Cleanup": 25.0,
        "Reforestation": 25.0,
        "Carbon_Capture": 25.0
    },
    "recent_events": []
}

print("Request:")
print(json.dumps(request_data, indent=2))
print("\nExpected Response:")
print("  - rebalancing_needed: False")
print("  - recommended_allocation: Same as current")
print("  - decision_logic: Insufficient data to optimize")

print("\n" + "=" * 60)
print("\nTo test these examples:")
print("1. Start the AI service: python main.py")
print("2. Use curl or Postman to POST to http://localhost:8000/optimize")
print("3. Or run the test suite: pytest tests/test_optimize.py")
