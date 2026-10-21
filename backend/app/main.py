"""FastAPI entry point for EventCraft AI — GenAI-Powered Event Planning Assistant."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth, events, budget, timeline, vendors, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database schema on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="EventCraft AI API",
    version="1.0.0",
    description="GenAI-powered planning assistant for weddings, birthdays, and community events.",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(budget.router)
app.include_router(timeline.router)
app.include_router(vendors.router)
app.include_router(chat.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "name": "EventCraft AI API",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
