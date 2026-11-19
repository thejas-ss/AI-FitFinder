import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError

from app.auth.deps import get_current_user
from app.core.config import settings
from app.core.security import (
    create_access_token,
    hash_password,
    hash_reset_token,
    new_reset_token,
    verify_password,
)
from app.database.mongo import password_resets, users
from app.models.user import (
    ForgotPasswordIn,
    GoogleLoginIn,
    LoginIn,
    RegisterIn,
    ResetPasswordIn,
    TokenOut,
    UserOut,
    serialize_user,
)

logger = logging.getLogger("fitfinder.auth")
router = APIRouter(prefix="/auth", tags=["auth"])


def _now() -> datetime:
    return datetime.now(timezone.utc)


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterIn):
    doc = payload.model_dump(exclude={"password"})
    doc.update(
        email=payload.email.lower(),
        date_of_birth=payload.date_of_birth.isoformat(),
        password_hash=hash_password(payload.password),
        auth_provider="password",
        favorite_brands=[],
        created_at=_now(),
    )
    try:
        result = await users.insert_one(doc)
    except DuplicateKeyError:
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")
    doc["_id"] = result.inserted_id
    return TokenOut(access_token=create_access_token(str(result.inserted_id)), user=serialize_user(doc))


@router.post("/login", response_model=TokenOut)
async def login(payload: LoginIn):
    user = await users.find_one({"email": payload.email.lower()})
    if not user or not user.get("password_hash") or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    token = create_access_token(str(user["_id"]), remember_me=payload.remember_me)
    return TokenOut(access_token=token, user=serialize_user(user))


@router.post("/google", response_model=TokenOut)
async def google_login(payload: GoogleLoginIn):
    if not settings.google_client_id:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Google login is not configured")
    try:
        info = await run_in_threadpool(
            id_token.verify_oauth2_token,
            payload.credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Google credential")
    if not info.get("email_verified"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Google email is not verified")

    user = await users.find_one_and_update(
        {"email": info["email"].lower()},
        {
            "$setOnInsert": {
                "name": info.get("name") or info["email"].split("@")[0],
                "email": info["email"].lower(),
                "avatar_url": info.get("picture"),
                "auth_provider": "google",
                "favorite_brands": [],
                "created_at": _now(),
            }
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return TokenOut(access_token=create_access_token(str(user["_id"]), remember_me=True), user=serialize_user(user))


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordIn):
    user = await users.find_one({"email": payload.email.lower()})
    if user:
        raw, token_hash = new_reset_token()
        await password_resets.insert_one(
            {"user_id": user["_id"], "token_hash": token_hash, "expires_at": _now() + timedelta(minutes=30)}
        )
        reset_link = f"{settings.frontend_url}/reset-password?token={raw}"
        # Replace with an email provider (Resend, SES, SendGrid) in production.
        logger.info("Password reset link for %s: %s", user["email"], reset_link)
    # Same response either way so attackers cannot discover registered emails.
    return {"message": "If that email is registered, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordIn):
    record = await password_resets.find_one_and_delete(
        {"token_hash": hash_reset_token(payload.token), "expires_at": {"$gt": _now()}}
    )
    if not record:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Reset link is invalid or has expired")
    await users.update_one({"_id": record["user_id"]}, {"$set": {"password_hash": hash_password(payload.password)}})
    return {"message": "Password updated. You can now log in."}


@router.get("/me", response_model=UserOut)
async def me(user=Depends(get_current_user)):
    return serialize_user(user)
