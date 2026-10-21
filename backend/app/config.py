"""Application configuration and environment settings."""
import json
import os
from typing import List
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

try:
    from pydantic_settings import BaseSettings, SettingsConfigDict

    class Settings(BaseSettings):
        SECRET_KEY: str = "your-secret-key-change-in-production"
        ALGORITHM: str = "HS256"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

        GEMINI_API_KEY: str = ""
        DATABASE_URL: str = "sqlite:///./event_planner.db"
        CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

        model_config = SettingsConfigDict(
            env_file=".env",
            env_file_encoding="utf-8",
            case_sensitive=True,
            extra="ignore",
        )

except ImportError:
    from pydantic import BaseModel

    class Settings(BaseModel):
        SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
        ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
        ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24)))

        GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
        DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./event_planner.db")
        CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

        def __init__(self, **kwargs):
            cors = os.getenv("CORS_ORIGINS")
            if cors:
                try:
                    kwargs["CORS_ORIGINS"] = json.loads(cors)
                except Exception:
                    kwargs["CORS_ORIGINS"] = [x.strip() for x in cors.split(",")]
            super().__init__(**kwargs)


settings = Settings()
