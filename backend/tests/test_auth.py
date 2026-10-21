"""Unit and integration tests for authentication."""
def test_register_user(client):
    payload = {
        "email": "sarah@example.com",
        "password": "securepassword",
        "full_name": "Sarah Connor",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "sarah@example.com"
    assert data["user"]["full_name"] == "Sarah Connor"


def test_register_duplicate_email(client, test_user):
    payload = {
        "email": test_user.email,
        "password": "password123",
        "full_name": "Duplicate User",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 400


def test_login_success(client, test_user):
    response = client.post(
        "/auth/login",
        data={"username": test_user.email, "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["id"] == test_user.id


def test_login_invalid_password(client, test_user):
    response = client.post(
        "/auth/login",
        data={"username": test_user.email, "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_get_current_user_me(client, auth_headers, test_user):
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
