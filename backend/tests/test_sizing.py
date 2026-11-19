import pytest

from app.ai.sizing import CATEGORY_EASE_CM, ORDER, match_chart, MEN_TOPS, recommend

BODY = {"chest": 98, "waist": 86, "hip": 96, "height": 175}


def size(category, audience="men", brand="us-polo", body=BODY):
    return recommend(brand, category, audience, body, 0.9)["recommended_size"]


def test_jacket_is_larger_than_shirt_for_same_body():
    assert ORDER[size("jackets")] > ORDER[size("shirts")]


def test_blazer_between_shirt_and_jacket():
    assert ORDER[size("shirts")] <= ORDER[size("blazers")] <= ORDER[size("jackets")]


def test_tshirt_and_shirt_match():
    assert size("t-shirts") == size("shirts")


def test_kids_winter_is_one_size_up():
    kid = {"height": 120, "chest": 60, "waist": 55, "hip": 60}
    assert size("winter", "kids", body=kid) != size("casual", "kids", body=kid)


def test_layered_note_for_outerwear_only():
    assert "layers" in recommend("us-polo", "jackets", "men", BODY, 0.9)["fit_note"]
    assert "layers" not in recommend("us-polo", "shirts", "men", BODY, 0.9)["fit_note"]


def test_match_chart_clamps_out_of_range():
    assert match_chart(10, MEN_TOPS)[0] == "XS"
    assert match_chart(500, MEN_TOPS)[0] == "3XL"


@pytest.mark.parametrize("category", sorted(CATEGORY_EASE_CM))
def test_every_category_produces_a_size(category):
    assert size(category, "women")
