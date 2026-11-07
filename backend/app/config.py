from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration settings loaded from environment or .env file."""

    anthropic_api_key: Optional[str] = None
    anthropic_model: str = "claude-haiku-5-5"
    host: str = "0.0.0.0"
    port: int = 8000
    environment: str = "development"
    cors_origins: str = "*"

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env", "../.env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def get_cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into a list of origins."""
        if not self.cors_origins or self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
