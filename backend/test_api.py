"""
Automated verification tests for NetraSaarthi FastAPI Backend.
Uses FastAPI TestClient to verify all required endpoints and validations.
"""
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["service"] == "NetraSaarthi AI Backend"

    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
    print("[PASS] Root & Health checks passed")


def test_patient_endpoints():
    # 1. Test POST /patients
    new_patient_payload = {
        "name": "Kamala Bai",
        "age": 56,
        "gender": "Female",
        "village": "Govindpur Sector 2",
        "phone": "+91 91234 56789",
        "diabetes_years": 8,
        "hypertension": True,
        "insulin": False,
        "rbs": 245.0,
        "hba1c": 8.9,
        "symptoms": ["Blurred vision", "Headaches"],
    }
    create_res = client.post("/patients", json=new_patient_payload)
    assert create_res.status_code == 201, create_res.text
    patient_data = create_res.json()
    assert patient_data["name"] == "Kamala Bai"
    assert patient_data["id"] is not None
    assert patient_data["custom_id"] is not None
    patient_id = patient_data["id"]
    print(f"[PASS] POST /patients passed (Created ID: {patient_id})")

    # 2. Test GET /patients
    list_res = client.get("/patients")
    assert list_res.status_code == 200
    patients = list_res.json()
    assert len(patients) >= 1
    print(f"[PASS] GET /patients passed ({len(patients)} patients returned)")

    # 3. Test GET /patients/{patient_id}
    get_res = client.get(f"/patients/{patient_id}")
    assert get_res.status_code == 200
    single_patient = get_res.json()
    assert single_patient["id"] == patient_id
    assert single_patient["name"] == "Kamala Bai"
    print(f"[PASS] GET /patients/{patient_id} passed")

    # 4. Test GET /patients/999999 (404 check)
    not_found_res = client.get("/patients/999999")
    assert not_found_res.status_code == 404
    print("[PASS] GET /patients/{patient_id} 404 check passed")

    return patient_id


def test_screening_endpoints(patient_id: int):
    # 1. Test POST /screenings
    screening_payload = {
        "patient_id": patient_id,
        "eye_scanned": "OD (Right Eye)",
        "notes": "Patient reports hazy vision in bright light. Grade: 2",
        "image_url": "https://storage.googleapis.com/netrasaarthi-fundus/sample1.jpg",
    }
    create_screen_res = client.post("/screenings", json=screening_payload)
    assert create_screen_res.status_code == 201, create_screen_res.text
    screening_data = create_screen_res.json()
    assert screening_data["patient_id"] == patient_id
    screening_id = screening_data["id"]

    # Verify mock AI prediction was generated and attached
    assert "prediction" in screening_data
    pred = screening_data["prediction"]
    assert pred is not None
    assert pred["predicted_grade"] in [0, 1, 2, 3, 4]
    assert pred["confidence"] > 90.0
    assert "microaneurysms" in pred["lesions"]
    assert len(pred["gradcam_hotspots"]) > 0
    assert "heatmap_url" in pred and pred["heatmap_url"] is not None
    assert pred["explanation_type"] == "AI Attention Visualization (Grad-CAM)"
    assert "clinically definitive lesion map" in pred["disclaimer"].lower()
    print(f"[PASS] POST /screenings passed (Screening ID: {screening_id}, AI Grade: {pred['predicted_grade']}, Heatmap: {pred['heatmap_url']})")

    # 2. Test GET /screenings/{screening_id}
    get_screen_res = client.get(f"/screenings/{screening_id}")
    assert get_screen_res.status_code == 200
    screen_detail = get_screen_res.json()
    assert screen_detail["id"] == screening_id
    assert screen_detail["patient"]["id"] == patient_id
    assert screen_detail["prediction"]["id"] == pred["id"]
    print(f"[PASS] GET /screenings/{screening_id} passed")

    # 3. Test POST /screenings/{screening_id}/review
    review_payload = {
        "doctor_name": "Dr. Arvind Joshi, MD",
        "confirmed_grade": 2,
        "agree_with_ai": True,
        "doctor_notes": "Moderate NPDR confirmed with parafoveal hard exudate ring. Diet control advised.",
        "follow_up_recommendation": "Tele-consult review in 60 days.",
    }
    review_res = client.post(f"/screenings/{screening_id}/review", json=review_payload)
    assert review_res.status_code == 201, review_res.text
    review_data = review_res.json()
    assert review_data["screening_id"] == screening_id
    assert review_data["doctor_name"] == "Dr. Arvind Joshi, MD"
    assert review_data["confirmed_grade"] == 2
    assert review_data["review_status"] == "Specialist Validated"
    print(f"[PASS] POST /screenings/{screening_id}/review passed")

    # 4. Verify review is now attached to GET /screenings/{screening_id}
    updated_screen_res = client.get(f"/screenings/{screening_id}")
    updated_screen = updated_screen_res.json()
    assert updated_screen["doctor_review"] is not None
    assert updated_screen["status"] == "Specialist Validated"
    print("[PASS] GET /screenings/{screening_id} contains validated doctor review")


