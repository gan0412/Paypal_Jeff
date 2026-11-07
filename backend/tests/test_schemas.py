import pytest
from pydantic import ValidationError
from app.models import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    EvaluateRequest,
    EvaluateResponse,
    TransactionContext,
)


def test_transaction_context_valid():
    tx = TransactionContext(
        recipient="user@example.com",
        amount=250.0,
        currency="USD",
        memo="Emergency loan",
    )
    assert tx.recipient == "user@example.com"
    assert tx.amount == 250.0
    assert tx.currency == "USD"
    assert tx.memo == "Emergency loan"


def test_chat_request_validation():
    req = ChatRequest(
        message="Someone is telling me to send $500",
        history=[
            ChatMessage(role="user", content="Hello"),
            ChatMessage(role="assistant", content="Hi! How can I help?"),
        ],
        transaction=TransactionContext(amount=500.0, memo="Urgent"),
    )
    assert len(req.history) == 2
    assert req.transaction.amount == 500.0


def test_chat_response_emotion_constraint():
    resp = ChatResponse(
        reply="Take a pause.",
        emotion="concerned",
        risk_level="high",
    )
    assert resp.emotion == "concerned"
    assert resp.risk_level == "high"

    with pytest.raises(ValidationError):
        ChatResponse(
            reply="Invalid",
            emotion="angry",  # Not an allowed emotion
            risk_level="low",
        )


def test_evaluate_response_validation():
    resp = EvaluateResponse(
        risk_level="high",
        avatar_emotion="concerned",
        should_alert=True,
        proactive_prompt="Notice urgent language in your note.",
    )
    assert resp.should_alert is True
    assert resp.avatar_emotion == "concerned"
