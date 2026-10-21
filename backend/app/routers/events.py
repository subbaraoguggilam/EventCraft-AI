"""Events router — CRUD and AI generation triggers for events."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Event, User, BudgetItem, TimelineItem, VendorItem
from app.schemas.schemas import (
    EventCreate,
    EventUpdate,
    EventResponse,
    EventDetailResponse,
    BudgetSummary,
    BudgetItemResponse,
    TimelineItemResponse,
    VendorItemResponse,
)
from app.services.ai_service import ai_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/events", tags=["Events"])


def get_user_event_or_404(event_id: int, user: User, db: Session) -> Event:
    """Fetch event ensuring ownership or raise 404/403."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {event_id} not found",
        )
    if event.owner_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this event",
        )
    return event


def calculate_budget_summary(event: Event) -> BudgetSummary:
    total_est = sum(item.estimated_cost for item in event.budget_items)
    total_act = sum(item.actual_cost or 0.0 for item in event.budget_items)
    total_paid = sum(item.actual_cost or item.estimated_cost for item in event.budget_items if item.paid)
    budget_limit = event.total_budget or total_est
    remaining = budget_limit - total_act

    return BudgetSummary(
        total_estimated=round(total_est, 2),
        total_actual=round(total_act, 2),
        total_paid=round(total_paid, 2),
        remaining_budget=round(remaining, 2),
        items_count=len(event.budget_items),
    )


def calculate_vendor_summary(event: Event) -> dict:
    total = len(event.vendor_items)
    confirmed = sum(1 for v in event.vendor_items if v.status.value == "confirmed")
    pending = sum(1 for v in event.vendor_items if v.status.value == "pending")
    contacted = sum(1 for v in event.vendor_items if v.status.value == "contacted")
    cancelled = sum(1 for v in event.vendor_items if v.status.value == "cancelled")
    return {
        "total": total,
        "confirmed": confirmed,
        "pending": pending,
        "contacted": contacted,
        "cancelled": cancelled,
    }


@router.get("", response_model=List[EventResponse])
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all events owned by current user."""
    return db.query(Event).filter(Event.owner_id == current_user.id).order_by(Event.created_at.desc()).all()


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_in: EventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new event."""
    event = Event(
        owner_id=current_user.id,
        title=event_in.title,
        event_type=event_in.event_type,
        event_date=event_in.event_date,
        venue=event_in.venue,
        guest_count=event_in.guest_count,
        total_budget=event_in.total_budget,
        description=event_in.description,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.get("/{event_id}", response_model=EventDetailResponse)
def get_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get complete event details including budget, timeline, and vendors."""
    event = get_user_event_or_404(event_id, current_user, db)
    b_summary = calculate_budget_summary(event)
    v_summary = calculate_vendor_summary(event)

    return EventDetailResponse(
        id=event.id,
        owner_id=event.owner_id,
        title=event.title,
        event_type=event.event_type,
        event_date=event.event_date,
        venue=event.venue,
        guest_count=event.guest_count,
        total_budget=event.total_budget,
        description=event.description,
        created_at=event.created_at,
        updated_at=event.updated_at,
        budget_items=[BudgetItemResponse.model_validate(b) for b in event.budget_items],
        timeline_items=[TimelineItemResponse.model_validate(t) for t in event.timeline_items],
        vendor_items=[VendorItemResponse.model_validate(v) for v in event.vendor_items],
        budget_summary=b_summary,
        vendor_summary=v_summary,
    )


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    event_in: EventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update event metadata."""
    event = get_user_event_or_404(event_id, current_user, db)
    update_data = event_in.model_dump(exclude_unset=True)

    # Reconcile date/event_date & budget/total_budget if present
    if "date" in update_data and "event_date" not in update_data:
        update_data["event_date"] = update_data.pop("date")
    if "budget" in update_data and "total_budget" not in update_data:
        update_data["total_budget"] = update_data.pop("budget")

    for field, value in update_data.items():
        if hasattr(event, field):
            setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an event and all associated records."""
    event = get_user_event_or_404(event_id, current_user, db)
    db.delete(event)
    db.commit()
    return None


@router.post("/{event_id}/generate-ideas")
def generate_ideas(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate personalized ideas (themes, decor, food, entertainment) using Gemini AI."""
    event = get_user_event_or_404(event_id, current_user, db)
    raw_ideas = ai_service.generate_event_ideas(
        event_type=event.event_type.value,
        guest_count=event.guest_count,
        budget=event.total_budget,
        preferences=event.description,
    )

    flattened: List[str] = []
    if isinstance(raw_ideas, dict):
        for category, items in raw_ideas.items():
            if isinstance(items, list):
                for item in items:
                    flattened.append(f"{category.title()}: {item}")
            elif isinstance(items, str):
                flattened.append(f"{category.title()}: {items}")
    elif isinstance(raw_ideas, list):
        flattened = [str(x) for x in raw_ideas]

    return {
        "ideas": flattened if flattened else [
            "Elegant lighting and candle accents",
            "Personalized welcome signage",
            "Curated playlist and acoustic live set",
            "Interactive memory photo guestbook",
        ],
        "details": raw_ideas,
    }


@router.post("/{event_id}/generate-budget", response_model=List[BudgetItemResponse])
def generate_budget_items(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate budget breakdown with Gemini AI and insert into event budget."""
    event = get_user_event_or_404(event_id, current_user, db)
    budget_limit = event.total_budget or 5000.0
    suggestions = ai_service.generate_budget_allocation(
        event_type=event.event_type.value,
        total_budget=budget_limit,
        guest_count=event.guest_count,
    )

    new_items = []
    for item in suggestions:
        cost = float(item.get("estimated_cost", 0.0) or 0.0)
        b = BudgetItem(
            event_id=event.id,
            category=str(item.get("category", "General")),
            name=str(item.get("name", "Item")),
            estimated_cost=round(cost, 2),
            notes=item.get("notes"),
        )
        db.add(b)
        new_items.append(b)

    db.commit()
    for b in new_items:
        db.refresh(b)
    return [BudgetItemResponse.model_validate(b) for b in new_items]


@router.post("/{event_id}/generate-timeline", response_model=List[TimelineItemResponse])
def generate_timeline_items(
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
                from datetime import datetime
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


@router.post("/{event_id}/generate-vendors", response_model=List[VendorItemResponse])
def generate_vendor_items(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate vendor checklist with Gemini AI and insert into event vendors."""
    event = get_user_event_or_404(event_id, current_user, db)
    suggestions = ai_service.generate_vendor_checklist(
        event_type=event.event_type.value,
        guest_count=event.guest_count,
        budget=event.total_budget,
    )

    new_items = []
    for item in suggestions:
        v = VendorItem(
            event_id=event.id,
            vendor_type=str(item.get("vendor_type", "other")),
            vendor_name=item.get("vendor_name"),
            contact_email=item.get("contact_email"),
            contact_phone=item.get("contact_phone"),
            quoted_price=item.get("quoted_price"),
            status="pending",
            notes=item.get("notes"),
        )
        db.add(v)
        new_items.append(v)

    db.commit()
    for v in new_items:
        db.refresh(v)
    return [VendorItemResponse.model_validate(v) for v in new_items]
