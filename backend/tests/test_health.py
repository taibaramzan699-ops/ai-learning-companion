"""Smoke test that does not touch MongoDB, Pinecone, or Firebase."""
from unittest.mock import AsyncMock, MagicMock, patch

def test_health_check(monkeypatch):
    monkeypatch.setenv("MONGODB_URI", "mongodb://localhost:27017")
    monkeypatch.setenv("FIREBASE_CREDENTIALS_PATH", "./firebase-service-account.json")
    monkeypatch.setenv("PINECONE_API_KEY", "test")
    monkeypatch.setenv("CLOUDINARY_CLOUD_NAME", "test")
    monkeypatch.setenv("CLOUDINARY_API_KEY", "test")
    monkeypatch.setenv("CLOUDINARY_API_SECRET", "test")
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    monkeypatch.setenv("GEMINI_API_KEY", "test")

    with (
        patch("app.db.mongodb.connect_to_mongo", new_callable=AsyncMock),
        patch("app.db.mongodb.close_mongo_connection", new_callable=AsyncMock),
        patch("app.services.pinecone_service._get_index", return_value=MagicMock()),
        patch("app.core.security._ensure_firebase"),
        patch("firebase_admin.credentials.Certificate", return_value=MagicMock()),
        patch("firebase_admin.initialize_app"),
    ):
        from fastapi.testclient import TestClient
        from app.main import app

        with TestClient(app) as client:
            response = client.get("/health")
            assert response.status_code == 200
            assert response.json()["status"] == "ok"