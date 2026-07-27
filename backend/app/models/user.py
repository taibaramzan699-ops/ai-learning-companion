from datetime import datetime, timezone
from typing import Literal
from pydantic import BaseModel, Field, ConfigDict


class UserBase(BaseModel):
    email: str
    display_name: str
    photo_url: str | None = None
    role: Literal["student", "admin"] = "student"


class UserCreate(UserBase):
    firebase_uid: str


class UserInDB(UserBase):
    model_config = ConfigDict(populate_by_name=True)

    id: str = Field(alias="_id")
    firebase_uid: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserPublic(UserBase):
    id: str
    created_at: datetime
