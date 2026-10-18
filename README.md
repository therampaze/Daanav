# Daanav

A minimal donation management web app: record donations, allocate funds to causes, and see totals on a dashboard. Amounts are displayed in Indian Rupees (₹).

- **Frontend:** React + Vite (`frontend/`)
- **Backend:** Python + FastAPI + SQLAlchemy (`backend/`)
- **Database:** SQLite file at `backend/daanav.db` (created automatically on first start, git-ignored)

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm

## Installation

```bash
# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend (in a second terminal)
cd frontend
npm install
```

## Running

Start the backend (http://127.0.0.1:8000, interactive API docs at `/docs`):

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Start the frontend (http://localhost:5173):

```bash
cd frontend
npm run dev
```

The Vite dev server proxies `/api/*` to `http://127.0.0.1:8000`, so no environment variables or CORS configuration are needed. To start with an empty database, stop the backend and delete `backend/daanav.db`.

## API endpoints

All request/response bodies are JSON. Amounts are numbers with up to 2 decimal places.

| Method | Path | Description | Success |
| ------ | ---- | ----------- | ------- |
| GET | `/api/health` | Health check | 200 |
| GET | `/api/dashboard` | `total_donations`, `donation_count`, `total_allocated`, `remaining_balance` | 200 |
| GET | `/api/donations` | List donations (newest date first) | 200 |
| POST | `/api/donations` | Create a donation | 201 |
| GET | `/api/donations/{id}` | Get one donation | 200 |
| PUT | `/api/donations/{id}` | Replace a donation | 200 |
| DELETE | `/api/donations/{id}` | Delete a donation | 204 |
| GET | `/api/allocations` | List allocations (newest first) | 200 |
| POST | `/api/allocations` | Create an allocation | 201 |
| DELETE | `/api/allocations/{id}` | Delete an allocation | 204 |

Donation body:

```json
{ "donor_name": "Asha Rao", "amount": 5000, "date": "2024-05-01", "purpose": "Education" }
```

Allocation body:

```json
{ "cause_name": "School books", "amount": 2000, "description": "Grade 5 textbooks" }
```

### Rules and errors

- `donor_name` / `cause_name` must not be empty; `amount` must be greater than zero (max 2 decimals); `date` is required (`YYYY-MM-DD`). `purpose` and `description` are optional.
- **422** — validation failed. Response: `{"detail": "Donor name must not be empty.", "errors": [{"field": "donor_name", "message": "..."}]}`
- **404** — donation/allocation not found.
- **409** — the change would make total allocations exceed total donations. This applies to creating an allocation larger than the remaining balance, and to reducing or deleting a donation whose funds are already allocated (delete or reduce allocations first).

## Testing

```bash
# Backend (uses an in-memory SQLite database; does not touch daanav.db)
cd backend
source .venv/bin/activate
pytest

# Frontend (Vitest + Testing Library)
cd frontend
npm test
```

## Project structure

```
backend/
  app/
    main.py          # FastAPI app, router registration, readable validation errors
    database.py      # SQLite engine, session, get_db dependency
    models.py        # SQLAlchemy models: Donation, Allocation
    schemas.py       # Pydantic request/response schemas and validation
    totals.py        # Dashboard totals and balance calculations
    routers/         # dashboard.py, donations.py, allocations.py
  tests/             # pytest suite
frontend/
  src/
    App.jsx          # Layout and hash-based navigation
    api.js           # Fetch wrapper and API calls
    format.js        # INR/date formatting
    validation.js    # Client-side form validation
    components/      # Dashboard, Donations, Allocations, forms, status messages
    __tests__/       # Vitest suite
```

## Known limitations

- Single-user, no authentication (out of scope for this MVP).
- No database migrations; tables are created on startup. Schema changes require deleting `daanav.db`.
- Allocations cannot be edited (create/delete only, per spec).
- Delete confirmation uses the browser's native confirm dialog.
