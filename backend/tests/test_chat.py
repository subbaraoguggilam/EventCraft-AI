"""Unit and integration tests for AI planning chat."""
def test_chat_interaction_and_history(client, auth_headers):
    # 1. Create event
    ev_res = client.post(
        "/events",
        json={
            "title": "Garden Wedding",
            "event_type": "wedding",
            "venue": "Botanical Conservatory",
            "guest_count": 80,
            "total_budget": 15000.0,
        },
        headers=auth_headers,
    )
    event_id = ev_res.json()["id"]

    # 2. Send message
    chat_res = client.post(
        f"/events/{event_id}/chat",
        json={"message": "What floral arrangements work best for late spring?"},
        headers=auth_headers,
    )
    assert chat_res.status_code == 201
    data = chat_res.json()
    assert "message" in data
    assert "response" in data
    assert data["message"]["role"] == "user"
    assert data["response"]["role"] == "assistant"
    assert len(data["response"]["content"]) > 0

    # 3. Retrieve history
    hist_res = client.get(f"/events/{event_id}/chat", headers=auth_headers)
    assert hist_res.status_code == 200
    messages = hist_res.json()
    assert len(messages) >= 2

    # 4. Clear history
    del_res = client.delete(f"/events/{event_id}/chat", headers=auth_headers)
    assert del_res.status_code == 204

    hist_after = client.get(f"/events/{event_id}/chat", headers=auth_headers)
    assert hist_after.status_code == 200
    assert len(hist_after.json()) == 0
