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


# ============================================================================
# Session API Models (aligned with docs/API_CONTRACT.md and frontend types.ts)
# ============================================================================

MoodType = Literal["calm", "listening", "thinking", "concerned", "relieved"]
SessionRiskLevel = Literal["low", "elevated", "high"]
ChoiceType = Literal["continue", "protected", "cancel"]
PaymentMethodType = Literal["friends_family", "goods_services"]


class PaymentPayload(BaseModel):
    """Payment draft details submitted to start a review session."""

    amount: float = Field(..., ge=0, description="Payment transfer amount")
    currency: str = Field(default="USD", description="Currency code (e.g. USD)")
    recipient_name: str = Field(..., description="Recipient display name")
    recipient_email: str = Field(..., description="Recipient email address")
    recipient_is_new: bool = Field(default=True, description="Whether this is a first-time recipient")
    note: str = Field(default="", description="Payment note or memo")
    payment_type: PaymentMethodType = Field(
        default="friends_family",
        description="friends_family (no protection) or goods_services (purchase protection)",
    )


class RiskSignalPayload(BaseModel):
    """Specific scam risk indicator."""

    code: str = Field(..., description="Machine-readable signal code")
    label: str = Field(..., description="Human-readable label for UI badge")
    detail: Optional[str] = Field(default=None, description="Optional extra detail")


class RiskPayload(BaseModel):
    """Overall scam risk assessment."""

    score: int = Field(..., ge=0, le=100, description="Risk score 0-100")
    level: SessionRiskLevel = Field(..., description="Risk tier: low (<35), elevated (<65), high (>=65)")
    signals: List[RiskSignalPayload] = Field(default_factory=list, description="Active risk signals detected")


class AgentTurnPayload(BaseModel):
    """Jeff's conversational turn response."""

    message: str = Field(..., description="Text shown in the chat")
    mood: MoodType = Field(..., description="Avatar face expression")
    risk: RiskPayload = Field(..., description="Current evaluated risk")
    quick_replies: Optional[List[str]] = Field(default=None, description="Suggested quick reply choices")
    recommended: Optional[ChoiceType] = Field(default=None, description="Recommended user decision action")
    done: bool = Field(default=False, description="Whether Jeff has completed the inquiry")


class StartSessionRequest(BaseModel):
    """Request payload to initiate a payment review session."""

    payment: PaymentPayload = Field(..., description="Payment being reviewed")


class StartSessionResponse(AgentTurnPayload):
    """Response returned upon starting a session, includes session_id."""

    session_id: str = Field(..., description="Unique ID for this review session")


class SendMessageRequest(BaseModel):
    """Request payload for sending a user message in an active session."""

    text: str = Field(..., description="User message text")


class DecisionRequest(BaseModel):
    """Request payload for the user's final payment decision."""

    choice: ChoiceType = Field(..., description="User choice: continue, protected, or cancel")


class DecisionResponse(BaseModel):
    """Outcome of the payment decision."""

    status: Literal["sent", "protected", "cancelled"] = Field(..., description="Decision status")
    message: str = Field(..., description="Human-readable status text")
    order_id: Optional[str] = Field(default=None, description="Order ID if protected")
    approve_url: Optional[str] = Field(default=None, description="Approval URL if applicable")

