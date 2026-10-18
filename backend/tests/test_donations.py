import pytest


def test_create_and_list_donations(client, make_donation):
    created = make_donation(amount=2500.5, donor_name="  Ravi Kumar  ", purpose="Books")
    assert created["id"] > 0
    assert created["donor_name"] == "Ravi Kumar"
    assert created["amount"] == 2500.5
    assert created["date"] == "2024-05-01"
    assert created["purpose"] == "Books"

    response = client.get("/api/donations")
    assert response.status_code == 200
    assert [d["id"] for d in response.json()] == [created["id"]]


def test_list_is_empty_initially(client):
    response = client.get("/api/donations")
    assert response.status_code == 200
    assert response.json() == []


def test_list_orders_newest_first(client, make_donation):
    older = make_donation(date="2024-01-01")
    newer = make_donation(date="2024-06-01")
    ids = [d["id"] for d in client.get("/api/donations").json()]
    assert ids == [newer["id"], older["id"]]


def test_purpose_is_optional(client):
    response = client.post(
        "/api/donations", json={"donor_name": "Meera", "amount": 10, "date": "2024-05-01"}
    )
    assert response.status_code == 201
    assert response.json()["purpose"] == ""


def test_get_donation(client, make_donation):
    created = make_donation()
    response = client.get(f"/api/donations/{created['id']}")
    assert response.status_code == 200
    assert response.json() == created


def test_update_donation(client, make_donation):
    created = make_donation(amount=1000)
    response = client.put(
        f"/api/donations/{created['id']}",
        json={"donor_name": "Asha R.", "amount": 1500, "date": "2024-05-02", "purpose": "Food"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["donor_name"] == "Asha R."
    assert body["amount"] == 1500
    assert body["date"] == "2024-05-02"
    assert body["purpose"] == "Food"
    assert client.get(f"/api/donations/{created['id']}").json() == body


def test_delete_donation(client, make_donation):
    created = make_donation()
    response = client.delete(f"/api/donations/{created['id']}")
    assert response.status_code == 204
    assert client.get(f"/api/donations/{created['id']}").status_code == 404
    assert client.get("/api/donations").json() == []


@pytest.mark.parametrize(
    "method, path",
    [("get", "/api/donations/999"), ("delete", "/api/donations/999")],
)
def test_missing_donation_returns_404(client, method, path):
    response = getattr(client, method)(path)
    assert response.status_code == 404
    assert response.json()["detail"] == "Donation not found."


def test_update_missing_donation_returns_404(client):
    response = client.put(
        "/api/donations/999",
        json={"donor_name": "X", "amount": 1, "date": "2024-05-01", "purpose": ""},
    )
    assert response.status_code == 404


@pytest.mark.parametrize(
    "payload, field, message",
    [
        ({"donor_name": "", "amount": 10, "date": "2024-05-01"}, "donor_name", "Donor name must not be empty."),
        ({"donor_name": "   ", "amount": 10, "date": "2024-05-01"}, "donor_name", "Donor name must not be empty."),
        ({"amount": 10, "date": "2024-05-01"}, "donor_name", "Donor name is required."),
        ({"donor_name": "A", "amount": 0, "date": "2024-05-01"}, "amount", "Amount must be greater than zero."),
        ({"donor_name": "A", "amount": -5, "date": "2024-05-01"}, "amount", "Amount must be greater than zero."),
        ({"donor_name": "A", "amount": "abc", "date": "2024-05-01"}, "amount", "Amount must be a valid number."),
        ({"donor_name": "A", "amount": 1.005, "date": "2024-05-01"}, "amount", "Amount can have at most 2 decimal places."),
        ({"donor_name": "A", "amount": 10, "date": "not-a-date"}, "date", "Date must be a valid date (YYYY-MM-DD)."),
        ({"donor_name": "A", "amount": 10}, "date", "Date is required."),
    ],
)
def test_create_donation_validation(client, payload, field, message):
    response = client.post("/api/donations", json=payload)
    assert response.status_code == 422
    body = response.json()
    assert {"field": field, "message": message} in body["errors"]
    assert message in body["detail"]
    assert client.get("/api/donations").json() == []


def test_update_donation_validation(client, make_donation):
    created = make_donation()
    response = client.put(
        f"/api/donations/{created['id']}",
        json={"donor_name": "", "amount": 0, "date": "2024-05-01"},
    )
    assert response.status_code == 422
    fields = {e["field"] for e in response.json()["errors"]}
    assert fields == {"donor_name", "amount"}
    assert client.get(f"/api/donations/{created['id']}").json() == created


def test_cannot_delete_donation_needed_by_allocations(client, make_donation, make_allocation):
    first = make_donation(amount=1000)
    make_donation(amount=500)
    make_allocation(amount=1200)

    response = client.delete(f"/api/donations/{first['id']}")
    assert response.status_code == 409
    assert "₹1,200.00 already allocated" in response.json()["detail"]
    assert len(client.get("/api/donations").json()) == 2


def test_cannot_reduce_donation_below_allocations(client, make_donation, make_allocation):
    donation = make_donation(amount=1000)
    make_allocation(amount=800)
    payload = {"donor_name": "Asha Rao", "date": "2024-05-01", "purpose": ""}

    response = client.put(f"/api/donations/{donation['id']}", json={**payload, "amount": 700})
    assert response.status_code == 409

    response = client.put(f"/api/donations/{donation['id']}", json={**payload, "amount": 800})
    assert response.status_code == 200
    assert response.json()["amount"] == 800
