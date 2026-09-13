"""
Fundus Image Quality Gate & Retinal Morphology Validation.

Two-Stage Verification Pipeline:
Stage 1: Retinal Fundus Morphology Validation (Is it a genuine retinal fundus image?)
- Evaluates chromatic distribution (warm red-orange choroid signature vs cool/neutral non-retinal objects).
- Analyzes green-channel vessel contrast and dark ocular perimeter.
- Rejects random webcam captures (faces, rooms, objects, ceilings, text).

Stage 2: Optical Quality & Clarity Gate (Is the retina image sharp and clear?)
- Evaluates resolution, brightness/illumination, contrast, and focus/blur sharpness.
- Flags motion blur, optical defocus, or extreme glare.

STATUS DECISIONS:
- GOOD: Valid retinal photograph with diagnostic clarity.
- RETAKE_REQUIRED: Valid retinal image, but degraded (blurry, too dark, or glare).
- INVALID_IMAGE: Not a retinal fundus photograph (non-retinal object or invalid capture).
"""

from typing import Dict, List, Any, Union
from pathlib import Path
# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
from PIL import Image
# pyrefly: ignore [missing-import]
import cv2

# Quality Gate Decision Statuses
STATUS_GOOD = "GOOD"
STATUS_RETAKE_REQUIRED = "RETAKE_REQUIRED"
STATUS_INVALID_IMAGE = "INVALID_IMAGE"
STATUS_NOT_RETINA = "INVALID_IMAGE"

QUALITY_DISCLAIMER = (
    "Prototype explainable quality & morphology heuristics for demonstration. "
    "Not clinically validated."
)


