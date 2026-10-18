from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Donation
from ..schemas import DonationIn, DonationOut
from ..totals import format_inr, get_totals

router = APIRouter(prefix="/api/donations", tags=["donations"])


def _get_or_404(db: Session, donation_id: int) -> Donation:
    donation = db.get(Donation, donation_id)
    if donation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Donation not found.")
    return donation


def _ensure_covers_allocations(db: Session, reduction: Decimal, action: str) -> None:
    totals = get_totals(db)
    if totals.total_donations - reduction < totals.total_allocated:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Cannot {action} this donation: total donations would fall below "
            f"the {format_inr(totals.total_allocated)} already allocated.",
        )


@router.get("", response_model=list[DonationOut])
def list_donations(db: Session = Depends(get_db)):
    stmt = select(Donation).order_by(Donation.date.desc(), Donation.id.desc())
    return db.scalars(stmt).all()


@router.post("", response_model=DonationOut, status_code=status.HTTP_201_CREATED)
def create_donation(payload: DonationIn, db: Session = Depends(get_db)):
    donation = Donation(**payload.model_dump())
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation


@router.get("/{donation_id}", response_model=DonationOut)
def get_donation(donation_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, donation_id)


@router.put("/{donation_id}", response_model=DonationOut)
def update_donation(donation_id: int, payload: DonationIn, db: Session = Depends(get_db)):
    donation = _get_or_404(db, donation_id)
    reduction = donation.amount - payload.amount
    if reduction > 0:
        _ensure_covers_allocations(db, reduction, "reduce")
    for field, value in payload.model_dump().items():
        setattr(donation, field, value)
    db.commit()
    db.refresh(donation)
    return donation


@router.delete("/{donation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_donation(donation_id: int, db: Session = Depends(get_db)):
    donation = _get_or_404(db, donation_id)
    _ensure_covers_allocations(db, donation.amount, "delete")
    db.delete(donation)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
