import enum
from datetime import datetime, timezone

def get_utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


# ---------------------------------------------------------------------------
# Enumerations
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
# ORM Models
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    events = relationship("Event", back_populates="owner", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    event_type = Column(Enum(EventType), nullable=False)
    event_date = Column(DateTime, nullable=True)
    venue = Column(String(500), nullable=True)
    guest_count = Column(Integer, nullable=True)
    total_budget = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)
    updated_at = Column(DateTime, default=get_utc_now, onupdate=get_utc_now, nullable=False)

    # Relationships
    owner = relationship("User", back_populates="events")
    budget_items = relationship("BudgetItem", back_populates="event", cascade="all, delete-orphan")
    timeline_items = relationship("TimelineItem", back_populates="event", cascade="all, delete-orphan")
    vendor_items = relationship("VendorItem", back_populates="event", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="event", cascade="all, delete-orphan")


class BudgetItem(Base):
    __tablename__ = "budget_items"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    estimated_cost = Column(Float, default=0.0, nullable=False)
    actual_cost = Column(Float, nullable=True)
    paid = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    event = relationship("Event", back_populates="budget_items")


class TimelineItem(Base):
    __tablename__ = "timeline_items"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    priority = Column(Enum(Priority), default=Priority.medium, nullable=False)
    category = Column(String(100), nullable=True)

    # Relationships
    event = relationship("Event", back_populates="timeline_items")


class VendorItem(Base):
    __tablename__ = "vendor_items"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    vendor_type = Column(String(100), nullable=False)
    vendor_name = Column(String(255), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    quoted_price = Column(Float, nullable=True)
    status = Column(Enum(VendorStatus), default=VendorStatus.pending, nullable=False)
    notes = Column(Text, nullable=True)
    booked_date = Column(DateTime, nullable=True)

    # Relationships
    event = relationship("Event", back_populates="vendor_items")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(ChatRole), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=get_utc_now, nullable=False)

    # Relationships
    event = relationship("Event", back_populates="chat_messages")
