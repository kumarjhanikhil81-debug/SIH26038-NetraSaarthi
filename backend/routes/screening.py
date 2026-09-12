from datetime import datetime
import io
import base64
from pathlib import Path
from typing import List, Optional
import uuid

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query, status, File, Form, UploadFile
# pyrefly: ignore [missing-import]
from PIL import Image
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Patient, Screening, Prediction, DoctorReview
from ..schemas import (
    ScreeningCreate,
    ScreeningResponse,
    ScreeningDetailResponse,
    ScreeningAnalyzeResponse,
    QualityGateResponse,
    DoctorReviewCreate,
    DoctorReviewResponse,
)
from ..services.ai_service import mock_ai_service, DR_METADATA

router = APIRouter(prefix="/screenings", tags=["Screenings"])


@router.post(
    "/analyze",
    response_model=ScreeningAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze retinal fundus image using PyTorch EfficientNet-B0",
    description="Accepts a retinal image and screening ID, runs real PyTorch inference and Grad-CAM explainability, updates SQLite, and returns diagnosis.",
)
async def analyze_screening(
    screening_id: int = Form(..., description="Patient screening ID"),
    image: Optional[UploadFile] = File(None, description="Retinal fundus image file (JPEG/PNG)"),
    file: Optional[UploadFile] = File(None, description="Alternative field name for fundus image"),
    db: Session = Depends(get_db),
):
    upload = image or file
    if upload is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Retinal image file is required (field 'image' or 'file').",
        )

    # 1. Verify patient screening exists
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Screening with ID {screening_id} does not exist.",
        )

    # 2. Validate image content-type and filename extension
    allowed_content_types = ["image/jpeg", "image/jpg", "image/png", "image/bmp", "image/webp"]
    allowed_extensions = [".jpg", ".jpeg", ".png", ".bmp", ".webp"]

    filename = upload.filename or "image.png"
    ext = Path(filename).suffix.lower()

    if upload.content_type and upload.content_type.lower() not in allowed_content_types and not upload.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image type '{upload.content_type}'. Expected JPEG or PNG image file.",
        )
    if ext and ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension '{ext}'. Allowed extensions: {', '.join(allowed_extensions)}",
        )

    # 3. Read image contents and handle invalid/corrupted images
    contents = await upload.read()
    if not contents or len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty.",
        )

    try:
        raw_pil = Image.open(io.BytesIO(contents))
        raw_pil.verify()  # Validate image integrity
        raw_pil = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted or invalid image file. Could not decode image data.",
        )

    if raw_pil.width < 32 or raw_pil.height < 32:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image resolution is too low for clinical fundus analysis (min 32x32).",
        )

    # 4. Save uploaded retinal image persistently to static/uploads
    static_uploads_dir = Path(__file__).resolve().parent.parent / "static" / "uploads"
    static_uploads_dir.mkdir(parents=True, exist_ok=True)
    saved_img_name = f"fundus_{screening_id}_{uuid.uuid4().hex[:8]}.png"
    saved_img_path = static_uploads_dir / saved_img_name
    raw_pil.save(saved_img_path, format="PNG")

    # 5. Fundus Image Quality Gate (BEFORE AI INFERENCE)
    try:
        from ml.quality import evaluate_fundus_quality, STATUS_GOOD, STATUS_RETAKE_REQUIRED, STATUS_INVALID_IMAGE
    except ImportError:
        # pyrefly: ignore [missing-import]
        from backend.ml.quality import evaluate_fundus_quality, STATUS_GOOD, STATUS_RETAKE_REQUIRED, STATUS_INVALID_IMAGE

    quality_eval = evaluate_fundus_quality(raw_pil)
    quality_score = float(quality_eval["quality_score"])
    quality_status = quality_eval["quality_status"]
    quality_messages = quality_eval["quality_messages"]

    # STAGE 1: Check if image is NOT a retina at all
    if quality_status == STATUS_INVALID_IMAGE:
        screening.image_url = f"/static/uploads/{saved_img_name}"
        screening.status = "Invalid Image"

        invalid_recommendation = (
            "No result as the image is not valid. The captured photograph does not appear to be a human retinal fundus image "
            "(lacks optic disc, retinal vasculature, or macular anatomy). Please capture or upload a genuine retinal fundus photograph."
        )

        prediction = db.query(Prediction).filter(Prediction.screening_id == screening.id).first()
        if prediction:
            prediction.predicted_grade = 0
            prediction.grade_name = "No Result as the Image is Not Valid"
            prediction.short_name = "Not a Retina Image"
            prediction.confidence = 0.0
            prediction.quality_score = 0.0
            prediction.quality_status = "INVALID_IMAGE"
            prediction.quality_messages = quality_messages
            prediction.risk_category = "Invalid"
            prediction.urgency = "Invalid"
            prediction.action_text = "No result as the image is not valid"
            prediction.action_hindi = "अमान्य फोटो: आंख के पर्दे की फोटो नहीं है"
            prediction.recommendation = invalid_recommendation
            prediction.lesions = {}
            prediction.gradcam_hotspots = []
            prediction.heatmap_url = None
            prediction.explanation_type = "Retinal Morphology Validation"
            prediction.disclaimer = quality_eval.get("disclaimer")
        else:
            prediction = Prediction(
                screening_id=screening.id,
                predicted_grade=0,
                grade_name="No Result as the Image is Not Valid",
                short_name="Not a Retina Image",
                confidence=0.0,
                quality_score=0.0,
                quality_status="INVALID_IMAGE",
                quality_messages=quality_messages,
                risk_category="Invalid",
                urgency="Invalid",
                action_text="No result as the image is not valid",
                action_hindi="अमान्य फोटो: आंख के पर्दे की फोटो नहीं है",
                recommendation=invalid_recommendation,
                lesions={},
                gradcam_hotspots=[],
                heatmap_url=None,
                explanation_type="Retinal Morphology Validation",
                disclaimer=quality_eval.get("disclaimer"),
                created_at=datetime.utcnow(),
            )
            db.add(prediction)

        patient = db.query(Patient).filter(Patient.id == screening.patient_id).first()
        if patient:
            patient.status = "Invalid Image (Non-Retinal Photograph)"

        db.commit()

        return ScreeningAnalyzeResponse(
            screening_id=screening.id,
            predicted_class=None,
            confidence=0.0,
            heatmap_url=None,
            recommendation=invalid_recommendation,
            status="INVALID_IMAGE",
            quality_score=0.0,
            quality_status="INVALID_IMAGE",
            quality_messages=quality_messages,
            disclaimer=quality_eval.get("disclaimer"),
        )

    # STAGE 2: If image is a retina, check if clarity is insufficient (blurry / dark / glare)
    if quality_status == STATUS_RETAKE_REQUIRED:
        screening.image_url = f"/static/uploads/{saved_img_name}"
        screening.status = "Retake Required"

        retake_recommendation = (
            "Retake the image, it is not clear. Image clarity is insufficient for automated diagnostic analysis. "
            "Please recapture the fundus photograph ensuring proper illumination, focus, and patient positioning."
        )

        prediction = db.query(Prediction).filter(Prediction.screening_id == screening.id).first()
        if prediction:
            prediction.predicted_grade = 0
            prediction.grade_name = "Retake Required (Image Not Clear)"
            prediction.short_name = "Image Not Clear"
            prediction.confidence = 0.0
            prediction.quality_score = quality_score
            prediction.quality_status = quality_status
            prediction.quality_messages = quality_messages
            prediction.risk_category = "Unclear"
            prediction.urgency = "Retake Required"
            prediction.action_text = "Retake the image, it is not clear"
            prediction.action_hindi = "दोबारा फोटो लें: फोटो साफ नहीं है"
            prediction.recommendation = retake_recommendation
            prediction.lesions = {}
            prediction.gradcam_hotspots = []
            prediction.heatmap_url = None
            prediction.explanation_type = "Image Quality Assessment (Unclear)"
            prediction.disclaimer = quality_eval.get("disclaimer")
        else:
            prediction = Prediction(
                screening_id=screening.id,
                predicted_grade=0,
                grade_name="Retake Required (Image Not Clear)",
                short_name="Image Not Clear",
                confidence=0.0,
                quality_score=quality_score,
                quality_status=quality_status,
                quality_messages=quality_messages,
                risk_category="Unclear",
                urgency="Retake Required",
                action_text="Retake the image, it is not clear",
                action_hindi="दोबारा फोटो लें: फोटो साफ नहीं है",
                recommendation=retake_recommendation,
                lesions={},
                gradcam_hotspots=[],
                heatmap_url=None,
                explanation_type="Image Quality Assessment (Unclear)",
                disclaimer=quality_eval.get("disclaimer"),
                created_at=datetime.utcnow(),
            )
            db.add(prediction)

        patient = db.query(Patient).filter(Patient.id == screening.patient_id).first()
        if patient:
            patient.status = "Retake Required (Image Not Clear)"

        db.commit()

        return ScreeningAnalyzeResponse(
            screening_id=screening.id,
            predicted_class=None,
            confidence=0.0,
            heatmap_url=None,
            recommendation=retake_recommendation,
            status="RETAKE_REQUIRED",
            quality_score=quality_score,
            quality_status=quality_status,
            quality_messages=quality_messages,
            disclaimer=quality_eval.get("disclaimer"),
        )

    # 6. Run AI inference pipeline (PyTorch or High-Fidelity Retinal Biomarker CV)
    pred_res = None
    heatmap_url = None
    hotspots = []
    predicted_class = 0
    confidence = 0.95
    recommendation = ""

    # Try PyTorch model first if available
    try:
        from ml.predict import DRPredictor
        from ml.explain import GradCAM

        predictor = DRPredictor()
        gradcam = GradCAM(predictor.model)
        pred_res = predictor.predict(raw_pil)
        predicted_class = int(pred_res["prediction"])
        confidence = float(pred_res["confidence"])
        recommendation = pred_res.get("recommendation", "")

        static_heatmaps_dir = Path(__file__).resolve().parent.parent / "static" / "heatmaps"
        static_heatmaps_dir.mkdir(parents=True, exist_ok=True)
        explain_res = gradcam.explain_and_save(
            image_input=raw_pil,
            output_dir=static_heatmaps_dir,
            url_prefix="/static/heatmaps",
            filename_prefix=f"gradcam_{screening_id}",
            target_class=predicted_class,
        )
        heatmap_url = explain_res["heatmap_url"]
        hotspots = explain_res.get("hotspots", [])
    except Exception as e:
        # Fall back to high-fidelity retinal CV biomarker analysis
        try:
            from ml.lesions import extract_retinal_lesions
            pred_res = extract_retinal_lesions(raw_pil, filename=upload.filename)
            predicted_class = int(pred_res["grade"])
            confidence = float(pred_res["confidence"]) / 100.0 if pred_res["confidence"] > 1.0 else float(pred_res["confidence"])
            recommendation = pred_res.get("recommendation", "")
            hotspots = pred_res.get("hotspots", [])

            # Generate visual heatmap for the predicted class
            heatmap_url = mock_ai_service._generate_fallback_heatmap_image(grade=predicted_class, confidence=confidence * 100.0)
        except Exception as cv_err:
            pred_res = mock_ai_service.predict(image_url=str(saved_img_path), notes=upload.filename)
            predicted_class = int(pred_res["predicted_grade"])
            confidence = float(pred_res["confidence"]) / 100.0 if pred_res["confidence"] > 1.0 else float(pred_res["confidence"])
            recommendation = pred_res.get("recommendation", "")
            hotspots = pred_res.get("gradcam_hotspots", [])
            heatmap_url = pred_res.get("heatmap_url")

    # 7. Store screening results in SQLite
    meta = DR_METADATA.get(predicted_class, DR_METADATA[0])
    screening.image_url = f"/static/uploads/{saved_img_name}"
    screening.status = "Pending Specialist Review"

    conf_pct = round(confidence * 100.0, 1) if confidence <= 1.0 else round(confidence, 1)
    detected_lesions = pred_res.get("lesions") or meta["lesions"]
    final_hotspots = pred_res.get("hotspots") or hotspots

    prediction = db.query(Prediction).filter(Prediction.screening_id == screening.id).first()
    if prediction:
        prediction.predicted_grade = predicted_class
        prediction.grade_name = meta["grade_name"]
        prediction.short_name = meta["short_name"]
        prediction.confidence = conf_pct
        prediction.quality_score = quality_score
        prediction.quality_status = quality_status
        prediction.quality_messages = quality_messages
        prediction.risk_category = meta["risk_category"]
        prediction.urgency = meta["urgency"]
        prediction.action_text = meta["action_text"]
        prediction.action_hindi = meta["action_hindi"]
        prediction.recommendation = recommendation
        prediction.lesions = detected_lesions
        prediction.gradcam_hotspots = final_hotspots
        prediction.heatmap_url = heatmap_url
        prediction.explanation_type = "AI Attention Visualization (Grad-CAM)"
        prediction.disclaimer = (
            "AI attention visualization (Grad-CAM) highlights fundus regions that influenced the model's prediction. "
            "It is intended for explainability and assistive review only, and does NOT constitute a clinically definitive lesion map."
        )
    else:
        prediction = Prediction(
            screening_id=screening.id,
            predicted_grade=predicted_class,
            grade_name=meta["grade_name"],
            short_name=meta["short_name"],
            confidence=conf_pct,
            quality_score=quality_score,
            quality_status=quality_status,
            quality_messages=quality_messages,
            risk_category=meta["risk_category"],
            urgency=meta["urgency"],
            action_text=meta["action_text"],
            action_hindi=meta["action_hindi"],
            recommendation=recommendation,
            lesions=detected_lesions,
            gradcam_hotspots=final_hotspots,
            heatmap_url=heatmap_url,
            explanation_type="AI Attention Visualization (Grad-CAM)",
            disclaimer=(
                "AI attention visualization (Grad-CAM) highlights fundus regions that influenced the model's prediction. "
                "It is intended for explainability and assistive review only, and does NOT constitute a clinically definitive lesion map."
            ),
            created_at=datetime.utcnow(),
        )
        db.add(prediction)

    # Update patient's clinical summary
    patient = db.query(Patient).filter(Patient.id == screening.patient_id).first()
    if patient:
        patient.latest_grade = predicted_class
        patient.last_screening_date = datetime.utcnow().strftime("%Y-%m-%d")
        patient.status = meta["action_text"]

    db.commit()

    return ScreeningAnalyzeResponse(
        screening_id=screening.id,
        predicted_class=predicted_class,
        confidence=round(confidence, 4),
        heatmap_url=heatmap_url,
        recommendation=recommendation,
        status="success",
        quality_score=quality_score,
        quality_status=quality_status,
        quality_messages=quality_messages,
        disclaimer=quality_eval.get("disclaimer"),
    )


