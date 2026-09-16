from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.eligibility import load_schemes, match_profile
from app.llm import chat_answer, explain_scheme, init_llm
from app.models import (
    ChatRequest,
    ChatResponse,
    ExplainRequest,
    ExplainResponse,
    LanguageOption,
    LanguagesResponse,
    MatchResponse,
    ProfileRequest,
    SchemeSummary,
    SchemesListResponse,
)
from app.rag import build_index, semantic_search

load_dotenv()

SCHEMES: list[dict] = []
SCHEMES_BY_ID: dict[str, dict] = {}

LANGUAGES = [
    LanguageOption(code="en", label="English"),
    LanguageOption(code="hi", label="हिन्दी (Hindi)"),
    LanguageOption(code="bn", label="বাংলা (Bengali)"),
    LanguageOption(code="ta", label="தமிழ் (Tamil)"),
    LanguageOption(code="te", label="తెలుగు (Telugu)"),
    LanguageOption(code="mr", label="मराठी (Marathi)"),
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    global SCHEMES, SCHEMES_BY_ID
    SCHEMES = load_schemes()
    SCHEMES_BY_ID = {s["id"]: s for s in SCHEMES}
    build_index(SCHEMES)
    init_llm()
    yield


app = FastAPI(title="Government Scheme Assistant API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/match", response_model=MatchResponse)
def match(profile: ProfileRequest):
    matches = match_profile(profile.model_dump(), SCHEMES)
    return MatchResponse(matches=matches)


@app.post("/api/explain", response_model=ExplainResponse)
def explain(req: ExplainRequest):
    scheme = SCHEMES_BY_ID.get(req.scheme_id)
    if scheme is None:
        return ExplainResponse(scheme_id=req.scheme_id, language=req.language, error="Scheme not found")
    try:
        text = explain_scheme(scheme, req.language)
        return ExplainResponse(scheme_id=req.scheme_id, language=req.language, explanation=text)
    except Exception as e:
        return ExplainResponse(
            scheme_id=req.scheme_id,
            language=req.language,
            error=f"AI explanation is temporarily unavailable ({e}).",
            fallback=scheme,
        )


@app.post("/api/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    scheme = SCHEMES_BY_ID.get(req.scheme_id)
    if scheme is None:
        return ChatResponse(error="Scheme not found")
    try:
        history = [h.model_dump() for h in req.history]
        reply = chat_answer(scheme, req.message, req.language, history)
        return ChatResponse(reply=reply)
    except Exception as e:
        return ChatResponse(error=f"AI chat is temporarily unavailable ({e}).")


@app.get("/api/schemes", response_model=SchemesListResponse)
def list_schemes(q: str | None = None, category: str | None = None):
    pool = SCHEMES
    if q:
        semantic_matches = semantic_search(q, top_k=15)
        matched_ids = {scheme_id for scheme_id, _score in semantic_matches}
        substring_matched = {
            s["id"] for s in SCHEMES if q.lower() in s["name"].lower() or q.lower() in s["description"].lower()
        }
        keep_ids = matched_ids | substring_matched
        pool = [s for s in pool if s["id"] in keep_ids]
    if category:
        pool = [s for s in pool if s["category"].lower() == category.lower()]
    return SchemesListResponse(
        schemes=[
            SchemeSummary(
                scheme_id=s["id"],
                name=s["name"],
                category=s["category"],
                description=s["description"],
                ministry=s["ministry"],
            )
            for s in pool
        ]
    )


@app.get("/api/languages", response_model=LanguagesResponse)
def languages():
    return LanguagesResponse(languages=LANGUAGES)
