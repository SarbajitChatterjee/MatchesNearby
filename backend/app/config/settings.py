"""
Application Settings
====================
Single source of truth for all configuration.
Reads from .env file → environment variables → defaults (in that priority order).

Usage anywhere in the codebase:
    from app.config.settings import get_settings
    settings = get_settings()
    print(settings.api_football_key)
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """
    Each field maps to an environment variable (case-insensitive).
    Example: 'api_football_key' reads from API_FOOTBALL_KEY in .env.

    Default values are fallbacks — override them in .env for your environment.
    """

    # — External Service Credentials —
    api_football_key: str = ""      # Required. API calls fail without this.
    supabase_url: str = ""          # Required. Database connection fails without this.
    supabase_key: str = ""          # Required. Use the service_role key, not anon.

    # — Data Configuration —
    league_ids: str = "39,140,78,135,61,2,3"  # Comma-separated API-Football league IDs
    season: int = 2025                         # Football season year
    fixtures_next: int = 50                    # Upcoming fixtures to fetch per league
    sync_freshness_hours: int = 6              # Hours before cached data is considered stale

    # — Server Configuration —
    host: str = "0.0.0.0"                                          # 0.0.0.0 = accept external connections
    port: int = 8000                                                # Railway overrides this in production
    cors_origins: str = "http://localhost:5173,http://localhost:3000"  # Allowed frontend URLs

    @property
    def league_id_list(self) -> list[int]:
        """Convert comma-separated string '39,140,78' → [39, 140, 78]."""
        return [int(x.strip()) for x in self.league_ids.split(",")]

    @property
    def cors_origin_list(self) -> list[str]:
        """Convert comma-separated string to a list of URLs."""
        return [x.strip() for x in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """
    Returns a cached Settings instance.
    The .env file is read once at startup; subsequent calls return the same object.
    """
    return Settings()
