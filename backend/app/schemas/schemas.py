from __future__ import annotations

import enum
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Enumerations (mirror ORM enums so schemas stay self-contained)
# ---------------------------------------------------------------------------

class EventType(str, enum.Enum):
    wedding = "wedding"
    birthday = "birthday"
    community = "community"


class Priority(str, enum.Enum):
    high = "high"
    medium = "medium"
    low = "low"


class VendorStatus(str, enum.Enum):
    pending = "pending"
    contacted = "contacted"
    confirmed = "confirmed"
    cancelled = "cancelled"


class ChatRole(str, enum.Enum):
    user = "user"
    assistant = "assistant"


# ---------------------------------------------------------------------------
# Auth / User schemas
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=255)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    created_at: datetime
    is_active: bool

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None


# ---------------------------------------------------------------------------
# Event schemas
# ---------------------------------------------------------------------------

class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    event_type: EventType
    event_date: Optional[datetime] = None
    date: Optional[datetime] = None
    venue: Optional[str] = Field(None, max_length=500)
    guest_count: Optional[int] = Field(None, ge=1)
    total_budget: Optional[float] = Field(None, ge=0)
    budget: Optional[float] = Field(None, ge=0)
    description: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "date" in values and "event_date" not in values:
                values["event_date"] = values["date"]
            if "budget" in values and "total_budget" not in values:
                values["total_budget"] = values["budget"]
        return values


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    event_type: Optional[EventType] = None
    event_date: Optional[datetime] = None
    date: Optional[datetime] = None
    venue: Optional[str] = Field(None, max_length=500)
    guest_count: Optional[int] = Field(None, ge=1)
    total_budget: Optional[float] = Field(None, ge=0)
    budget: Optional[float] = Field(None, ge=0)
    description: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "date" in values and "event_date" not in values:
                values["event_date"] = values["date"]
            if "budget" in values and "total_budget" not in values:
                values["total_budget"] = values["budget"]
        return values


class BudgetSummary(BaseModel):
    total_estimated: float = 0.0
    total_actual: float = 0.0
    total_paid: float = 0.0
    remaining_budget: float = 0.0
    items_count: int = 0


class EventResponse(BaseModel):
    id: int
    owner_id: int
    title: str
    event_type: EventType
    event_date: Optional[datetime] = None
    date: Optional[datetime] = None
    venue: Optional[str] = None
    guest_count: Optional[int] = None
    total_budget: Optional[float] = None
    budget: Optional[float] = None
    description: Optional[str] = None
    status: str = "planning"
    ai_ideas: List[str] = []
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            data_dict = {k: v for k, v in data.__dict__.items() if not k.startswith("_")}
            if "event_date" in data_dict and data_dict["event_date"] is not None:
                data_dict["date"] = data_dict["event_date"]
            if "total_budget" in data_dict and data_dict["total_budget"] is not None:
                data_dict["budget"] = data_dict["total_budget"]
            return data_dict
        elif isinstance(data, dict):
            if "event_date" in data and "date" not in data:
                data["date"] = data["event_date"]
            if "total_budget" in data and "budget" not in data:
                data["budget"] = data["total_budget"]
        return data

    model_config = {"from_attributes": True}


class EventDetailResponse(EventResponse):
    budget_items: List[BudgetItemResponse] = []
    timeline_items: List[TimelineItemResponse] = []
    vendor_items: List[VendorItemResponse] = []
    budget_summary: Optional[BudgetSummary] = None
    vendor_summary: Optional[dict] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Budget schemas
# ---------------------------------------------------------------------------

