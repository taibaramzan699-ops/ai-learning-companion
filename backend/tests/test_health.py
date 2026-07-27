"""
Basic smoke test. Full auth-flow tests require a running MongoDB Atlas
connection and a valid Firebase service account — see README for setup.
"""
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient


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
    ):
        from app.main import app

        client = TestClient(app)
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

        