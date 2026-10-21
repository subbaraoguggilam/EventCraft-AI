"""Chat router — context-aware AI planning conversations."""
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import ChatMessage, Event, User, ChatRole
from app.schemas.schemas import (
    ChatMessageResponse,
    ChatRequest,
    ChatResponse,
)
from app.services.ai_service import ai_service
from app.utils.security import get_current_user
from app.routers.events import get_user_event_or_404

router = APIRouter(prefix="/events/{event_id}/chat", tags=["AI Chat"])


@router.get("", response_model=List[ChatMessageResponse])
def get_chat_history(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve message history for this event planning session."""
    event = get_user_event_or_404(event_id, current_user, db)
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.event_id == event.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [ChatMessageResponse.model_validate(m) for m in messages]


@router.post("", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
def send_chat_message(
    event_id: int,
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a prompt to the AI event planner and receive tailored contextual advice."""
    event = get_user_event_or_404(event_id, current_user, db)

    # 1. Save user message
    user_msg = ChatMessage(
        event_id=event.id,
        role=ChatRole.user,
        content=req.message,
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # 2. Collect history for context
    past_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.event_id == event.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    formatted_messages = [
        {"role": m.role.value, "content": m.content} for m in past_messages
    ]

    event_context = {
        "title": event.title,
        "event_type": event.event_type.value,
        "event_date": event.event_date.isoformat() if event.event_date else "Not set",
        "venue": event.venue or "Not set",
        "guest_count": event.guest_count,
        "total_budget": event.total_budget,
        "description": event.description or "None provided",
    }

    # 3. Call AI Service
    ai_reply_text = ai_service.chat(
        messages=formatted_messages,
        event_context=event_context,
    )

    # 4. Save assistant response
    ai_msg = ChatMessage(
        event_id=event.id,
        role=ChatRole.assistant,
        content=ai_reply_text,
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    return ChatResponse(
        message=ChatMessageResponse.model_validate(user_msg),
        response=ChatMessageResponse.model_validate(ai_msg),
    )


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_chat_history(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clear conversational history for this event."""
    event = get_user_event_or_404(event_id, current_user, db)
    db.query(ChatMessage).filter(ChatMessage.event_id == event.id).delete()
    db.commit()
    return None
