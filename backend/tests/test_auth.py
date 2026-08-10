import pytest
from auth import verify_password, get_password_hash, create_access_token

def test_password_hashing():
    password = "MySecurePassword123!"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_register_and_login_flow(client):
    user_data = {
        "email": "testuser@example.com",
        "password": "Password123!",
        "full_name": "Test User"
    }

    # 1. Register User
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == 200
    res_data = response.json()
    assert "access_token" in res_data
    assert res_data["user"]["email"] == "testuser@example.com"
    token = res_data["access_token"]

    # 2. Duplicate Registration Fail
    dup_res = client.post("/auth/register", json=user_data)
    assert dup_res.status_code == 400

    # 3. Login User
    login_res = client.post("/auth/login", json={
        "email": "testuser@example.com",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Get Current User Profile with Token
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "testuser@example.com"

    # 5. Invalid Token Fail
    bad_res = client.get("/auth/me", headers={"Authorization": "Bearer invalid_token"})
    assert bad_res.status_code == 401
