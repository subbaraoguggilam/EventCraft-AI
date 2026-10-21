# 🎉 EventCraft AI — GenAI-Powered Event Planning Assistant

<div align="center">

![EventCraft AI](https://img.shields.io/badge/EventCraft-AI%20Powered-6366f1?style=for-the-badge&logo=sparkles)
![Python](https://img.shields.io/badge/Python-3.11+-3776ab?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-1.5%20Flash-4285f4?style=for-the-badge&logo=google&logoColor=white)

**Plan your perfect wedding, birthday, or community event — powered by Google Gemini AI**

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [API Docs](#-api-documentation) • [Testing](#-testing)

</div>

---

## 📋 Chosen Vertical

**Challenge 5: Celebration & Event Planner**

EventCraft AI is a full-stack, GenAI-powered planning assistant that helps users organize weddings, birthdays, and community events. It provides:
- 🧠 AI-generated personalized ideas (themes, decorations, food, entertainment)
- 💰 Smart budget tracking with category allocation and visualization
- 📅 Auto-generated timelines with milestone management
- 📋 Vendor checklists with status tracking
- 💬 Conversational AI assistant with event context awareness

---

## ✨ Features

### 🤖 AI-Powered (Google Gemini 1.5 Flash)
| Feature | Description |
|---|---|
| **Idea Generation** | Personalized themes, decoration, food & entertainment ideas based on event type, budget, and guest count |
| **Budget Allocation** | Smart budget breakdown by category (venue, catering, photography, etc.) |
| **Timeline Builder** | Auto-generated countdown milestones from today to event date |
| **Vendor Checklist** | Comprehensive vendor list with type, priority, and estimated costs |
| **AI Chat Assistant** | Context-aware conversational assistant that knows your event details |

### 📊 Planning Tools
- **Budget Tracker**: Track estimated vs actual costs, visualize with pie charts
- **Interactive Timeline**: Visual vertical timeline with priority levels and completion tracking
- **Vendor Manager**: Contact info, status tracking (pending → contacted → confirmed), progress view
- **Event Dashboard**: Overview of all events with statistics

### 🔒 Security & Auth
- JWT-based authentication (HS256)
- Password hashing with bcrypt (passlib)
- Row-level security: users can only access their own events
- Input validation (Pydantic v2 with strict field constraints)
- No secrets in code (environment variables only)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React + TS)                │
│  Landing → Auth → Dashboard → Event Detail → AI Chat    │
│  TailwindCSS | React Query | React Router | Recharts     │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP (REST + JSON)
                       │ Proxy: /api → :8000
┌──────────────────────▼──────────────────────────────────┐
│               Backend (FastAPI + Python)                 │
│  /auth  /events  /budget  /timeline  /vendors  /chat    │
│  JWT Auth | Pydantic v2 | SQLAlchemy ORM                │
└──────────┬───────────────────────┬──────────────────────┘
           │                       │
┌──────────▼──────┐    ┌──────────▼──────────────────────┐
│ SQLite Database │    │     Google Gemini 1.5 Flash      │
│ (SQLAlchemy)    │    │  AI Ideas, Budget, Timeline,     │
│                 │    │  Vendors, Chat (context-aware)   │
└─────────────────┘    └──────────────────────────────────┘
```

### Database Schema

```
User ─┐
      ├── Event ─┬── BudgetItem
      │          ├── TimelineItem
      │          ├── VendorItem
      │          └── ChatMessage
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Google Gemini API key ([Get one free](https://aistudio.google.com/))

### Option 1: Manual Setup

#### Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env: set GEMINI_API_KEY and SECRET_KEY

# Run the server
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# VITE_API_URL=http://localhost:8000

# Run dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) 🎉

### Option 2: Docker Compose

```bash
# Set your GEMINI_API_KEY in docker-compose.yml or .env
docker-compose up --build
```

---

## 📁 Project Structure

```
event-planner/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Pydantic Settings
│   │   ├── database.py          # SQLAlchemy setup
│   │   ├── models/
│   │   │   └── models.py        # ORM models (User, Event, ...)
│   │   ├── schemas/
│   │   │   └── schemas.py       # Pydantic v2 schemas
│   │   ├── routers/
│   │   │   ├── auth.py          # /auth/* endpoints
│   │   │   ├── events.py        # /events/* + AI generation
│   │   │   ├── budget.py        # /events/{id}/budget/*
│   │   │   ├── timeline.py      # /events/{id}/timeline/*
│   │   │   ├── vendors.py       # /events/{id}/vendors/*
│   │   │   └── chat.py          # /events/{id}/chat/*
│   │   ├── services/
│   │   │   └── ai_service.py    # Google Gemini integration
│   │   └── utils/
│   │       └── security.py      # JWT, password hashing
│   ├── tests/
│   │   ├── conftest.py          # pytest fixtures
│   │   ├── test_auth.py         # Auth endpoint tests
│   │   ├── test_events.py       # Event CRUD tests
│   │   ├── test_budget.py       # Budget tests
│   │   ├── test_timeline.py     # Timeline tests
│   │   └── test_vendors.py      # Vendor tests
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Common/          # Reusable UI components
│   │   │   ├── Budget/          # Budget tab & components
│   │   │   ├── Timeline/        # Timeline tab & components
│   │   │   ├── Vendors/         # Vendor tab & components
│   │   │   ├── Events/          # Event card component
│   │   │   └── Layout/          # Navbar, Sidebar, ProtectedRoute
│   │   ├── pages/               # Page components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── contexts/            # React contexts
│   │   ├── services/            # Axios API client
│   │   ├── types/               # TypeScript types
│   │   ├── utils/               # Utility functions
│   │   └── test/                # Vitest tests
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── docker-compose.yml
└── README.md
```

---

## 🔌 API Documentation

After starting the backend, visit:
- **Interactive API Docs (Swagger UI)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login, get JWT token |
| `GET` | `/auth/me` | Get current user |
| `GET` | `/events` | List user's events |
| `POST` | `/events` | Create new event |
| `GET` | `/events/{id}` | Get event with all details |
| `POST` | `/events/{id}/generate-ideas` | 🤖 AI: Generate event ideas |
| `POST` | `/events/{id}/generate-budget` | 🤖 AI: Generate budget plan |
| `POST` | `/events/{id}/generate-timeline` | 🤖 AI: Generate timeline |
| `POST` | `/events/{id}/generate-vendors` | 🤖 AI: Generate vendor list |
| `POST` | `/events/{id}/chat` | 🤖 AI: Chat with assistant |

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v --tb=short
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Test Coverage
- **Auth**: Register, login, token validation, unauthorized access
- **Events**: CRUD, ownership checks, AI generation endpoints
- **Budget**: CRUD, summary calculations, category grouping
- **Timeline**: CRUD, completion toggle, priority filtering
- **Vendors**: CRUD, status tracking, contact validation

---

## 🛡️ Security Considerations

1. **Secrets Management**: All secrets via environment variables, never hardcoded
2. **Password Security**: bcrypt hashing with salt (passlib)
3. **JWT Tokens**: HS256 signed, 24-hour expiry
4. **Authorization**: Every endpoint verifies user owns the resource
5. **Input Validation**: Pydantic v2 with strict typing and field constraints
6. **CORS**: Configurable origins, defaults to localhost only
7. **SQL Injection**: SQLAlchemy ORM (parameterized queries)
8. **Rate Limiting**: Handled by Gemini API SDK

---

## ♿ Accessibility

EventCraft AI is built to meet **WCAG 2.1 Level AA** standards:
- Semantic HTML5 (`nav`, `main`, `article`, `header`, `section`)
- ARIA labels on all interactive elements
- Keyboard navigation support (Tab, Enter, Escape)
- Focus indicators (visible focus rings)
- Color contrast ratios ≥ 4.5:1 for text
- Screen reader compatible (role attributes, aria-live regions)
- Responsive design (mobile-first, works from 320px up)

---

## 🤝 Assumptions

1. **Gemini API Key**: User must provide their own Google Gemini API key. The app works without it (returns sensible fallback data).
2. **Single-tenant**: Each user sees only their own events. No team/sharing features in v1.
3. **SQLite**: Chosen for zero-infrastructure setup. Can be swapped for PostgreSQL by changing `DATABASE_URL`.
4. **Currency**: All budget amounts are in USD. Locale formatting applied on frontend.
5. **Internet**: Gemini API requires internet connectivity. Graceful degradation when offline.
6. **Event dates**: Events must be in the future when created; existing events retain their dates.

---

## 🔧 Configuration

### Backend `.env`
| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEY` | `` | Google Gemini API key (required for AI features) |
| `SECRET_KEY` | `change-me` | JWT signing secret (change in production!) |
| `DATABASE_URL` | `sqlite:///./event_planner.db` | SQLAlchemy DB URL |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | Token expiry (24h) |

### Frontend `.env`
| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL |

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with ❤️ for Prompt Wars Hackathon — Challenge 5: Celebration & Event Planner
</div>
