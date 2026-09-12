from datetime import datetime
from typing import Optional, List, Dict, Any
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------
# Patient Schemas
# ---------------------------------------------------------
class PatientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Rameshwar Patil"])
    age: int = Field(..., ge=0, le=130, examples=[63])
    gender: str = Field(..., min_length=1, max_length=20, examples=["Male"])
    village: Optional[str] = Field(None, max_length=150, examples=["Rampur Kalan"])
    phone: Optional[str] = Field(None, max_length=30, examples=["+91 98765 43210"])
    abha_id: Optional[str] = Field(None, max_length=50, examples=["91-4402-1190-8834"])
    diabetes_years: Optional[int] = Field(0, ge=0, le=80, examples=[20])
    hypertension: Optional[bool] = Field(False, examples=[True])
    insulin: Optional[bool] = Field(False, examples=[True])
    rbs: Optional[float] = Field(None, ge=0, le=1000, description="Random Blood Sugar mg/dL", examples=[320.0])
    hba1c: Optional[float] = Field(None, ge=0, le=25, description="HbA1c percentage", examples=[10.4])
    symptoms: Optional[List[str]] = Field(default_factory=list, examples=[["Blurry vision", "Floaters"]])


class PatientCreate(PatientBase):
    custom_id: Optional[str] = Field(None, max_length=50, examples=["PAT-2026-001"])


class PatientResponse(PatientBase):
    id: int
    custom_id: Optional[str] = None
    last_screening_date: Optional[str] = None
    latest_grade: Optional[int] = None
    status: Optional[str] = None
    review_status: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Prediction Schemas
# ---------------------------------------------------------
class PredictionResponse(BaseModel):
    id: int
    screening_id: int
    predicted_grade: int
    grade_name: str
    short_name: Optional[str] = None
    confidence: float
    quality_score: float
    quality_status: Optional[str] = "GOOD"
    quality_messages: List[str] = Field(default_factory=list)
    risk_category: str
    urgency: str
    action_text: Optional[str] = None
    action_hindi: Optional[str] = None
    recommendation: Optional[str] = None
    lesions: Dict[str, Any] = Field(default_factory=dict)
    gradcam_hotspots: List[Dict[str, Any]] = Field(default_factory=list)
    heatmap_url: Optional[str] = Field(None, examples=["/static/heatmaps/gradcam_sample.png"])
    explanation_type: Optional[str] = Field("AI Attention Visualization (Grad-CAM)")
    disclaimer: Optional[str] = Field(
        "AI attention visualization (Grad-CAM) highlights fundus regions that influenced the model's prediction. "
        "It is intended for explainability and assistive review only, and does NOT constitute a clinically definitive lesion map."
    )
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Doctor Review Schemas
# ---------------------------------------------------------
class DoctorReviewCreate(BaseModel):
    doctor_name: str = Field(..., min_length=1, max_length=100, examples=["Dr. Arvind Joshi, MD"])
    confirmed_grade: int = Field(..., ge=0, le=4, examples=[4])
    agree_with_ai: bool = Field(True, examples=[True])
    doctor_notes: Optional[str] = Field(
        None,
        examples=["Active NVD fronds confirmed. Scheduled for emergency laser photocoagulation."],
    )
    follow_up_recommendation: Optional[str] = Field(
        None,
        examples=["Immediate specialist intervention within 48-72 hours"],
    )


class DoctorReviewResponse(BaseModel):
    id: int
    screening_id: int
    doctor_name: str
    confirmed_grade: int
    agree_with_ai: bool
    doctor_notes: Optional[str] = None
    follow_up_recommendation: Optional[str] = None
    review_status: str
    reviewed_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Screening Schemas
# ---------------------------------------------------------
class ScreeningCreate(BaseModel):
    patient_id: int = Field(..., description="ID of patient to screen")
    patient_custom_id: Optional[str] = Field(None, description="Optional custom patient ID e.g. PAT-2026-001")
    eye_scanned: Optional[str] = Field("Both Eyes", examples=["OD (Right Eye)", "OS (Left Eye)", "Both Eyes"])
    image_url: Optional[str] = Field(None, examples=["https://example.com/fundus1.jpg"])
    notes: Optional[str] = Field(None, examples=["Patient reports sudden blurriness in right eye"])
    target_grade: Optional[int] = Field(None, description="Optional override grade for mock AI simulation")


class ScreeningResponse(BaseModel):
    id: int
    patient_id: int
    eye_scanned: str
    image_url: Optional[str] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime
    prediction: Optional[PredictionResponse] = None
    doctor_review: Optional[DoctorReviewResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ScreeningDetailResponse(ScreeningResponse):
    patient: Optional[PatientResponse] = None

    model_config = ConfigDict(from_attributes=True)


class PatientDetailResponse(PatientResponse):
    screenings: List[ScreeningResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ScreeningAnalyzeResponse(BaseModel):
    screening_id: int
    predicted_class: Optional[int] = None
    confidence: Optional[float] = None
    heatmap_url: Optional[str] = None
    recommendation: str
    status: str
    quality_score: float
    quality_status: str  # "GOOD" | "RETAKE_REQUIRED"
    quality_messages: List[str] = Field(default_factory=list)
    disclaimer: Optional[str] = (
        "Prototype explainable quality heuristics for demonstration. "
        "Not clinically validated."
    )

    model_config = ConfigDict(from_attributes=True)


class QualityGateResponse(BaseModel):
    quality_score: float = Field(..., ge=0.0, le=100.0, description="Heuristic quality score (0-100)")
    quality_status: str = Field(..., description="Quality gate decision: GOOD, RETAKE_REQUIRED, or INVALID_IMAGE")
    is_retina: bool = Field(True, description="Whether the image is identified as a human retinal fundus photograph")
    is_clear: bool = Field(True, description="Whether the retinal photograph has sufficient focus, contrast, and illumination")
    quality_messages: List[str] = Field(default_factory=list, description="Explainable feedback for resolution, brightness, contrast, and blur")
    metrics: Dict[str, Any] = Field(default_factory=dict, description="Quantitative measurement details")
    disclaimer: str = Field(
        "Prototype explainable quality heuristics for demonstration. Not clinically validated.",
        description="Clinical non-validation disclaimer",
    )

    model_config = ConfigDict(from_attributes=True)


