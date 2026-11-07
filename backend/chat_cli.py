#!/usr/bin/env python3
"""Interactive CLI tool to chat directly with Jeff in your terminal."""

import json
import sys
from pathlib import Path
import httpx

# Ensure paths are configured
_backend_dir = Path(__file__).resolve().parent
if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

EMOTION_ICONS = {
    "neutral": "🙂",
    "thinking": "🤔",
    "concerned": "😟 ⚠️",
}


def main():
    api_url = "http://localhost:8000/api/chat"
    health_url = "http://localhost:8000/health"

    print("=" * 65)
    print("  🛡️  JEFF - PayPal Anti-Scam Conversational Guardian (CLI) 🛡️")
    print("      'When the scammers attack, Jeff has your back.'")
    print("=" * 65)

    # Check if server is running
    try:
        res = httpx.get(health_url, timeout=2.0)
        data = res.json()
        print(f" Connected to Jeff API: {data.get('status')} | Model: {data.get('model')}")
    except Exception:
        print("\n [!] Backend server does not appear to be running on http://localhost:8000.")
        print("     Please start it in another terminal with:  python3 backend/app/main.py\n")
        return

    # Prompt user for optional transaction context
    print("\n--- [Active Transaction Setup] ---")
    recipient = input("Recipient username/email (default: unknown_user@gmail.com): ").strip()
    if not recipient:
        recipient = "unknown_user@gmail.com"

    amount_input = input("Amount $ (default: 450): ").strip()
    amount = float(amount_input) if amount_input else 450.0

    memo = input("Payment note/memo (default: URGENT MEDICAL EMERGENCY - PLEASE SEND FAST): ").strip()
    if not memo:
        memo = "URGENT MEDICAL EMERGENCY - PLEASE SEND FAST"

    transaction_ctx = {
        "recipient": recipient,
        "amount": amount,
        "currency": "USD",
        "memo": memo,
    }

    print("\n" + "-" * 65)
    print(f" Transaction Draft: ${amount:.2f} USD to {recipient}")
    print(f" Note: \"{memo}\"")
    print("-" * 65)

    history = []

    # Proactive Risk Check: If risk is at least high, Jeff immediately alerts without user message!
    try:
        init_resp = httpx.post(
            api_url,
            json={"message": "", "history": [], "transaction": transaction_ctx},
            timeout=30.0,
        )
        if init_resp.status_code == 200:
            init_data = init_resp.json()
            init_reply = init_data.get("reply", "")
            init_emotion = init_data.get("emotion", "neutral")
            init_risk = init_data.get("risk_level", "low")

            if init_risk == "high" or init_emotion == "concerned":
                icon = EMOTION_ICONS.get(init_emotion, "🙂")
                print(f"\nJeff [{icon} {init_emotion.upper()} | Risk: {init_risk.upper()}]:")
                print(f"  \"{init_reply}\"")
                history.append({"role": "assistant", "content": init_reply})
    except Exception:
        pass

    print("\nType your message to Jeff below (or 'exit' to quit).\n")

    while True:
        try:
            user_msg = input("\nYou: ").strip()
            if not user_msg:
                continue
            if user_msg.lower() in ("exit", "quit", "q"):
                print("\nExiting Jeff chat. Stay safe!\n")
                break

            payload = {
                "message": user_msg,
                "history": history,
                "transaction": transaction_ctx,
            }

            print(" [Jeff is thinking...] ", end="\r", flush=True)

            resp = httpx.post(api_url, json=payload, timeout=30.0)

            if resp.status_code != 200:
                print(f"\n[Error {resp.status_code}]: {resp.text}")
                continue

            data = resp.json()
            reply = data.get("reply", "")
            emotion = data.get("emotion", "neutral")
            risk_level = data.get("risk_level", "low")

            icon = EMOTION_ICONS.get(emotion, "🙂")

            print(" " * 30, end="\r")  # Clear thinking text
            print(f"\nJeff [{icon} {emotion.upper()} | Risk: {risk_level.upper()}]:")
            print(f"  \"{reply}\"")

            # Update history
            history.append({"role": "user", "content": user_msg})
            history.append({"role": "assistant", "content": reply})

        except KeyboardInterrupt:
            print("\nExiting Jeff chat. Stay safe!\n")
            break
        except Exception as e:
            print(f"\n[Error communicating with server]: {e}")


if __name__ == "__main__":
    main()
