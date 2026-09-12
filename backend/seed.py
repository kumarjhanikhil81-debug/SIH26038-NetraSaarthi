from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models import Patient, Screening, Prediction, DoctorReview
from .services.ai_service import DR_METADATA

INITIAL_PATIENTS_DATA = [
    {
        "custom_id": "PAT-2026-001",
        "abha_id": "91-4402-1190-8834",
        "name": "Rameshwar Patil",
        "age": 63,
        "gender": "Male",
        "village": "Rampur Kalan (PHC Sector 3)",
        "phone": "+91 98765 43210",
        "diabetes_years": 20,
        "hypertension": True,
        "insulin": True,
        "rbs": 320.0,
        "hba1c": 10.4,
        "symptoms": ["Blurry vision", "Floaters / black spots", "Night difficulty"],
        "latest_grade": 4,
        "status": "CRITICAL: Immediate Specialist Intervention",
        "review_status": "Pending Specialist Review",
        "last_screening_date": "2026-09-01",
        "screenings": [
            {
                "eye_scanned": "OD (Right Eye)",
                "notes": "Patient experiencing heavy floaters and severe visual blur.",
                "grade": 4,
                "confidence": 97.4,
                "review": None,
            }
        ],
    },
    {
        "custom_id": "PAT-2026-002",
        "abha_id": "84-1290-7731-9012",
        "name": "Shanti Devi",
        "age": 58,
        "gender": "Female",
        "village": "Shivpur Village",
        "phone": "+91 94123 78901",
        "diabetes_years": 16,
        "hypertension": True,
        "insulin": False,
        "rbs": 290.0,
        "hba1c": 9.8,
        "symptoms": ["Blurry vision", "Eye strain"],
        "latest_grade": 3,
        "status": "Urgent Hospital Referral (within 7-14 Days)",
        "review_status": "Specialist Validated",
        "last_screening_date": "2026-08-28",
        "screenings": [
            {
                "eye_scanned": "Both Eyes",
                "notes": "Severe NPDR detected in fundus photograph.",
                "grade": 3,
                "confidence": 95.8,
                "review": {
                    "doctor_name": "Dr. Arvind Joshi, MD",
                    "confirmed_grade": 3,
                    "agree_with_ai": True,
                    "doctor_notes": "Confirmed Severe NPDR. Scheduled for PRP laser at District Hospital on 10th Sept.",
                    "follow_up_recommendation": "Follow-up post laser in 4 weeks.",
                },
            }
        ],
    },
    {
        "custom_id": "PAT-2026-003",
        "abha_id": "53-9081-3312-6541",
        "name": "Mohammed Farooq",
        "age": 61,
        "gender": "Male",
        "village": "Bikrampur",
        "phone": "+91 97654 12389",
        "diabetes_years": 12,
        "hypertension": False,
        "insulin": False,
        "rbs": 235.0,
        "hba1c": 8.5,
        "symptoms": ["Mild blurriness when reading"],
        "latest_grade": 2,
        "status": "Ophthalmologist Referral within 30 Days",
        "review_status": "Specialist Validated",
        "last_screening_date": "2026-08-20",
        "screenings": [
            {
                "eye_scanned": "OS (Left Eye)",
                "notes": "Moderate NPDR with hard exudate ring.",
                "grade": 2,
                "confidence": 96.1,
                "review": {
                    "doctor_name": "Dr. Arvind Joshi, MD",
                    "confirmed_grade": 2,
                    "agree_with_ai": True,
                    "doctor_notes": "Advised strict diet control and Metformin adjustment. Repeat scan in 3 months.",
                    "follow_up_recommendation": "Repeat retinal scan in 3 months.",
                },
            }
        ],
    },
    {
        "custom_id": "PAT-2026-004",
        "abha_id": "77-3129-8800-4411",
        "name": "Ram Prasad Verma",
        "age": 54,
        "gender": "Male",
        "village": "Kalyanpur Gram",
        "phone": "+91 98234 56712",
        "diabetes_years": 7,
        "hypertension": False,
        "insulin": False,
        "rbs": 182.0,
        "hba1c": 7.4,
        "symptoms": ["No visual complaints"],
        "latest_grade": 1,
        "status": "Early Stage - Monitor in 6-9 Months",
        "review_status": "Specialist Validated",
        "last_screening_date": "2026-08-15",
        "screenings": [
            {
                "eye_scanned": "Both Eyes",
                "notes": "Mild NPDR routine screening.",
                "grade": 1,
                "confidence": 94.6,
                "review": {
                    "doctor_name": "Dr. Arvind Joshi, MD",
                    "confirmed_grade": 1,
                    "agree_with_ai": True,
                    "doctor_notes": "Isolated microaneurysms. Keep HbA1c < 7.0%. Repeat ASHA screening in 6 months.",
                    "follow_up_recommendation": "ASHA re-check in 6 months.",
                },
            }
        ],
    },
    {
        "custom_id": "PAT-2026-005",
        "abha_id": "62-7711-2290-3344",
        "name": "Sunita Sharma",
        "age": 48,
        "gender": "Female",
        "village": "Rampur Kalan (PHC Sector 1)",
        "phone": "+91 99887 66554",
        "diabetes_years": 3,
        "hypertension": False,
        "insulin": False,
        "rbs": 135.0,
        "hba1c": 6.4,
        "symptoms": ["None"],
        "latest_grade": 0,
        "status": "Routine Annual Eye Screening",
        "review_status": "Completed",
        "last_screening_date": "2026-08-10",
        "screenings": [
            {
                "eye_scanned": "Both Eyes",
                "notes": "Clear fundus. Normal vascular pattern.",
                "grade": 0,
                "confidence": 98.2,
                "review": None,
            }
        ],
    },
]


