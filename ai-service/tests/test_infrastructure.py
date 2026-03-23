"""Infrastructure tests for AI service"""
from fastapi.testclient import TestClient
from main import app, mean

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

def test_mean_helper():
    """Test that the lightweight averaging helper works for optimizer calculations"""
    assert mean([1, 2, 3]) == 2
    assert mean([]) == 0.0