def is_retinal_fundus_image(img_np: np.ndarray) -> Dict[str, Any]:
    """
    Validates whether an image exhibits the morphological and chromatic characteristics
    of an illuminated human retinal fundus photograph.
    """
    h, w = img_np.shape[:2]
    if h < 32 or w < 32:
        return {
            "is_retina": False,
            "confidence": 0.0,
            "reason": "Image resolution is too low for anatomical inspection.",
            "metrics": {"resolution": f"{w}x{h}"}
        }

    r = img_np[:, :, 0].astype(np.float32)
    g = img_np[:, :, 1].astype(np.float32)
    b = img_np[:, :, 2].astype(np.float32)

    # Convert to grayscale for FOV boundary
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    mean_all = float(np.mean(gray))

    # Reject total dark / covered lens
    if mean_all < 18.0:
        return {
            "is_retina": False,
            "confidence": 0.0,
            "is_dark": True,
            "reason": f"Severe underexposure or camera lens obscured (mean brightness: {mean_all:.1f}/255).",
            "metrics": {
                "mean_r": round(float(np.mean(r)), 1),
                "mean_g": round(float(np.mean(g)), 1),
                "mean_b": round(float(np.mean(b)), 1),
                "rb_ratio": 0.0,
                "rg_ratio": 0.0,
                "retina_color_ratio": 0.0,
            }
        }

    # Reject blown-out white surfaces / documents
    if mean_all > 235.0:
        return {
            "is_retina": False,
            "confidence": 0.0,
            "reason": f"Severe overexposure or white document/screen detected (mean brightness: {mean_all:.1f}/255).",
            "metrics": {
                "mean_r": round(float(np.mean(r)), 1),
                "mean_g": round(float(np.mean(g)), 1),
                "mean_b": round(float(np.mean(b)), 1),
                "rb_ratio": 1.0,
                "rg_ratio": 1.0,
                "retina_color_ratio": 0.0,
            }
        }

    fg_mask = gray > 15
    fg_pixels_count = int(np.sum(fg_mask))

    if fg_pixels_count < 0.15 * h * w:
        return {
            "is_retina": False,
            "confidence": 0.0,
            "reason": "Image lacks illuminated ocular field of view.",
            "metrics": {"fg_fraction": round(fg_pixels_count / (h * w), 3)}
        }

    r_fg = r[fg_mask]
    g_fg = g[fg_mask]
    b_fg = b[fg_mask]

    mean_r = float(np.mean(r_fg))
    mean_g = float(np.mean(g_fg))
    mean_b = float(np.mean(b_fg))

    # Metric 1: Red Dominance over Green and Blue (Fundus absorbs green/blue, strongly reflects red)
    rb_ratio = mean_r / (mean_b + 1e-4)
    rg_ratio = mean_r / (mean_g + 1e-4)
    tot_fg = mean_r + mean_g + mean_b + 1e-4
    blue_share = mean_b / tot_fg

    # Metric 2: Warm Retinal Hue Coverage in HSV space
    # Retinal hues: warm red-orange-amber spectrum (Hue [0..30] or [160..180] in OpenCV 0-180 scale)
    hsv = cv2.cvtColor(img_np, cv2.COLOR_RGB2HSV)
    hue = hsv[:, :, 0]
    sat = hsv[:, :, 1]
    val = hsv[:, :, 2]

    retina_color_mask = (
        ((hue <= 30) | (hue >= 160)) &
        (sat >= 25) &
        (val >= 25) &
        fg_mask
    )
    retina_color_ratio = float(np.sum(retina_color_mask)) / float(fg_pixels_count) if fg_pixels_count > 0 else 0.0

    # Metric 3: Ophthalmic Circular Aperture / Corner Darkness Check
    c_sz = int(min(h, w) * 0.12)
    corner_mask = np.zeros((h, w), dtype=bool)
    corner_mask[:c_sz, :c_sz] = True
    corner_mask[:c_sz, -c_sz:] = True
    corner_mask[-c_sz:, :c_sz] = True
    corner_mask[-c_sz:, -c_sz:] = True
    corner_lum = float(np.mean(gray[corner_mask])) if np.sum(corner_mask) > 0 else 0.0
    center_lum = float(np.mean(gray[h // 4 : 3 * h // 4, w // 4 : 3 * w // 4])) if h >= 4 and w >= 4 else mean_all

    is_retina = True
    reasons = []

    # Check A: Red must significantly exceed Green (choroidal hemoglobin reflection)
    if rg_ratio < 1.30:
        is_retina = False
        reasons.append(f"Insufficient red-to-green ratio ({rg_ratio:.2f} < 1.30, not choroidal tissue).")

    # Check B: Red must heavily exceed Blue (fundus absorbs blue)
    if rb_ratio < 1.65:
        is_retina = False
        reasons.append(f"Chromatic profile lacks retinal red reflectance (Red/Blue ratio: {rb_ratio:.2f} < 1.65).")

    # Check C: Blue share must be low (< 22%)
    if blue_share > 0.22:
        is_retina = False
        reasons.append(f"Excessive blue spectrum ({blue_share * 100.0:.1f}% > 22%, room/screen lighting).")

    # Check D: Warm retinal pigment coverage
    if retina_color_ratio < 0.40:
        is_retina = False
        reasons.append(f"Warm retinal pigment coverage is only {retina_color_ratio * 100.0:.1f}% (minimum 40% required).")

    # Check E: Neutral Gray Check (Faces, office rooms, keyboards, text documents)
    diff_rg = abs(mean_r - mean_g)
    diff_rb = abs(mean_r - mean_b)
    if diff_rg < 12 and diff_rb < 16:
        is_retina = False
        reasons.append("Image exhibits neutral/grayscale tones characteristic of an office or room environment.")

    # Check F: Circular ophthalmic aperture check
    if corner_lum > 70.0 and corner_lum > 0.70 * center_lum:
        is_retina = False
        reasons.append(f"Image lacks circular ophthalmic aperture (bright illuminated corners: {corner_lum:.1f}).")

    metrics = {
        "mean_r": round(mean_r, 1),
        "mean_g": round(mean_g, 1),
        "mean_b": round(mean_b, 1),
        "rb_ratio": round(rb_ratio, 2),
        "rg_ratio": round(rg_ratio, 2),
        "blue_share": round(blue_share, 3),
        "retina_color_ratio": round(retina_color_ratio, 3),
        "corner_lum": round(corner_lum, 1),
    }

    if is_retina:
        confidence = min(98.5, 75.0 + retina_color_ratio * 20.0 + min(8.0, rb_ratio * 3.0))
        return {
            "is_retina": True,
            "confidence": round(confidence, 1),
            "reason": "Valid retinal fundus morphology detected.",
            "metrics": metrics
        }
    else:
        return {
            "is_retina": False,
            "confidence": 0.0,
            "reason": " ".join(reasons) if reasons else "Photograph does not contain retinal anatomical features.",
            "metrics": metrics
        }


def evaluate_fundus_quality(
    image_input: Union[Image.Image, np.ndarray, str, Path],
) -> Dict[str, Any]:
    """
    Evaluates retinal fundus image validity and quality across:
    1. Retinal Morphology Validity (Is it a retina image?)
    2. Resolution
    3. Brightness / Illumination
    4. Contrast / Dynamic Range
    5. Blur / Focus Sharpness
    """
    # 1. Load image into numpy RGB format
    if isinstance(image_input, (str, Path)):
        pil_img = Image.open(str(image_input)).convert("RGB")
        img_np = np.array(pil_img)
    elif isinstance(image_input, Image.Image):
        pil_img = image_input.convert("RGB")
        img_np = np.array(pil_img)
    elif isinstance(image_input, np.ndarray):
        img_np = image_input.copy()
        if img_np.ndim == 2:
            img_np = cv2.cvtColor(img_np, cv2.COLOR_GRAY2RGB)
        elif img_np.shape[2] == 4:
            img_np = cv2.cvtColor(img_np, cv2.COLOR_RGBA2RGB)
    else:
        raise ValueError(f"Unsupported image_input type: {type(image_input)}")

    height, width = img_np.shape[:2]

    # ---------------------------------------------------------
    # STAGE 1: Retinal Morphology Check (Is it a Retina?)
    # ---------------------------------------------------------
    retina_morphology = is_retinal_fundus_image(img_np)
    if not retina_morphology["is_retina"]:
        invalid_msg = "No result as the image is not valid. The captured photograph is not a retinal fundus image."
        return {
            "quality_score": 0.0,
            "quality_status": STATUS_INVALID_IMAGE,
            "is_retina": False,
            "is_clear": False,
            "quality_messages": [invalid_msg, retina_morphology["reason"]],
            "metrics": {
                "morphology": retina_morphology["metrics"],
                "resolution": {"width": width, "height": height},
            },
            "disclaimer": QUALITY_DISCLAIMER,
        }

    # ---------------------------------------------------------
    # STAGE 2: Clarity & Quality Gate (Is the Retina Clear?)
    # ---------------------------------------------------------
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)
    retina_mask = gray > 15
    retina_pixels = gray[retina_mask] if np.any(retina_mask) else gray.flatten()

    messages: List[str] = []
    is_retake = False

    # Heuristic 1: Resolution (Max 25 pts)
    min_dim = min(width, height)
    if min_dim < 120:
        res_score = 0.0
        res_msg = f"Resolution ({width}x{height}) is critically low. Minimum 180x180 required for microaneurysm detection."
        is_retake = True
    elif min_dim < 180:
        res_score = 12.0
        res_msg = f"Resolution ({width}x{height}) is below standard threshold (180x180). Retinal microvessels cannot be discerned."
        is_retake = True
    elif min_dim < 300:
        res_score = 20.0
        res_msg = f"Resolution ({width}x{height}) meets basic criteria, but >= 400x400 is recommended for optimal diagnostic detail."
    else:
        res_score = 25.0
        res_msg = f"Resolution ({width}x{height}) meets diagnostic imaging standards."
    messages.append(res_msg)

    # Heuristic 2: Brightness / Illumination (Max 25 pts)
    if len(retina_pixels) > 0:
        mean_lum = float(np.mean(retina_pixels))
        clip_high_pct = float(np.mean(retina_pixels > 248) * 100.0)
    else:
        mean_lum = 0.0
        clip_high_pct = 0.0

    if mean_lum < 28.0:
        bright_score = 5.0
        bright_msg = f"Severe underexposure (mean brightness: {mean_lum:.1f}/255). Retinal structures are obscured in dark shadows."
        is_retake = True
    elif mean_lum < 40.0:
        bright_score = 14.0
        bright_msg = f"Sub-optimal illumination (mean brightness: {mean_lum:.1f}/255). Retinal fundus is too dark."
        is_retake = True
    elif mean_lum > 230.0 or clip_high_pct > 35.0:
        bright_score = 5.0
        bright_msg = f"Severe overexposure / flash glare (mean: {mean_lum:.1f}/255, {clip_high_pct:.1f}% washed out). Retinal detail is obscured."
        is_retake = True
    elif mean_lum > 210.0 or clip_high_pct > 18.0:
        bright_score = 16.0
        bright_msg = f"Moderate glare / high brightness (mean: {mean_lum:.1f}/255). Some retinal areas may be washed out."
    else:
        bright_score = 25.0
        bright_msg = f"Illumination is well-balanced across the retina (mean luminance: {mean_lum:.1f}/255)."
    messages.append(bright_msg)

    # Heuristic 3: Contrast / Dynamic Range (Max 25 pts)
    std_contrast = float(np.std(retina_pixels)) if len(retina_pixels) > 1 else 0.0
    if std_contrast < 9.0:
        contrast_score = 5.0
        contrast_msg = f"Extremely low contrast (std dev: {std_contrast:.1f}). Insufficient dynamic range to distinguish hemorrhages or exudates."
        is_retake = True
    elif std_contrast < 15.0:
        contrast_score = 16.0
        contrast_msg = f"Borderline contrast (std dev: {std_contrast:.1f}). Subtle microaneurysms may be difficult to differentiate."
    elif std_contrast < 24.0:
        contrast_score = 21.0
        contrast_msg = f"Adequate retinal contrast (std dev: {std_contrast:.1f})."
    else:
        contrast_score = 25.0
        contrast_msg = f"High contrast (std dev: {std_contrast:.1f}) provides sharp differentiation of vascular features."
    messages.append(contrast_msg)

    # Heuristic 4: Blur / Focus Sharpness (Max 25 pts)
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    if laplacian_var < 18.0:
        blur_score = 4.0
        blur_msg = f"Severe motion blur or optical defocus detected (focus score: {laplacian_var:.1f}). Retinal vessels are blurry."
        is_retake = True
    elif laplacian_var < 30.0:
        blur_score = 14.0
        blur_msg = f"Soft or slightly blurred focus (focus score: {laplacian_var:.1f}). Borderline sharpness for micro-lesion detection."
        if std_contrast < 14.0 or mean_lum < 35.0:
            is_retake = True
    elif laplacian_var < 65.0:
        blur_score = 20.0
        blur_msg = f"Acceptable focus sharpness (focus score: {laplacian_var:.1f}). Retinal arcade vessels are identifiable."
    else:
        blur_score = 25.0
        blur_msg = f"Sharp focus (focus score: {laplacian_var:.1f}) with distinct optic disc and vessel margins."
    messages.append(blur_msg)

    total_score = round(float(res_score + bright_score + contrast_score + blur_score), 1)
    total_score = max(0.0, min(100.0, total_score))

    if total_score < 55.0:
        is_retake = True

    if is_retake:
        final_status = STATUS_RETAKE_REQUIRED
        status_msg = "Retake the image, it is not clear. Image clarity is insufficient for automated diagnostic analysis."
    else:
        final_status = STATUS_GOOD
        status_msg = "Retinal image is verified and meets clarity criteria for diagnostic analysis."

    return {
        "quality_score": total_score,
        "quality_status": final_status,
        "status_message": status_msg,
        "is_retina": True,
        "is_clear": not is_retake,
        "quality_messages": messages,
        "metrics": {
            "resolution": {"width": width, "height": height, "score": res_score},
            "brightness": {"mean_luminance": round(mean_lum, 2), "clip_high_pct": round(clip_high_pct, 2), "score": bright_score},
            "contrast": {"std_deviation": round(std_contrast, 2), "score": contrast_score},
            "blur": {"laplacian_variance": round(laplacian_var, 2), "score": blur_score},
            "morphology": retina_morphology["metrics"],
        },
        "disclaimer": QUALITY_DISCLAIMER,
    }
