from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas import DashboardOut
from ..totals import get_totals

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
def read_dashboard(db: Session = Depends(get_db)):
    totals = get_totals(db)
    return DashboardOut(
        total_donations=float(totals.total_donations),
        donation_count=totals.donation_count,
        total_allocated=float(totals.total_allocated),
        remaining_balance=float(totals.remaining_balance),
    )
