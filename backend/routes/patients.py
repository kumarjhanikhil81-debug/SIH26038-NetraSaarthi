from typing import List, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, Query, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import or_

from ..database import get_db
from ..models import Patient
from ..schemas import PatientCreate, PatientResponse, PatientDetailResponse

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post(
    "",
    response_model=PatientResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new patient",
    description="Registers a patient in the NetraSaarthi registry with demographic and clinical history.",
)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    # Check if custom_id already exists if supplied
    if payload.custom_id:
        existing = db.query(Patient).filter(Patient.custom_id == payload.custom_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Patient with ID '{payload.custom_id}' already exists",
            )

    new_patient = Patient(
        custom_id=payload.custom_id,
        abha_id=payload.abha_id,
        name=payload.name,
        age=payload.age,
        gender=payload.gender,
        village=payload.village,
        phone=payload.phone,
        diabetes_years=payload.diabetes_years or 0,
        hypertension=payload.hypertension or False,
        insulin=payload.insulin or False,
        rbs=payload.rbs,
        hba1c=payload.hba1c,
        symptoms=payload.symptoms or [],
        status="Normal - Annual Review",
        review_status="Pending Specialist Review",
    )

    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)

    # If no custom_id was provided, generate standard PAT-YYYY-XXX format
    if not new_patient.custom_id:
        new_patient.custom_id = f"PAT-2026-{new_patient.id:03d}"
        db.commit()
        db.refresh(new_patient)

    return new_patient


@router.get(
    "",
    response_model=List[PatientResponse],
    summary="Get all patients",
    description="Retrieve all registered patients with optional keyword search.",
)
def list_patients(
    search: Optional[str] = Query(None, description="Search by name, ABHA ID, or village"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(Patient)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Patient.name.ilike(term),
                Patient.custom_id.ilike(term),
                Patient.abha_id.ilike(term),
                Patient.village.ilike(term),
            )
        )
    return query.order_by(Patient.id.desc()).offset(skip).limit(limit).all()


@router.get(
    "/{patient_id}",
    response_model=PatientDetailResponse,
    summary="Get patient details",
    description="Retrieve full details for a patient, including all past screenings and AI predictions.",
)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        # Fallback: check if queried by custom_id like PAT-2026-001
        patient = db.query(Patient).filter(Patient.custom_id == str(patient_id)).first()

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with ID {patient_id} not found",
        )

    return patient
