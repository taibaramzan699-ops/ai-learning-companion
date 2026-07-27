import firebase_admin
from firebase_admin import auth as firebase_auth, credentials
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings

# Initialize Firebase Admin SDK once, using the service account JSON
# downloaded from Firebase Console > Project Settings > Service Accounts.
if not firebase_admin._apps:
    cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)

bearer_scheme = HTTPBearer(auto_error=False)


class FirebaseUser:
    def __init__(self, uid: str, email: str | None, claims: dict):
        self.uid = uid
        self.email = email
        self.claims = claims


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> FirebaseUser:
    """Verify the Firebase ID token sent from the frontend and return the user."""
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = credentials.credentials
    try:
        decoded = firebase_auth.verify_id_token(token)
    except Exception as exc:  # firebase raises various exception subtypes
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
        ) from exc

    return FirebaseUser(uid=decoded["uid"], email=decoded.get("email"), claims=decoded)


async def require_admin(user: FirebaseUser = Depends(get_current_user)) -> FirebaseUser:
    if user.claims.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
