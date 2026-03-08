from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "NexusSolo"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # Database (individual fields for RDS, or full URL for local)
    DATABASE_URL: str = ""
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_NAME: str = "nexus_solo"
    DB_USER: str = "root"
    DB_PASSWORD: str = "password"

    # LLM Provider: "bedrock", "gemini", or "mock"
    LLM_PROVIDER: str = "mock"

    # AWS / Bedrock
    AWS_REGION: str = "ap-south-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    BEDROCK_CRITICAL_MODEL: str = "us.anthropic.claude-opus-4-6-20250624-v1:0"
    BEDROCK_FAST_MODEL: str = "us.anthropic.claude-sonnet-4-6-20250514-v1:0"

    # Gemini (legacy, still supported)
    GEMINI_API_KEY: str = ""

    # Platform APIs
    YOUTUBE_API_KEY: str = ""
    INSTAGRAM_APP_ID: str = ""
    INSTAGRAM_APP_SECRET: str = ""
    INSTAGRAM_APP_NAME: str = ""

    # Security
    API_KEY_SECRET: str = "nexus-dev-secret"
    DEFAULT_API_KEY: str = "nexus-dev-key-12345"

    # Rate Limiting
    RATE_LIMIT_PER_HOUR: int = 1000

    @property
    def effective_database_url(self) -> str:
        """Return DATABASE_URL if set, otherwise build from individual DB_* fields."""
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
