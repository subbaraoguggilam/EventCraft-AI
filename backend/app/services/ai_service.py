"""
AI Service — wraps the Google Generative AI (Gemini) SDK.

Tailored for Indian celebrations (Weddings, Birthdays, Community Festivals)
using INR (₹) and Indian cultural traditions.
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
        import re

        match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass
    return None


# ---------------------------------------------------------------------------
# Indian Fallback data
# ---------------------------------------------------------------------------

def _fallback_ideas(event_type: str) -> Dict[str, Any]:
    defaults = {
        "wedding": {
            "themes": [
                "Royal Rajasthani Heritage",
                "Pastel Floral Garden Vivaah",
                "Vibrant Bollywood Sangeet & Mehendi",
            ],
            "decorations": [
                "Marigold (Genda Phool) & Jasmine floral mandap",
                "Brass Urli with floating petals & diyas",
                "Fairy lights canopy with colourful silk drapes",
            ],
            "food": [
                "Live Chaat, Dosa & Tandoori counters",
                "Royal Mughlai & North Indian Dal Makhani buffet",
                "Assorted Mithai & Kulfi dessert bar",
            ],
            "entertainment": [
                "Live Punjabi Dhol & Bollywood DJ",
                "Mehendi & Sangeet dance choreography",
                "360-degree video selfie booth",
            ],
        },
        "birthday": {
            "themes": [
                "Bollywood Retro Disco",
                "Desi Mela & Carnival",
                "Royal Prince / Princess Theme",
            ],
            "decorations": [
                "Balloon arch with fairy lights & marigold accents",
                "Personalized photo milestone cutout wall",
                "Floral entrance arch",
            ],
            "food": [
                "Paneer & Chicken Tikka starter platters",
                "Dum Biryani & Gulab Jamun dessert",
                "Customized tiered designer cake",
            ],
            "entertainment": [
                "DJ with high-energy dance tracks",
                "Magic show & interactive party host",
                "Face painting & instant photo prints",
            ],
        },
        "community": {
            "themes": [
                "Grand Diwali Mela & Dandiya Raas",
                "Ganesh Utsav Cultural Mahotsav",
                "Holi Milan & Spring Community Mela",
            ],
            "decorations": [
                "Intricate Rangoli & flower petal carpets",
                "Shamiana with traditional cloth hangings & torans",
                "Eco-friendly paper lanterns & fairy lights",
            ],
            "food": [
                "Mahaprasad & traditional community feast",
                "Regional street food & sweet stalls",
                "Cutting Chai & Samosa hospitality counters",
            ],
            "entertainment": [
                "Live Garba & Dandiya orchestra",
                "Society talent showcase, dance & drama skits",
                "Antakshari & musical evening",
            ],
        },
    }
    return defaults.get(event_type, defaults["community"])


def _fallback_budget(total_budget: float, event_type: str) -> List[Dict[str, Any]]:
    allocations = {
        "wedding": [
            ("Mandap, Lawn & Venue", 0.30),
            ("Catering & Sweet Counters", 0.35),
            ("Candid Photography & Cinematography", 0.10),
            ("Floral & Lighting Décor", 0.10),
            ("Dhol, DJ & Sangeet Sound", 0.05),
            ("Bridal Attire & Makeup", 0.05),
            ("Pooja Samagri & Miscellaneous", 0.05),
        ],
        "birthday": [
            ("Banquet Hall / Club House", 0.25),
            ("Catering, Snacks & Cake", 0.35),
            ("Theme Decorations & Balloons", 0.15),
            ("DJ / Magic Show & Games", 0.15),
            ("Return Gifts & Digital Invites", 0.05),
            ("Miscellaneous", 0.05),
        ],
        "community": [
            ("Ground / Stage & Shamiana", 0.25),
            ("Food Stalls & Refreshments", 0.30),
            ("Sound System, DJ & Lighting", 0.20),
            ("Banners, Prizes & Marketing", 0.10),
            ("Security & Cleaning Staff", 0.10),
            ("Pooja & Cultural Rituals", 0.05),
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
        (90, "Muhurat & Date Finalization", "Finalize auspicious date with family and astrologer", "high", "Planning"),
        (75, "Book Venue & Banquet Lawn", "Reserve venue in Udaipur / Jaipur / Bangalore / Mumbai", "high", "Venue"),
        (60, "Send E-Invites & Lagan Patrika", "Distribute printed invitation cards & WhatsApp video invites", "high", "Invitations"),
        (45, "Finalize Catering & Sweet Boxes", "Menu tasting for North Indian, Chaat & Mithai selection", "high", "Catering"),
        (30, "Sangeet Dance Practice & Outfits", "Choreography sessions for family performances and outfit trials", "medium", "Attire"),
        (15, "Mehendi & Makeup Confirmation", "Confirm bridal makeup artist and Mehendi team timings", "high", "Beauty"),
        (3, "Mandap & Haldi Stage Setup", "Verify floral decor, sound check, and Haldi yellow theme", "high", "Decor"),
        (0, "Celebration Day & Baraat Welcome", "Dhol arrival, Baraat swagat, Mandap rituals, and dinner reception", "high", "Execution"),
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
        {"vendor_type": "Banquet / Resort Venue", "status": "pending"},
        {"vendor_type": "Traditional & Modern Catering", "status": "pending"},
        {"vendor_type": "Candid Photography & Drone", "status": "pending"},
        {"vendor_type": "Mandap & Floral Decorator", "status": "pending"},
    ]
    extras = {
        "wedding": [
            {"vendor_type": "Punjabi Dhol & DJ", "status": "pending"},
            {"vendor_type": "Bridal Mehendi Artist", "status": "pending"},
            {"vendor_type": "Pandit Ji / Priest", "status": "pending"},
            {"vendor_type": "Bridal Makeup & Hair Stylist", "status": "pending"},
            {"vendor_type": "Sangeet Choreographer", "status": "pending"},
        ],
        "birthday": [
            {"vendor_type": "DJ & Sound System", "status": "pending"},
            {"vendor_type": "Custom Theme Cake Baker", "status": "pending"},
            {"vendor_type": "Kids Magic Show & Host", "status": "pending"},
        ],
        "community": [
            {"vendor_type": "Shamiana & Stage Setup", "status": "pending"},
            {"vendor_type": "Live Orchestra / Dandiya Troupe", "status": "pending"},
            {"vendor_type": "Security & Gate Management", "status": "pending"},
        ],
    }
    return common + extras.get(event_type, [])


# ---------------------------------------------------------------------------
# AI Service class
# ---------------------------------------------------------------------------

class AIService:
    """Gemini-powered AI helpers for Indian celebration planning."""

    def generate_event_ideas(
        self,
        event_type: str,
        guest_count: Optional[int],
        budget: Optional[float],
        preferences: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Return theme ideas, decorations, food, and entertainment tailored to Indian customs."""
        model = _get_model()
        if model is None:
            return _fallback_ideas(event_type)

        prompt = (
            f"You are an expert Indian celebration and event planner. Generate ideas for a {event_type} in India "
            f"with approximately {guest_count or '150'} guests and a budget of ₹{budget or '5,00,000'}. "
            f"Consider rich Indian traditions (Sangeet, Haldi, Mehendi, Pooja, Festive Melas, Indian cuisines). "
            + (f"User preferences: {preferences}. " if preferences else "")
            + "Return ONLY a JSON object with keys: themes (list of strings), "
            "decorations (list of strings), food (list of strings), entertainment (list of strings). "
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
        """Return a list of budget category dicts with estimated_cost in INR (₹)."""
        model = _get_model()
        if model is None:
            return _fallback_budget(total_budget, event_type)

        prompt = (
            f"You are an expert Indian wedding and event financial planner. Allocate a ₹{total_budget:.2f} budget "
            f"for a {event_type} in India with {guest_count or '150'} guests. "
            "Include typical Indian categories like Venue/Lawn, Catering/Mithai, Mandap/Floral Decor, "
            "Photography, DJ/Dhol, Attire, and Pooja/Rituals. "
            "Return ONLY a JSON array where each element has keys: "
            "category (string), name (string), estimated_cost (number), notes (string). "
            "Make costs sum close to the total budget in INR. No extra text."
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
        """Return planning timeline milestones in an Indian event context."""
        model = _get_model()
        if model is None:
            return _fallback_timeline(event_date, event_type)

        date_str = event_date.strftime("%Y-%m-%d") if event_date else "TBD"
        prompt = (
            f"You are a premier Indian event planner. Create a step-by-step planning timeline for an Indian "
            f"{event_type} scheduled for {date_str} with {guest_count or '150'} guests. "
            "Include Indian celebration milestones like Muhurat, Sangeet dance practice, Mehendi artist booking, "
            "Lagan Patrika / Invitation distribution, and Haldi prep. "
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
        """Return Indian vendor checklist (Catering/Halwai, Mandap, Dhol/DJ, Mehendi, Pandit Ji)."""
        model = _get_model()
        if model is None:
            return _fallback_vendors(event_type)

        prompt = (
            f"You are an Indian event coordinator. List the vendors needed for an Indian "
            f"{event_type} with {guest_count or '150'} guests and a budget of ₹{budget or '5,00,000'}. "
            "Include vendors like Banquet/Resort, Catering/Halwai, Candid Photographer, Mandap Decorator, "
            "Dhol/DJ, Mehendi Artist, Pandit Ji / Officiant. "
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
        Context-aware conversational assistant tailored for Indian celebrations.
        """
        model = _get_model()

        ctx_lines = [
            "You are an expert Indian celebration and event planning assistant.",
            "You help users organize Indian Weddings (Shaadi, Sangeet, Mehendi, Haldi), "
            "Birthdays (Janmadin, Annaprashan, Milestones), and Community Events (Diwali Mela, Dandiya Raas, Ganesh Utsav).",
            "Always use Indian Rupees (₹ / INR) for budgets and prices.",
            "Provide culturally rich, practical, warm, and creative Indian advice."
        ]
        if event_context:
            ctx_lines.append(
                f"\nCurrent celebration context:\n"
                f"- Title: {event_context.get('title', 'N/A')}\n"
                f"- Type: {event_context.get('event_type', 'N/A')}\n"
                f"- Date: {event_context.get('event_date', 'N/A')}\n"
                f"- Venue: {event_context.get('venue', 'N/A')}\n"
                f"- Guest count: {event_context.get('guest_count', 'N/A')}\n"
                f"- Total budget: ₹{event_context.get('total_budget', 'N/A')}\n"
                f"- Description: {event_context.get('description', 'N/A')}"
            )
        system_ctx = "\n".join(ctx_lines)

        if model is None:
            last_user_msg = next(
                (m["content"] for m in reversed(messages) if m.get("role") == "user"),
                "Namaste",
            )
            return (
                f"Namaste! I am your AI event planning assistant for Indian celebrations. "
                f"(AI live responses are in offline demo mode — set GEMINI_API_KEY to activate Gemini). "
                f"Regarding your query: \"{last_user_msg}\", I can help you plan traditional rituals, "
                f"Haldi/Sangeet ceremonies, delicious Indian banquet catering, and budget allocations in ₹ INR!"
            )

        try:
            history = []
            for msg in messages[:-1]:
                role = "user" if msg.get("role") == "user" else "model"
                history.append({"role": role, "parts": [msg["content"]]})

            chat_session = model.start_chat(history=history)
            last_user = messages[-1]["content"] if messages else "Namaste"
            full_prompt = f"{system_ctx}\n\nUser: {last_user}"
            response = chat_session.send_message(full_prompt)
            return response.text
        except Exception as exc:
            logger.warning("chat failed: %s", exc)
            return (
                "I apologize, I encountered an issue processing your request. "
                "Please try again in a moment."
            )


# Singleton instance
ai_service = AIService()
