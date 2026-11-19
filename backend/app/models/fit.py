from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Audience = Literal["men", "women", "kids"]


class Measurements(BaseModel):
    chest: float = Field(gt=30, lt=200, description="Chest / bust circumference in cm")
    waist: float = Field(gt=30, lt=200)
    hip: float = Field(gt=30, lt=200)
    shoulder: float = Field(gt=15, lt=80)
    sleeve: float = Field(gt=20, lt=100)
    inseam: float | None = Field(default=None, gt=20, lt=120)
    height: float | None = Field(default=None, gt=50, lt=260)


class MeasurementOut(BaseModel):
    id: str
    measurements: Measurements
    quality: float
    views: list[str]
    image_urls: dict[str, str] = {}
    # view -> joint name -> [x, y, visibility] (x/y normalized 0..1)
    landmarks: dict[str, dict[str, list[float]]] = {}
    created_at: datetime


class RecommendIn(BaseModel):
    brand: str = Field(min_length=1, max_length=60)
    category: str = Field(min_length=1, max_length=60)
    audience: Audience
    measurements: Measurements
    quality: float = Field(default=0.9, ge=0, le=1)


class SizeMatch(BaseModel):
    brand: str
    brand_name: str
    size: str
    confidence: int


class RecommendationOut(BaseModel):
    id: str
    brand: str
    brand_name: str
    category: str
    audience: Audience
    measurements: Measurements
    recommended_size: str
    confidence: int
    fit_note: str
    comparison: list[SizeMatch]
    created_at: datetime


class PurchaseIn(BaseModel):
    product_id: str = Field(max_length=120)
    product_name: str = Field(max_length=200)
    brand: str = Field(max_length=60)
    size: str = Field(max_length=20)
    price: float = Field(ge=0)
    store: str = Field(max_length=40)
    url: str = Field(max_length=500)
