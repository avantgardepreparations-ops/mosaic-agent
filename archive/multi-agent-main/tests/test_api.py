import pytest
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


def test_health():
    """Test health endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root():
    """Test root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert "MOSAICMIND" in data["separation_warning"]


def test_infer_mock():
    """Test infer endpoint with mock processing."""
    payload = {
        "input": "Hello world",
        "userId": "test-user"
    }
    
    response = client.post("/api/v1/infer", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "output" in data
    assert "trace" in data
    assert data["trace"]["user_id"] == "test-user"


def test_infer_without_user():
    """Test infer endpoint without user ID."""
    payload = {
        "input": "Test input"
    }
    
    response = client.post("/api/v1/infer", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "output" in data
    assert "trace" in data


def test_conversation_crud():
    """Test conversation CRUD operations."""
    # Create conversation
    create_payload = {
        "title": "Test Conversation",
        "user_id": "test-user"
    }
    
    create_response = client.post("/api/v1/conversations", json=create_payload)
    assert create_response.status_code == 200
    
    conversation = create_response.json()
    assert conversation["title"] == "Test Conversation"
    assert conversation["user_id"] == "test-user"
    assert "id" in conversation
    
    conversation_id = conversation["id"]
    
    # Get conversation
    get_response = client.get(f"/api/v1/conversations/{conversation_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == conversation_id
    
    # List conversations
    list_response = client.get("/api/v1/conversations")
    assert list_response.status_code == 200
    assert "conversations" in list_response.json()
    
    # Delete conversation
    delete_response = client.delete(f"/api/v1/conversations/{conversation_id}")
    assert delete_response.status_code == 200
    
    # Verify deletion
    get_deleted_response = client.get(f"/api/v1/conversations/{conversation_id}")
    assert get_deleted_response.status_code == 404


def test_conversation_not_found():
    """Test getting non-existent conversation."""
    response = client.get("/api/v1/conversations/non-existent-id")
    assert response.status_code == 404