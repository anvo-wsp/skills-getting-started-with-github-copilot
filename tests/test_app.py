import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data

def test_signup_for_activity_success():
    response = client.post("/activities/Chess Club/signup?email=tester@mergington.edu")
    assert response.status_code == 200
    assert "Signed up" in response.json().get("message", "")

    # Clean up: remove the test participant
    client.delete("/activities/Chess Club/participants/tester@mergington.edu")

def test_signup_duplicate():
    email = "duplicate@mergington.edu"
    # First signup
    client.post(f"/activities/Programming Class/signup?email={email}")
    # Duplicate signup
    response = client.post(f"/activities/Programming Class/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json().get("detail", "")
    # Clean up
    client.delete(f"/activities/Programming Class/participants/{email}")

def test_unregister_participant():
    email = "unregister@mergington.edu"
    # Register first
    client.post(f"/activities/Gym Class/signup?email={email}")
    # Unregister
    response = client.delete(f"/activities/Gym Class/participants/{email}")
    assert response.status_code == 200
    assert "Unregistered" in response.json().get("message", "")

def test_unregister_nonexistent():
    response = client.delete("/activities/Chess Club/participants/notfound@mergington.edu")
    assert response.status_code == 404
    assert "Participant not found" in response.json().get("detail", "")
