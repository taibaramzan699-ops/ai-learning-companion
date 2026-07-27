from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central app configuration, loaded from environment variables / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    APP_NAME: str = "AI Learning Companion API"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

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