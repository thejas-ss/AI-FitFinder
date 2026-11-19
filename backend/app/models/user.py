from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field

Gender = Literal["male", "female", "other"]


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    phone: str = Field(pattern=r"^\+?[0-9]{7,15}$")
    password: str = Field(min_length=8, max_length=128)
    gender: Gender
    date_of_birth: date
    height_cm: float = Field(gt=50, lt=260)
    weight_kg: float = Field(gt=10, lt=300)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    remember_me: bool = False


class GoogleLoginIn(BaseModel):
    credential: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    phone: str | None = Field(default=None, pattern=r"^\+?[0-9]{7,15}$")
    gender: Gender | None = None
    date_of_birth: date | None = None
    height_cm: float | None = Field(default=None, gt=50, lt=260)
    weight_kg: float | None = Field(default=None, gt=10, lt=300)
    avatar_url: str | None = None


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    phone: str | None = None
    gender: Gender | None = None
    date_of_birth: date | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    avatar_url: str | None = None
    favorite_brands: list[str] = []


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


def serialize_user(doc: dict[str, Any]) -> UserOut:
    fields = {key: doc.get(key) for key in UserOut.model_fields if key not in ("id", "favorite_brands")}
    return UserOut(id=str(doc["_id"]), favorite_brands=doc.get("favorite_brands", []), **fields)
