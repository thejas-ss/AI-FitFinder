"""Shopping suggestions.

Products here are generated from a small template catalogue so the app works
out of the box. Swap `_catalogue()` for a real product feed (affiliate APIs,
your own Mongo `products` collection, etc.) when you have one.
"""

import hashlib
from urllib.parse import quote_plus

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.deps import get_current_user
from app.brands.data import BRANDS_BY_SLUG

router = APIRouter(prefix="/shopping", tags=["shopping"])

STYLES = {
    "men": ["Classic", "Slim Fit", "Essential", "Premium Cotton", "Everyday", "Signature"],
    "women": ["Elegant", "Flowy", "Tailored", "Everyday", "Festive", "Signature"],
    "kids": ["Playtime", "Comfort", "Everyday", "Festive", "Cozy", "Adventure"],
}
BASE_PRICE = {"sportswear": 1499, "casual": 1299, "denim": 1999, "formal": 1799,
              "premium": 3999, "fast-fashion": 1199, "luxury": 24999, "ethnic": 2499}


def _marketplaces(query: str) -> dict[str, str]:
    q = quote_plus(query)
    return {
        "amazon": f"https://www.amazon.in/s?k={q}",
        "flipkart": f"https://www.flipkart.com/search?q={q}",
        "ajio": f"https://www.ajio.com/search/?text={q}",
        "myntra": f"https://www.myntra.com/{quote_plus(query.lower().replace(' ', '-'))}",
    }


def _catalogue(brand_slug: str, category: str, audience: str, size: str) -> list[dict]:
    brand = BRANDS_BY_SLUG[brand_slug]
    base = BASE_PRICE.get(brand["segments"][0], 1499)
    label = category.replace("-", " ").title()
    products = []
    for i, style in enumerate(STYLES[audience]):
        seed = int(hashlib.md5(f"{brand_slug}{category}{i}".encode()).hexdigest(), 16)
        name = f"{brand['name']} {style} {label}"
        products.append({
            "id": f"{brand_slug}-{category}-{i}",
            "name": name,
            "brand": brand_slug,
            "brand_name": brand["name"],
            "price": base + (seed % 12) * 100 - 1,
            "rating": round(3.8 + (seed % 12) / 10, 1),
            "reviews": 50 + seed % 2400,
            "recommended_size": size,
            "image_url": None,  # plug in your catalogue images (e.g. Cloudinary) here
            "official_url": brand["website"],
            "marketplaces": _marketplaces(f"{brand['name']} {label} {audience}"),
        })
    return products


@router.get("/products")
async def products(
    brand: str = Query(..., max_length=60),
    category: str = Query(..., max_length=60),
    audience: str = Query(..., pattern="^(men|women|kids)$"),
    size: str = Query(..., max_length=20),
    _user=Depends(get_current_user),
):
    if brand not in BRANDS_BY_SLUG:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Unknown brand")
    return _catalogue(brand, category, audience, size)
