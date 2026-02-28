from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "NexusSolo"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "mysql+pymysql://root:password@localhost:3306/nexus_solo"

    # LLM
    LLM_PROVIDER: str = "mock"  # "gemini" or "mock"
    GEMINI_API_KEY: str = ""

    # Platform APIs
    YOUTUBE_API_KEY: str = ""

    # Security
    API_KEY_SECRET: str = "nexus-dev-secret"
    DEFAULT_API_KEY: str = "nexus-dev-key-12345"

    # Rate Limiting
    RATE_LIMIT_PER_HOUR: int = 1000

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
