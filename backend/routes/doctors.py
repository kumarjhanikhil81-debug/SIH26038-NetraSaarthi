from typing import List
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Screening
from ..schemas import ScreeningDetailResponse

router = APIRouter(prefix="/doctors", tags=["Doctors"])


@router.get(
    "/review-queue",
    response_model=List[ScreeningDetailResponse],
    summary="Get pending screenings queue",
    description="Lists all patient screenings pending specialist review or flagged urgent.",
)
def get_review_queue(db: Session = Depends(get_db)):
    # Returns screenings where review is pending, prioritized by highest grade
    screenings = (
        db.query(Screening)
        .filter(Screening.status != "Specialist Validated")
        .order_by(Screening.id.desc())
        .limit(25)
        .all()
    )
    return screenings
