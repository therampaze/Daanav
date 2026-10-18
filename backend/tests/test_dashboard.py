EMPTY = {"total_donations": 0, "donation_count": 0, "total_allocated": 0, "remaining_balance": 0}


def dashboard(client):
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    return response.json()


def test_dashboard_empty(client):
    assert dashboard(client) == EMPTY


def test_dashboard_totals_track_changes(client, make_donation, make_allocation):
    first = make_donation(amount=1000.10)
    make_donation(amount=500.20)
    assert dashboard(client) == {
        "total_donations": 1500.30,
        "donation_count": 2,
        "total_allocated": 0,
        "remaining_balance": 1500.30,
    }

    allocation = make_allocation(amount=0.30)
    make_allocation(amount=1000)
    assert dashboard(client) == {
        "total_donations": 1500.30,
        "donation_count": 2,
        "total_allocated": 1000.30,
        "remaining_balance": 500.00,
    }

    client.put(
        f"/api/donations/{first['id']}",
        json={"donor_name": "Asha", "amount": 2000, "date": "2024-05-01"},
    )
    assert dashboard(client)["total_donations"] == 2500.20
    assert dashboard(client)["remaining_balance"] == 1499.90

    client.delete(f"/api/allocations/{allocation['id']}")
    assert dashboard(client) == {
        "total_donations": 2500.20,
        "donation_count": 2,
        "total_allocated": 1000,
        "remaining_balance": 1500.20,
    }


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}
