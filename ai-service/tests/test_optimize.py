"""Tests for the portfolio optimization endpoint"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_optimize_endpoint_exists():
    """Test that the /optimize endpoint is accessible"""
    response = client.post("/optimize", json={
        "current_allocation": {
            "Solar": 25.0,
            "River_Cleanup": 25.0,
            "Reforestation": 25.0,
            "Carbon_Capture": 25.0
        },
        "recent_events": []
    })
    assert response.status_code == 200

def test_optimize_with_no_events():
    """Test optimization with no recent events"""
    response = client.post("/optimize", json={
        "current_allocation": {
            "Solar": 25.0,
            "River_Cleanup": 25.0,
            "Reforestation": 25.0,
            "Carbon_Capture": 25.0
        },
        "recent_events": []
    })
    
    assert response.status_code == 200
    data = response.json()
    
    assert "recommended_allocation" in data
    assert "decision_logic" in data
    assert "impact_per_dollar_ratios" in data
    assert "rebalancing_needed" in data
    assert data["rebalancing_needed"] == False

def test_optimize_with_high_performing_category():
    """Test optimization when one category has 20%+ higher performance"""
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
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["rebalancing_needed"] == True
    assert data["recommended_allocation"]["Solar"] > 25.0
    # Verify allocations sum to 100%
    total = sum(data["recommended_allocation"].values())
    assert abs(total - 100.0) < 0.01

def test_optimize_response_structure():
    """Test that response has correct structure"""
    response = client.post("/optimize", json={
        "current_allocation": {
            "Solar": 25.0,
            "River_Cleanup": 25.0,
            "Reforestation": 25.0,
            "Carbon_Capture": 25.0
        },
        "recent_events": [
            {"event_type": "Solar", "impact_score": 80.0}
        ]
    })
    
    assert response.status_code == 200
    data = response.json()
    
    # Check all required fields
    assert isinstance(data["recommended_allocation"], dict)
    assert isinstance(data["decision_logic"], str)
    assert isinstance(data["impact_per_dollar_ratios"], dict)
    assert isinstance(data["rebalancing_needed"], bool)

def test_optimize_allocation_sum():
    """Test that recommended allocation always sums to 100%"""
    response = client.post("/optimize", json={
        "current_allocation": {
            "Solar": 30.0,
            "River_Cleanup": 20.0,
            "Reforestation": 25.0,
            "Carbon_Capture": 25.0
        },
        "recent_events": [
            {"event_type": "Reforestation", "impact_score": 150.0},
            {"event_type": "Reforestation", "impact_score": 140.0},
            {"event_type": "Solar", "impact_score": 60.0},
            {"event_type": "River_Cleanup", "impact_score": 55.0},
            {"event_type": "Carbon_Capture", "impact_score": 58.0}
        ]
    })
    
    assert response.status_code == 200
    data = response.json()
    
    total = sum(data["recommended_allocation"].values())
    assert abs(total - 100.0) < 0.01

def test_optimize_no_rebalancing_when_similar_performance():
    """Test that no rebalancing occurs when all categories perform similarly"""
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
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["rebalancing_needed"] == False
    # Should maintain current allocation
    assert data["recommended_allocation"]["Solar"] == 25.0

def test_optimize_impact_ratios_calculated():
    """Test that impact-per-dollar ratios are correctly calculated"""
    response = client.post("/optimize", json={
        "current_allocation": {
            "Solar": 25.0,
            "River_Cleanup": 25.0,
            "Reforestation": 25.0,
            "Carbon_Capture": 25.0
        },
        "recent_events": [
            {"event_type": "Solar", "impact_score": 100.0},
            {"event_type": "Solar", "impact_score": 80.0},
            {"event_type": "River_Cleanup", "impact_score": 50.0}
        ]
    })
    
    assert response.status_code == 200
    data = response.json()
    
    # Weighted ratios incorporate readiness, proof confidence, and cost defaults.
    assert abs(data["impact_per_dollar_ratios"]["Solar"] - 73.8) < 0.01
    assert abs(data["impact_per_dollar_ratios"]["River_Cleanup"] - 41.0) < 0.01
    # Categories with no events should have 0.0
    assert data["impact_per_dollar_ratios"]["Reforestation"] == 0.0
    assert data["impact_per_dollar_ratios"]["Carbon_Capture"] == 0.0
