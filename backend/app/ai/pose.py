"""Body measurement extraction with MediaPipe Pose + segmentation.

Pipeline for each photo:
1. Decode + downscale with OpenCV.
2. Run MediaPipe Pose (landmarks + person segmentation mask).
3. Convert pixels to centimetres using the user's real height.
4. Measure body widths on the mask at chest / waist / hip heights.
5. Combine front width with side depth (measured, or estimated) and
   approximate each circumference as an ellipse (Ramanujan formula).

Best results: fitted clothes, plain background, full body in frame,
arms held ~20 degrees away from the torso (A-pose), camera at chest height.
"""

from dataclasses import dataclass
from math import pi, sqrt

import cv2
import mediapipe as mp
import numpy as np

mp_pose = mp.solutions.pose
P = mp_pose.PoseLandmark

# Typical depth/width ratios of the human torso (front view width vs side view depth)
DEPTH_RATIO = {"chest": 0.72, "waist": 0.76, "hip": 0.74}
KEY_LANDMARKS = [
    P.LEFT_SHOULDER, P.RIGHT_SHOULDER, P.LEFT_HIP, P.RIGHT_HIP,
    P.LEFT_ELBOW, P.RIGHT_ELBOW, P.LEFT_WRIST, P.RIGHT_WRIST,
    P.LEFT_KNEE, P.RIGHT_KNEE, P.LEFT_ANKLE, P.RIGHT_ANKLE,
]


# Simple set of joints returned to the client (drawn as a skeleton overlay).
SIMPLE_LANDMARKS = [
    P.NOSE,
    P.LEFT_SHOULDER, P.RIGHT_SHOULDER, P.LEFT_ELBOW, P.RIGHT_ELBOW, P.LEFT_WRIST, P.RIGHT_WRIST,
    P.LEFT_HIP, P.RIGHT_HIP, P.LEFT_KNEE, P.RIGHT_KNEE, P.LEFT_ANKLE, P.RIGHT_ANKLE,
]


# Shoulder width / torso length measured on the photo. Facing the camera it is about 0.7;
# in profile the shoulders overlap and it drops to roughly 0.1-0.3.
FRONT_MIN_SHOULDER_RATIO = 0.55   # front/back photos must be at least this "wide"
SIDE_MAX_SHOULDER_RATIO = 0.40    # side photos must be at most this "wide"


class PoseError(ValueError):
    """Raised when a photo cannot be analysed; message is safe to show users."""


@dataclass
class ViewAnalysis:
    px_per_cm: float
    widths_cm: dict[str, float]
    shoulder_cm: float
    sleeve_cm: float
    inseam_cm: float
    visibility: float
    landmarks: dict[str, list[float]]  # name -> [x, y, visibility], x/y normalized 0..1


def decode_image(data: bytes, max_side: int = 1280) -> np.ndarray:
    image = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise PoseError("Unsupported image. Please upload a JPG, PNG or WEBP photo.")
    h, w = image.shape[:2]
    scale = max_side / max(h, w)
    if scale < 1:
        image = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return image


def _run_pose(image: np.ndarray):
    with mp_pose.Pose(static_image_mode=True, model_complexity=2, enable_segmentation=True) as pose:
        result = pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    if not result.pose_landmarks or result.segmentation_mask is None:
        raise PoseError("No person detected. Stand fully in frame with good lighting.")
    h, w = image.shape[:2]
    landmarks = result.pose_landmarks.landmark
    points = {lm: np.array([landmarks[lm].x * w, landmarks[lm].y * h]) for lm in P}
    visibility = {lm: landmarks[lm].visibility for lm in P}
    mask = (result.segmentation_mask > 0.5).astype(np.uint8)
    return points, visibility, mask


def _row_width(mask: np.ndarray, y: float, x_center: float) -> float:
    """Width of the contiguous body region on row y that contains x_center."""
    row = mask[int(np.clip(y, 0, mask.shape[0] - 1))]
    x = int(np.clip(x_center, 0, mask.shape[1] - 1))
    if not row[x]:
        return 0.0
    left = x
    while left > 0 and row[left - 1]:
        left -= 1
    right = x
    while right < len(row) - 1 and row[right + 1]:
        right += 1
    return float(right - left + 1)


