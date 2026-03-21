"""Manual test script to verify the optimize endpoint"""
import sys
import json
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

print("Testing /optimize endpoint...")
print("=" * 60)

# Test 1: No events
print("\nTest 1: No events")
response = client.post("/optimize", json={
    "current_allocation": {
        "Solar": 25.0,
        "River_Cleanup": 25.0,
        "Reforestation": 25.0,
        "Carbon_Capture": 25.0
    },
    "recent_events": []
})
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Test 2: High performing category
print("\n" + "=" * 60)
print("\nTest 2: Solar performing 20%+ better")
response = client.post("/optimize", json={
    "current_allocation": {
        "Solar": 25.0,
        "River_Cleanup": 25.0,
        "Reforestation": 25.0,
        "Carbon_Capture": 25.0
    },
    "recent_events": [
        {"event_type": "Solar", "impact_score": 100.0},
        {"event_type": "Solar", "impact_score": 120.0},
        {"event_type": "River_Cleanup", "impact_score": 50.0},
        {"event_type": "Reforestation", "impact_score": 45.0},
        {"event_type": "Carbon_Capture", "impact_score": 48.0}
    ]
})
print(f"Status: {response.status_code}")
data = response.json()
print(f"Rebalancing needed: {data['rebalancing_needed']}")
print(f"Recommended allocation: {json.dumps(data['recommended_allocation'], indent=2)}")
print(f"Decision logic: {data['decision_logic']}")
print(f"Impact ratios: {json.dumps(data['impact_per_dollar_ratios'], indent=2)}")

# Verify sum is 100%
total = sum(data['recommended_allocation'].values())
print(f"Total allocation: {total:.2f}%")

# Test 3: Similar performance
print("\n" + "=" * 60)
print("\nTest 3: All categories performing similarly")
response = client.post("/optimize", json={
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
})
print(f"Status: {response.status_code}")
data = response.json()
print(f"Rebalancing needed: {data['rebalancing_needed']}")
print(f"Decision logic: {data['decision_logic']}")

print("\n" + "=" * 60)
print("\nAll tests completed!")
