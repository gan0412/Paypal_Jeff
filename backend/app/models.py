from typing import List, Literal, Optional
from pydantic import BaseModel, Field

EmotionState = Literal["neutral", "thinking", "concerned"]
RiskLevel = Literal["low", "medium", "high"]
RoleType = Literal["user", "assistant"]


class TransactionContext(BaseModel):
    """Context of the PayPal transaction being drafted or reviewed."""

    recipient: Optional[str] = Field(default=None, description="Recipient email, username, or identifier")
    amount: Optional[float] = Field(default=None, ge=0, description="Amount to be transferred")
    currency: str = Field(default="USD", max_length=10, description="Currency code (e.g. USD, EUR)")
    memo: Optional[str] = Field(default=None, description="User note or description on the payment")


class ChatMessage(BaseModel):
    """Single chat turn in conversation history."""

    role: RoleType = Field(..., description="Sender role: user or assistant")
    content: str = Field(..., description="Message text content")


class ChatRequest(BaseModel):
    """Payload for conversational interaction with Jeff."""

    message: Optional[str] = Field(
        default="",
        description="Latest message from the user (optional for proactive initial alert)",
    )
    history: List[ChatMessage] = Field(default_factory=list, description="Previous messages in this session")
    transaction: Optional[TransactionContext] = Field(
        default=None,
        description="Active transaction context on the send money page",
    )


class ChatResponse(BaseModel):
    """Response returned by Jeff."""

    reply: str = Field(..., description="Jeff's humanlike conversational response")
    emotion: EmotionState = Field(
        default="neutral",
        description="Dynamic corner avatar expression state: neutral, thinking, or concerned",
    )
    risk_level: RiskLevel = Field(
        default="low",
        description="Current evaluated scam risk level: low, medium, or high",
    )


class EvaluateRequest(BaseModel):
    """Payload for real-time background risk evaluation of transaction draft."""

    transaction: TransactionContext = Field(..., description="Transaction details to evaluate")


class EvaluateResponse(BaseModel):
    """Proactive risk evaluation result for background notifications."""

    risk_level: RiskLevel = Field(..., description="Evaluated risk level")
    avatar_emotion: Literal["neutral", "concerned"] = Field(
        ...,
        description="Avatar expression for the corner widget",
    )
    should_alert: bool = Field(
        ...,
        description="Whether a proactive warning badge should pop up next to Jeff",
    )
    proactive_prompt: Optional[str] = Field(
        default=None,
        description="Short, gentle proactive nudge from Jeff if should_alert is True",
    )


class HealthResponse(BaseModel):
    """Service health check response."""

    status: str
    model: str
    has_api_key: bool
    version: str
