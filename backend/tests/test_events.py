"""Unit and integration tests for events and AI generator endpoints."""
def test_create_and_list_events(client, auth_headers):
    payload = {
        "title": "Summer Community Festival",
        "event_type": "community",
        "venue": "Civic Center Park",
        "guest_count": 350,
        "total_budget": 12000.0,
        "description": "Annual music, food trucks, and craft vendors festival",
    }
    create_res = client.post("/events", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    event_data = create_res.json()
    assert event_data["title"] == payload["title"]
    assert event_data["event_type"] == "community"

    list_res = client.get("/events", headers=auth_headers)
    assert list_res.status_code == 200
    events = list_res.json()
    assert len(events) >= 1
    assert any(e["id"] == event_data["id"] for e in events)


def test_get_event_detail(client, auth_headers):
    payload = {
        "title": "Emma's 30th Birthday",
        "event_type": "birthday",
        "venue": "Skyline Lounge",
        "guest_count": 40,
        "total_budget": 3000.0,
    }
    create_res = client.post("/events", json=payload, headers=auth_headers)
    event_id = create_res.json()["id"]

    res = client.get(f"/events/{event_id}", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == event_id
    assert "budget_summary" in data
    assert "vendor_summary" in data


def test_update_event(client, auth_headers):
    payload = {
        "title": "Golden Wedding Anniversary",
        "event_type": "wedding",
        "total_budget": 15000.0,
    }
    create_res = client.post("/events", json=payload, headers=auth_headers)
    event_id = create_res.json()["id"]

    update_res = client.put(
        f"/events/{event_id}",
        json={"title": "Updated Golden Anniversary", "total_budget": 18000.0},
        headers=auth_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Golden Anniversary"
    assert update_res.json()["total_budget"] == 18000.0


def test_delete_event(client, auth_headers):
    payload = {
        "title": "Temporary Event",
        "event_type": "birthday",
    }
    create_res = client.post("/events", json=payload, headers=auth_headers)
    event_id = create_res.json()["id"]

    del_res = client.delete(f"/events/{event_id}", headers=auth_headers)
    assert del_res.status_code == 204

    get_res = client.get(f"/events/{event_id}", headers=auth_headers)
    assert get_res.status_code == 404


def test_generate_event_ideas_fallback(client, auth_headers):
    payload = {
        "title": "Rustic Barn Wedding",
        "event_type": "wedding",
        "guest_count": 120,
        "total_budget": 20000.0,
    }
    create_res = client.post("/events", json=payload, headers=auth_headers)
    event_id = create_res.json()["id"]

    ideas_res = client.post(f"/events/{event_id}/generate-ideas", headers=auth_headers)
    assert ideas_res.status_code == 200
    data = ideas_res.json()
    assert "ideas" in data
    assert len(data["ideas"]) > 0
