from fastapi import APIRouter, HTTPException, Query, status

from app.brands.data import BRANDS, BRANDS_BY_SLUG, Brand

router = APIRouter(prefix="/brands", tags=["brands"])


@router.get("", response_model=list[Brand])
async def list_brands(
    q: str | None = Query(default=None, max_length=60),
    segment: str | None = Query(default=None, max_length=30),
):
    results = BRANDS
    if q:
        needle = q.lower()
        results = [b for b in results if needle in b["name"].lower()]
    if segment:
        results = [b for b in results if segment in b["segments"]]
    return results


@router.get("/{slug}", response_model=Brand)
async def get_brand(slug: str):
    brand = BRANDS_BY_SLUG.get(slug)
    if not brand:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Brand not found")
    return brand