def test_screenings_analyze(screening_id: int):
    import io
    # pyrefly: ignore [missing-import]
    from PIL import Image

    print("\n--- Testing POST /screenings/analyze (PyTorch + Grad-CAM Integration) ---")

    # 1. Generate valid synthetic retinal fundus image (RGB 224x224)
    fundus_img = Image.new("RGB", (224, 224), color=(180, 60, 30))
    for x in range(70, 150):
        for y in range(70, 150):
            fundus_img.putpixel((x, y), (230, 200, 80))
    img_buf = io.BytesIO()
    fundus_img.save(img_buf, format="PNG")
    valid_png_bytes = img_buf.getvalue()

    # A. Test successful analysis with valid retinal image and screening_id
    res = client.post(
        "/screenings/analyze",
        data={"screening_id": screening_id},
        files={"image": ("retina_sample.png", valid_png_bytes, "image/png")},
    )
    assert res.status_code == 200, f"Analysis failed: {res.text}"
    data = res.json()

    assert data["screening_id"] == screening_id
    assert data["predicted_class"] in [0, 1, 2, 3, 4]
    assert isinstance(data["confidence"], float) and 0.0 <= data["confidence"] <= 1.0
    assert data["heatmap_url"].startswith("/static/heatmaps/")
    assert len(data["recommendation"]) > 0
    assert data["status"] == "success"
    # Quality gate verification
    assert data["quality_status"] == "GOOD"
    assert isinstance(data["quality_score"], float) and data["quality_score"] >= 60.0
    assert isinstance(data["quality_messages"], list) and len(data["quality_messages"]) == 4
    assert "Not clinically validated" in data.get("disclaimer", "")

    print(
        f"[PASS] POST /screenings/analyze success: class={data['predicted_class']}, "
        f"quality={data['quality_status']} ({data['quality_score']}/100), heatmap={data['heatmap_url']}"
    )

    # B. Verify the generated Grad-CAM heatmap can be fetched via /static/
    static_res = client.get(data["heatmap_url"])
    assert static_res.status_code == 200, f"Could not retrieve heatmap at {data['heatmap_url']}"
    assert "image" in static_res.headers.get("content-type", "")
    print(f"[PASS] Static heatmap file retrieved successfully from {data['heatmap_url']}")

    # C. Verify SQLite database persistence for Screening and Prediction
    get_res = client.get(f"/screenings/{screening_id}")
    assert get_res.status_code == 200
    screen_detail = get_res.json()
    assert screen_detail["image_url"] is not None and "/static/uploads/" in screen_detail["image_url"]
    assert screen_detail["prediction"] is not None
    assert screen_detail["prediction"]["predicted_grade"] == data["predicted_class"]
    assert screen_detail["prediction"]["heatmap_url"] == data["heatmap_url"]
    assert screen_detail["prediction"]["quality_score"] == data["quality_score"]
    assert screen_detail["prediction"]["quality_status"] == "GOOD"
    assert screen_detail["prediction"]["explanation_type"] == "AI Attention Visualization (Grad-CAM)"
    print("[PASS] SQLite persistence verified: Prediction, quality, and heatmap saved")

    # D. Test Quality Gate: Blurry image -> RETAKE_REQUIRED (AI inference halted)
    # pyrefly: ignore [missing-import]
    import cv2
    # pyrefly: ignore [missing-import]
    import numpy as np
    blurry_arr = cv2.GaussianBlur(np.array(fundus_img), (51, 51), 25)
    blurry_pil = Image.fromarray(blurry_arr)
    blurry_buf = io.BytesIO()
    blurry_pil.save(blurry_buf, format="PNG")

    res_blur = client.post(
        "/screenings/analyze",
        data={"screening_id": screening_id},
        files={"image": ("blurry.png", blurry_buf.getvalue(), "image/png")},
    )
    assert res_blur.status_code == 200
    blur_data = res_blur.json()
    assert blur_data["quality_status"] == "RETAKE_REQUIRED"
    assert blur_data["status"] == "RETAKE_REQUIRED"
    assert blur_data["predicted_class"] is None  # Inference must be gated; no fabricated prediction!
    assert blur_data["confidence"] is None
    assert blur_data["heatmap_url"] is None
    assert any("blur" in msg.lower() or "focus" in msg.lower() for msg in blur_data["quality_messages"])
    print(f"[PASS] Quality Gate correctly intercepted blurry image: {blur_data['quality_status']} (Score: {blur_data['quality_score']})")

    # E. Test Quality Gate: Severely dark/underexposed image -> RETAKE_REQUIRED
    dark_pil = Image.new("RGB", (224, 224), color=(10, 5, 2))
    dark_buf = io.BytesIO()
    dark_pil.save(dark_buf, format="PNG")

    res_dark = client.post(
        "/screenings/analyze",
        data={"screening_id": screening_id},
        files={"image": ("dark.png", dark_buf.getvalue(), "image/png")},
    )
    assert res_dark.status_code == 200
    dark_data = res_dark.json()
    assert dark_data["quality_status"] == "RETAKE_REQUIRED"
    assert dark_data["predicted_class"] is None
    assert any("underexposure" in msg.lower() or "dark" in msg.lower() for msg in dark_data["quality_messages"])
    print(f"[PASS] Quality Gate correctly intercepted dark image: {dark_data['quality_status']} (Score: {dark_data['quality_score']})")

    # F. Test nonexistent screening_id -> 404
    res_404 = client.post(
        "/screenings/analyze",
        data={"screening_id": 999999},
        files={"image": ("retina_sample.png", valid_png_bytes, "image/png")},
    )
    assert res_404.status_code == 404, f"Expected 404 for invalid screening_id, got {res_404.status_code}"
    print("[PASS] POST /screenings/analyze 404 check passed for nonexistent screening")

    # G. Test invalid file type (e.g. text file) -> 400
    res_bad_type = client.post(
        "/screenings/analyze",
        data={"screening_id": screening_id},
        files={"image": ("report.txt", b"Invalid text file content", "text/plain")},
    )
    assert res_bad_type.status_code == 400, f"Expected 400 for text file, got {res_bad_type.status_code}"
    print("[PASS] POST /screenings/analyze 400 check passed for invalid file type")

    # H. Test corrupted image bytes -> 400
    res_corrupt = client.post(
        "/screenings/analyze",
        data={"screening_id": screening_id},
        files={"image": ("corrupted.png", b"\x89PNG\r\n\x1a\nCorruptedGarbageBytes12345", "image/png")},
    )
    assert res_corrupt.status_code == 400, f"Expected 400 for corrupted image, got {res_corrupt.status_code}"
    print("[PASS] POST /screenings/analyze 400 check passed for corrupted image data")

    # I. Test low resolution image (< 32x32) -> 400
    tiny_img = Image.new("RGB", (16, 16), color=(200, 100, 50))
    tiny_buf = io.BytesIO()
    tiny_img.save(tiny_buf, format="PNG")
    res_tiny = client.post(
        "/screenings/analyze",
        data={"screening_id": screening_id},
        files={"image": ("tiny.png", tiny_buf.getvalue(), "image/png")},
    )
    assert res_tiny.status_code == 400, f"Expected 400 for low resolution image, got {res_tiny.status_code}"
    print("[PASS] POST /screenings/analyze 400 check passed for low resolution image")

    # J. Test missing image file -> 400
    res_missing = client.post(
        "/screenings/analyze",
        data={"screening_id": screening_id},
    )
    assert res_missing.status_code == 400 or res_missing.status_code == 422
    print("[PASS] POST /screenings/analyze 400/422 check passed for missing file")


