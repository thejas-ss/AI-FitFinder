import pytest

mp = pytest.importorskip("mediapipe")
if not hasattr(mp, "solutions"):  # newer MediaPipe releases dropped the legacy API pose.py uses
    pytest.skip("mediapipe.solutions not available", allow_module_level=True)

from app.ai import pose  # noqa: E402


def test_depth_from_chest_inverts_the_ellipse():
    depth = pose.depth_from_chest(40.0, 100.0)
    assert pose.ellipse_circumference(40.0, depth) == pytest.approx(100.0, abs=0.05)


def test_ellipse_of_circle():
    assert pose.ellipse_circumference(20, 20) == pytest.approx(62.83, abs=0.05)


def test_front_photo_must_exist():
    with pytest.raises(pose.PoseError):
        pose.analyse_photos({"side": b""}, 175)
