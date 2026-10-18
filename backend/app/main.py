from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from .database import Base, engine
from .routers import allocations, dashboard, donations

FIELD_LABELS = {
    "donor_name": "Donor name",
    "cause_name": "Cause name",
    "amount": "Amount",
    "date": "Date",
    "purpose": "Purpose",
    "description": "Description",
}


def _readable_error(error: dict) -> dict:
    field = str(error["loc"][-1]) if error.get("loc") else ""
    label = FIELD_LABELS.get(field, field.replace("_", " ").capitalize() or "Request")
    kind = error.get("type", "")
    if kind == "missing":
        message = f"{label} is required."
    elif kind == "string_too_short":
        message = f"{label} must not be empty."
    elif kind == "greater_than":
        message = f"{label} must be greater than zero."
    elif kind in ("decimal_parsing", "float_parsing"):
        message = f"{label} must be a valid number."
    elif kind == "decimal_max_places":
        message = f"{label} can have at most 2 decimal places."
    elif kind.startswith("date"):
        message = f"{label} must be a valid date (YYYY-MM-DD)."
    else:
        message = f"{label}: {error.get('msg', 'invalid value')}."
    return {"field": field, "message": message}


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Daanav API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    errors = [_readable_error(e) for e in exc.errors()]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": " ".join(e["message"] for e in errors), "errors": errors},
    )


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}


app.include_router(dashboard.router)
app.include_router(donations.router)
app.include_router(allocations.router)
