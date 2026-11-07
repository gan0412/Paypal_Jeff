import re
from typing import Tuple

# Patterns for sensitive Personally Identifiable Information (PII)
CARD_PATTERN = re.compile(
    r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b"
)
SSN_PATTERN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
OTP_PATTERN = re.compile(
    r"\b(?:otp|passcode|verification code|pin|2fa code)[\s:=#]*([0-9]{4,8})\b",
    re.IGNORECASE,
)
PASSWORD_PATTERN = re.compile(
    r"\b(?:password|passwd|pwd)[\s:=#]+([^\s,;]+)",
    re.IGNORECASE,
)

# Policy leakage / probe keywords (scammers probing internal heuristic thresholds)
POLICY_PROBE_PATTERNS = [
    re.compile(
        r"internal(?:\s+(?:fraud|detection|heuristic|risk|telemetry|scoring))+[\s\w]*(?:algorithm|rules?|thresholds?|logic|models?|parameters?)",
        re.IGNORECASE,
    ),
    re.compile(
        r"(?:what\s+is|reveal|explain|show)\s+(?:your|the)\s+(?:internal\s+)?(?:backend\s+score|risk\s+threshold|scoring\s+algorithm|detection\s+criteria)",
        re.IGNORECASE,
    ),
    re.compile(
        r"typing\s+(?:cadence|speed|latency|ms)\s+(?:threshold|rules?|score)",
        re.IGNORECASE,
    ),
]


def redact_pii(text: str) -> str:
    """Scrub sensitive PII from incoming and outgoing text.

    Replaces credit cards, SSNs, OTP codes, and plaintext passwords with redaction tokens.
    """
    if not text:
        return text

    redacted = CARD_PATTERN.sub("[CARD_REDACTED]", text)
    redacted = SSN_PATTERN.sub("[SSN_REDACTED]", redacted)

    def _replace_otp(m: re.Match) -> str:
        prefix = m.group(0).split(m.group(1))[0]
        return f"{prefix}[OTP_REDACTED]"

    redacted = OTP_PATTERN.sub(_replace_otp, redacted)

    def _replace_pwd(m: re.Match) -> str:
        prefix = m.group(0).split(m.group(1))[0]
        return f"{prefix}[PASSWORD_REDACTED]"

    redacted = PASSWORD_PATTERN.sub(_replace_pwd, redacted)
    return redacted


def check_policy_probe(text: str) -> Tuple[bool, str]:
    """Check if the text is explicitly probing for internal fraud detection thresholds.

    Returns:
        (is_probe: bool, safe_message: str)
    """
    if not text:
        return False, ""

    for pattern in POLICY_PROBE_PATTERNS:
        if pattern.search(text):
            return (
                True,
                "I focus on helping you spot universal social engineering red flags—like manufactured urgency, secrecy, or pressure to pay unknown accounts—rather than discussing proprietary backend detection criteria. Let's look at the situation together.",
            )
    return False, ""
