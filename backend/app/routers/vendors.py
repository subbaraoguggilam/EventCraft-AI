"""Vendors router — manage vendor checklist, contacts, quotes, and booking status."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import VendorItem, Event, User
from app.schemas.schemas import (
    VendorItemCreate,
    VendorItemUpdate,
    VendorItemResponse,
    VendorListResponse,
)
from app.services.ai_service import ai_service
from app.utils.security import get_current_user
from app.routers.events import get_user_event_or_404, calculate_vendor_summary

router = APIRouter(prefix="/events/{event_id}/vendors", tags=["Vendors"])


def get_vendor_item_or_404(event_id: int, vendor_id: int, user: User, db: Session) -> VendorItem:
    event = get_user_event_or_404(event_id, user, db)
    item = db.query(VendorItem).filter(
        VendorItem.id == vendor_id,
        VendorItem.event_id == event.id,
    ).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vendor item {vendor_id} not found",
        )
    return item


@router.get("", response_model=List[VendorItemResponse])
def list_vendors(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all vendors associated with the event."""
    event = get_user_event_or_404(event_id, current_user, db)
    return [VendorItemResponse.model_validate(v) for v in event.vendor_items]


@router.get("/summary")
def get_vendor_summary(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get status overview counts for vendors."""
    event = get_user_event_or_404(event_id, current_user, db)
    return calculate_vendor_summary(event)


@router.post("", response_model=VendorItemResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(
    event_id: int,
    vendor_in: VendorItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new vendor record."""
    event = get_user_event_or_404(event_id, current_user, db)
    v_name = vendor_in.vendor_name or vendor_in.name
    price = vendor_in.quoted_price if vendor_in.price is None else vendor_in.price

    item = VendorItem(
        event_id=event.id,
        vendor_type=vendor_in.vendor_type,
        vendor_name=v_name,
        contact_email=str(vendor_in.contact_email) if vendor_in.contact_email else None,
        contact_phone=vendor_in.contact_phone,
        quoted_price=price,
        status=vendor_in.status,
        notes=vendor_in.notes,
        booked_date=vendor_in.booked_date,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return VendorItemResponse.model_validate(item)


@router.put("/{vendor_id}", response_model=VendorItemResponse)
def update_vendor(
    event_id: int,
    vendor_id: int,
    vendor_in: VendorItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update vendor details, status, or quoted price."""
    item = get_vendor_item_or_404(event_id, vendor_id, current_user, db)
    update_data = vendor_in.model_dump(exclude_unset=True)

    if "name" in update_data and "vendor_name" not in update_data:
        update_data["vendor_name"] = update_data.pop("name")
    elif "name" in update_data:
        update_data.pop("name")

    if "price" in update_data and "quoted_price" not in update_data:
        update_data["quoted_price"] = update_data.pop("price")
    elif "price" in update_data:
        update_data.pop("price")

    if "contact_name" in update_data:
        update_data.pop("contact_name")

    for field, value in update_data.items():
        if hasattr(item, field):
            setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return VendorItemResponse.model_validate(item)


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(
    event_id: int,
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a vendor from the checklist."""
    item = get_vendor_item_or_404(event_id, vendor_id, current_user, db)
    db.delete(item)
    db.commit()
    return None


@router.post("/generate", response_model=List[VendorItemResponse])
def generate_vendor_items_alias(
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
