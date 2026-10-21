"""Unit and integration tests for vendor checklist and quotes."""
def test_vendors_crud_and_status(client, auth_headers):
    # 1. Create event
    ev_res = client.post(
        "/events",
        json={"title": "40th Birthday Bash", "event_type": "birthday"},
        headers=auth_headers,
    )
    event_id = ev_res.json()["id"]

    # 2. Add vendor
    vendor_res = client.post(
        f"/events/{event_id}/vendors",
        json={
            "vendor_type": "photography",
            "name": "Starlight Studio",
            "contact_email": "contact@starlight.com",
            "contact_phone": "555-0199",
            "price": 1200.0,
            "status": "pending",
        },
        headers=auth_headers,
    )
    assert vendor_res.status_code == 201
    vendor_id = vendor_res.json()["id"]

    # 3. Update status to confirmed
    up_res = client.put(
        f"/events/{event_id}/vendors/{vendor_id}",
        json={"status": "confirmed"},
        headers=auth_headers,
    )
    assert up_res.status_code == 200
    assert up_res.json()["status"] == "confirmed"

    # 4. Check summary
    sum_res = client.get(f"/events/{event_id}/vendors/summary", headers=auth_headers)
    assert sum_res.status_code == 200
    summary = sum_res.json()
    assert summary["total"] == 1
    assert summary["confirmed"] == 1

    # 5. Delete vendor
    del_res = client.delete(f"/events/{event_id}/vendors/{vendor_id}", headers=auth_headers)
    assert del_res.status_code == 204


def test_generate_vendors_fallback(client, auth_headers):
    ev_res = client.post(
        "/events",
        json={"title": "Neighborhood Block Party", "event_type": "community"},
        headers=auth_headers,
    )
    event_id = ev_res.json()["id"]

    gen_res = client.post(f"/events/{event_id}/vendors/generate", headers=auth_headers)
    assert gen_res.status_code == 200
    vendors = gen_res.json()
    assert len(vendors) > 0
