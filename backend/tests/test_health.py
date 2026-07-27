"""
Basic smoke test. Full auth-flow tests require a running MongoDB Atlas
connection and a valid Firebase service account — see README for setup.
"""
from fastapi.testclient import TestClient


def test_health_check(monkeypatch):
    # Point at a throwaway local Mongo/Firebase config for import-time settings validation.
    monkeypatch.setenv("MONGODB_URI", "mongodb://localhost:27017")
    monkeypatch.setenv("FIREBASE_CREDENTIALS_PATH", "./firebase-service-account.json")
    monkeypatch.setenv("PINECONE_API_KEY", "test")
    monkeypatch.setenv("CLOUDINARY_CLOUD_NAME", "test")
    monkeypatch.setenv("CLOUDINARY_API_KEY", "test")
    monkeypatch.setenv("CLOUDINARY_API_SECRET", "test")
    monkeypatch.setenv("OPENAI_API_KEY", "test")

    from app.main import app

    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
