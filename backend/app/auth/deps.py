from typing import Any

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.database.mongo import users

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Session expired. Please log in again.",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict[str, Any]:
    user_id = decode_access_token(token)
    if not user_id or not ObjectId.is_valid(user_id):
        raise UNAUTHORIZED
    user = await users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise UNAUTHORIZED
    return user
