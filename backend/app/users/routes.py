from fastapi import APIRouter, Depends, HTTPException, status
from pymongo import ReturnDocument

from app.auth.deps import get_current_user
from app.brands.data import BRANDS_BY_SLUG
from app.database.mongo import users
from app.models.user import UserOut, UserUpdate, serialize_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_profile(user=Depends(get_current_user)):
    return serialize_user(user)


@router.patch("/me", response_model=UserOut)
async def update_profile(payload: UserUpdate, user=Depends(get_current_user)):
    changes = payload.model_dump(exclude_unset=True, exclude_none=True)
    if "date_of_birth" in changes:
        changes["date_of_birth"] = changes["date_of_birth"].isoformat()
    if not changes:
        return serialize_user(user)
    updated = await users.find_one_and_update(
        {"_id": user["_id"]}, {"$set": changes}, return_document=ReturnDocument.AFTER
    )
    return serialize_user(updated)


@router.post("/me/favorites/{brand}", response_model=UserOut)
async def toggle_favorite(brand: str, user=Depends(get_current_user)):
    if brand not in BRANDS_BY_SLUG:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown brand")
    operator = "$pull" if brand in user.get("favorite_brands", []) else "$addToSet"
    updated = await users.find_one_and_update(
        {"_id": user["_id"]}, {operator: {"favorite_brands": brand}}, return_document=ReturnDocument.AFTER
    )
    return serialize_user(updated)
