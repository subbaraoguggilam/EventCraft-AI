"""Unit and integration tests for event timeline and milestone management."""
def test_timeline_crud(client, auth_headers):
    # 1. Create an event
    ev_res = client.post(
        "/events",
        json={"title": "Beach Wedding", "event_type": "wedding", "total_budget": 10000.0},
        headers=auth_headers,
    )
    event_id = ev_res.json()["id"]

    # 2. Add milestone
    item_res = client.post(
        f"/events/{event_id}/timeline",
        json={
            "title": "Send Invitations",
            "description": "Mail printed stationery and trigger digital RSVP form",
            "priority": "high",
            "is_completed": False,
        },
        headers=auth_headers,
    )
    assert item_res.status_code == 201
    item_id = item_res.json()["id"]
    assert item_res.json()["priority"] == "high"

    # 3. List timeline
    list_res = client.get(f"/events/{event_id}/timeline", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 4. Toggle completion
    up_res = client.put(
        f"/events/{event_id}/timeline/{item_id}",
        json={"is_completed": True},
        headers=auth_headers,
    )
    assert up_res.status_code == 200
    assert up_res.json()["is_completed"] is True

    # 5. Delete milestone
    del_res = client.delete(f"/events/{event_id}/timeline/{item_id}", headers=auth_headers)
    assert del_res.status_code == 204


def test_generate_timeline_fallback(client, auth_headers):
    ev_res = client.post(
        "/events",
        json={"title": "Charity 5K Run", "event_type": "community"},
        headers=auth_headers,
    )
    event_id = ev_res.json()["id"]

    gen_res = client.post(f"/events/{event_id}/timeline/generate", headers=auth_headers)
    assert gen_res.status_code == 200
    milestones = gen_res.json()
    assert len(milestones) > 0
    assert any(m["title"] for m in milestones)
