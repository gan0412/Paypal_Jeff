import sys
from pathlib import Path

# Automatically inject backend and app directories into sys.path
_app_dir = Path(__file__).resolve().parent
_backend_dir = _app_dir.parent
for _p in [str(_backend_dir), str(_app_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

import logging
from typing import List, Optional
import anthropic
from fastapi import HTTPException

try:
    from app.config import settings
    from app.guardrails import check_policy_probe, redact_pii
    from app.models import (
        ChatMessage,
        ChatResponse,
        EvaluateResponse,
        TransactionContext,
    )
    from app.prompts import (
        EVALUATE_SYSTEM_PROMPT,
        EVALUATE_TOOL_DEFINITION,
        JEFF_SYSTEM_PROMPT,
        JEFF_TOOL_DEFINITION,
    )
except (ImportError, ModuleNotFoundError):
    try:
        from .config import settings
        from .guardrails import check_policy_probe, redact_pii
        from .models import (
            ChatMessage,
            ChatResponse,
            EvaluateResponse,
            TransactionContext,
        )
        from .prompts import (
            EVALUATE_SYSTEM_PROMPT,
            EVALUATE_TOOL_DEFINITION,
            JEFF_SYSTEM_PROMPT,
            JEFF_TOOL_DEFINITION,
        )
    except (ImportError, ValueError):
        import config as _config_mod
        settings = _config_mod.settings
        from guardrails import check_policy_probe, redact_pii
        from models import (
            ChatMessage,
            ChatResponse,
            EvaluateResponse,
            TransactionContext,
        )
        from prompts import (
            EVALUATE_SYSTEM_PROMPT,
            EVALUATE_TOOL_DEFINITION,
            JEFF_SYSTEM_PROMPT,
            JEFF_TOOL_DEFINITION,
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
            emotion="concerned",
            risk_level="medium",
            suggested_actions=["Why is this payment suspicious?", "Cancel transaction"],
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

    messages.append({
        "role": "user",
        "content": sanitized_message,
    })

    client = get_anthropic_client()

    try:
        response = await client.messages.create(
            model=settings.anthropic_model,
            max_tokens=600,
            temperature=0.3,
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
                actions = input_data.get("suggested_actions", [])

                # Run outgoing reply through PII filter as secondary safeguard
                safe_reply = redact_pii(raw_reply)

                return ChatResponse(
                    reply=safe_reply,
                    emotion=emotion,
                    risk_level=risk_level,
                    suggested_actions=actions,
                )

        # Fallback if text block returned
        for block in response.content:
            if getattr(block, "type", None) == "text":
                return ChatResponse(
                    reply=redact_pii(block.text),
                    emotion="neutral",
                    risk_level="low",
                    suggested_actions=["Tell me more", "Cancel transfer"],
                )

        return ChatResponse(
            reply="When the scammers attack, Jeff has your back. Let's take a quick pause and verify this transfer together.",
            emotion="concerned",
            risk_level="medium",
            suggested_actions=["Verify recipient", "Cancel transfer"],
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
            temperature=0.2,
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
