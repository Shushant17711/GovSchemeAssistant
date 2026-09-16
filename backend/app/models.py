from typing import Literal, Optional

from pydantic import BaseModel

Language = Literal["en", "hi", "bn", "ta", "te", "mr"]
Gender = Literal["male", "female", "other"]


class ProfileRequest(BaseModel):
    age: int
    annual_income: int
    state: str
    occupation: str
    social_category: str
    gender: Gender
    disability: bool = False


class MatchedScheme(BaseModel):
    scheme_id: str
    name: str
    category: str
    why_matched: list[str]
    documents_required: list[str]
    benefits: str
    official_url: str
    benefit_amount: Optional[float] = None
    benefit_frequency: Optional[str] = None


class NearMissScheme(BaseModel):
    scheme_id: str
    name: str
    category: str
    blocking_reason: str
    official_url: str


class MatchResponse(BaseModel):
    matches: list[MatchedScheme]
    near_misses: list[NearMissScheme]


class ExplainRequest(BaseModel):
    scheme_id: str
    language: Language
    llm_base_url: Optional[str] = None
    llm_model: Optional[str] = None


class ExplainResponse(BaseModel):
    scheme_id: str
    language: Language
    explanation: Optional[str] = None
    error: Optional[str] = None
    fallback: Optional[dict] = None
    llm_settings_ignored: Optional[bool] = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    scheme_id: str
    message: str
    language: Language
    history: list[ChatMessage] = []
    llm_base_url: Optional[str] = None
    llm_model: Optional[str] = None


class ChatResponse(BaseModel):
    reply: Optional[str] = None
    error: Optional[str] = None
    llm_settings_ignored: Optional[bool] = None


class SchemeSummary(BaseModel):
    scheme_id: str
    name: str
    category: str
    description: str
    ministry: str


class SchemesListResponse(BaseModel):
    schemes: list[SchemeSummary]


class LanguageOption(BaseModel):
    code: Language
    label: str


class LanguagesResponse(BaseModel):
    languages: list[LanguageOption]


class ScamCheckRequest(BaseModel):
    message: str
    language: Language


class ScamMatchedScheme(BaseModel):
    scheme_id: str
    name: str
    real_benefit: str


class ScamCheckResponse(BaseModel):
    risk_level: Literal["low", "medium", "high"]
    reasons: list[str]
    matched_scheme: Optional[ScamMatchedScheme] = None
    disclaimer: str
