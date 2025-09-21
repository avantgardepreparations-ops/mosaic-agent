from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid
from .storage import storage


class ConversationService:
    """Service for managing conversations."""
    
    CONVERSATIONS_FILE = "conversations.json"
    USERS_FILE = "users.json"
    PROJECTS_FILE = "projects.json"
    
    @staticmethod
    def create_conversation(user_id: Optional[str] = None, project_id: Optional[str] = None, 
                          title: str = "New Conversation") -> Dict[str, Any]:
        """Create a new conversation."""
        conversation_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc).isoformat()
        
        conversation = {
            "id": conversation_id,
            "title": title,
            "user_id": user_id,
            "project_id": project_id,
            "created_at": timestamp,
            "updated_at": timestamp,
            "messages": []
        }
        
        def update_conversations(data):
            if "conversations" not in data:
                data["conversations"] = {}
            data["conversations"][conversation_id] = conversation
            return data
        
        storage.update_json(ConversationService.CONVERSATIONS_FILE, update_conversations)
        return conversation
    
    @staticmethod
    def get_conversation(conversation_id: str) -> Optional[Dict[str, Any]]:
        """Get a conversation by ID."""
        data = storage.read_json(ConversationService.CONVERSATIONS_FILE)
        return data.get("conversations", {}).get(conversation_id)
    
    @staticmethod
    def list_conversations(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List conversations, optionally filtered by user."""
        data = storage.read_json(ConversationService.CONVERSATIONS_FILE)
        conversations = list(data.get("conversations", {}).values())
        
        if user_id:
            conversations = [c for c in conversations if c.get("user_id") == user_id]
        
        # Sort by updated_at descending
        conversations.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        return conversations
    
    @staticmethod
    def add_message(conversation_id: str, content: str, role: str = "user", 
                   metadata: Optional[Dict[str, Any]] = None) -> bool:
        """Add a message to a conversation."""
        def update_conversation(data):
            if "conversations" not in data:
                data["conversations"] = {}
            
            if conversation_id not in data["conversations"]:
                return data
            
            message = {
                "id": str(uuid.uuid4()),
                "content": content,
                "role": role,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "metadata": metadata or {}
            }
            
            data["conversations"][conversation_id]["messages"].append(message)
            data["conversations"][conversation_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
            return data
        
        storage.update_json(ConversationService.CONVERSATIONS_FILE, update_conversation)
        return True
    
    @staticmethod
    def delete_conversation(conversation_id: str) -> bool:
        """Delete a conversation."""
        def update_conversations(data):
            if "conversations" in data and conversation_id in data["conversations"]:
                del data["conversations"][conversation_id]
            return data
        
        storage.update_json(ConversationService.CONVERSATIONS_FILE, update_conversations)
        return True
    
    @staticmethod
    def ensure_user(user_id: str, user_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Ensure user exists, create if not."""
        def update_users(data):
            if "users" not in data:
                data["users"] = {}
            
            if user_id not in data["users"]:
                data["users"][user_id] = {
                    "id": user_id,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    **(user_data or {})
                }
            
            return data
        
        storage.update_json(ConversationService.USERS_FILE, update_users)
        users_data = storage.read_json(ConversationService.USERS_FILE)
        return users_data["users"][user_id]