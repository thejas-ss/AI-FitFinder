"""Maps body measurements to brand sizes."""

from app.brands.data import BRANDS_BY_SLUG

SizeChart = list[tuple[str, float, float]]  # (label, min_cm_inclusive, max_cm_exclusive)

MEN_TOPS: SizeChart = [
    ("XS", 82, 88), ("S", 88, 94), ("M", 94, 100), ("L", 100, 106),
    ("XL", 106, 112), ("XXL", 112, 118), ("3XL", 118, 126),
]
WOMEN_TOPS: SizeChart = [
    ("XS", 78, 83), ("S", 83, 88), ("M", 88, 94), ("L", 94, 100),
    ("XL", 100, 106), ("XXL", 106, 112), ("3XL", 112, 120),
]
WOMEN_HIPS: SizeChart = [
    ("XS", 84, 89), ("S", 89, 94), ("M", 94, 100), ("L", 100, 106),
    ("XL", 106, 112), ("XXL", 112, 118), ("3XL", 118, 126),
]
KIDS_BY_HEIGHT: SizeChart = [
    ("2-3Y", 92, 98), ("3-4Y", 98, 104), ("4-5Y", 104, 110), ("5-6Y", 110, 116),
    ("6-7Y", 116, 122), ("7-8Y", 122, 128), ("8-9Y", 128, 134), ("9-10Y", 134, 140),
    ("10-11Y", 140, 146), ("11-12Y", 146, 152), ("12-13Y", 152, 158), ("13-14Y", 158, 164),
]

BOTTOM_CATEGORIES = {
    "jeans", "pants", "cargo", "skirts", "palazzo", "leggings", "jeggings",
    "salwar", "churidar", "trousers", "shorts",
}
FULL_BODY_CATEGORIES = {
    "dresses", "maxi-dresses", "midi-dresses", "mini-dresses", "gowns", "jumpsuits",
    "co-ord-sets", "anarkali", "kurta-sets", "lehengas", "nightwear", "maternity-wear",
}
# Extra room (cm) each garment type needs on top of the body measurement before it is matched
# to a size chart. Outerwear is worn over other clothes, so it needs a bigger size than a shirt
# for the same body. Chest-based categories add this to the chest, bottoms to the waist/hip.
# Tune these numbers as you collect real brand charts.
CATEGORY_EASE_CM = {
    # tops - close fit, no layering
    "t-shirts": 0, "polo": 0, "shirts": 0, "tops": 0, "blouses": 0, "sportswear": 0, "activewear": 0,
    "formal-shirts": 1, "kurti": 2, "tunics": 2,
    # relaxed or layered
    "kurta": 4, "kurta-sets": 4, "anarkali": 4, "sweaters": 4, "shrugs": 4,
    # worn over a shirt / sweater: size up
    "blazers": 6, "jackets": 8, "sherwani": 8,
    # full-length
    "dresses": 0, "maxi-dresses": 0, "midi-dresses": 0, "mini-dresses": 0, "gowns": 2, "lehengas": 2,
    "jumpsuits": 2, "co-ord-sets": 2, "nightwear": 4, "maternity-wear": 8,
    # bottoms (added to waist/hip)
    "jeans": 0, "jeggings": 0, "leggings": 0, "pants": 1, "trousers": 1, "cargo": 2, "palazzo": 4,
}
KIDS_EASE_CM = {"winter": 6}  # added to height: one size up for layering

COMPARISON_BRANDS = ["tommy-hilfiger", "us-polo", "levis", "zara", "hm", "nike"]

ORDER = {label: i for chart in (MEN_TOPS, WOMEN_TOPS, KIDS_BY_HEIGHT) for i, (label, _, _) in enumerate(chart)}


def match_chart(value: float, chart: SizeChart) -> tuple[str, float]:
    """Returns (size_label, fit_score 0..1). Score is 1 at the centre of a size."""
    for label, low, high in chart:
        if low <= value < high:
            centre, half = (low + high) / 2, (high - low) / 2
            return label, 1 - 0.3 * abs(value - centre) / half
    return (chart[0][0], 0.55) if value < chart[0][1] else (chart[-1][0], 0.55)


def waist_to_jeans_size(waist_cm: float) -> tuple[str, float]:
    inches = waist_cm / 2.54
    size = int(round(inches / 2) * 2)  # jeans come in even sizes: 28, 30, 32...
    size = max(26, min(size, 46))
    return str(size), 1 - min(abs(inches - size) / 2, 0.4)


def category_ease(category: str, audience: str) -> float:
    if audience == "kids":
        return float(KIDS_EASE_CM.get(category, 0))
    return float(CATEGORY_EASE_CM.get(category, 0))


def size_for_brand(brand_slug: str, category: str, audience: str, m: dict) -> tuple[str, float]:
    brand = BRANDS_BY_SLUG.get(brand_slug)
    offset = brand["fit_offset_cm"] if brand else 0.0
    ease = category_ease(category, audience)

    if audience == "kids":
        return match_chart((m.get("height") or 120) + offset / 2 + ease, KIDS_BY_HEIGHT)

    if category in BOTTOM_CATEGORIES:
        if audience == "men" or category in {"jeans", "jeggings"}:
            return waist_to_jeans_size(m["waist"] + offset / 2 + ease / 2)
        return match_chart(m["hip"] + offset + ease, WOMEN_HIPS)

    tops = MEN_TOPS if audience == "men" else WOMEN_TOPS
    size, score = match_chart(m["chest"] + offset + ease, tops)

    if category in FULL_BODY_CATEGORIES and audience == "women":
        hip_size, hip_score = match_chart(m["hip"] + offset + ease, WOMEN_HIPS)
        # For full-length garments the larger of bust/hip size wins.
        if ORDER.get(hip_size, 0) > ORDER.get(size, 0):
            size, score = hip_size, hip_score

    return size, score


def fit_note(brand_slug: str, score: float, category: str = "", audience: str = "") -> str:
    brand = BRANDS_BY_SLUG.get(brand_slug)
    fit = brand["fit"] if brand else "Regular"
    if score > 0.9:
        note = f"{fit} fit — you sit right in the middle of this size."
    elif score > 0.75:
        note = f"{fit} fit — comfortable, with a little room to move."
    else:
        note = f"{fit} fit — you are between sizes; size up for a relaxed feel."
    if category_ease(category, audience) >= 6:
        note += " Sized up so it fits comfortably over other layers."
    return note


def recommend(brand_slug: str, category: str, audience: str, measurements: dict, quality: float) -> dict:
    size, score = size_for_brand(brand_slug, category, audience, measurements)
    confidence = round(min(score * quality, 0.99) * 100)

    standard_size, standard_score = size_for_brand("", category, audience, measurements)
    comparison = [{"brand": "standard", "brand_name": "Standard", "size": standard_size,
                   "confidence": round(standard_score * quality * 100)}]
    for slug in [s for s in COMPARISON_BRANDS if s != brand_slug][:4]:
        other_size, other_score = size_for_brand(slug, category, audience, measurements)
        comparison.append({
            "brand": slug,
            "brand_name": BRANDS_BY_SLUG[slug]["name"],
            "size": other_size,
            "confidence": round(other_score * quality * 100),
        })

    return {
        "recommended_size": size,
        "confidence": confidence,
        "fit_note": fit_note(brand_slug, score, category, audience),
        "comparison": comparison,
    }
