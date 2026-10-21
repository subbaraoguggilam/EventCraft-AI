"""Timeline router — manage milestones, task deadlines, and schedules."""
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import TimelineItem, Event, User
from app.schemas.schemas import (
    TimelineItemCreate,
    TimelineItemUpdate,
    TimelineItemResponse,
)
from app.services.ai_service import ai_service
from app.utils.security import get_current_user
from app.routers.events import get_user_event_or_404

router = APIRouter(prefix="/events/{event_id}/timeline", tags=["Timeline"])


def get_timeline_item_or_404(event_id: int, item_id: int, user: User, db: Session) -> TimelineItem:
    event = get_user_event_or_404(event_id, user, db)
    item = db.query(TimelineItem).filter(
        TimelineItem.id == item_id,
        TimelineItem.event_id == event.id,
    ).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timeline item {item_id} not found",
        )
    return item


@router.get("", response_model=List[TimelineItemResponse])
def list_timeline_items(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List timeline milestones for an event ordered by due date."""
    event = get_user_event_or_404(event_id, current_user, db)
    items = sorted(
        event.timeline_items,
        key=lambda x: (x.due_date is None, x.due_date or datetime.max),
    )
    return [TimelineItemResponse.model_validate(t) for t in items]


@router.post("", response_model=TimelineItemResponse, status_code=status.HTTP_201_CREATED)
def create_timeline_item(
    event_id: int,
    item_in: TimelineItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a milestone or task to the event schedule."""
    event = get_user_event_or_404(event_id, current_user, db)
    completed = item_in.is_completed if item_in.completed is None else item_in.completed
    item = TimelineItem(
        event_id=event.id,
        title=item_in.title,
        description=item_in.description,
        due_date=item_in.due_date,
        is_completed=completed,
        priority=item_in.priority,
        category=item_in.category or "General",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return TimelineItemResponse.model_validate(item)


@router.put("/{item_id}", response_model=TimelineItemResponse)
def update_timeline_item(
    event_id: int,
    item_id: int,
    item_in: TimelineItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update milestone details or completion status."""
    item = get_timeline_item_or_404(event_id, item_id, current_user, db)
    update_data = item_in.model_dump(exclude_unset=True)

    if "completed" in update_data:
        update_data["is_completed"] = update_data.pop("completed")

    for field, value in update_data.items():
        if hasattr(item, field):
            setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return TimelineItemResponse.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_timeline_item(
    event_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a milestone from timeline."""
    item = get_timeline_item_or_404(event_id, item_id, current_user, db)
    db.delete(item)
    db.commit()
    return None


@router.post("/generate", response_model=List[TimelineItemResponse])
def generate_timeline_items_alias(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate milestone timeline with Gemini AI and insert into event timeline."""
    event = get_user_event_or_404(event_id, current_user, db)
    suggestions = ai_service.generate_timeline(
        event_type=event.event_type.value,
        event_date=event.event_date,
        guest_count=event.guest_count,
    )

    new_items = []
    for item in suggestions:
        due = None
        if item.get("due_date"):
            try:
                due = datetime.fromisoformat(str(item["due_date"]).replace("Z", "+00:00"))
            except Exception:
                due = None

        t = TimelineItem(
            event_id=event.id,
            title=str(item.get("title", "Milestone")),
            description=item.get("description"),
            due_date=due,
            priority=item.get("priority", "medium"),
            category=item.get("category", "Planning"),
        )
        db.add(t)
        new_items.append(t)

    db.commit()
    for t in new_items:
        db.refresh(t)
    return [TimelineItemResponse.model_validate(t) for t in new_items]
