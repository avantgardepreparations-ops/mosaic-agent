from fastapi import APIRouter, HTTPException, status
from typing import Optional, Dict, Any
from pydantic import BaseModel
import traceback
from ..services.conversation import ConversationService
from ..services.encryption import EncryptionService


router = APIRouter()


class InferRequest(BaseModel):
    input: str
    userId: Optional[str] = None


class InferResponse(BaseModel):
    output: str
    trace: Optional[Dict[str, Any]] = None


class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"
    user_id: Optional[str] = None
    project_id: Optional[str] = None


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@router.post("/infer", response_model=InferResponse)
async def infer(request: InferRequest):
    """Process inference request."""
    try:
        # For now, this is a simple echo with some processing
        # In a real implementation, this would integrate with AI models
        
        input_text = request.input
        user_id = request.userId
        
        # Simple processing - reverse the text as a demo
        output = f"Processed: {input_text[::-1]}"
        
        trace = {
            "input_length": len(input_text),
            "user_id": user_id,
            "processing_time": "fast",
            "model_used": "demo_model"
        }
        
        # If user_id provided, ensure user exists
        if user_id:
            ConversationService.ensure_user(user_id)
        
        return InferResponse(output=output, trace=trace)
        
    except Exception as e:
        # Don't expose internal errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Processing failed"
        )


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get a specific conversation."""
    conversation = ConversationService.get_conversation(conversation_id)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return conversation


@router.get("/conversations")
async def list_conversations(user_id: Optional[str] = None):
    """List conversations, optionally filtered by user."""
    conversations = ConversationService.list_conversations(user_id)
    return {"conversations": conversations}


@router.post("/conversations")
async def create_conversation(conversation_data: ConversationCreate):
    """Create a new conversation."""
    try:
        conversation = ConversationService.create_conversation(
            user_id=conversation_data.user_id,
            project_id=conversation_data.project_id,
            title=conversation_data.title
        )
        return conversation
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create conversation"
        )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation."""
    success = ConversationService.delete_conversation(conversation_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return {"message": "Conversation deleted successfully"}