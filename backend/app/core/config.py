"""Application configuration."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    APP_NAME: str = "DevFlow API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./devflow.db"

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30

    # Monitoring
    MONITOR_INTERVAL: int = 10  # seconds between health checks

    class Config:
        env_file = ".env"


settings = Settings()
