"""Infrastructure tests for AI service"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    """Test that health endpoint is accessible"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "ecoswarm-ai-optimizer"}

def test_fastapi_app_exists():
    """Test that FastAPI app is properly initialized"""
    assert app is not None
    assert app.title == "EcoSwarm AI Portfolio Optimizer"

def test_numpy_available():
    """Test that NumPy is available for calculations"""
    import numpy as np
    assert np is not None
    # Test basic numpy operation
    arr = np.array([1, 2, 3])
    assert arr.sum() == 6
