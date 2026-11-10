import sys
from pathlib import Path

# Automatically inject backend and app directories into sys.path
_app_dir = Path(__file__).resolve().parent
_backend_dir = _app_dir.parent
for _p in [str(_backend_dir), str(_app_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

import logging
import time
from typing import Dict, List, Optional
import uuid
import anthropic
from fastapi import HTTPException

try:
    from app.config import settings
    from app.guardrails import check_policy_probe, redact_pii
    from app.models import (
        AgentTurnPayload,
        ChatMessage,
        ChatResponse,
        ChoiceType,
        DecisionResponse,
        EvaluateResponse,
        MoodType,
        PaymentPayload,
        RiskPayload,
        RiskSignalPayload,
        StartSessionResponse,
        TransactionContext,
    )
    from app.prompts import (
        EVALUATE_SYSTEM_PROMPT,
        EVALUATE_TOOL_DEFINITION,
        JEFF_SYSTEM_PROMPT,
        JEFF_TOOL_DEFINITION,
        SESSION_SYSTEM_PROMPT,
        SESSION_TOOL_DEFINITION,
        language_instruction,
        normalize_language,
    )
except (ImportError, ModuleNotFoundError):
    try:
        from .config import settings
        from .guardrails import check_policy_probe, redact_pii
        from .models import (
            AgentTurnPayload,
            ChatMessage,
            ChatResponse,
            ChoiceType,
            DecisionResponse,
            EvaluateResponse,
            MoodType,
            PaymentPayload,
            RiskPayload,
            RiskSignalPayload,
            StartSessionResponse,
            TransactionContext,
        )
        from .prompts import (
            EVALUATE_SYSTEM_PROMPT,
            EVALUATE_TOOL_DEFINITION,
            JEFF_SYSTEM_PROMPT,
            JEFF_TOOL_DEFINITION,
            SESSION_SYSTEM_PROMPT,
            SESSION_TOOL_DEFINITION,
            language_instruction,
            normalize_language,
        )
    except (ImportError, ValueError):
        import config as _config_mod
        settings = _config_mod.settings
        from guardrails import check_policy_probe, redact_pii
        from models import (
            AgentTurnPayload,
            ChatMessage,
            ChatResponse,
            ChoiceType,
            DecisionResponse,
            EvaluateResponse,
            MoodType,
            PaymentPayload,
            RiskPayload,
            RiskSignalPayload,
            StartSessionResponse,
            TransactionContext,
        )
        from prompts import (
            EVALUATE_SYSTEM_PROMPT,
            EVALUATE_TOOL_DEFINITION,
            JEFF_SYSTEM_PROMPT,
            JEFF_TOOL_DEFINITION,
            SESSION_SYSTEM_PROMPT,
            SESSION_TOOL_DEFINITION,
            language_instruction,
            normalize_language,
        )

logger = logging.getLogger("jeff_backend")


def get_anthropic_client() -> anthropic.AsyncAnthropic:
    """Instantiate and validate AsyncAnthropic client."""
    api_key = settings.anthropic_api_key
    if not api_key or api_key.strip() in ("", "your_anthropic_api_key_here"):
        raise HTTPException(
            status_code=500,
            detail="ANTHROPIC_API_KEY is not configured. Please set your Anthropic API key in .env or environment variables.",
        )
    return anthropic.AsyncAnthropic(api_key=api_key)


async def generate_chat_response(
    user_message: str,
    history: List[ChatMessage],
    transaction: Optional[TransactionContext] = None,
) -> ChatResponse:
    """Process user message through guardrails and Claude Haiku model."""
    # 1. Check for policy probes
    is_probe, probe_reply = check_policy_probe(user_message)
    if is_probe:
        return ChatResponse(
            reply=probe_reply,
            emotion="thinking",
            risk_level="medium",
        )

    # 2. Sanitize user message and memo for PII
    sanitized_message = redact_pii(user_message)
    sanitized_memo = redact_pii(transaction.memo) if transaction and transaction.memo else None

    # 3. Assemble context
    system_text = JEFF_SYSTEM_PROMPT
    if transaction:
        tx_summary = (
            f"\n\n[Active Send Money Context]\n"
            f"- Recipient: {transaction.recipient or 'Not specified'}\n"
            f"- Amount: {transaction.amount if transaction.amount is not None else 'Not specified'} {transaction.currency}\n"
            f"- Memo / Note: {sanitized_memo or 'None'}"
        )
        system_text += tx_summary

    # 4. Prepare message list for Claude API
    messages = []
    for msg in history:
        messages.append({
            "role": msg.role,
            "content": redact_pii(msg.content),
        })

    if sanitized_message and sanitized_message.strip():
        messages.append({
            "role": "user",
            "content": sanitized_message,
        })
    else:
        messages.append({
            "role": "user",
            "content": "[User opened chat or initiated transaction review without typing a message. If risk is at least high, immediately alert them. If low or medium, greet them naturally.]",
        })

    client = get_anthropic_client()

    try:
        response = await client.messages.create(
            model=settings.anthropic_model,
            max_tokens=250,
            system=system_text,
            messages=messages,
            tools=[JEFF_TOOL_DEFINITION],
            tool_choice={"type": "tool", "name": "respond_as_jeff"},
        )

        # Parse structured output from tool use
        for block in response.content:
            if getattr(block, "type", None) == "tool_use" and block.name == "respond_as_jeff":
                input_data = block.input
                raw_reply = input_data.get("reply", "I'm right here with you. Let's look at this transfer together.")
                emotion = input_data.get("emotion", "neutral")
                risk_level = input_data.get("risk_level", "low")

                # Ensure feelings correspond directly to risk level (low/safe/cancel -> neutral)
                if risk_level == "high":
                    emotion = "concerned"
                elif risk_level == "medium":
                    emotion = "thinking"
                else:
                    emotion = "neutral"

                # Run outgoing reply through PII filter as secondary safeguard
                safe_reply = redact_pii(raw_reply)

                return ChatResponse(
                    reply=safe_reply,
                    emotion=emotion,
                    risk_level=risk_level,
                )

        # Fallback if text block returned
        for block in response.content:
            if getattr(block, "type", None) == "text":
                return ChatResponse(
                    reply=redact_pii(block.text),
                    emotion="neutral",
                    risk_level="low",
                )

        return ChatResponse(
            reply="When the scammers attack, Jeff has your back. Let's take a quick pause and verify this transfer together.",
            emotion="concerned",
            risk_level="high",
        )

    except anthropic.APIError as exc:
        logger.error(f"Anthropic API Error: {exc}")
        raise HTTPException(
            status_code=502,
            detail=f"Anthropic API Error ({exc.__class__.__name__}): {str(exc)}",
        )
    except Exception as exc:
        logger.error(f"Unexpected error communicating with LLM: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Error in Jeff agent processing: {str(exc)}",
        )


async def generate_evaluation(transaction: TransactionContext) -> EvaluateResponse:
    """Evaluate transaction draft for urgent scam markers."""
    sanitized_memo = redact_pii(transaction.memo) if transaction.memo else ""

    client = get_anthropic_client()

    user_prompt = (
        f"Evaluate this payment draft:\n"
        f"- Recipient: {transaction.recipient or 'Unknown'}\n"
        f"- Amount: {transaction.amount if transaction.amount is not None else 'Unknown'} {transaction.currency}\n"
        f"- Memo: {sanitized_memo or 'None'}"
    )

    try:
        response = await client.messages.create(
            model=settings.anthropic_model,
            max_tokens=300,
            system=EVALUATE_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
            tools=[EVALUATE_TOOL_DEFINITION],
            tool_choice={"type": "tool", "name": "evaluate_transaction_risk"},
        )

        for block in response.content:
            if getattr(block, "type", None) == "tool_use" and block.name == "evaluate_transaction_risk":
                data = block.input
                risk_level = data.get("risk_level", "low")
                avatar_emotion = data.get("avatar_emotion", "neutral")
                should_alert = data.get("should_alert", False)
                proactive_prompt = data.get("proactive_prompt", "")

                return EvaluateResponse(
                    risk_level=risk_level,
                    avatar_emotion=avatar_emotion,
                    should_alert=should_alert,
                    proactive_prompt=proactive_prompt if should_alert else None,
                )

        return EvaluateResponse(
            risk_level="low",
            avatar_emotion="neutral",
            should_alert=False,
            proactive_prompt=None,
        )

    except anthropic.APIError as exc:
        logger.error(f"Anthropic API Error during evaluation: {exc}")
        raise HTTPException(
            status_code=502,
            detail=f"Anthropic API Error ({exc.__class__.__name__}): {str(exc)}",
        )
    except Exception as exc:
        logger.error(f"Unexpected evaluation error: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Error during risk evaluation: {str(exc)}",
        )


# ============================================================================
# Session-Based Review Dialog (powers React frontend)
# ============================================================================


class SessionState:
    """In-memory state for an interactive payment review session."""

    def __init__(self, session_id: str, payment: PaymentPayload):
        self.session_id = session_id
        self.payment = payment
        self.messages: List[dict] = []
        self.score: int = 50
        self.level: str = "elevated"
        self.signals: List[RiskSignalPayload] = []
        self.mood: MoodType = "thinking"
        self.turns: int = 0
        self.created_at: float = time.time()
        self.language: str = "en"


sessions_store: Dict[str, SessionState] = {}


def compute_level(score: int) -> str:
    """Return risk tier according to score: <35 low, <65 elevated, >=65 high."""
    if score < 35:
        return "low"
    elif score < 65:
        return "elevated"
    return "high"


def build_initial_signals(payment: PaymentPayload) -> List[RiskSignalPayload]:
    """Derive deterministic baseline risk signals from transaction attributes."""
    signals: List[RiskSignalPayload] = []
    if payment.recipient_is_new:
        signals.append(
            RiskSignalPayload(
                code="new_recipient",
                label="First payment to this person",
                detail=payment.recipient_email,
            )
        )
    else:
        signals.append(
            RiskSignalPayload(
                code="known_recipient",
                label=f"You have paid {payment.recipient_name} before",
            )
        )

    if payment.payment_type == "friends_family" and payment.recipient_is_new:
        signals.append(
            RiskSignalPayload(
                code="friends_family",
                label="Sent as Friends & Family (no purchase protection)",
            )
        )

    if payment.amount >= 1000:
        signals.append(
            RiskSignalPayload(
                code="large_amount",
                label="Much larger than typical payments",
                detail=f"${payment.amount:,.2f}",
            )
        )

    if payment.note:
        note_lower = payment.note.lower()
        if any(w in note_lower for w in ["flight", "travel", "love", "partner", "boyfriend", "girlfriend", "see me"]):
            signals.append(
                RiskSignalPayload(
                    code="emotional_note",
                    label="Note mentions travel or relationship",
                )
            )
        if any(w in note_lower for w in ["urgent", "hurry", "asap", "emergency", "fast", "today"]):
            signals.append(
                RiskSignalPayload(
                    code="urgent_wording",
                    label="Note indicates urgency or emergency",
                )
            )

    return signals


async def generate_session_start(payment: PaymentPayload, language: str = "en") -> StartSessionResponse:
    """Initiate a payment review session, evaluate risk, and generate Jeff's opening turn."""
    session_id = f"sess_{uuid.uuid4().hex[:10]}"
    session = SessionState(session_id=session_id, payment=payment)
    session.signals = build_initial_signals(payment)
    session.language = normalize_language(language)

    # Initial baseline heuristic
    if not payment.recipient_is_new:
        base_score = 15
        base_mood: MoodType = "calm"
    elif any(s.code in ("urgent_wording", "emotional_note") for s in session.signals) or (payment.recipient_is_new and payment.payment_type == "friends_family"):
        base_score = 72
        base_mood = "concerned"
    else:
        base_score = 45
        base_mood = "thinking"

    system_text = SESSION_SYSTEM_PROMPT
    tx_summary = (
        f"\n\n[Payment Transaction Under Review]\n"
        f"- Recipient Name: {payment.recipient_name}\n"
        f"- Recipient Email: {payment.recipient_email}\n"
        f"- First time paying this person: {'Yes' if payment.recipient_is_new else 'No (Known recipient)'}\n"
        f"- Amount: ${payment.amount:,.2f} {payment.currency}\n"
        f"- Payment Type: {'Friends & Family (No purchase protection)' if payment.payment_type == 'friends_family' else 'Goods & Services (Purchase protection)'}\n"
        f"- Note / Memo: {redact_pii(payment.note) if payment.note else 'None'}\n"
        f"- Initial Detected Signals: {', '.join(s.code for s in session.signals)}\n"
        f"- Suggested Initial Base Score: {base_score}\n"
    )
    system_text += tx_summary + language_instruction(session.language)

    client = get_anthropic_client()
    user_prompt = (
        "The user has opened the payment review screen. "
        "Provide your opening evaluation message as Jeff. "
        "Remember: introduce yourself as an AI assistant (e.g. 'Hi, I\\'m Jeff, an AI assistant...'). "
        "Keep it concise (1-2 sentences). "
        "If there are scam markers (first-time recipient with romance/travel notes, urgency, or Friends & Family without buyer protection), "
        "treat this as HIGH risk (score >= 65), set mood='concerned', and advise caution before sending. "
        "If it is a routine payment to a known contact, confirm calmly (score < 35, mood='calm', done=true, recommended='continue')."
    )

    try:
        response = await client.messages.create(
            model=settings.anthropic_model,
            max_tokens=300,
            system=system_text,
            messages=[{"role": "user", "content": user_prompt}],
            tools=[SESSION_TOOL_DEFINITION],
            tool_choice={"type": "tool", "name": "respond_session_turn"},
        )

        for block in response.content:
            if getattr(block, "type", None) == "tool_use" and block.name == "respond_session_turn":
                data = block.input
                raw_message = data.get("message", "Hi, I'm Jeff, an AI assistant. Let's look over this payment together.")
                score = int(data.get("score", base_score))
                score = max(0, min(100, score))
                level = compute_level(score)
                mood = data.get("mood", base_mood)

                # Strict risk-driven behavioral model from AGENTS.md:
                if level == "high":
                    mood = "concerned"
                elif level == "low" and mood == "concerned":
                    mood = "calm"

                # Merge signals
                extracted_signals = data.get("signals", [])
                sig_map = {s.code: s for s in session.signals}
                for s in extracted_signals:
                    if isinstance(s, dict) and "code" in s and "label" in s:
                        code = s["code"]
                        sig_map[code] = RiskSignalPayload(
                            code=code,
                            label=s["label"],
                            detail=s.get("detail"),
                        )
                session.signals = list(sig_map.values())

                quick_replies = data.get("quick_replies")
                if quick_replies and not isinstance(quick_replies, list):
                    quick_replies = None

                # Provide smart fallback quick replies if LLM omitted them on opening turn
                if not quick_replies and not data.get("done", False):
                    if not payment.recipient_is_new:
                        quick_replies = ["Yes, all good", "It's something else"]
                    elif any(s.code == "emotional_note" for s in session.signals):
                        quick_replies = ["We met online", "He's my partner", "I know them"]
                    elif any(s.code == "urgent_wording" for s in session.signals):
                        quick_replies = ["I know them well", "Someone asked me to send it", "I'll verify first"]
                    else:
                        quick_replies = ["I know this person", "We met online", "I want to verify"]

                recommended = data.get("recommended")
                if recommended not in ("continue", "protected", "cancel"):
                    recommended = None

                done = bool(data.get("done", False))

                # If low risk routine payment, suggest continue
                if level == "low" and not recommended:
                    recommended = "continue"

                session.score = score
                session.level = level
                session.mood = mood
                session.messages.append({"role": "assistant", "content": raw_message})
                sessions_store[session_id] = session

                return StartSessionResponse(
                    session_id=session_id,
                    message=redact_pii(raw_message),
                    mood=mood,
                    risk=RiskPayload(
                        score=score,
                        level=level,
                        signals=session.signals,
                    ),
                    quick_replies=quick_replies,
                    recommended=recommended,
                    done=done,
                )

        # Fallback if no tool use returned
        safe_msg = f"Hi, I'm Jeff, an AI assistant. Checking your transfer of ${payment.amount:,.2f} to {payment.recipient_name}."
        session.score = base_score
        session.level = compute_level(base_score)
        session.mood = base_mood
        session.messages.append({"role": "assistant", "content": safe_msg})
        sessions_store[session_id] = session

        return StartSessionResponse(
            session_id=session_id,
            message=safe_msg,
            mood=base_mood,
            risk=RiskPayload(
                score=base_score,
                level=compute_level(base_score),
                signals=session.signals,
            ),
            quick_replies=["Yes, all good", "I want to check"],
            recommended="continue" if base_score < 35 else None,
            done=base_score < 35,
        )

    except anthropic.APIError as exc:
        logger.error(f"Anthropic API Error starting session: {exc}")
        raise HTTPException(
            status_code=502,
            detail=f"Anthropic API Error ({exc.__class__.__name__}): {str(exc)}",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Unexpected error starting session: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Error starting session: {str(exc)}",
        )


async def generate_session_message(session_id: str, text: str, language: Optional[str] = None) -> AgentTurnPayload:
    """Process an ongoing conversation turn inside an active session."""
    session = sessions_store.get(session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="This session has expired. Please start again.",
        )
    if language:
        session.language = normalize_language(language)

    # 1. Policy probe safeguard
    is_probe, probe_reply = check_policy_probe(text)
    if is_probe:
        return AgentTurnPayload(
            message=probe_reply,
            mood="thinking",
            risk=RiskPayload(
                score=session.score,
                level=compute_level(session.score),
                signals=session.signals,
            ),
            quick_replies=None,
            recommended=None,
            done=False,
        )

    # 2. Sanitize and record user turn
    sanitized_text = redact_pii(text)
    session.messages.append({"role": "user", "content": sanitized_text})
    session.turns += 1

    # 3. Assemble prompt context
    p = session.payment
    system_text = SESSION_SYSTEM_PROMPT
    tx_summary = (
        f"\n\n[Payment Transaction Under Review]\n"
        f"- Recipient Name: {p.recipient_name}\n"
        f"- Recipient Email: {p.recipient_email}\n"
        f"- First time paying this person: {'Yes' if p.recipient_is_new else 'No'}\n"
        f"- Amount: ${p.amount:,.2f} {p.currency}\n"
        f"- Payment Type: {'Friends & Family (No purchase protection)' if p.payment_type == 'friends_family' else 'Goods & Services (Purchase protection)'}\n"
        f"- Note / Memo: {redact_pii(p.note) if p.note else 'None'}\n"
        f"- Current Turn Number: {session.turns}\n"
        f"- Current Risk Score: {session.score} ({session.level})\n"
        f"- Current Active Signals: {', '.join(s.code for s in session.signals)}\n"
    )
    system_text += tx_summary + language_instruction(session.language)

    api_messages = [{"role": msg["role"], "content": msg["content"]} for msg in session.messages]
    client = get_anthropic_client()

    try:
        response = await client.messages.create(
            model=settings.anthropic_model,
            max_tokens=300,
            system=system_text,
            messages=api_messages,
            tools=[SESSION_TOOL_DEFINITION],
            tool_choice={"type": "tool", "name": "respond_session_turn"},
        )

        for block in response.content:
            if getattr(block, "type", None) == "tool_use" and block.name == "respond_session_turn":
                data = block.input
                raw_message = data.get("message", "Thanks for confirming. Let's make sure you're protected.")
                mood = data.get("mood", session.mood)
                score = int(data.get("score", session.score))
                score = max(0, min(100, score))
                level = compute_level(score)

                # Merge signals
                extracted_signals = data.get("signals", [])
                sig_map = {s.code: s for s in session.signals}
                for s in extracted_signals:
                    if isinstance(s, dict) and "code" in s and "label" in s:
                        code = s["code"]
                        sig_map[code] = RiskSignalPayload(
                            code=code,
                            label=s["label"],
                            detail=s.get("detail"),
                        )
                session.signals = list(sig_map.values())

                quick_replies = data.get("quick_replies")
                if quick_replies and not isinstance(quick_replies, list):
                    quick_replies = None

                # Provide fallback quick replies if LLM omitted them on follow-up turn
                if not quick_replies and not data.get("done", False):
                    quick_replies = ["Yes", "No", "I want to verify first"]

                recommended = data.get("recommended")
                if recommended not in ("continue", "protected", "cancel"):
                    recommended = None

                done = bool(data.get("done", False))

                # Respect User Agency & Intelligence:
                # If user confirms familiarity/trust (e.g. "my dad", "all good", "know him"),
                # ensure chill de-escalation, mood relieved/calm, recommended continue, done=True
                t_lower = sanitized_text.lower()
                familiar_cues = [
                    "my dad", "my mom", "my brother", "my sister", "my son", "my daughter",
                    "my roommate", "my friend", "my wife", "my husband", "i know him",
                    "i know her", "i know them", "all good", "its fine", "it's fine", "nah all good",
                ]
                if any(cue in t_lower for cue in familiar_cues):
                    score = min(score, 18)
                    level = "low"
                    mood = "relieved"
                    recommended = "continue"
                    done = True

                # If wrapped up (done) or max turns reached, ensure recommendation is populated
                if done or session.turns >= 4:
                    done = True
                    if not recommended:
                        recommended = "continue" if level == "low" else "protected"

                session.score = score
                session.level = level
                session.mood = mood
                session.messages.append({"role": "assistant", "content": raw_message})

                return AgentTurnPayload(
                    message=redact_pii(raw_message),
                    mood=mood,
                    risk=RiskPayload(
                        score=score,
                        level=level,
                        signals=session.signals,
                    ),
                    quick_replies=quick_replies if not done else None,
                    recommended=recommended,
                    done=done,
                )

        # Fallback if no tool use
        safe_reply = "Got it. You're in full control of this payment."
        session.messages.append({"role": "assistant", "content": safe_reply})
        return AgentTurnPayload(
            message=safe_reply,
            mood="calm",
            risk=RiskPayload(
                score=session.score,
                level=session.level,
                signals=session.signals,
            ),
            quick_replies=None,
            recommended="continue" if session.level == "low" else "protected",
            done=True,
        )

    except anthropic.APIError as exc:
        logger.error(f"Anthropic API Error processing session message: {exc}")
        raise HTTPException(
            status_code=502,
            detail=f"Anthropic API Error ({exc.__class__.__name__}): {str(exc)}",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Unexpected error processing session message: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Error in Jeff agent processing: {str(exc)}",
        )


def handle_session_decision(session_id: str, choice: ChoiceType, order_id: Optional[str] = None) -> DecisionResponse:
    """Handle the user's final payment decision (continue, protected, or cancel)."""
    session = sessions_store.get(session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="This session has expired. Please start again.",
        )

    if choice == "cancel":
        return DecisionResponse(
            status="cancelled",
            message="Nothing was sent.",
        )
    elif choice == "protected":
        oid = order_id or f"PROT-{uuid.uuid4().hex[:8].upper()}"
        return DecisionResponse(
            status="protected",
            message="The payment is now protected. The money is released when you confirm delivery.",
            order_id=oid,
        )
    else:  # continue
        return DecisionResponse(
            status="sent",
            message="Payment completed successfully.",
            order_id=order_id,
        )

