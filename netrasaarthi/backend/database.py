"""NetraSaarthi Database Configuration and Models.
Provides patient registry and screening models for rural health screening.
Supports both Pydantic (if installed) and Python standard library dataclasses.
"""

from datetime import datetime
from typing import Optional, Dict, Any

try:
    from pydantic import BaseModel, Field  # type: ignore # pyright: ignore[reportMissingImports]
    
    class PatientCreate(BaseModel):
        name: str
        age: int
        gender: str
        abha_id: Optional[str] = None
        contact: Optional[str] = None
        village: Optional[str] = None
        primary_center: Optional[str] = None
        diabetes_years: Optional[int] = None

    class ScreeningRecord(BaseModel):
        id: Optional[str] = None
        patient_id: str
        eye: str
        dr_grade: int
        dr_grade_name: str
        confidence_score: float
        lesion_counts: Dict[str, Any] = Field(default_factory=dict)
        recommendation: str
        created_at: datetime = Field(default_factory=datetime.utcnow)

except ImportError:
    from dataclasses import dataclass, field

    @dataclass
    class PatientCreate:  # type: ignore
        name: str
        age: int
        gender: str
        abha_id: Optional[str] = None
        contact: Optional[str] = None
        village: Optional[str] = None
        primary_center: Optional[str] = None
        diabetes_years: Optional[int] = None

    @dataclass
    class ScreeningRecord:  # type: ignore
        patient_id: str
        eye: str
        dr_grade: int
        dr_grade_name: str
        confidence_score: float
        recommendation: str
        id: Optional[str] = None
        lesion_counts: Dict[str, Any] = field(default_factory=dict)
        created_at: datetime = field(default_factory=datetime.utcnow)
