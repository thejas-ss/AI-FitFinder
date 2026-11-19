import logging
from datetime import datetime, timezone

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from pydantic import ValidationError

from app.ai.pose import PoseError, analyse_photos
from app.auth.deps import get_current_user
from app.core.config import settings
from app.database.mongo import measurements
from app.models.fit import MeasurementOut, Measurements

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

if settings.cloudinary_enabled:
    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )


async def _read_image(file: UploadFile | None) -> bytes | None:
    if file is None:
        return None
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, f"{file.filename}: use JPG, PNG or WEBP")
    data = await file.read(settings.max_upload_mb * 1024 * 1024 + 1)
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, f"Each photo must be under {settings.max_upload_mb} MB")
    return data


@router.post("/analyze", response_model=MeasurementOut)
async def analyze_photos(
    front: UploadFile = File(...),
    side: UploadFile | None = File(default=None),
    back: UploadFile | None = File(default=None),
    angle45: UploadFile | None = File(default=None),
    height_cm: float | None = Form(default=None, gt=50, lt=260),
    chest_cm: float | None = Form(default=None, gt=50, lt=200),
    save_photos: bool = Form(default=False),
    user=Depends(get_current_user),
):
    height = height_cm or user.get("height_cm")
    if not height:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Add your height to your profile first")

    views: dict[str, bytes] = {}
    for name, file in {"front": front, "side": side, "back": back, "angle45": angle45}.items():
        data = await _read_image(file)
        if data:
            views[name] = data

    try:
        values, quality, landmarks = await run_in_threadpool(analyse_photos, views, float(height), chest_cm)
        Measurements(**values)  # validate now so implausible results give a clear message, not a 500
    except PoseError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(exc))
    except ValidationError:
        logger.warning("Implausible measurements for user %s: %s", user["_id"], values, exc_info=True)
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "Those measurements didn't look right. Stand straight, arms slightly away from your body, "
            "full body in frame, and enter your exact height.",
        )
    except Exception:
        # Full traceback goes to the server log; the user gets a readable message instead of a blank failure.
        logger.exception("Photo analysis crashed for user %s", user["_id"])
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Our analysis service had a problem. Please try again in a moment.")

    image_urls: dict[str, str] = {}
    if save_photos and settings.cloudinary_enabled:
        for name, data in views.items():
            result = await run_in_threadpool(
                cloudinary.uploader.upload,
                data,
                folder=f"fitfinder/{user['_id']}",
                type="authenticated",  # not publicly listable; serve via signed URLs
                resource_type="image",
            )
            image_urls[name] = result["secure_url"]

    doc = {
        "user_id": user["_id"],
        "measurements": values,
        "quality": quality,
        "landmarks": landmarks,
        "views": list(views.keys()),
        "image_urls": image_urls,
        "created_at": datetime.now(timezone.utc),
    }
    inserted = await measurements.insert_one(doc)
    return MeasurementOut(id=str(inserted.inserted_id), measurements=Measurements(**values), quality=quality,
                          views=doc["views"], image_urls=image_urls, landmarks=landmarks, created_at=doc["created_at"])