def _avg_width(mask: np.ndarray, y: float, x_center: float, band: int = 4) -> float:
    widths = [_row_width(mask, y + dy, x_center) for dy in range(-band, band + 1)]
    widths = [w for w in widths if w > 0]
    return float(np.median(widths)) if widths else 0.0


def _dist(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.linalg.norm(a - b))


def check_view_matches_slot(view: str | None, pts: dict, vis: dict) -> None:
    """Reject e.g. a side photo uploaded in the front slot (or the other way round)."""
    if view not in ("front", "back", "side"):
        return
    if min(vis[P.LEFT_SHOULDER], vis[P.RIGHT_SHOULDER]) < 0.5:
        return  # shoulders not reliably found; other checks will report the problem
    shoulder_mid = (pts[P.LEFT_SHOULDER] + pts[P.RIGHT_SHOULDER]) / 2
    hip_mid = (pts[P.LEFT_HIP] + pts[P.RIGHT_HIP]) / 2
    torso = _dist(shoulder_mid, hip_mid)
    if torso <= 0:
        return
    ratio = _dist(pts[P.LEFT_SHOULDER], pts[P.RIGHT_SHOULDER]) / torso
    if view in ("front", "back") and ratio < FRONT_MIN_SHOULDER_RATIO:
        raise PoseError(f"Please add the correct photo. The {view} photo must face the camera, but this looks like a side view.")
    if view == "side" and ratio > SIDE_MAX_SHOULDER_RATIO:
        raise PoseError("Please add the correct photo. The side photo must show you in profile (turned 90 degrees), not facing the camera.")


def analyse_view(data: bytes, height_cm: float, view: str | None = None) -> ViewAnalysis:
    image = decode_image(data)
    pts, vis, mask = _run_pose(image)
    check_view_matches_slot(view, pts, vis)

    body_rows = np.where(mask.any(axis=1))[0]
    if body_rows.size == 0:
        raise PoseError("Could not separate you from the background. Try a plainer background.")
    top = body_rows.min()
    feet = max(pts[P.LEFT_HEEL][1], pts[P.RIGHT_HEEL][1], pts[P.LEFT_FOOT_INDEX][1], pts[P.RIGHT_FOOT_INDEX][1])
    pixel_height = feet - top
    if pixel_height < image.shape[0] * 0.5:
        raise PoseError("Please step back so your whole body, head to feet, is visible.")
    px_per_cm = pixel_height / height_cm

    shoulder_mid = (pts[P.LEFT_SHOULDER] + pts[P.RIGHT_SHOULDER]) / 2
    hip_mid = (pts[P.LEFT_HIP] + pts[P.RIGHT_HIP]) / 2
    torso = hip_mid[1] - shoulder_mid[1]
    x_center = (shoulder_mid[0] + hip_mid[0]) / 2

    rows = {
        "chest": shoulder_mid[1] + 0.25 * torso,
        "waist": shoulder_mid[1] + 0.68 * torso,
        "hip": hip_mid[1] + 0.08 * torso,
    }
    widths_cm = {name: _avg_width(mask, y, x_center) / px_per_cm for name, y in rows.items()}

    # Landmark shoulders sit inside the joint; 1.15 approximates biacromial width.
    shoulder_cm = _dist(pts[P.LEFT_SHOULDER], pts[P.RIGHT_SHOULDER]) * 1.15 / px_per_cm

    def arm(side_shoulder, side_elbow, side_wrist):
        return _dist(pts[side_shoulder], pts[side_elbow]) + _dist(pts[side_elbow], pts[side_wrist])

    sleeve_cm = max(
        arm(P.LEFT_SHOULDER, P.LEFT_ELBOW, P.LEFT_WRIST),
        arm(P.RIGHT_SHOULDER, P.RIGHT_ELBOW, P.RIGHT_WRIST),
    ) / px_per_cm * 1.05

    leg = np.mean([
        _dist(pts[P.LEFT_HIP], pts[P.LEFT_KNEE]) + _dist(pts[P.LEFT_KNEE], pts[P.LEFT_ANKLE]),
        _dist(pts[P.RIGHT_HIP], pts[P.RIGHT_KNEE]) + _dist(pts[P.RIGHT_KNEE], pts[P.RIGHT_ANKLE]),
    ])
    inseam_cm = float(leg) / px_per_cm * 0.9  # crotch sits below the hip joint landmark

    visibility = float(np.mean([vis[lm] for lm in KEY_LANDMARKS]))

    # Re-use the landmarks already computed above: no extra model run, no change to the numbers.
    img_h, img_w = image.shape[:2]
    landmarks = {
        lm.name.lower(): [round(float(pts[lm][0]) / img_w, 4), round(float(pts[lm][1]) / img_h, 4), round(float(vis[lm]), 3)]
        for lm in SIMPLE_LANDMARKS
    }
    return ViewAnalysis(px_per_cm, widths_cm, shoulder_cm, sleeve_cm, inseam_cm, visibility, landmarks)


