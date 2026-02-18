"""
Application Entry Point
=======================
Creates and configures the FastAPI application.

Run locally:   uvicorn app.main:app --reload --port 8000
In production: uvicorn app.main:app --host 0.0.0.0 --port 8000

Interactive API docs available at: http://localhost:8000/docs
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import get_settings
from app.routes.matches import router as match_router

# Configure structured logging for the entire application.
# All files use: logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    """
    Application factory — creates a configured FastAPI instance.

    Using a factory function (instead of a bare `app = FastAPI()`) makes
    testing easier: you can call create_app() with different settings.
    """
    settings = get_settings()

    app = FastAPI(
        title="MatchNearby API",
        description="Backend for the MatchNearby app. Proxies API-Football, "
                    "caches data in Supabase, and serves clean match data.",
        version="0.1.0",
    )

    # ── CORS Middleware ──
    # Browsers block cross-origin requests by default. Without this,
    # your React frontend at localhost:5173 can't call this API at localhost:8000.
    # In production, set CORS_ORIGINS to your real frontend URL.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Route Registration ──
    # All match routes are prefixed with /api to match the frontend contract.
    # So @router.get("/matches") becomes GET /api/matches on the server.
    app.include_router(match_router, prefix="/api")

    # ── Health Check ──
    # Used by Railway/hosting platforms to verify the server is alive.
    # Not under /api because it's infrastructure, not part of the API contract.
    @app.get("/health")
    async def health():
        return {"status": "ok", "version": "0.1.0"}

    logger.info("MatchNearby API started")
    logger.info(f"Configured leagues: {settings.league_id_list}")
    return app


# This is what uvicorn imports: `uvicorn app.main:app`
app = create_app()