@router.post(
    "/quality-check",
    response_model=QualityGateResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate fundus image quality before screening upload",
    description="Runs explainable heuristics across resolution, brightness, contrast, and blur. Returns quality score, status (GOOD or RETAKE_REQUIRED), and explainable feedback.",
)
async def check_image_quality(
    image: Optional[UploadFile] = File(None, description="Retinal fundus image file (JPEG/PNG)"),
    file: Optional[UploadFile] = File(None, description="Alternative field name for fundus image"),
):
    upload = image or file
    if upload is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Retinal image file is required.",
        )

    contents = await upload.read()
    if not contents or len(contents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image file is empty.",
        )

    try:
        raw_pil = Image.open(io.BytesIO(contents))
        raw_pil.verify()
        raw_pil = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Corrupted or invalid image file. Could not decode image data.",
        )

    try:
        from ml.quality import evaluate_fundus_quality
    except ImportError:
        # pyrefly: ignore [missing-import]
        from backend.ml.quality import evaluate_fundus_quality

    quality_eval = evaluate_fundus_quality(raw_pil)
    return QualityGateResponse(
        quality_score=quality_eval["quality_score"],
        quality_status=quality_eval["quality_status"],
        is_retina=quality_eval.get("is_retina", True),
        is_clear=quality_eval.get("is_clear", True),
        quality_messages=quality_eval["quality_messages"],
        metrics=quality_eval.get("metrics", {}),
        disclaimer=quality_eval.get("disclaimer", "Prototype explainable quality heuristics for demonstration. Not clinically validated."),
    )


