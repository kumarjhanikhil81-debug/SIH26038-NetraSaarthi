from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import relationship
from .database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    custom_id = Column(String(50), unique=True, index=True, nullable=True)  # e.g., PAT-2026-001
    abha_id = Column(String(50), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    village = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=True)
    diabetes_years = Column(Integer, default=0)
    hypertension = Column(Boolean, default=False)
    insulin = Column(Boolean, default=False)
    rbs = Column(Float, nullable=True)  # Random Blood Sugar in mg/dL
    hba1c = Column(Float, nullable=True)  # HbA1c percentage
    symptoms = Column(JSON, default=list)  # List of symptom strings
    last_screening_date = Column(String(30), nullable=True)
    latest_grade = Column(Integer, nullable=True)
    status = Column(String(100), default="Normal - Annual Review")
    review_status = Column(String(100), default="Pending Specialist Review")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    screenings = relationship(
        "Screening",
        back_populates="patient",
        cascade="all, delete-orphan",
        order_by="desc(Screening.created_at)",
    )


class Screening(Base):
    __tablename__ = "screenings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    eye_scanned = Column(String(50), default="Both Eyes")  # "OD (Right Eye)", "OS (Left Eye)", "Both Eyes"
    image_url = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(100), default="Completed")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="screenings")
    prediction = relationship(
        "Prediction",
        back_populates="screening",
        uselist=False,
        cascade="all, delete-orphan",
    )
    doctor_review = relationship(
        "DoctorReview",
        back_populates="screening",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    screening_id = Column(
        Integer,
        ForeignKey("screenings.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    predicted_grade = Column(Integer, nullable=False)  # 0 to 4
    grade_name = Column(String(100), nullable=False)
    short_name = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=False)  # e.g. 96.5%
    quality_score = Column(Float, default=95.0)
    quality_status = Column(String(50), default="GOOD")
    quality_messages = Column(JSON, default=list)
    risk_category = Column(String(50), nullable=False)  # Low, Moderate, Elevated, High, Critical
    urgency = Column(String(50), nullable=False)  # Normal, Medium, High, Critical, Emergency
    action_text = Column(String(200), nullable=True)
    action_hindi = Column(String(200), nullable=True)
    recommendation = Column(Text, nullable=True)
    lesions = Column(JSON, default=dict)  # {"microaneurysms": 4, "hemorrhages": 0, ...}
    gradcam_hotspots = Column(JSON, default=list)  # List of hotspot objects
    heatmap_url = Column(String(300), nullable=True)  # URL path to saved Grad-CAM overlay visualization
    explanation_type = Column(String(100), default="AI Attention Visualization (Grad-CAM)")
    disclaimer = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    screening = relationship("Screening", back_populates="prediction")


class DoctorReview(Base):
    __tablename__ = "doctor_reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    screening_id = Column(
        Integer,
        ForeignKey("screenings.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    doctor_name = Column(String(100), nullable=False)
    confirmed_grade = Column(Integer, nullable=False)  # 0 to 4
    agree_with_ai = Column(Boolean, default=True)
    doctor_notes = Column(Text, nullable=True)
    follow_up_recommendation = Column(Text, nullable=True)
    review_status = Column(String(100), default="Specialist Validated")
    reviewed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    screening = relationship("Screening", back_populates="doctor_review")
