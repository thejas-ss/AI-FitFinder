"""Brand catalogue and fit profiles.

`fit_offset_cm` describes how a brand cuts compared with a standard chart.
Positive values mean the brand runs small/slim, so the body measurement is
"inflated" by that amount before it is matched against the standard chart.
Tune these values with real brand size charts as you collect them.
"""

# Pydantic requires typing_extensions.TypedDict on Python < 3.12
from typing_extensions import TypedDict


class Brand(TypedDict):
    slug: str
    name: str
    website: str
    segments: list[str]
    fit_offset_cm: float
    fit: str
    color: str


BRANDS: list[Brand] = [
    {"slug": "nike", "name": "Nike", "website": "https://www.nike.com/in/", "segments": ["sportswear"], "fit_offset_cm": 0, "fit": "Regular", "color": "#111111"},
    {"slug": "adidas", "name": "Adidas", "website": "https://www.adidas.co.in/", "segments": ["sportswear"], "fit_offset_cm": 0, "fit": "Regular", "color": "#000000"},
    {"slug": "puma", "name": "Puma", "website": "https://in.puma.com/", "segments": ["sportswear"], "fit_offset_cm": 1, "fit": "Regular", "color": "#BA2025"},
    {"slug": "us-polo", "name": "US Polo Assn.", "website": "https://uspoloassn.in/", "segments": ["casual"], "fit_offset_cm": 0, "fit": "Regular", "color": "#0B2A5B"},
    {"slug": "tommy-hilfiger", "name": "Tommy Hilfiger", "website": "https://in.tommy.com/", "segments": ["premium", "casual"], "fit_offset_cm": 5, "fit": "Slim", "color": "#002F6C"},
    {"slug": "levis", "name": "Levi's", "website": "https://levi.in/", "segments": ["denim", "casual"], "fit_offset_cm": 2, "fit": "Regular", "color": "#C41230"},
    {"slug": "peter-england", "name": "Peter England", "website": "https://www.peterengland.com/", "segments": ["formal"], "fit_offset_cm": 0, "fit": "Regular", "color": "#1D3557"},
    {"slug": "van-heusen", "name": "Van Heusen", "website": "https://vanheusenindia.abfrl.in/", "segments": ["formal"], "fit_offset_cm": 2, "fit": "Tailored", "color": "#22223B"},
    {"slug": "allen-solly", "name": "Allen Solly", "website": "https://allensolly.abfrl.in/", "segments": ["formal", "casual"], "fit_offset_cm": 2, "fit": "Tailored", "color": "#2B2D42"},
    {"slug": "louis-philippe", "name": "Louis Philippe", "website": "https://louisphilippe.abfrl.in/", "segments": ["formal", "premium"], "fit_offset_cm": 2, "fit": "Tailored", "color": "#3D2B1F"},
    {"slug": "raymond", "name": "Raymond", "website": "https://www.myraymond.com/", "segments": ["formal", "ethnic"], "fit_offset_cm": 0, "fit": "Regular", "color": "#5A189A"},
    {"slug": "arrow", "name": "Arrow", "website": "https://arrow.abfrl.in/", "segments": ["formal"], "fit_offset_cm": 1, "fit": "Regular", "color": "#14213D"},
    {"slug": "blackberrys", "name": "Blackberrys", "website": "https://blackberrys.com/", "segments": ["formal"], "fit_offset_cm": 3, "fit": "Slim", "color": "#1B1B1B"},
    {"slug": "hm", "name": "H&M", "website": "https://www2.hm.com/en_in/", "segments": ["fast-fashion"], "fit_offset_cm": 1, "fit": "Regular", "color": "#E50010"},
    {"slug": "zara", "name": "Zara", "website": "https://www.zara.com/in/", "segments": ["fast-fashion", "premium"], "fit_offset_cm": 5, "fit": "Slim", "color": "#000000"},
    {"slug": "burberry", "name": "Burberry", "website": "https://in.burberry.com/", "segments": ["luxury"], "fit_offset_cm": 4, "fit": "Slim", "color": "#8B6B3D"},
    {"slug": "calvin-klein", "name": "Calvin Klein", "website": "https://calvinklein.in/", "segments": ["premium"], "fit_offset_cm": 4, "fit": "Slim", "color": "#1A1A1A"},
    {"slug": "lacoste", "name": "Lacoste", "website": "https://www.lacoste.in/", "segments": ["premium", "casual"], "fit_offset_cm": 3, "fit": "Classic", "color": "#004526"},
    {"slug": "lee", "name": "Lee", "website": "https://www.leejeans.in/", "segments": ["denim"], "fit_offset_cm": 1, "fit": "Regular", "color": "#2E4A7D"},
    {"slug": "wrangler", "name": "Wrangler", "website": "https://www.wrangler.in/", "segments": ["denim"], "fit_offset_cm": 0, "fit": "Regular", "color": "#7A1F1F"},
    {"slug": "flying-machine", "name": "Flying Machine", "website": "https://www.flyingmachine.in/", "segments": ["denim", "casual"], "fit_offset_cm": 2, "fit": "Slim", "color": "#0D3B66"},
    {"slug": "mufti", "name": "Mufti", "website": "https://www.muftijeans.in/", "segments": ["denim", "casual"], "fit_offset_cm": 3, "fit": "Slim", "color": "#3A3A3A"},
    {"slug": "being-human", "name": "Being Human", "website": "https://www.beinghumanclothing.com/", "segments": ["casual"], "fit_offset_cm": -1, "fit": "Relaxed", "color": "#1F7A8C"},
    {"slug": "spykar", "name": "Spykar", "website": "https://spykar.com/", "segments": ["denim"], "fit_offset_cm": 2, "fit": "Slim", "color": "#E63946"},
    {"slug": "roadster", "name": "Roadster", "website": "https://www.myntra.com/roadster", "segments": ["casual"], "fit_offset_cm": -1, "fit": "Relaxed", "color": "#6D4C41"},
    {"slug": "jack-jones", "name": "Jack & Jones", "website": "https://www.jackjones.in/", "segments": ["casual", "denim"], "fit_offset_cm": 4, "fit": "Slim", "color": "#0A0A0A"},
]

BRANDS_BY_SLUG: dict[str, Brand] = {b["slug"]: b for b in BRANDS}
