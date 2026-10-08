import re
from typing import Any

from app.llm import classify_scam_claim
from app.rag import semantic_search

DISCLAIMER = (
    "This is an automated risk assessment, not a legal determination. "
    "If you suspect fraud, report it to the National Cyber Crime Reporting Portal "
    "(cybercrime.gov.in) or call the helpline 1930."
)

PAYMENT_PATTERNS = [
    r"processing fee",
    r"registration fee",
    r"pay\s*(rs\.?|₹|inr)",
    r"deposit.*(to receive|before)",
]

CREDENTIAL_PATTERNS = [
    r"\botp\b",
    r"\bpin\b",
    r"\bcvv\b",
    r"share your aadhaar",
    r"bank (password|pin)",
]

URGENCY_PATTERNS = [
    r"act now",
    r"within 24 hours",
    r"will be cancelled",
    r"limited time",
    r"urgent",
    r"before it expires",
    r"expires (today|soon)",
]

LINK_PATTERNS = [
    r"bit\.ly",
    r"tinyurl",
    r"https?://(?!.*\.gov\.in)[a-z0-9.-]+\.(tk|xyz|top|club)\b",
    r"https?://(?!.*\.gov\.in)[a-z0-9.-]+-(verify|claim|update|kyc)\.[a-z.]+",
]

# Generic "you've won something, act on it" social-engineering phrasing. Weaker
# signal than payment/credential requests, so these only ever raise to "medium" —
# real deterministic proof of fraud (a benefit claim that contradicts the actual
# scheme) is handled separately in check_message() via the LLM cross-reference.
LOTTERY_PATTERNS = [
    r"congratulations.{0,30}(selected|winner|won)",
    r"you (have been|are) selected",
    r"claim your (reward|prize|amount|cash)",
    r"verify your (bank|account) (details|number)",
]


def _any_match(patterns: list[str], text: str) -> bool:
    return any(re.search(p, text, re.IGNORECASE) for p in patterns)


def detect_red_flags(message: str) -> tuple[list[str], bool, bool]:
    """Returns (reasons, high_flag, medium_flag)."""
    reasons: list[str] = []
    high = False
    medium = False

    if _any_match(PAYMENT_PATTERNS, message):
        reasons.append("Asks you to pay a fee — real government schemes never charge a fee to receive a benefit.")
        high = True
    if _any_match(CREDENTIAL_PATTERNS, message):
        reasons.append("Asks for an OTP, PIN, or bank credentials — no legitimate scheme communication ever asks for these.")
        high = True
    if _any_match(URGENCY_PATTERNS, message):
        reasons.append("Uses urgency/pressure language, a common scam tactic.")
        medium = True
    if _any_match(LINK_PATTERNS, message):
        reasons.append("Contains a shortened or suspicious-looking link instead of an official .gov.in domain.")
        medium = True
    if _any_match(LOTTERY_PATTERNS, message):
        reasons.append("Uses \"you've been selected / claim your reward\" phrasing typical of scam messages.")
        medium = True

    return reasons, high, medium


def check_message(message: str, language: str, schemes_by_id: dict[str, dict[str, Any]]) -> dict[str, Any]:
    reasons, high, medium = detect_red_flags(message)

    matched_scheme = None
    try:
        results = semantic_search(message, top_k=1, min_score=0.4)
        if results:
            scheme_id, _score = results[0]
            scheme = schemes_by_id.get(scheme_id)
            if scheme:
                classification = classify_scam_claim(message, scheme, language)
                if classification and classification.get("matches_official_benefit") is False:
                    note = classification.get("note")
                    if note:
                        reasons.append(note)
                    # A message that misstates a real scheme's actual benefit is direct,
                    # factual proof of fraud — at least as strong a signal as any regex
                    # match, so it must be able to raise the verdict, not just add a
                    # footnote nobody sees reflected in the risk level.
                    high = True
                matched_scheme = {
                    "scheme_id": scheme_id,
                    "name": scheme["name"],
                    "real_benefit": scheme["benefits"],
                }
    except Exception:
        pass

    # This line intentionally comes after the LLM cross-reference above, so a
    # caught benefit mismatch can still elevate the verdict to "high".
    risk_level = "high" if high else ("medium" if medium else "low")

    if not reasons:
        reasons.append("No obvious red flags detected in the message text.")

    return {
        "risk_level": risk_level,
        "reasons": reasons,
        "matched_scheme": matched_scheme,
        "disclaimer": DISCLAIMER,
    }
