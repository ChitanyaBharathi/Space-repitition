import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MindForge Backend API"
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://pklvfialofgylifvdkcn.supabase.co")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHZmaWFsb2ZneWxpZnZka2NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MDIzMDksImV4cCI6MjEwMzM3ODMwOX0.ysIQcl0KgBvCgkfPxhlfwKZn9EwyCDxi_B95ZxXwtA0")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