class BudgetItemCreate(BaseModel):
    category: str = Field(..., min_length=1, max_length=100)
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=255)
    estimated_cost: float = Field(..., ge=0)
    actual_cost: Optional[float] = Field(None, ge=0)
    paid: bool = False
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_name(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if not values.get("name") and values.get("description"):
                values["name"] = values["description"]
            elif not values.get("description") and values.get("name"):
                values["description"] = values["name"]
        return values


class BudgetItemUpdate(BaseModel):
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None, max_length=255)
    estimated_cost: Optional[float] = Field(None, ge=0)
    actual_cost: Optional[float] = Field(None, ge=0)
    paid: Optional[bool] = None
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_name(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if not values.get("name") and values.get("description"):
                values["name"] = values["description"]
        return values


class BudgetItemResponse(BaseModel):
    id: int
    event_id: int
    category: str
    name: str
    description: Optional[str] = None
    estimated_cost: float
    actual_cost: Optional[float] = None
    paid: bool
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def populate_desc(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            d = {k: v for k, v in data.__dict__.items() if not k.startswith("_")}
            d["description"] = d.get("name")
            return d
        elif isinstance(data, dict):
            if "name" in data and "description" not in data:
                data["description"] = data["name"]
        return data

    model_config = {"from_attributes": True}


class BudgetListResponse(BaseModel):
    items: List[BudgetItemResponse]
    summary: BudgetSummary


# ---------------------------------------------------------------------------
# Timeline schemas
# ---------------------------------------------------------------------------

class TimelineItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: bool = False
    completed: Optional[bool] = None
    priority: Priority = Priority.medium
    category: Optional[str] = Field(None, max_length=100)

    @model_validator(mode="before")
    @classmethod
    def reconcile_completed(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "completed" in values and "is_completed" not in values:
                values["is_completed"] = values["completed"]
        return values


class TimelineItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None
    completed: Optional[bool] = None
    priority: Optional[Priority] = None
    category: Optional[str] = Field(None, max_length=100)

    @model_validator(mode="before")
    @classmethod
    def reconcile_completed(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "completed" in values and "is_completed" not in values:
                values["is_completed"] = values["completed"]
        return values


class TimelineItemResponse(BaseModel):
    id: int
    event_id: int
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: bool
    completed: bool = False
    priority: Priority
    category: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def populate_completed(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            d = {k: v for k, v in data.__dict__.items() if not k.startswith("_")}
            d["completed"] = d.get("is_completed", False)
            return d
        elif isinstance(data, dict):
            data["completed"] = data.get("is_completed", False)
        return data

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Vendor schemas
# ---------------------------------------------------------------------------

class VendorItemCreate(BaseModel):
    vendor_type: str = Field(..., min_length=1, max_length=100)
    vendor_name: Optional[str] = Field(None, max_length=255)
    name: Optional[str] = Field(None, max_length=255)
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)
    quoted_price: Optional[float] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0)
    status: VendorStatus = VendorStatus.pending
    notes: Optional[str] = None
    booked_date: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if not values.get("vendor_name") and values.get("name"):
                values["vendor_name"] = values["name"]
            if not values.get("quoted_price") and values.get("price") is not None:
                values["quoted_price"] = values["price"]
        return values


class VendorItemUpdate(BaseModel):
    vendor_type: Optional[str] = Field(None, min_length=1, max_length=100)
    vendor_name: Optional[str] = Field(None, max_length=255)
    name: Optional[str] = Field(None, max_length=255)
    contact_name: Optional[str] = Field(None, max_length=255)
    contact_email: Optional[str] = Field(None, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)
    quoted_price: Optional[float] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0)
    status: Optional[VendorStatus] = None
    notes: Optional[str] = None
    booked_date: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def reconcile_fields(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if not values.get("vendor_name") and values.get("name"):
                values["vendor_name"] = values["name"]
            if not values.get("quoted_price") and values.get("price") is not None:
                values["quoted_price"] = values["price"]
        return values


class VendorItemResponse(BaseModel):
    id: int
    event_id: int
    vendor_type: str
    vendor_name: Optional[str] = None
    name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    quoted_price: Optional[float] = None
    price: Optional[float] = None
    status: VendorStatus
    notes: Optional[str] = None
    booked_date: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def populate_aliases(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            d = {k: v for k, v in data.__dict__.items() if not k.startswith("_")}
            d["name"] = d.get("vendor_name")
            d["price"] = d.get("quoted_price")
            return d
        elif isinstance(data, dict):
            if "vendor_name" in data and "name" not in data:
                data["name"] = data["vendor_name"]
            if "quoted_price" in data and "price" not in data:
                data["price"] = data["quoted_price"]
        return data

    model_config = {"from_attributes": True}


class VendorListResponse(BaseModel):
    items: List[VendorItemResponse]
    summary: dict


# ---------------------------------------------------------------------------
# Chat schemas
# ---------------------------------------------------------------------------

class ChatMessageCreate(BaseModel):
    role: ChatRole
    content: str = Field(..., min_length=1)


class ChatMessageResponse(BaseModel):
    id: int
    event_id: int
    role: ChatRole
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


class ChatResponse(BaseModel):
    message: ChatMessageResponse
    response: ChatMessageResponse

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Forward reference resolution
# ---------------------------------------------------------------------------

EventDetailResponse.model_rebuild()
