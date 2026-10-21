"""Budget router — manage budget items and summary for events."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import BudgetItem, Event, User
from app.schemas.schemas import (
    BudgetItemCreate,
    BudgetItemUpdate,
    BudgetItemResponse,
    BudgetListResponse,
    BudgetSummary,
)
from app.services.ai_service import ai_service
from app.utils.security import get_current_user
from app.routers.events import get_user_event_or_404, calculate_budget_summary

router = APIRouter(prefix="/events/{event_id}/budget", tags=["Budget"])


def get_budget_item_or_404(event_id: int, item_id: int, user: User, db: Session) -> BudgetItem:
    event = get_user_event_or_404(event_id, user, db)
    item = db.query(BudgetItem).filter(
        BudgetItem.id == item_id,
        BudgetItem.event_id == event.id,
    ).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Budget item {item_id} not found",
        )
    return item


@router.get("", response_model=List[BudgetItemResponse])
def list_budget_items(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all budget items for an event."""
    event = get_user_event_or_404(event_id, current_user, db)
    return [BudgetItemResponse.model_validate(b) for b in event.budget_items]


@router.get("/summary", response_model=BudgetSummary)
def get_budget_summary(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get aggregated budget numbers."""
    event = get_user_event_or_404(event_id, current_user, db)
    return calculate_budget_summary(event)


@router.post("", response_model=BudgetItemResponse, status_code=status.HTTP_201_CREATED)
def create_budget_item(
    event_id: int,
    item_in: BudgetItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new line item to event budget."""
    event = get_user_event_or_404(event_id, current_user, db)
    item_name = item_in.name or item_in.description or "Expense"
    item = BudgetItem(
        event_id=event.id,
        category=item_in.category,
        name=item_name,
        estimated_cost=item_in.estimated_cost,
        actual_cost=item_in.actual_cost,
        paid=item_in.paid,
        notes=item_in.notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return BudgetItemResponse.model_validate(item)


@router.put("/{item_id}", response_model=BudgetItemResponse)
def update_budget_item(
    event_id: int,
    item_id: int,
    item_in: BudgetItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing budget line item."""
    item = get_budget_item_or_404(event_id, item_id, current_user, db)
    update_data = item_in.model_dump(exclude_unset=True)

    if "description" in update_data and "name" not in update_data:
        update_data["name"] = update_data.pop("description")
    elif "description" in update_data:
        update_data.pop("description")

    for field, value in update_data.items():
        if hasattr(item, field):
            setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return BudgetItemResponse.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget_item(
    event_id: int,
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a budget item."""
    item = get_budget_item_or_404(event_id, item_id, current_user, db)
    db.delete(item)
    db.commit()
    return None


@router.post("/generate", response_model=List[BudgetItemResponse])
def generate_budget_items_alias(
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
