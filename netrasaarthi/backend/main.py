"""NetraSaarthi - AI-Assisted Diabetic Retinopathy Screening Backend.
Designed for rural healthcare & tele-ophthalmology triage.
"""

from typing import List, Optional
import uuid
from datetime import datetime

try:
    from backend.database import PatientCreate, ScreeningRecord
except ImportError:
    from database import PatientCreate, ScreeningRecord  # type: ignore

try:
    from fastapi import FastAPI, HTTPException, UploadFile, File, Form  # type: ignore # pyright: ignore[reportMissingImports]
    from fastapi.middleware.cors import CORSMiddleware  # type: ignore # pyright: ignore[reportMissingImports]
    import uvicorn  # type: ignore # pyright: ignore[reportMissingImports]
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False
    FastAPI = None  # type: ignore

if HAS_FASTAPI and FastAPI:
    app = FastAPI(
        title="NetraSaarthi API",
        description="Explainable AI Diabetic Retinopathy Screening API",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    patients_db = []
    screenings_db = []

    @app.get("/")
    def read_root():
        return {
            "service": "NetraSaarthi Backend API",
            "version": "1.0.0",
            "status": "operational",
            "endpoints": ["/health", "/patients", "/screenings", "/analyze"],
        }

    @app.get("/health")
    def health_check():
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "patients_count": len(patients_db),
        }

    @app.get("/patients")
    def get_patients():
        return {"patients": patients_db}

    @app.post("/patients")
    def create_patient(patient: PatientCreate):
        patient_id = f"PAT-{uuid.uuid4().hex[:6].upper()}"
        patient_dict = getattr(patient, "dict", lambda: patient.__dict__)()
        record = {
            "id": patient_id,
            **patient_dict,
            "registered_at": datetime.utcnow().isoformat(),
        }
        patients_db.append(record)
        return {"status": "success", "patient": record}

    @app.post("/analyze")
    async def analyze_fundus(
        patient_id: str = Form(...),
        eye: str = Form("OD"),
        file: Optional[UploadFile] = File(None),
    ):
        analysis_result = {
            "scan_id": f"SCAN-{uuid.uuid4().hex[:8].upper()}",
            "patient_id": patient_id,
            "eye": eye,
            "dr_grade": 2,
            "dr_grade_name": "Moderate NPDR",
            "confidence": 0.942,
            "lesions": {
                "microaneurysms": 14,
                "hemorrhages": 8,
                "hard_exudates": 5,
                "cotton_wool_spots": 0,
                "neovascularization": 0,
            },
            "urgency": "Review within 30 days",
            "timestamp": datetime.utcnow().isoformat(),
        }
        screenings_db.append(analysis_result)
        return {"status": "success", "analysis": analysis_result}

else:
    # Minimal fallback runner when FastAPI is not yet installed in the environment
    print("FastAPI is not installed. To install run: pip install -r requirements.txt")


if __name__ == "__main__":
    if HAS_FASTAPI:
        import uvicorn  # type: ignore # pyright: ignore[reportMissingImports]
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    else:
        print("Please install requirements: pip install -r requirements.txt")
