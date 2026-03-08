import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database import engine, Base
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.logging import LoggingMiddleware
from app.events.handlers import register_event_handlers

# Import all models so Base.metadata knows about them
import app.models  # noqa: F401

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("nexus_solo")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    settings = get_settings()
    logger.info(f"Starting {settings.APP_NAME} in {settings.APP_ENV} mode")
    logger.info(f"LLM Provider: {settings.LLM_PROVIDER}")

    # Create all tables
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")

    # Register event handlers
    register_event_handlers()

    yield

    logger.info("Shutting down...")


settings = get_settings()

app = FastAPI(
    title="Nexus Solo API",
    description="Multi-agent AI command center for solopreneur creator managers. Manage creators, generate content, detect crises, negotiate deals, and predict performance.",
    version="1.0.0",
    lifespan=lifespan,
)

# Middleware (order matters — last added = outermost = runs first)
# CORSMiddleware MUST be added last so it wraps everything and
# handles preflight OPTIONS before rate-limiting or logging can interfere.
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Register routers
from app.routers import creators, content, trends, crisis, deals, analytics, system, youtube, instagram, pipeline, voice  # noqa: E402

app.include_router(creators.router)
app.include_router(content.router)
app.include_router(trends.router)
app.include_router(crisis.router)
app.include_router(deals.router)
app.include_router(analytics.router)
app.include_router(system.router)
app.include_router(youtube.router)
app.include_router(instagram.router)
app.include_router(pipeline.router)
app.include_router(voice.router)


@app.get("/", tags=["Root"])
def root():
    return {
        "name": "Nexus Solo",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/system/health",
    }
