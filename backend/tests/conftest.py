import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app


@pytest.fixture()
def client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture()
def make_donation(client):
    def _make(amount=1000, donor_name="Asha Rao", date="2024-05-01", purpose="General"):
        response = client.post(
            "/api/donations",
            json={"donor_name": donor_name, "amount": amount, "date": date, "purpose": purpose},
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _make


@pytest.fixture()
def make_allocation(client):
    def _make(amount=100, cause_name="School supplies", description=""):
        response = client.post(
            "/api/allocations",
            json={"cause_name": cause_name, "amount": amount, "description": description},
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _make
