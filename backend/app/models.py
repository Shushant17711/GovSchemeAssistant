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


class MatchResponse(BaseModel):
    matches: list[MatchedScheme]


class ExplainRequest(BaseModel):
    scheme_id: str
    language: Language


class ExplainResponse(BaseModel):
    scheme_id: str
    language: Language
    explanation: Optional[str] = None
    error: Optional[str] = None
    fallback: Optional[dict] = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    scheme_id: str
    message: str
    language: Language
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    reply: Optional[str] = None
    error: Optional[str] = None


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
