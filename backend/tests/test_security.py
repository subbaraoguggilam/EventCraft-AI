"""Security and tenant isolation test suite."""
import pytest
from app.models.models import User, Event
from app.utils.security import hash_password, create_access_token


def test_security_headers_present(client):
    """Verify OWASP-recommended security headers are attached to responses."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("x-frame-options") == "DENY"
    assert resp.headers.get("x-xss-protection") == "1; mode=block"
    assert resp.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
    assert resp.headers.get("permissions-policy") == "geolocation=(), camera=(), microphone=()"


def test_unauthenticated_request_rejected(client):
    """Requests to protected endpoints without Bearer token must return 401."""
    resp = client.get("/events")
    assert resp.status_code == 401


def test_invalid_token_rejected(client):
    """Requests with forged or invalid Bearer token must return 401."""
    resp = client.get("/events", headers={"Authorization": "Bearer forged-token-abc"})
    assert resp.status_code == 401


def test_tenant_isolation_read_access(client, db_session, test_user, auth_headers):
    """User B cannot read User A's event and gets 403 Forbidden."""
    # User A creates an event
    event = Event(
        owner_id=test_user.id,
        title="User A Private Wedding",
        event_type="wedding",
        total_budget=1500000.0,
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)

    # Create User B
    user_b = User(
        email="user_b@example.com",
        full_name="User B",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user_b)
    db_session.commit()
    db_session.refresh(user_b)

    token_b = create_access_token(data={"sub": user_b.email, "user_id": user_b.id})
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B tries to access User A's event
    resp = client.get(f"/events/{event.id}", headers=headers_b)
    assert resp.status_code == 403


def test_tenant_isolation_mutate_access(client, db_session, test_user, auth_headers):
    """User B cannot delete or modify User A's event and gets 403 Forbidden."""
    event = Event(
        owner_id=test_user.id,
        title="User A Protected Event",
        event_type="birthday",
        total_budget=50000.0,
    )
    db_session.add(event)
    db_session.commit()
    db_session.refresh(event)

    # Create User B
    user_b = User(
        email="intruder@example.com",
        full_name="Intruder",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user_b)
    db_session.commit()
    db_session.refresh(user_b)

    token_b = create_access_token(data={"sub": user_b.email, "user_id": user_b.id})
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User B tries to delete User A's event
    del_resp = client.delete(f"/events/{event.id}", headers=headers_b)
    assert del_resp.status_code == 403

    # Verify event still exists for User A
    get_resp = client.get(f"/events/{event.id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["title"] == "User A Protected Event"
