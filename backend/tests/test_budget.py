"""Unit and integration tests for budget tracking."""
def test_budget_crud_and_summary(client, auth_headers):
    # 1. Create an event
    ev_res = client.post(
        "/events",
        json={"title": "Tech Conference & Meetup", "event_type": "community", "total_budget": 5000.0},
        headers=auth_headers,
    )
    event_id = ev_res.json()["id"]

    # 2. Add budget item
    item_res = client.post(
        f"/events/{event_id}/budget",
        json={
            "category": "Catering",
            "name": "Coffee and Snacks",
            "estimated_cost": 800.0,
            "actual_cost": 750.0,
            "paid": True,
        },
        headers=auth_headers,
    )
    assert item_res.status_code == 201
    item_id = item_res.json()["id"]
    assert item_res.json()["estimated_cost"] == 800.0

    # 3. Add second item
    client.post(
        f"/events/{event_id}/budget",
        json={
            "category": "Audio/Visual",
            "name": "Microphones and Projector",
            "estimated_cost": 400.0,
            "actual_cost": 400.0,
            "paid": False,
        },
        headers=auth_headers,
    )

    # 4. List items
    list_res = client.get(f"/events/{event_id}/budget", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 2

    # 5. Check summary
    sum_res = client.get(f"/events/{event_id}/budget/summary", headers=auth_headers)
    assert sum_res.status_code == 200
    summary = sum_res.json()
    assert summary["total_estimated"] == 1200.0
    assert summary["total_actual"] == 1150.0
    assert summary["items_count"] == 2

    # 6. Update item
    up_res = client.put(
        f"/events/{event_id}/budget/{item_id}",
        json={"actual_cost": 720.0},
        headers=auth_headers,
    )
    assert up_res.status_code == 200
    assert up_res.json()["actual_cost"] == 720.0

    # 7. Delete item
    del_res = client.delete(f"/events/{event_id}/budget/{item_id}", headers=auth_headers)
    assert del_res.status_code == 204


def test_generate_budget_fallback(client, auth_headers):
    ev_res = client.post(
        "/events",
        json={"title": "Sweet 16 Party", "event_type": "birthday", "total_budget": 2000.0},
        headers=auth_headers,
    )
    event_id = ev_res.json()["id"]

    gen_res = client.post(f"/events/{event_id}/budget/generate", headers=auth_headers)
    assert gen_res.status_code == 200
    items = gen_res.json()
    assert len(items) > 0
    assert any(i["category"] for i in items)
