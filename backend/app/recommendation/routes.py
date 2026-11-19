from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.ai.sizing import recommend
from app.auth.deps import get_current_user
from app.brands.data import BRANDS_BY_SLUG
from app.database.mongo import recommendations
from app.models.fit import RecommendationOut, RecommendIn

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def _serialize(doc: dict) -> RecommendationOut:
    return RecommendationOut(id=str(doc["_id"]), **{k: v for k, v in doc.items() if k not in ("_id", "user_id")})


@router.post("", response_model=RecommendationOut, status_code=status.HTTP_201_CREATED)
async def create_recommendation(payload: RecommendIn, user=Depends(get_current_user)):
    brand = BRANDS_BY_SLUG.get(payload.brand)
    if not brand:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown brand")

    measured = payload.measurements.model_dump()
    if not measured.get("height"):
        measured["height"] = user.get("height_cm")

    result = recommend(payload.brand, payload.category, payload.audience, measured, payload.quality)
    doc = {
        "user_id": user["_id"],
        "brand": payload.brand,
        "brand_name": brand["name"],
        "category": payload.category,
        "audience": payload.audience,
        "measurements": measured,
        **result,
        "created_at": datetime.now(timezone.utc),
    }
    inserted = await recommendations.insert_one(doc)
    doc["_id"] = inserted.inserted_id
    return _serialize(doc)


@router.get("", response_model=list[RecommendationOut])
async def list_recommendations(limit: int = Query(default=20, ge=1, le=100), user=Depends(get_current_user)):
    cursor = recommendations.find({"user_id": user["_id"]}).sort("created_at", -1).limit(limit)
    return [_serialize(doc) async for doc in cursor]


@router.delete("/{rec_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recommendation(rec_id: str, user=Depends(get_current_user)):
    if not ObjectId.is_valid(rec_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
    result = await recommendations.delete_one({"_id": ObjectId(rec_id), "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Not found")
