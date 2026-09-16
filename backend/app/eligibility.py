import json
from pathlib import Path
from typing import Any

DATA_PATH = Path(__file__).parent.parent / "data" / "schemes.json"


def load_schemes() -> list[dict[str, Any]]:
    with open(DATA_PATH, encoding="utf-8") as f:
        return json.load(f)


def _gender_matches(profile_gender: str, scheme_gender: str) -> bool:
    if scheme_gender == "all":
        return True
    if profile_gender == "other":
        return False
    return profile_gender == scheme_gender


def _list_or_all_matches(value: str, field: Any) -> bool:
    if field == "all":
        return True
    return value.lower() in [v.lower() for v in field]


def match_profile(profile: dict[str, Any], schemes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    results = []
    for scheme in schemes:
        elig = scheme["eligibility"]
        reasons: list[str] = []

        if elig["age_min"] is not None and profile["age"] < elig["age_min"]:
            continue
        if elig["age_max"] is not None and profile["age"] > elig["age_max"]:
            continue
        if elig["age_min"] is not None or elig["age_max"] is not None:
            lo = elig["age_min"] if elig["age_min"] is not None else 0
            hi = elig["age_max"] if elig["age_max"] is not None else 120
            reasons.append(f"Age {lo}-{hi}")

        if elig["income_max_annual"] is not None:
            if profile["annual_income"] > elig["income_max_annual"]:
                continue
            reasons.append(f"Annual income below ₹{elig['income_max_annual']:,}")

        if elig["states"] != "all" and profile["state"].lower() not in [s.lower() for s in elig["states"]]:
            continue
        if elig["states"] != "all":
            reasons.append(f"Available in {profile['state']}")

        if not _list_or_all_matches(profile["occupation"], elig["occupation"]):
            continue
        if elig["occupation"] != "all":
            reasons.append(f"Occupation: {profile['occupation']}")

        if not _list_or_all_matches(profile["social_category"], elig["social_category"]):
            continue
        if elig["social_category"] != "all":
            reasons.append(f"Social category: {profile['social_category']}")

        if not _gender_matches(profile["gender"], elig["gender"]):
            continue
        if elig["gender"] != "all":
            reasons.append(f"Gender: {elig['gender']}")

        if elig["disability_required"] and not profile.get("disability", False):
            continue
        if elig["disability_required"]:
            reasons.append("For persons with disabilities")

        if not reasons:
            reasons.append("Open to all citizens")

        results.append(
            {
                "scheme_id": scheme["id"],
                "name": scheme["name"],
                "category": scheme["category"],
                "why_matched": reasons,
                "documents_required": scheme["documents_required"],
                "benefits": scheme["benefits"],
                "official_url": scheme["official_url"],
            }
        )
    return results
