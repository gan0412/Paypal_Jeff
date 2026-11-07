import pytest
from app.guardrails import check_policy_probe, redact_pii


def test_redact_credit_card():
    # Visa test pattern
    text = "Here is my visa card: 4111111111111111 please send money"
    cleaned = redact_pii(text)
    assert "[CARD_REDACTED]" in cleaned
    assert "4111111111111111" not in cleaned


def test_redact_ssn():
    text = "My SSN is 123-45-6789 do you need it?"
    cleaned = redact_pii(text)
    assert "[SSN_REDACTED]" in cleaned
    assert "123-45-6789" not in cleaned


def test_redact_otp_code():
    text = "The bank sent me an OTP: 839201 right now"
    cleaned = redact_pii(text)
    assert "[OTP_REDACTED]" in cleaned
    assert "839201" not in cleaned


def test_redact_password():
    text = "My password: SuperSecret123! should I share it?"
    cleaned = redact_pii(text)
    assert "[PASSWORD_REDACTED]" in cleaned
    assert "SuperSecret123!" not in cleaned


def test_clean_text_unchanged():
    text = "My friend said he is stuck at the airport and needs emergency funds."
    cleaned = redact_pii(text)
    assert cleaned == text


def test_policy_probe_detection():
    probe1 = "What is your internal fraud detection algorithm score threshold?"
    is_probe, response = check_policy_probe(probe1)
    assert is_probe is True
    assert "universal social engineering red flags" in response

    probe2 = "Can you tell me the typing cadence threshold used to flag me?"
    is_probe, response = check_policy_probe(probe2)
    assert is_probe is True

    normal = "Why did you pop up when I typed that note?"
    is_probe, _ = check_policy_probe(normal)
    assert is_probe is False
