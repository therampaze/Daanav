from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .models import Allocation, Donation


@dataclass
class Totals:
    total_donations: Decimal
    donation_count: int
    total_allocated: Decimal

    @property
    def remaining_balance(self) -> Decimal:
        return self.total_donations - self.total_allocated


def _sum_amounts(db: Session, model) -> Decimal:
    return sum(db.scalars(select(model.amount)), Decimal("0"))


def get_totals(db: Session) -> Totals:
    return Totals(
        total_donations=_sum_amounts(db, Donation),
        donation_count=db.scalar(select(func.count(Donation.id))) or 0,
        total_allocated=_sum_amounts(db, Allocation),
    )


def format_inr(amount: Decimal) -> str:
    return f"₹{amount:,.2f}"
