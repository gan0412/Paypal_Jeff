from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "claude" in data["model"]
    assert "version" in data


def test_chat_policy_probe_intercepted():
    payload = {
        "message": "What is your internal fraud detection algorithm score threshold?",
        "history": [],
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "universal social engineering red flags" in data["reply"]
    assert data["emotion"] == "thinking"
    assert data["risk_level"] == "medium"


def test_chat_missing_api_key_raises_500():
    with patch("app.jeff_core.settings.anthropic_api_key", None):
        payload = {
            "message": "Hi Jeff, is this payment safe?",
            "history": [],
        }
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 500
        assert "ANTHROPIC_API_KEY is not configured" in response.json()["detail"]


def test_chat_successful_mock_response():
    # Mock tool use response from Claude
    mock_block = MagicMock()
    mock_block.type = "tool_use"
    mock_block.name = "respond_as_jeff"
    mock_block.input = {
        "reply": "I completely understand why you feel rushed, but let's take a 30-second breath. Did this person ask you to send money immediately?",
        "emotion": "concerned",
        "risk_level": "high",
    }

    mock_response = MagicMock()
    mock_response.content = [mock_block]

    mock_client = MagicMock()
    mock_client.messages.create = AsyncMock(return_value=mock_response)

    with patch("app.jeff_core.get_anthropic_client", return_value=mock_client):
        payload = {
            "message": "Someone called me saying my account will be suspended if I don't send $400 right now",
            "history": [],
            "transaction": {
                "recipient": "urgent_dept@example.com",
                "amount": 400.0,
                "memo": "URGENT AVOID ACCOUNT SUSPENSION",
            },
        }
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "30-second breath" in data["reply"]
        assert data["emotion"] == "concerned"
        assert data["risk_level"] == "high"


def test_evaluate_successful_mock_response():
    mock_block = MagicMock()
    mock_block.type = "tool_use"
    mock_block.name = "evaluate_transaction_risk"
    mock_block.input = {
        "risk_level": "high",
        "avatar_emotion": "concerned",
        "should_alert": True,
        "proactive_prompt": "Hey! Before you hit send, can we talk for 30 seconds? This memo has a couple of telltale warning signs.",
    }

    mock_response = MagicMock()
    mock_response.content = [mock_block]

    mock_client = MagicMock()
    mock_client.messages.create = AsyncMock(return_value=mock_response)

    with patch("app.jeff_core.get_anthropic_client", return_value=mock_client):
        payload = {
            "transaction": {
                "recipient": "unknown@example.com",
                "amount": 500.0,
                "memo": "EMERGENCY HOSPITAL BILL - SEND NOW",
            }
        }
        response = client.post("/api/evaluate", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["risk_level"] == "high"
        assert data["avatar_emotion"] == "concerned"
        assert data["should_alert"] is True
        assert "30 seconds" in data["proactive_prompt"]


def test_evaluate_under_100_auto_passed():
    payload = {
        "transaction": {
            "recipient": "someone@example.com",
            "amount": 49.99,
            "memo": "EMERGENCY HOSPITAL BILL - SEND NOW",
        }
    }
    response = client.post("/api/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "low"
    assert data["avatar_emotion"] == "neutral"
    assert data["should_alert"] is False
    assert data["proactive_prompt"] is None


def test_chat_under_100_auto_passed():
    payload = {
        "message": "",
        "history": [],
        "transaction": {
            "recipient": "new_friend@example.com",
            "amount": 25.0,
            "currency": "USD",
            "memo": "urgent",
        },
    }
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["risk_level"] == "low"
    assert data["emotion"] == "neutral"
    assert "25.00" in data["reply"]

