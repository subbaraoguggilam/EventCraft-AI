"""
AI Service — wraps the Google Generative AI (Gemini) SDK.

All public methods return sensible fallback data when the API key is missing
or the API call fails, so the rest of the application keeps working.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Lazy Gemini initialisation
# ---------------------------------------------------------------------------

_genai = None
_gemini_model = None


def _get_model():
    """Return a cached Gemini GenerativeModel, or None if unavailable."""
    global _genai, _gemini_model
    if _gemini_model is not None:
        return _gemini_model
    if not settings.GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai  # type: ignore

        genai.configure(api_key=settings.GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        _genai = genai
        return _gemini_model
    except Exception as exc:
        logger.warning("Failed to initialise Gemini model: %s", exc)
        return None


def _safe_json(text: str) -> Any:
    """Extract the first JSON block from *text* and parse it."""
    text = text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object/array embedded in prose
        import re

        match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    return None


# ---------------------------------------------------------------------------
# Fallback data
# ---------------------------------------------------------------------------

def _fallback_ideas(event_type: str) -> Dict[str, Any]:
    defaults = {
        "wedding": {
            "themes": ["Garden Romance", "Rustic Elegance", "Modern Minimalist"],
            "decorations": ["Floral arches", "String lights", "Candle centerpieces"],
            "food": ["3-course plated dinner", "Cocktail hour appetisers", "Wedding cake"],
            "entertainment": ["Live band", "DJ", "Photo booth"],
        },
        "birthday": {
            "themes": ["Tropical Luau", "Hollywood Glam", "Vintage Retro"],
            "decorations": ["Balloon garlands", "Photo wall", "Themed centrepieces"],
            "food": ["Dessert table", "Buffet stations", "Personalised cake"],
            "entertainment": ["DJ", "Games area", "Karaoke"],
        },
        "community": {
            "themes": ["Cultural Festival", "Green & Sustainable", "Town Fair"],
            "decorations": ["Banner displays", "Community artwork", "Nature elements"],
            "food": ["Food trucks", "Community potluck", "Local vendor stalls"],
            "entertainment": ["Live performances", "Interactive workshops", "Sports activities"],
        },
    }
    return defaults.get(event_type, defaults["community"])


def _fallback_budget(total_budget: float, event_type: str) -> List[Dict[str, Any]]:
    allocations = {
        "wedding": [
            ("Venue", 0.30),
            ("Catering", 0.35),
            ("Photography/Videography", 0.10),
            ("Flowers & Décor", 0.08),
            ("Music & Entertainment", 0.07),
            ("Attire", 0.05),
            ("Miscellaneous", 0.05),
        ],
        "birthday": [
            ("Venue", 0.25),
            ("Catering & Cake", 0.35),
            ("Decorations", 0.15),
            ("Entertainment", 0.15),
            ("Invitations & Favours", 0.05),
            ("Miscellaneous", 0.05),
        ],
        "community": [
            ("Venue & Permits", 0.20),
            ("Food & Beverages", 0.30),
            ("Entertainment", 0.20),
            ("Marketing & Promotion", 0.10),
            ("Equipment & Supplies", 0.15),
            ("Miscellaneous", 0.05),
        ],
    }
    cats = allocations.get(event_type, allocations["community"])
    return [
        {"category": cat, "name": cat, "estimated_cost": round(total_budget * pct, 2), "notes": ""}
        for cat, pct in cats
    ]


def _fallback_timeline(event_date: Optional[datetime], event_type: str) -> List[Dict[str, Any]]:
    base = event_date or datetime.utcnow() + timedelta(days=90)
    items = [
        (90, "Initial Planning", "Define goals, budget, and guest list", "high", "Planning"),
        (75, "Venue Booking", "Research and book the venue", "high", "Venue"),
        (60, "Send Invitations", "Send out invitations to guests", "high", "Guests"),
        (45, "Vendor Contracts", "Finalise all vendor agreements", "high", "Vendors"),
        (30, "Menu Finalisation", "Confirm catering menu", "medium", "Catering"),
        (14, "Final Guest Count", "Confirm headcount with caterer", "medium", "Guests"),
        (7, "Final Walkthrough", "Walk through all arrangements", "high", "Logistics"),
        (1, "Day-Before Check", "Confirm all vendors and logistics", "high", "Logistics"),
    ]
    return [
        {
            "title": title,
            "description": desc,
            "due_date": (base - timedelta(days=days_before)).isoformat(),
            "priority": priority,
            "category": category,
            "is_completed": False,
        }
        for days_before, title, desc, priority, category in items
    ]


def _fallback_vendors(event_type: str) -> List[Dict[str, Any]]:
    common = [
        {"vendor_type": "Venue", "status": "pending"},
        {"vendor_type": "Catering", "status": "pending"},
        {"vendor_type": "Photography", "status": "pending"},
        {"vendor_type": "Florist / Décor", "status": "pending"},
    ]
    extras = {
        "wedding": [
            {"vendor_type": "Wedding Planner", "status": "pending"},
            {"vendor_type": "DJ / Band", "status": "pending"},
            {"vendor_type": "Officiant", "status": "pending"},
            {"vendor_type": "Hair & Makeup", "status": "pending"},
        ],
        "birthday": [
            {"vendor_type": "DJ / Entertainer", "status": "pending"},
            {"vendor_type": "Cake Baker", "status": "pending"},
        ],
        "community": [
            {"vendor_type": "Sound System / AV", "status": "pending"},
            {"vendor_type": "Security", "status": "pending"},
            {"vendor_type": "Event MC", "status": "pending"},
        ],
    }
    return common + extras.get(event_type, [])


# ---------------------------------------------------------------------------
# AI Service class
# ---------------------------------------------------------------------------

class AIService:
    """Gemini-powered AI helpers for the event planning assistant."""

    # ------------------------------------------------------------------
    # Public helpers
    # ------------------------------------------------------------------

    def generate_event_ideas(
        self,
        event_type: str,
        guest_count: Optional[int],
        budget: Optional[float],
        preferences: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Return theme ideas, decorations, food, and entertainment suggestions."""
        model = _get_model()
        if model is None:
            return _fallback_ideas(event_type)

        prompt = (
            f"You are a creative event planner. Generate ideas for a {event_type} event "
            f"with approximately {guest_count or 'unknown'} guests and a budget of "
            f"${budget or 'unknown'}. "
            + (f"Additional preferences: {preferences}. " if preferences else "")
            + "Return ONLY a JSON object with keys: themes (list of strings), "
            "decorations (list), food (list), entertainment (list). "
            "No extra text."
        )
        try:
            response = model.generate_content(prompt)
            data = _safe_json(response.text)
            if isinstance(data, dict):
                return data
        except Exception as exc:
            logger.warning("generate_event_ideas failed: %s", exc)
        return _fallback_ideas(event_type)

    def generate_budget_allocation(
        self,
        event_type: str,
        total_budget: float,
        guest_count: Optional[int],
    ) -> List[Dict[str, Any]]:
        """Return a list of budget category dicts with estimated_cost."""
        model = _get_model()
        if model is None:
            return _fallback_budget(total_budget, event_type)

        prompt = (
            f"You are a financial event planner. Allocate a ${total_budget:.2f} budget "
            f"for a {event_type} with {guest_count or 'unknown'} guests. "
            "Return ONLY a JSON array where each element has keys: "
            "category (string), name (string), estimated_cost (number), notes (string). "
            "Make costs sum close to the total budget. No extra text."
        )
        try:
            response = model.generate_content(prompt)
            data = _safe_json(response.text)
            if isinstance(data, list):
                return data
        except Exception as exc:
            logger.warning("generate_budget_allocation failed: %s", exc)
        return _fallback_budget(total_budget, event_type)

    def generate_timeline(
        self,
        event_type: str,
        event_date: Optional[datetime],
        guest_count: Optional[int],
    ) -> List[Dict[str, Any]]:
        """Return a planning timeline as a list of milestone dicts."""
        model = _get_model()
        if model is None:
            return _fallback_timeline(event_date, event_type)

        date_str = event_date.strftime("%Y-%m-%d") if event_date else "TBD"
        prompt = (
            f"You are an expert event coordinator. Create a planning timeline for a "
            f"{event_type} event on {date_str} with {guest_count or 'unknown'} guests. "
            "Return ONLY a JSON array where each element has keys: "
            "title (string), description (string), due_date (ISO 8601 string), "
            "priority (one of: high/medium/low), category (string), is_completed (false). "
            "Order from earliest to latest. No extra text."
        )
        try:
            response = model.generate_content(prompt)
            data = _safe_json(response.text)
            if isinstance(data, list):
                return data
        except Exception as exc:
            logger.warning("generate_timeline failed: %s", exc)
        return _fallback_timeline(event_date, event_type)

    def generate_vendor_checklist(
        self,
        event_type: str,
        guest_count: Optional[int],
        budget: Optional[float],
    ) -> List[Dict[str, Any]]:
        """Return a list of vendor dicts to source for the event."""
        model = _get_model()
        if model is None:
            return _fallback_vendors(event_type)

        prompt = (
            f"You are an event procurement specialist. List the vendors needed for a "
            f"{event_type} event with {guest_count or 'unknown'} guests and a "
            f"${budget or 'unknown'} budget. "
            "Return ONLY a JSON array where each element has keys: "
            "vendor_type (string), vendor_name (null), contact_email (null), "
            "contact_phone (null), quoted_price (null), status ('pending'), notes (string). "
            "No extra text."
        )
        try:
            response = model.generate_content(prompt)
            data = _safe_json(response.text)
            if isinstance(data, list):
                return data
        except Exception as exc:
            logger.warning("generate_vendor_checklist failed: %s", exc)
        return _fallback_vendors(event_type)

    def chat(self, messages: List[Dict[str, str]], event_context: Dict[str, Any]) -> str:
        """
        Context-aware conversational assistant.

        *messages* is a list of {"role": "user"|"assistant", "content": "..."} dicts.
        *event_context* provides event details used to ground the assistant.
        """
        model = _get_model()

        # Build system context text
        ctx_lines = ["You are a helpful AI event planning assistant."]
        if event_context:
            ctx_lines.append(
                f"\nCurrent event context:\n"
                f"- Title: {event_context.get('title', 'N/A')}\n"
                f"- Type: {event_context.get('event_type', 'N/A')}\n"
                f"- Date: {event_context.get('event_date', 'N/A')}\n"
                f"- Venue: {event_context.get('venue', 'N/A')}\n"
                f"- Guest count: {event_context.get('guest_count', 'N/A')}\n"
                f"- Total budget: ${event_context.get('total_budget', 'N/A')}\n"
                f"- Description: {event_context.get('description', 'N/A')}"
            )
        ctx_lines.append(
            "\nAnswer questions, offer suggestions, and help the user plan their event. "
            "Be concise, friendly, and practical."
        )
        system_ctx = "\n".join(ctx_lines)

        if model is None:
            last_user_msg = next(
                (m["content"] for m in reversed(messages) if m.get("role") == "user"),
                "Hello",
            )
            return (
                f"I'm your event planning assistant! (AI responses are unavailable — "
                f"please set a valid GEMINI_API_KEY.) You asked: \"{last_user_msg}\". "
                "I'd love to help once the API key is configured."
            )

        try:
            # Build Gemini chat history (all but the last user message)
            history = []
            for msg in messages[:-1]:
                role = "user" if msg.get("role") == "user" else "model"
                history.append({"role": role, "parts": [msg["content"]]})

            chat_session = model.start_chat(history=history)
            last_user = messages[-1]["content"] if messages else "Hello"
            full_prompt = f"{system_ctx}\n\nUser: {last_user}"
            response = chat_session.send_message(full_prompt)
            return response.text
        except Exception as exc:
            logger.warning("chat failed: %s", exc)
            return (
                "I'm sorry, I encountered an error processing your request. "
                "Please try again in a moment."
            )


# Singleton instance
ai_service = AIService()
