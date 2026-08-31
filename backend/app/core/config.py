import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "MindForge Backend API"
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://pklvfialofgylifvdkcn.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHZmaWFsb2ZneWxpZnZka2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MDIzMDksImV4cCI6MjEwMzM3ODMwOX0.ysIQcl0KgBvCgkfPxhlfwKZn9EwyCDxi_B95ZxXwtA0")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    
    # AI Generation Config
    AI_API_KEY: Optional[str] = os.getenv("AI_API_KEY", "")
    AI_BASE_URL: Optional[str] = os.getenv("AI_BASE_URL", "https://api.openai.com/v1")
    AI_MODEL: str = os.getenv("AI_MODEL", "gpt-4o-mini")
    AI_EMBEDDING_MODEL: str = os.getenv("AI_EMBEDDING_MODEL", "text-embedding-3-small")

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

