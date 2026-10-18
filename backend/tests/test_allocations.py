def test_create_and_list_allocations(client, make_donation, make_allocation):
    make_donation(amount=1000)
    created = make_allocation(amount=400, cause_name=" Flood relief ", description="Kits")
    assert created["cause_name"] == "Flood relief"
    assert created["amount"] == 400
    assert created["description"] == "Kits"

    response = client.get("/api/allocations")
    assert response.status_code == 200
    assert [a["id"] for a in response.json()] == [created["id"]]


def test_allocation_persists_across_requests(client, make_donation, make_allocation):
    make_donation(amount=1000)
    created = make_allocation(amount=250)
    assert client.get("/api/allocations").json()[0] == created


def test_allocation_up_to_exact_balance_is_allowed(client, make_donation, make_allocation):
    make_donation(amount=1000)
    make_allocation(amount=600)
    make_allocation(amount=400)
    assert client.get("/api/dashboard").json()["remaining_balance"] == 0


def test_allocation_exceeding_balance_is_rejected(client, make_donation, make_allocation):
    make_donation(amount=1000)
    make_allocation(amount=700)

    response = client.post("/api/allocations", json={"cause_name": "Health", "amount": 300.01})
    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Allocation of ₹300.01 exceeds the available balance of ₹300.00."
    )
    assert len(client.get("/api/allocations").json()) == 1


def test_allocation_without_donations_is_rejected(client):
    response = client.post("/api/allocations", json={"cause_name": "Health", "amount": 1})
    assert response.status_code == 409
    assert client.get("/api/allocations").json() == []


def test_allocation_validation(client, make_donation):
    make_donation(amount=1000)
    response = client.post("/api/allocations", json={"cause_name": " ", "amount": 0})
    assert response.status_code == 422
    errors = response.json()["errors"]
    assert {"field": "cause_name", "message": "Cause name must not be empty."} in errors
    assert {"field": "amount", "message": "Amount must be greater than zero."} in errors


def test_delete_allocation(client, make_donation, make_allocation):
    make_donation(amount=1000)
    created = make_allocation(amount=500)
    response = client.delete(f"/api/allocations/{created['id']}")
    assert response.status_code == 204
    assert client.get("/api/allocations").json() == []


def test_delete_missing_allocation_returns_404(client):
    response = client.delete("/api/allocations/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Allocation not found."