def test_quality_check_endpoint():
    import io
    # pyrefly: ignore [missing-import]
    from PIL import Image

    print("\n--- Testing POST /screenings/quality-check (Standalone Gate) ---")

    # 1. Test good image
    fundus_img = Image.new("RGB", (300, 300), color=(180, 60, 30))
    for x in range(100, 200):
        for y in range(100, 200):
            fundus_img.putpixel((x, y), (230, 200, 80))
    img_buf = io.BytesIO()
    fundus_img.save(img_buf, format="PNG")

    res = client.post(
        "/screenings/quality-check",
        files={"image": ("quality_sample.png", img_buf.getvalue(), "image/png")},
    )
    assert res.status_code == 200, f"Quality check failed: {res.text}"
    data = res.json()
    assert data["quality_status"] == "GOOD"
    assert data["quality_score"] >= 60.0
    assert len(data["quality_messages"]) == 4
    assert "metrics" in data
    assert "Not clinically validated" in data["disclaimer"]
    print(f"[PASS] Standalone Quality Gate: status={data['quality_status']}, score={data['quality_score']}")



def test_cors_headers():
    res = client.options(
        "/patients",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert res.headers.get("access-control-allow-origin") in ["http://localhost:5173", "*"]
    print("[PASS] CORS headers configured properly for frontend")


if __name__ == "__main__":
    print("--- Running NetraSaarthi API Verification ---")
    test_root_and_health()
    pid = test_patient_endpoints()
    test_screening_endpoints(pid)
    test_screenings_analyze(pid)
    test_quality_check_endpoint()
    test_cors_headers()
    print("\nALL VERIFICATION TESTS PASSED SUCCESSFULLY!")

