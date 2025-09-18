import pytest
import tempfile
import os
from app.services.conversation import ConversationService
from app.services.storage import AtomicJsonStorage


@pytest.fixture
def temp_conversation_service():
    """Create conversation service with temporary storage."""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Override the global storage for testing
        original_storage = ConversationService.__dict__.get('storage')
        test_storage = AtomicJsonStorage(temp_dir)
        
        # Monkey patch for testing
        import app.services.conversation
        app.services.conversation.storage = test_storage
        
        yield ConversationService
        
        # Restore original storage if it existed
        if original_storage:
            app.services.conversation.storage = original_storage


def test_create_conversation(temp_conversation_service):
    """Test conversation creation."""
    conversation = temp_conversation_service.create_conversation(
        user_id="test-user",
        title="Test Conversation"
    )
    
    assert conversation["title"] == "Test Conversation"
    assert conversation["user_id"] == "test-user"
    assert "id" in conversation
    assert "created_at" in conversation
    assert conversation["messages"] == []


def test_get_conversation(temp_conversation_service):
    """Test retrieving a conversation."""
    # Create conversation
    created = temp_conversation_service.create_conversation(
        title="Get Test"
    )
    conversation_id = created["id"]
    
    # Get conversation
    retrieved = temp_conversation_service.get_conversation(conversation_id)
    assert retrieved is not None
    assert retrieved["id"] == conversation_id
    assert retrieved["title"] == "Get Test"


def test_get_nonexistent_conversation(temp_conversation_service):
    """Test getting a conversation that doesn't exist."""
    result = temp_conversation_service.get_conversation("nonexistent-id")
    assert result is None


def test_list_conversations(temp_conversation_service):
    """Test listing conversations."""
    # Create multiple conversations
    conv1 = temp_conversation_service.create_conversation(
        user_id="user1", title="Conv 1"
    )
    conv2 = temp_conversation_service.create_conversation(
        user_id="user2", title="Conv 2"
    )
    conv3 = temp_conversation_service.create_conversation(
        user_id="user1", title="Conv 3"
    )
    
    # List all conversations
    all_conversations = temp_conversation_service.list_conversations()
    assert len(all_conversations) == 3
    
    # List conversations for specific user
    user1_conversations = temp_conversation_service.list_conversations("user1")
    assert len(user1_conversations) == 2
    
    user2_conversations = temp_conversation_service.list_conversations("user2")
    assert len(user2_conversations) == 1


def test_add_message(temp_conversation_service):
    """Test adding messages to a conversation."""
    # Create conversation
    conversation = temp_conversation_service.create_conversation()
    conversation_id = conversation["id"]
    
    # Add message
    success = temp_conversation_service.add_message(
        conversation_id, "Hello world", "user"
    )
    assert success
    
    # Verify message was added
    retrieved = temp_conversation_service.get_conversation(conversation_id)
    assert len(retrieved["messages"]) == 1
    assert retrieved["messages"][0]["content"] == "Hello world"
    assert retrieved["messages"][0]["role"] == "user"


def test_delete_conversation(temp_conversation_service):
    """Test deleting a conversation."""
    # Create conversation
    conversation = temp_conversation_service.create_conversation()
    conversation_id = conversation["id"]
    
    # Verify it exists
    assert temp_conversation_service.get_conversation(conversation_id) is not None
    
    # Delete it
    success = temp_conversation_service.delete_conversation(conversation_id)
    assert success
    
    # Verify it's gone
    assert temp_conversation_service.get_conversation(conversation_id) is None


def test_ensure_user(temp_conversation_service):
    """Test user creation and retrieval."""
    user_id = "test-user"
    user_data = {"name": "Test User", "email": "test@example.com"}
    
    # Ensure user (create)
    created_user = temp_conversation_service.ensure_user(user_id, user_data)
    assert created_user["id"] == user_id
    assert created_user["name"] == "Test User"
    
    # Ensure same user again (should return existing)
    existing_user = temp_conversation_service.ensure_user(user_id)
    assert existing_user["id"] == user_id
    assert existing_user["name"] == "Test User"  # Should preserve existing data