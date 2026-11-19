from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, status

from app.auth.deps import get_current_user
from app.database.mongo import measurements, purchases
from app.models.fit import MeasurementOut, PurchaseIn

router = APIRouter(prefix="/history", tags=["history"])


@router.get("/measurements", response_model=list[MeasurementOut])
async def measurement_history(limit: int = Query(default=10, ge=1, le=50), user=Depends(get_current_user)):
    cursor = measurements.find({"user_id": user["_id"]}).sort("created_at", -1).limit(limit)
    return [
        MeasurementOut(id=str(d["_id"]), measurements=d["measurements"], quality=d["quality"],
                       views=d["views"], image_urls=d.get("image_urls", {}), created_at=d["created_at"])
        async for d in cursor
    ]


@router.post("/purchases", status_code=status.HTTP_201_CREATED)
async def record_purchase(payload: PurchaseIn, user=Depends(get_current_user)):
    doc = {**payload.model_dump(), "user_id": user["_id"], "created_at": datetime.now(timezone.utc)}
    result = await purchases.insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.get("/purchases")
async def purchase_history(limit: int = Query(default=20, ge=1, le=100), user=Depends(get_current_user)):
    cursor = purchases.find({"user_id": user["_id"]}).sort("created_at", -1).limit(limit)
    return [
        {**{k: v for k, v in d.items() if k not in ("_id", "user_id")}, "id": str(d["_id"])}
        async for d in cursor
    ]
