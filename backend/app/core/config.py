import json

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central app configuration, loaded from environment variables / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_NAME: str = "AI Learning Companion API"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    # Kept as a raw string so pydantic-settings never tries to JSON-decode the env
    # value (that decode crashes on non-JSON input). Read `cors_origins` for the list.
    CORS_ORIGINS: str = '["http://localhost:3000"]'

    @property
    def cors_origins(self) -> list[str]:
        """Parse CORS_ORIGINS as a JSON array, comma-separated string, or single origin."""
        text = self.CORS_ORIGINS.strip()
        if not text:
            return []
        if text.startswith("["):
            return json.loads(text)
        return [origin.strip() for origin in text.split(",") if origin.strip()]

    # MongoDB Atlas
    MONGODB_URI: str
    MONGODB_DB_NAME: str = "ai_learning_companion"

    # Firebase Admin (service account JSON path)
    FIREBASE_CREDENTIALS_PATH: str

    # Pinecone
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str = "learning-companion"

    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    GEMINI_API_KEY: str
    GEMINI_EMBEDDING_MODEL: str = "models/text-embedding-004"
    OPENAI_API_KEY: str
    OPENAI_CHAT_MODEL: str = "gpt-4o-mini"
    REDIS_URL: str = "redis://localhost:6379/0"
settings = Settings()  # type: ignore[call-arg]