def seed_database(db: Session = None):
    """Seed initial clinical test cases if database is empty."""
    own_session = False
    if db is None:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        own_session = True

    try:
        seeded_count = 0
        for p_data_raw in INITIAL_PATIENTS_DATA:
            p_data = dict(p_data_raw)
            screenings_data = p_data.pop("screenings", [])
            custom_id = p_data.get("custom_id")

            existing = db.query(Patient).filter(Patient.custom_id == custom_id).first()
            if existing:
                continue

            patient = Patient(**p_data)
            db.add(patient)
            db.commit()
            db.refresh(patient)
            seeded_count += 1

            for s_data in screenings_data:
                grade = s_data["grade"]
                info = DR_METADATA[grade]
                screening = Screening(
                    patient_id=patient.id,
                    eye_scanned=s_data["eye_scanned"],
                    notes=s_data["notes"],
                    status="Specialist Validated" if s_data.get("review") else "Pending Specialist Review",
                    created_at=datetime.utcnow(),
                )
                db.add(screening)
                db.commit()
                db.refresh(screening)

                prediction = Prediction(
                    screening_id=screening.id,
                    predicted_grade=grade,
                    grade_name=info["grade_name"],
                    short_name=info["short_name"],
                    confidence=s_data["confidence"],
                    quality_score=95.0,
                    risk_category=info["risk_category"],
                    urgency=info["urgency"],
                    action_text=info["action_text"],
                    action_hindi=info["action_hindi"],
                    recommendation=info["recommendation"],
                    lesions=info["lesions"],
                    gradcam_hotspots=info["hotspots"],
                    created_at=datetime.utcnow(),
                )
                db.add(prediction)

                if s_data.get("review"):
                    r = s_data["review"]
                    review = DoctorReview(
                        screening_id=screening.id,
                        doctor_name=r["doctor_name"],
                        confirmed_grade=r["confirmed_grade"],
                        agree_with_ai=r["agree_with_ai"],
                        doctor_notes=r["doctor_notes"],
                        follow_up_recommendation=r["follow_up_recommendation"],
                        review_status="Specialist Validated",
                        reviewed_at=datetime.utcnow(),
                    )
                    db.add(review)

                db.commit()

        if seeded_count > 0:
            print(f"[Seed] Added {seeded_count} sample clinical cases to the database.")
        else:
            print("[Seed] All sample clinical cases already present in database.")
    finally:
        if own_session:
            db.close()


if __name__ == "__main__":
    seed_database()