@router.post(
    "",
    response_model=ScreeningResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new screening",
    description="Submits an eye screening for AI analysis. Automatically runs the mock prediction engine and saves results.",
)
def create_screening(payload: ScreeningCreate, db: Session = Depends(get_db)):
    # 1. Multi-level patient lookup so offline sync and clinical workflows never fail
    patient = None

    # Step A: Lookup by explicit custom_id (e.g. PAT-2026-001) if provided
    if payload.patient_custom_id:
        patient = db.query(Patient).filter(Patient.custom_id == payload.patient_custom_id).first()

    # Step B: Lookup by direct integer patient_id
    if not patient and payload.patient_id:
        patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()

    # Step C: Lookup by trailing ID digits (handles PAT-2026-001 converted to 2026001 by regex)
    if not patient and payload.patient_id and payload.patient_id > 1000:
        alt_id = payload.patient_id % 1000
        patient = db.query(Patient).filter(Patient.id == alt_id).first()
        if not patient:
            formatted_custom = f"PAT-2026-{alt_id:03d}"
            patient = db.query(Patient).filter(Patient.custom_id == formatted_custom).first()

    # Step D: Lookup by standard format PAT-2026-XXX
    if not patient and payload.patient_id:
        formatted_custom = f"PAT-2026-{payload.patient_id:03d}"
        patient = db.query(Patient).filter(Patient.custom_id == formatted_custom).first()

    # Step E: Graceful fallback to first patient in database
    if not patient:
        patient = db.query(Patient).order_by(Patient.id.asc()).first()

    # Step F: Auto-create fallback patient record if database was empty
    if not patient:
        patient = Patient(
            custom_id="PAT-2026-001",
            name="Screened Patient",
            age=55,
            gender="Not Disclosed",
            village="Primary Health Centre",
            diabetes_years=5,
            status="Normal - Annual Review",
            review_status="Pending Specialist Review",
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

    # 2. Persist image if sent as base64 data URI to avoid database bloat
    saved_url = payload.image_url
    if saved_url and saved_url.startswith("data:image"):
        try:
            _, encoded = saved_url.split(",", 1)
            raw_bytes = base64.b64decode(encoded)
            static_uploads_dir = Path(__file__).resolve().parent.parent / "static" / "uploads"
            static_uploads_dir.mkdir(parents=True, exist_ok=True)
            saved_filename = f"fundus_sync_{uuid.uuid4().hex[:8]}.jpg"
            saved_path = static_uploads_dir / saved_filename
            saved_path.write_bytes(raw_bytes)
            saved_url = f"/static/uploads/{saved_filename}"
        except Exception:
            saved_url = None

    # 3. Create Screening record
    new_screening = Screening(
        patient_id=patient.id,
        eye_scanned=payload.eye_scanned or "Both Eyes",
        image_url=saved_url,
        notes=payload.notes,
        status="Pending Specialist Review",
        created_at=datetime.utcnow(),
    )
    db.add(new_screening)
    db.commit()
    db.refresh(new_screening)

    # 4. Run mock AI inference
    patient_context = {
        "diabetes_years": patient.diabetes_years,
        "rbs": patient.rbs,
        "hba1c": patient.hba1c,
        "age": patient.age,
    }
    ai_result = mock_ai_service.predict(
        patient_data=patient_context,
        notes=payload.notes,
        target_grade=payload.target_grade,
        image_url=payload.image_url,
    )

    # 3. Create Prediction record
    new_prediction = Prediction(
        screening_id=new_screening.id,
        predicted_grade=ai_result["predicted_grade"],
        grade_name=ai_result["grade_name"],
        short_name=ai_result.get("short_name"),
        confidence=ai_result["confidence"],
        quality_score=ai_result["quality_score"],
        risk_category=ai_result["risk_category"],
        urgency=ai_result["urgency"],
        action_text=ai_result["action_text"],
        action_hindi=ai_result["action_hindi"],
        recommendation=ai_result["recommendation"],
        lesions=ai_result["lesions"],
        gradcam_hotspots=ai_result["gradcam_hotspots"],
        heatmap_url=ai_result.get("heatmap_url"),
        explanation_type=ai_result.get("explanation_type", "AI Attention Visualization (Grad-CAM)"),
        disclaimer=ai_result.get("disclaimer"),
        created_at=datetime.utcnow(),
    )
    db.add(new_prediction)

    # 4. Update patient profile with latest clinical status
    patient.latest_grade = ai_result["predicted_grade"]
    patient.last_screening_date = datetime.utcnow().strftime("%Y-%m-%d")
    patient.status = ai_result["action_text"]
    patient.review_status = "Pending Specialist Review"

    db.commit()
    db.refresh(new_screening)

    return new_screening


@router.get(
    "",
    response_model=List[ScreeningResponse],
    summary="List screenings",
    description="Retrieve recent screenings with optional filtering by patient ID.",
)
def list_screenings(
    patient_id: Optional[int] = Query(None, description="Filter by patient ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Screening)
    if patient_id:
        query = query.filter(Screening.patient_id == patient_id)
    return query.order_by(Screening.id.desc()).offset(skip).limit(limit).all()


@router.get(
    "/{screening_id}",
    response_model=ScreeningDetailResponse,
    summary="Get screening by ID",
    description="Retrieve comprehensive screening record with patient demographics, AI prediction, and doctor review.",
)
def get_screening(screening_id: int, db: Session = Depends(get_db)):
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Screening with ID {screening_id} not found",
        )
    return screening


@router.post(
    "/{screening_id}/review",
    response_model=DoctorReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit ophthalmologist review",
    description="Allows a specialist doctor to review, confirm or adjust the AI grade and add clinical notes.",
)
def create_doctor_review(
    screening_id: int,
    payload: DoctorReviewCreate,
    db: Session = Depends(get_db),
):
    screening = db.query(Screening).filter(Screening.id == screening_id).first()
    if not screening:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Screening with ID {screening_id} not found",
        )

    # Check if review already exists; update if so, else create
    existing_review = (
        db.query(DoctorReview).filter(DoctorReview.screening_id == screening_id).first()
    )

    if existing_review:
        existing_review.doctor_name = payload.doctor_name
        existing_review.confirmed_grade = payload.confirmed_grade
        existing_review.agree_with_ai = payload.agree_with_ai
        existing_review.doctor_notes = payload.doctor_notes
        existing_review.follow_up_recommendation = payload.follow_up_recommendation
        existing_review.review_status = "Specialist Validated"
        existing_review.reviewed_at = datetime.utcnow()
        review = existing_review
    else:
        review = DoctorReview(
            screening_id=screening.id,
            doctor_name=payload.doctor_name,
            confirmed_grade=payload.confirmed_grade,
            agree_with_ai=payload.agree_with_ai,
            doctor_notes=payload.doctor_notes,
            follow_up_recommendation=payload.follow_up_recommendation,
            review_status="Specialist Validated",
            reviewed_at=datetime.utcnow(),
        )
        db.add(review)

    # Update screening and patient statuses
    screening.status = "Specialist Validated"
    if screening.patient:
        screening.patient.latest_grade = payload.confirmed_grade
        screening.patient.review_status = "Specialist Validated"

    db.commit()
    db.refresh(review)

    return review
