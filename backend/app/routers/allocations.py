from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Allocation
from ..schemas import AllocationIn, AllocationOut
from ..totals import format_inr, get_totals

router = APIRouter(prefix="/api/allocations", tags=["allocations"])


@router.get("", response_model=list[AllocationOut])
def list_allocations(db: Session = Depends(get_db)):
    stmt = select(Allocation).order_by(Allocation.created_at.desc(), Allocation.id.desc())
    return db.scalars(stmt).all()


@router.post("", response_model=AllocationOut, status_code=status.HTTP_201_CREATED)
def create_allocation(payload: AllocationIn, db: Session = Depends(get_db)):
    remaining = get_totals(db).remaining_balance
    if payload.amount > remaining:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Allocation of {format_inr(payload.amount)} exceeds the available "
            f"balance of {format_inr(remaining)}.",
        )
    allocation = Allocation(**payload.model_dump())
    db.add(allocation)
    db.commit()
    db.refresh(allocation)
    return allocation


@router.delete("/{allocation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_allocation(allocation_id: int, db: Session = Depends(get_db)):
    allocation = db.get(Allocation, allocation_id)
    if allocation is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Allocation not found.")
    db.delete(allocation)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
