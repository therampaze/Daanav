import datetime as dt
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_serializer

Name = Annotated[
    str,
    StringConstraints(strip_whitespace=True, min_length=1, max_length=200),
]
Text = Annotated[str, StringConstraints(strip_whitespace=True, max_length=1000)]
Amount = Annotated[Decimal, Field(gt=0, max_digits=12, decimal_places=2)]


class _AmountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    @field_serializer("amount", check_fields=False)
    def _serialize_amount(self, value: Decimal) -> float:
        return float(value)


class DonationIn(BaseModel):
    donor_name: Name
    amount: Amount
    date: dt.date
    purpose: Text = ""


class DonationOut(_AmountOut):
    id: int
    donor_name: str
    amount: Decimal
    date: dt.date
    purpose: str


class AllocationIn(BaseModel):
    cause_name: Name
    amount: Amount
    description: Text = ""


class AllocationOut(_AmountOut):
    id: int
    cause_name: str
    amount: Decimal
    description: str
    created_at: dt.datetime


class DashboardOut(BaseModel):
    total_donations: float
    donation_count: int
    total_allocated: float
    remaining_balance: float