def ellipse_circumference(width: float, depth: float) -> float:
    a, b = width / 2, depth / 2
    return pi * (3 * (a + b) - sqrt((3 * a + b) * (a + 3 * b)))


def depth_from_chest(width: float, chest_cm: float) -> float:
    """Torso depth (cm) whose ellipse with the measured chest width has circumference chest_cm."""
    lo, hi = width * 0.3, width * 1.5
    for _ in range(40):  # circumference grows with depth, so bisection converges
        mid = (lo + hi) / 2
        if ellipse_circumference(width, mid) < chest_cm:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def analyse_photos(
    views: dict[str, bytes], height_cm: float, chest_cm: float | None = None
) -> tuple[dict[str, float], float, dict[str, dict[str, list[float]]]]:
    """views keys: front (required), side, back, angle45 (optional).

    height_cm sets the pixel->cm scale. chest_cm (optional, the user's known chest size) is used
    to personalise the body depth when there is no side photo, and as the chest result.

    Returns (measurements_cm, quality 0..1, landmarks per view).
    """
    if "front" not in views:
        raise PoseError("A front photo is required.")

    landmarks: dict[str, dict[str, list[float]]] = {}

    front = analyse_view(views["front"], height_cm, "front")
    landmarks["front"] = front.landmarks
    widths = dict(front.widths_cm)
    visibilities = [front.visibility]

    if "back" in views:
        back = analyse_view(views["back"], height_cm, "back")
        landmarks["back"] = back.landmarks
        widths = {k: (widths[k] + back.widths_cm[k]) / 2 for k in widths}
        visibilities.append(back.visibility)

    depths: dict[str, float]
    if "side" in views:
        side = analyse_view(views["side"], height_cm, "side")
        landmarks["side"] = side.landmarks
        depths = side.widths_cm
        visibilities.append(side.visibility)
    else:
        depths = {k: widths[k] * DEPTH_RATIO[k] for k in widths}
        if chest_cm and widths["chest"] > 0:
            # Fit this person's depth/width ratio to their real chest, then carry it to waist and hip.
            ratio = depth_from_chest(widths["chest"], chest_cm) / widths["chest"]
            ratio = min(max(ratio, 0.55), 0.95)  # ignore implausible values (e.g. a typo)
            depths = {k: widths[k] * ratio * DEPTH_RATIO[k] / DEPTH_RATIO["chest"] for k in widths}

    if "angle45" in views:
        angle = analyse_view(views["angle45"], height_cm, "angle45")
        landmarks["angle45"] = angle.landmarks
        visibilities.append(angle.visibility)

    if min(widths.values()) <= 0:
        raise PoseError("Arms are touching your body. Hold them slightly away and retake the photo.")

    result = {
        "chest": float(chest_cm) if chest_cm else ellipse_circumference(widths["chest"], depths["chest"]),
        "waist": ellipse_circumference(widths["waist"], depths["waist"]),
        "hip": ellipse_circumference(widths["hip"], depths["hip"]),
        "shoulder": front.shoulder_cm,
        "sleeve": front.sleeve_cm,
        "inseam": front.inseam_cm,
        "height": height_cm,
    }

    quality = float(np.mean(visibilities))
    view_bonus = {1: 0.88, 2: 0.95, 3: 0.98}.get(len(views), 1.0)
    quality = round(min(quality * view_bonus, 0.99), 3)

    return {k: round(v, 1) for k, v in result.items()}, quality, landmarks


def extract_measurements(
    views: dict[str, bytes], height_cm: float, chest_cm: float | None = None
) -> tuple[dict[str, float], float]:
    """Backwards-compatible wrapper: (measurements_cm, quality 0..1)."""
    values, quality, _ = analyse_photos(views, height_cm, chest_cm)
    return values, quality
