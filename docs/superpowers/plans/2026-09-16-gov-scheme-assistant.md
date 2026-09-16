# AI Multilingual Government Scheme Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working citizen-facing web app that matches a user profile against a curated database of ~40-50 real Indian central government schemes, explains matches in plain language in 6 languages via an LLM, supports grounded follow-up chat per scheme, and lets users browse/search all schemes.

**Architecture:** FastAPI backend (deterministic rule-based matching + sentence-transformers/FAISS semantic search + Groq LLM for explanation/chat) serving a React+Vite+TailwindCSS single-page frontend. No database, no auth — dataset loaded from a JSON file at startup, everything else in-memory.

**Tech Stack:** Python 3.11+, FastAPI, uvicorn, sentence-transformers, faiss-cpu, groq/openai SDK (OpenAI-compatible client), Pydantic. React 18, Vite, TypeScript, TailwindCSS, React Router, lucide-react.

**Note on testing:** Per the spec's explicit non-goal, this build has no automated test suite — verification is manual/functional at each step (run the server, hit the endpoint, check the response; run the dev server, click through the UI). Each task below states exactly what to run and what to expect instead of a pytest step.

Reference spec: `docs/superpowers/specs/2026-09-16-gov-scheme-assistant-design.md`

---

## Part A — Backend

### Task 1: Backend scaffold

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env.example`
- Create: `backend/.gitignore`
- Create: `backend/app/__init__.py`

- [ ] **Step 1: Create the directory structure and requirements file**

`backend/requirements.txt`:
```
fastapi==0.115.6
uvicorn[standard]==0.34.0
pydantic==2.10.4
python-dotenv==1.0.1
sentence-transformers==3.3.1
faiss-cpu==1.9.0.post1
openai==1.59.6
numpy<2
```

- [ ] **Step 2: Create `.env.example`**

```
GROQ_API_KEY=your_groq_api_key_here
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=llama-3.3-70b-versatile
PORT=8000
```

- [ ] **Step 3: Create `backend/.gitignore`**

```
.venv/
__pycache__/
*.pyc
.env
```

- [ ] **Step 4: Create empty `backend/app/__init__.py`**

- [ ] **Step 5: Create and activate a venv, install deps**

Run:
```bash
cd /home/shushant/Projects/GovSchemeAssistant/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```
Expected: all packages install without error (sentence-transformers/faiss install can take a few minutes).

- [ ] **Step 6: Commit**

```bash
cd /home/shushant/Projects/GovSchemeAssistant
git add backend/requirements.txt backend/.env.example backend/.gitignore backend/app/__init__.py
git commit -m "chore: scaffold backend project"
```

---

### Task 2: Curated scheme dataset

**Files:**
- Create: `backend/data/schemes.json`

- [ ] **Step 1: Write `backend/data/schemes.json`**

An array of scheme objects. Each object has exactly these fields (matching the spec's data model):
```json
{
  "id": "pm-kisan",
  "name": "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
  "category": "Agriculture",
  "ministry": "Ministry of Agriculture and Farmers Welfare",
  "description": "Provides income support of ₹6,000 per year, paid in three installments, directly to the bank accounts of eligible farmer families.",
  "eligibility": {
    "age_min": null,
    "age_max": null,
    "income_max_annual": null,
    "states": "all",
    "occupation": ["farmer"],
    "social_category": "all",
    "gender": "all",
    "disability_required": false
  },
  "benefits": "₹6,000/year in three equal installments of ₹2,000 directly to bank account (DBT).",
  "documents_required": ["Aadhaar card", "Land ownership records", "Bank account passbook", "Recent passport-size photo"],
  "official_url": "https://pmkisan.gov.in/",
  "how_to_apply": "Apply online at pmkisan.gov.in, or through Common Service Centres (CSC), or at the local revenue/agriculture office."
}
```

Write **40-50** real, well-known central government schemes covering these categories (aim for at least 3-5 per category): Agriculture, Health, Housing, Education/Scholarships, Employment & Livelihood, Women & Child Development, Senior Citizens/Pension, Disability, MSME/Business, Financial Inclusion/Insurance, Food Security, Skill Development/Digital.

Use `age_min`/`age_max`/`income_max_annual` as `null` when the scheme has no such restriction. Use `"all"` for `states`, `occupation`, or `social_category` when unrestricted (occupation as `"all"` string, not a list, when unrestricted — array otherwise). `gender` is one of `"all"`/`"male"`/`"female"` only (never `"other"` — that's a profile-side value, not a scheme constraint per the spec's gender rule).

Suggested schemes to include (research real details for each — approximate numeric thresholds are acceptable per spec but must be plausible, and every entry must carry a real, correct `official_url`):
PM-KISAN, PM Fasal Bima Yojana, Kisan Credit Card, Ayushman Bharat (PM-JAY), Janani Suraksha Yojana, PM Matru Vandana Yojana, PM Awas Yojana (Gramin), PM Awas Yojana (Urban), National Scholarship Portal (Post-Matric Scholarship for SC/ST/OBC), National Means-cum-Merit Scholarship, Beti Bachao Beti Padhao, Sukanya Samriddhi Yojana, MGNREGA, PM Kaushal Vikas Yojana, Deen Dayal Upadhyaya Grameen Kaushalya Yojana, Stand-Up India, PM Mudra Yojana, PM Employment Generation Programme (PMEGP), PM SVANidhi, PM Vishwakarma, e-Shram, Atal Pension Yojana, PM Shram Yogi Maandhan, PM Vaya Vandana Yojana, National Social Assistance Programme (Indira Gandhi National Old Age Pension), National Family Benefit Scheme, PM Jan Dhan Yojana, PM Jeevan Jyoti Bima Yojana, PM Suraksha Bima Yojana, PM Ujjwala Yojana, Saubhagya (electricity connections), Jal Jeevan Mission, Swachh Bharat Mission (household toilets), National Food Security Act / Antyodaya Anna Yojana, ADIP Scheme (aids for persons with disabilities), Divyangjan Scholarship, Startup India Seed Fund, Credit Guarantee Fund Scheme for Micro and Small Enterprises, PM-DAKSH, PM Gramin Digital Saksharta Abhiyan, National Pension System (NPS), One Student One Laptop / ICT schemes where applicable, Rashtriya Vayoshri Yojana, Pradhan Mantri Van Dhan Yojana.

Not all of the above need to be included — pick the ~40-50 most well-known and well-documented ones so the eligibility data is accurate.

- [ ] **Step 2: Verify the JSON is valid and has the right shape**

Run:
```bash
cd /home/shushant/Projects/GovSchemeAssistant
python3 -c "
import json
data = json.load(open('backend/data/schemes.json'))
assert isinstance(data, list)
assert 40 <= len(data) <= 60, len(data)
required = {'id','name','category','ministry','description','eligibility','benefits','documents_required','official_url','how_to_apply'}
for s in data:
    assert required.issubset(s.keys()), s.get('id')
    assert s['id'] == s['id'].lower().replace(' ', '-') or '-' in s['id']
ids = [s['id'] for s in data]
assert len(ids) == len(set(ids)), 'duplicate ids'
print(f'OK: {len(data)} schemes, all ids unique, all required fields present')
"
```
Expected: `OK: N schemes, all ids unique, all required fields present`

- [ ] **Step 3: Commit**

```bash
cd /home/shushant/Projects/GovSchemeAssistant
git add backend/data/schemes.json
git commit -m "feat: add curated government scheme dataset"
```

---

### Task 3: Pydantic models

**Files:**
- Create: `backend/app/models.py`

- [ ] **Step 1: Write `backend/app/models.py`**

```python
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
```

- [ ] **Step 2: Verify it imports cleanly**

Run:
```bash
cd /home/shushant/Projects/GovSchemeAssistant/backend
source .venv/bin/activate
python -c "from app.models import ProfileRequest, MatchResponse, ExplainRequest, ChatRequest, SchemesListResponse, LanguagesResponse; print('OK')"
```
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd /home/shushant/Projects/GovSchemeAssistant
git add backend/app/models.py
git commit -m "feat: add Pydantic request/response models"
```

---

### Task 4: Eligibility rule engine

**Files:**
- Create: `backend/app/eligibility.py`

- [ ] **Step 1: Write `backend/app/eligibility.py`**

```python
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
```

- [ ] **Step 2: Manually verify the rule engine against the real dataset**

Run:
```bash
cd /home/shushant/Projects/GovSchemeAssistant/backend
source .venv/bin/activate
python -c "
from app.eligibility import load_schemes, match_profile
schemes = load_schemes()
profile = {'age': 45, 'annual_income': 80000, 'state': 'Bihar', 'occupation': 'farmer', 'social_category': 'OBC', 'gender': 'male', 'disability': False}
matches = match_profile(profile, schemes)
print(f'{len(matches)} matches for a 45yo farmer in Bihar, OBC, income 80000')
for m in matches[:5]:
    print('-', m['name'], m['why_matched'])
assert len(matches) > 0, 'expected at least one match for a common profile'
"
```
Expected: prints a nonzero count and a handful of scheme names with reasons (e.g. PM-KISAN, MGNREGA, Kisan Credit Card should plausibly appear for a farmer profile).

- [ ] **Step 3: Verify gender exclusion rule works**

Run:
```bash
cd /home/shushant/Projects/GovSchemeAssistant/backend
source .venv/bin/activate
python -c "
from app.eligibility import load_schemes, match_profile
schemes = load_schemes()
p_other = {'age': 25, 'annual_income': 50000, 'state': 'Kerala', 'occupation': 'unemployed', 'social_category': 'General', 'gender': 'other', 'disability': False}
p_female = {**p_other, 'gender': 'female'}
matches_other = {m['scheme_id'] for m in match_profile(p_other, schemes)}
matches_female = {m['scheme_id'] for m in match_profile(p_female, schemes)}
female_only = matches_female - matches_other
print('Schemes matched for female but not other (should be female-specific schemes):', female_only)
"
```
Expected: any schemes in the difference should be genuinely female-specific (e.g. maternity-related schemes) — sanity-check the printed names by eye.

- [ ] **Step 4: Commit**

```bash
cd /home/shushant/Projects/GovSchemeAssistant
git add backend/app/eligibility.py
git commit -m "feat: add deterministic eligibility rule engine"
```

---

### Task 5: RAG semantic search (FAISS)

**Files:**
- Create: `backend/app/rag.py`

- [ ] **Step 1: Write `backend/app/rag.py`**

```python
from typing import Any

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None
_index: faiss.IndexFlatIP | None = None
_scheme_ids: list[str] = []
_schemes_by_id: dict[str, dict[str, Any]] = {}


def _scheme_text(scheme: dict[str, Any]) -> str:
    parts = [
        scheme["name"],
        scheme["category"],
        scheme["description"],
        scheme["benefits"],
    ]
    return " | ".join(parts)


def build_index(schemes: list[dict[str, Any]]) -> None:
    global _model, _index, _scheme_ids, _schemes_by_id
    _model = SentenceTransformer("all-MiniLM-L6-v2")
    _schemes_by_id = {s["id"]: s for s in schemes}
    _scheme_ids = [s["id"] for s in schemes]
    texts = [_scheme_text(s) for s in schemes]
    embeddings = _model.encode(texts, normalize_embeddings=True)
    dim = embeddings.shape[1]
    _index = faiss.IndexFlatIP(dim)
    _index.add(np.array(embeddings, dtype="float32"))


def semantic_search(query: str, top_k: int = 10) -> list[str]:
    if _model is None or _index is None:
        raise RuntimeError("RAG index not built — call build_index() at startup")
    query_vec = _model.encode([query], normalize_embeddings=True)
    scores, indices = _index.search(np.array(query_vec, dtype="float32"), top_k)
    return [_scheme_ids[i] for i in indices[0] if i != -1]
```

- [ ] **Step 2: Manually verify semantic search returns sensible results**

Run:
```bash
cd /home/shushant/Projects/GovSchemeAssistant/backend
source .venv/bin/activate
python -c "
from app.eligibility import load_schemes
from app.rag import build_index, semantic_search
schemes = load_schemes()
build_index(schemes)
by_id = {s['id']: s['name'] for s in schemes}
for q in ['help for farmers whose crops failed', 'money for a small business loan', 'health insurance for poor families']:
    ids = semantic_search(q, top_k=3)
    print(q, '->', [by_id[i] for i in ids])
"
```
Expected: each query's top results are topically relevant (e.g. the crop-failure query surfaces PM Fasal Bima Yojana; the business-loan query surfaces PM Mudra Yojana / Stand-Up India / PMEGP; the health-insurance query surfaces Ayushman Bharat). This takes ~10-30s on first run while the model downloads.

- [ ] **Step 3: Commit**

```bash
cd /home/shushant/Projects/GovSchemeAssistant
git add backend/app/rag.py
git commit -m "feat: add FAISS semantic search over scheme catalog"
```

---

### Task 6: LLM client (Groq)

**Files:**
- Create: `backend/app/llm.py`

- [ ] **Step 1: Write `backend/app/llm.py`**

```python
import os

from openai import OpenAI

_client: OpenAI | None = None
_model_name: str = "llama-3.3-70b-versatile"

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
}


def init_llm() -> None:
    global _client, _model_name
    api_key = os.environ.get("GROQ_API_KEY")
    base_url = os.environ.get("LLM_BASE_URL", "https://api.groq.com/openai/v1")
    _model_name = os.environ.get("LLM_MODEL", "llama-3.3-70b-versatile")
    if not api_key:
        print("WARNING: GROQ_API_KEY not set — AI explanation/chat features will be unavailable.")
        _client = None
        return
    _client = OpenAI(api_key=api_key, base_url=base_url)


def is_available() -> bool:
    return _client is not None


def explain_scheme(scheme: dict, language: str) -> str:
    if _client is None:
        raise RuntimeError("LLM client not initialized")
    lang_name = LANGUAGE_NAMES.get(language, "English")
    prompt = f"""You are explaining an Indian government scheme to a citizen who may not be familiar with government terminology.

Scheme name: {scheme['name']}
Category: {scheme['category']}
Description: {scheme['description']}
Benefits: {scheme['benefits']}
Documents required: {', '.join(scheme['documents_required'])}
How to apply: {scheme['how_to_apply']}

Write a short, simple, friendly explanation (4-6 sentences) of what this scheme is, who it helps, and what benefit they get. Avoid jargon. Respond ONLY in {lang_name}."""

    response = _client.chat.completions.create(
        model=_model_name,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=500,
    )
    return response.choices[0].message.content.strip()


def chat_answer(scheme: dict, message: str, language: str, history: list[dict]) -> str:
    if _client is None:
        raise RuntimeError("LLM client not initialized")
    lang_name = LANGUAGE_NAMES.get(language, "English")
    system_prompt = f"""You are a helpful assistant answering citizen questions about ONE specific Indian government scheme. Only use the information given below — do not invent eligibility rules, amounts, or documents not listed here. If asked something you cannot answer from this data, say so and suggest checking the official portal.

Scheme data:
Name: {scheme['name']}
Category: {scheme['category']}
Description: {scheme['description']}
Eligibility: {scheme['eligibility']}
Benefits: {scheme['benefits']}
Documents required: {', '.join(scheme['documents_required'])}
How to apply: {scheme['how_to_apply']}
Official URL: {scheme['official_url']}

Respond ONLY in {lang_name}. Keep answers concise (2-4 sentences) unless asked for more detail."""

    messages = [{"role": "system", "content": system_prompt}]
    for h in history:
        messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})

    response = _client.chat.completions.create(
        model=_model_name,
        messages=messages,
        temperature=0.3,
        max_tokens=500,
    )
    return response.choices[0].message.content.strip()
```

- [ ] **Step 2: Manually verify against the real Groq API**

Get a free API key at https://console.groq.com/keys, then run:
```bash
cd /home/shushant/Projects/GovSchemeAssistant/backend
source .venv/bin/activate
export GROQ_API_KEY=your_key_here
python -c "
from app.eligibility import load_schemes
from app.llm import init_llm, explain_scheme
init_llm()
schemes = {s['id']: s for s in load_schemes()}
scheme = schemes['pm-kisan']
print(explain_scheme(scheme, 'en'))
print('---')
print(explain_scheme(scheme, 'hi'))
"
```
Expected: two short, simple explanations of PM-KISAN, the second one in Hindi script. If `GROQ_API_KEY` is not set, `init_llm()` should print the warning and `explain_scheme` should raise — verify that too by running without the export.

- [ ] **Step 3: Commit**

```bash
cd /home/shushant/Projects/GovSchemeAssistant
git add backend/app/llm.py
git commit -m "feat: add Groq LLM client for scheme explanation and chat"
```

---

### Task 7: FastAPI app wiring

**Files:**
- Create: `backend/app/main.py`

- [ ] **Step 1: Write `backend/app/main.py`**

```python
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
            error=f"AI explanation is temporarily unavailable ({e}). Here is the scheme info: {scheme['description']}",
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
        matched_ids = set(semantic_search(q, top_k=len(SCHEMES)))
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
```

- [ ] **Step 2: Start the server and manually verify each endpoint**

Run:
```bash
cd /home/shushant/Projects/GovSchemeAssistant/backend
source .venv/bin/activate
export GROQ_API_KEY=your_key_here
uvicorn app.main:app --reload --port 8000
```
In another terminal:
```bash
curl -s -X POST http://localhost:8000/api/match -H 'Content-Type: application/json' \
  -d '{"age":45,"annual_income":80000,"state":"Bihar","occupation":"farmer","social_category":"OBC","gender":"male","disability":false}' | python3 -m json.tool

curl -s http://localhost:8000/api/languages | python3 -m json.tool

curl -s -X POST http://localhost:8000/api/explain -H 'Content-Type: application/json' \
  -d '{"scheme_id":"pm-kisan","language":"hi"}' | python3 -m json.tool

curl -s -X POST http://localhost:8000/api/chat -H 'Content-Type: application/json' \
  -d '{"scheme_id":"pm-kisan","message":"What documents do I need?","language":"en","history":[]}' | python3 -m json.tool

curl -s "http://localhost:8000/api/schemes?q=farmer+crop+insurance" | python3 -m json.tool
```
Expected: `/api/match` returns a nonempty `matches` array; `/api/languages` returns 6 languages; `/api/explain` returns a Hindi explanation; `/api/chat` returns an English answer about documents; `/api/schemes?q=...` returns crop-insurance-relevant schemes near the top.

- [ ] **Step 3: Commit**

```bash
cd /home/shushant/Projects/GovSchemeAssistant
git add backend/app/main.py
git commit -m "feat: wire up FastAPI endpoints for match/explain/chat/schemes/languages"
```

---

## Part B — Frontend

### Task 8: Frontend scaffold

**Files:**
- Create: `frontend/` (via Vite scaffold)
- Modify: `frontend/tailwind.config.js`, `frontend/src/index.css`

- [ ] **Step 1: Scaffold the Vite React-TS project**

Run:
```bash
cd /home/shushant/Projects/GovSchemeAssistant
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install react-router-dom lucide-react
```

- [ ] **Step 2: Configure Tailwind — `frontend/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
        },
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 3: Replace `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 4: Add `frontend/.env`**

```
VITE_API_URL=http://localhost:8000
```

- [ ] **Step 5: Verify the dev server boots**

Run:
```bash
cd /home/shushant/Projects/GovSchemeAssistant/frontend
npm run dev
```
Expected: Vite prints a local URL (e.g. `http://localhost:5173`); loading it in a browser shows the default Vite+React template with Tailwind base styles applied (no console errors).

- [ ] **Step 6: Commit**

```bash
cd /home/shushant/Projects/GovSchemeAssistant
echo "node_modules/" >> frontend/.gitignore
echo "dist/" >> frontend/.gitignore
git add frontend/
git commit -m "chore: scaffold frontend with Vite, React, TypeScript, Tailwind"
```

---

### Task 9: API client and shared types

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/types.ts`

- [ ] **Step 1: Write `frontend/src/lib/types.ts`**

```typescript
export type LanguageCode = "en" | "hi" | "bn" | "ta" | "te" | "mr";

export interface Profile {
  age: number;
  annual_income: number;
  state: string;
  occupation: string;
  social_category: string;
  gender: "male" | "female" | "other";
  disability: boolean;
}

export interface MatchedScheme {
  scheme_id: string;
  name: string;
  category: string;
  why_matched: string[];
  documents_required: string[];
  benefits: string;
  official_url: string;
}

export interface SchemeSummary {
  scheme_id: string;
  name: string;
  category: string;
  description: string;
  ministry: string;
}

export interface LanguageOption {
  code: LanguageCode;
  label: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
```

- [ ] **Step 2: Write `frontend/src/lib/api.ts`**

```typescript
import type { ChatMessage, LanguageCode, LanguageOption, MatchedScheme, Profile, SchemeSummary } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL as string;

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export function matchProfile(profile: Profile) {
  return post<{ matches: MatchedScheme[] }>("/api/match", profile);
}

export function explainScheme(scheme_id: string, language: LanguageCode) {
  return post<{ scheme_id: string; language: LanguageCode; explanation?: string; error?: string }>(
    "/api/explain",
    { scheme_id, language }
  );
}

export function chatWithScheme(scheme_id: string, message: string, language: LanguageCode, history: ChatMessage[]) {
  return post<{ reply?: string; error?: string }>("/api/chat", { scheme_id, message, language, history });
}

export function listSchemes(q?: string, category?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  const qs = params.toString();
  return get<{ schemes: SchemeSummary[] }>(`/api/schemes${qs ? `?${qs}` : ""}`);
}

export function getLanguages() {
  return get<{ languages: LanguageOption[] }>("/api/languages");
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd /home/shushant/Projects/GovSchemeAssistant/frontend
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /home/shushant/Projects/GovSchemeAssistant
git add frontend/src/lib/
git commit -m "feat: add typed API client for frontend"
```

---

### Task 10: Language context

**Files:**
- Create: `frontend/src/context/LanguageContext.tsx`
- Create: `frontend/src/components/LanguageSelector.tsx`

- [ ] **Step 1: Write `frontend/src/context/LanguageContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getLanguages } from "../lib/api";
import type { LanguageCode, LanguageOption } from "../lib/types";

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  options: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [options, setOptions] = useState<LanguageOption[]>([{ code: "en", label: "English" }]);

  useEffect(() => {
    getLanguages()
      .then((res) => setOptions(res.languages))
      .catch(() => {});
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, options }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
```

- [ ] **Step 2: Write `frontend/src/components/LanguageSelector.tsx`**

```tsx
import { Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function LanguageSelector() {
  const { language, setLanguage, options } = useLanguage();
  return (
    <div className="flex items-center gap-2 text-sm">
      <Languages className="h-4 w-4 text-brand-600" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as typeof language)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-700 focus:border-brand-500 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/shushant/Projects/GovSchemeAssistant
git add frontend/src/context/ frontend/src/components/LanguageSelector.tsx
git commit -m "feat: add language context and selector component"
```

---

### Task 11: App shell, routing, Home page

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`
- Create: `frontend/src/components/Layout.tsx`
- Create: `frontend/src/pages/Home.tsx`

- [ ] **Step 1: Write `frontend/src/components/Layout.tsx`**

```tsx
import { Landmark } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { LanguageSelector } from "./LanguageSelector";

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-brand-700">
            <Landmark className="h-6 w-6" />
            <span>Scheme Setu</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-gray-600">
            <Link to="/profile" className="hover:text-brand-600">Find my schemes</Link>
            <Link to="/browse" className="hover:text-brand-600">Browse all</Link>
            <LanguageSelector />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Write `frontend/src/pages/Home.tsx`**

```tsx
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Home() {
  return (
    <div className="flex flex-col items-center gap-10 py-12 text-center">
      <div className="rounded-full bg-brand-100 p-4">
        <Sparkles className="h-10 w-10 text-brand-600" />
      </div>
      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Which government schemes are you eligible for?
        </h1>
        <p className="text-lg text-gray-600">
          Answer a few simple questions and get a personalized list of central government schemes you may
          qualify for — explained simply, in your language.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-6 py-3 font-medium text-white shadow hover:bg-brand-700"
        >
          Find my schemes <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/browse"
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
        >
          <Search className="h-4 w-4" /> Browse all schemes
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `frontend/src/App.tsx`**

```tsx
import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { ProfileForm } from "./pages/ProfileForm";
import { Results } from "./pages/Results";
import { SchemeDetail } from "./pages/SchemeDetail";
import { Browse } from "./pages/Browse";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<ProfileForm />} />
        <Route path="/results" element={<Results />} />
        <Route path="/scheme/:id" element={<SchemeDetail />} />
        <Route path="/browse" element={<Browse />} />
      </Route>
    </Routes>
  );
}
```

- [ ] **Step 4: Update `frontend/src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { LanguageProvider } from "./context/LanguageContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
```

Note: this task references `ProfileForm`, `Results`, `SchemeDetail`, `Browse` pages that don't exist yet — they're created in Tasks 12-14. The dev server will show import errors until those tasks are done; that's expected and resolved by the end of Part B.

- [ ] **Step 5: Commit** (after Task 14 makes the app compile — see note in Task 14's final step; for now just stage)

```bash
cd /home/shushant/Projects/GovSchemeAssistant
git add frontend/src/App.tsx frontend/src/main.tsx frontend/src/components/Layout.tsx frontend/src/pages/Home.tsx
git commit -m "feat: add app shell, routing, and home page"
```

---

### Task 12: Profile form + Results pages

**Files:**
- Create: `frontend/src/pages/ProfileForm.tsx`
- Create: `frontend/src/pages/Results.tsx`
- Create: `frontend/src/components/SchemeCard.tsx`
- Create: `frontend/src/context/ResultsContext.tsx`

- [ ] **Step 1: Write `frontend/src/context/ResultsContext.tsx`** (holds match results in memory between Profile and Results pages, no backend session needed)

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";
import type { MatchedScheme } from "../lib/types";

interface ResultsContextValue {
  matches: MatchedScheme[];
  setMatches: (m: MatchedScheme[]) => void;
}

const ResultsContext = createContext<ResultsContextValue | undefined>(undefined);

export function ResultsProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<MatchedScheme[]>([]);
  return <ResultsContext.Provider value={{ matches, setMatches }}>{children}</ResultsContext.Provider>;
}

export function useResults() {
  const ctx = useContext(ResultsContext);
  if (!ctx) throw new Error("useResults must be used within ResultsProvider");
  return ctx;
}
```

Wrap `<App />` in `main.tsx` with `<ResultsProvider>` alongside `<LanguageProvider>`.

- [ ] **Step 2: Write `frontend/src/pages/ProfileForm.tsx`**

```tsx
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { matchProfile } from "../lib/api";
import { useResults } from "../context/ResultsContext";
import type { Profile } from "../lib/types";

const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Gujarat", "Haryana",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab",
  "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal",
];

export function ProfileForm() {
  const navigate = useNavigate();
  const { setMatches } = useResults();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Profile>({
    age: 30,
    annual_income: 100000,
    state: "Maharashtra",
    occupation: "farmer",
    social_category: "General",
    gender: "male",
    disability: false,
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await matchProfile(form);
      setMatches(res.matches);
      navigate("/results");
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Tell us about yourself</h1>
      <form onSubmit={onSubmit} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">Age</label>
          <input
            type="number"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
            className="mt-1 w-full rounded-md border-gray-300 border px-3 py-2 focus:border-brand-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Annual household income (₹)</label>
          <input
            type="number"
            value={form.annual_income}
            onChange={(e) => setForm({ ...form, annual_income: Number(e.target.value) })}
            className="mt-1 w-full rounded-md border-gray-300 border px-3 py-2 focus:border-brand-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">State</label>
          <select
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="mt-1 w-full rounded-md border-gray-300 border px-3 py-2 focus:border-brand-500 focus:outline-none"
          >
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Occupation</label>
          <input
            type="text"
            value={form.occupation}
            onChange={(e) => setForm({ ...form, occupation: e.target.value })}
            placeholder="e.g. farmer, student, unemployed, small business owner"
            className="mt-1 w-full rounded-md border-gray-300 border px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Social category</label>
          <select
            value={form.social_category}
            onChange={(e) => setForm({ ...form, social_category: e.target.value })}
            className="mt-1 w-full rounded-md border-gray-300 border px-3 py-2 focus:border-brand-500 focus:outline-none"
          >
            {["General", "OBC", "SC", "ST", "EWS"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value as Profile["gender"] })}
            className="mt-1 w-full rounded-md border-gray-300 border px-3 py-2 focus:border-brand-500 focus:outline-none"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.disability}
            onChange={(e) => setForm({ ...form, disability: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-brand-600"
          />
          <label className="text-sm text-gray-700">I am a person with a disability</label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Finding schemes..." : "Find my schemes"}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Write `frontend/src/components/SchemeCard.tsx`**

```tsx
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { MatchedScheme } from "../lib/types";

export function SchemeCard({ scheme }: { scheme: MatchedScheme }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md">
      <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
        {scheme.category}
      </span>
      <h3 className="mt-2 text-lg font-semibold text-gray-900">{scheme.name}</h3>
      <div className="mt-2 flex flex-wrap gap-1">
        {scheme.why_matched.map((reason) => (
          <span key={reason} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {reason}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm text-gray-600">{scheme.benefits}</p>
      <div className="mt-4 flex items-center gap-3">
        <Link
          to={`/scheme/${scheme.scheme_id}`}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Explain simply
        </Link>
        <a
          href={scheme.official_url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-brand-600"
        >
          Official site <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write `frontend/src/pages/Results.tsx`**

```tsx
import { Link } from "react-router-dom";
import { SchemeCard } from "../components/SchemeCard";
import { useResults } from "../context/ResultsContext";

export function Results() {
  const { matches } = useResults();

  if (matches.length === 0) {
    return (
      <div className="text-center">
        <p className="text-gray-600">No results yet.</p>
        <Link to="/profile" className="text-brand-600 underline">Fill in your profile</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">
        {matches.length} scheme{matches.length !== 1 ? "s" : ""} you may be eligible for
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Always verify final eligibility on the scheme's official portal before applying.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {matches.map((s) => (
          <SchemeCard key={s.scheme_id} scheme={s} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
cd /home/shushant/Projects/GovSchemeAssistant
git add frontend/src/pages/ProfileForm.tsx frontend/src/pages/Results.tsx frontend/src/components/SchemeCard.tsx frontend/src/context/ResultsContext.tsx frontend/src/main.tsx
git commit -m "feat: add profile form and results pages"
```

---

### Task 13: Scheme detail page with chat

**Files:**
- Create: `frontend/src/pages/SchemeDetail.tsx`
- Create: `frontend/src/components/ChatBox.tsx`

- [ ] **Step 1: Write `frontend/src/components/ChatBox.tsx`**

```tsx
import { Send } from "lucide-react";
import { useState } from "react";
import { chatWithScheme } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import type { ChatMessage } from "../lib/types";

export function ChatBox({ schemeId }: { schemeId: string }) {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: input };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setLoading(true);
    try {
      const res = await chatWithScheme(schemeId, userMsg.content, language, messages);
      const replyText = res.reply ?? res.error ?? "Something went wrong.";
      setMessages([...newHistory, { role: "assistant", content: replyText }]);
    } catch {
      setMessages([...newHistory, { role: "assistant", content: "Could not reach the server." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold text-gray-900">Ask a question about this scheme</h3>
      <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-sm ${
              m.role === "user" ? "ml-8 bg-brand-50 text-brand-900" : "mr-8 bg-gray-100 text-gray-800"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="mr-8 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-400">Thinking...</div>}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="e.g. What documents do I need?"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          onClick={send}
          disabled={loading}
          className="rounded-md bg-brand-600 px-3 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Write `frontend/src/pages/SchemeDetail.tsx`**

```tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { explainScheme, listSchemes } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import { ChatBox } from "../components/ChatBox";
import type { SchemeSummary } from "../lib/types";

export function SchemeDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const [scheme, setScheme] = useState<SchemeSummary | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setExplanation(null);
    setError(null);
    listSchemes()
      .then((res) => setScheme(res.schemes.find((s) => s.scheme_id === id) ?? null))
      .catch(() => {});
    explainScheme(id, language)
      .then((res) => {
        if (res.explanation) setExplanation(res.explanation);
        else setError(res.error ?? "Could not load explanation.");
      })
      .catch(() => setError("Could not reach the server."))
      .finally(() => setLoading(false));
  }, [id, language]);

  if (!id) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{scheme?.name ?? id}</h1>
        {scheme && <p className="text-sm text-gray-500">{scheme.ministry}</p>}
      </div>
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-gray-700">{explanation}</p>
        )}
      </div>
      <ChatBox schemeId={id} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /home/shushant/Projects/GovSchemeAssistant
git add frontend/src/pages/SchemeDetail.tsx frontend/src/components/ChatBox.tsx
git commit -m "feat: add scheme detail page with AI explanation and follow-up chat"
```

---

### Task 14: Browse/search page — final wiring and end-to-end verification

**Files:**
- Create: `frontend/src/pages/Browse.tsx`
- Modify: `frontend/src/main.tsx` (add ResultsProvider if not already done in Task 12)

- [ ] **Step 1: Write `frontend/src/pages/Browse.tsx`**

```tsx
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listSchemes } from "../lib/api";
import type { SchemeSummary } from "../lib/types";

const CATEGORIES = [
  "Agriculture", "Health", "Housing", "Education", "Employment", "Women & Child",
  "Senior Citizens", "Disability", "MSME", "Financial Inclusion", "Food Security", "Skill Development",
];

export function Browse() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [schemes, setSchemes] = useState<SchemeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listSchemes(query || undefined, category || undefined)
      .then((res) => setSchemes(res.schemes))
      .finally(() => setLoading(false));
  }, [query, category]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Browse all schemes</h1>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search schemes, e.g. 'loan for small business'"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {schemes.map((s) => (
            <Link
              key={s.scheme_id}
              to={`/scheme/${s.scheme_id}`}
              className="block rounded-xl border bg-white p-4 shadow-sm hover:shadow-md"
            >
              <span className="text-xs font-medium text-brand-600">{s.category}</span>
              <h3 className="font-semibold text-gray-900">{s.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">{s.description}</p>
            </Link>
          ))}
          {schemes.length === 0 && <p className="text-gray-500">No schemes found.</p>}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Ensure `frontend/src/main.tsx` wraps the app with both providers**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { LanguageProvider } from "./context/LanguageContext.tsx";
import { ResultsProvider } from "./context/ResultsContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <ResultsProvider>
          <App />
        </ResultsProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
```

- [ ] **Step 3: Verify the whole app compiles**

Run:
```bash
cd /home/shushant/Projects/GovSchemeAssistant/frontend
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Full manual end-to-end verification**

With the backend running (`uvicorn app.main:app --reload --port 8000` from Task 7, `GROQ_API_KEY` set) and frontend running (`npm run dev`):

1. Open the frontend URL in a browser.
2. Click "Find my schemes", fill in a realistic profile (e.g. 60-year-old farmer, low income, female, SC category, Maharashtra), submit.
3. Verify the Results page shows a nonempty, plausible list of matched scheme cards with "why matched" tags.
4. Click "Explain simply" on one card → verify the Scheme Detail page loads, shows a skeleton briefly, then a real AI-generated plain-language explanation.
5. Change the language selector to Hindi → verify the explanation reloads in Hindi.
6. In the chat box, ask "What documents do I need?" → verify a grounded, relevant answer appears in Hindi.
7. Go to "Browse all", search for "small business loan" → verify relevant schemes (Mudra, PMEGP, Stand-Up India, etc.) appear near the top.
8. Stop the backend server, retry "Explain simply" on a new scheme → verify the frontend shows a friendly error instead of crashing (matches the spec's error-handling requirement).
9. Restart the backend, confirm everything recovers.

Take a screenshot of the Results page and the Scheme Detail page with chat to confirm visual polish (gradient hero on Home, card grid, badges, chat bubbles).

- [ ] **Step 5: Commit**

```bash
cd /home/shushant/Projects/GovSchemeAssistant
git add frontend/src/pages/Browse.tsx frontend/src/main.tsx
git commit -m "feat: add browse/search page; complete end-to-end app"
```

---

### Task 15: Top-level README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write a `README.md`** at the project root covering: what this is (problem statement, one paragraph), architecture diagram (reuse from spec), how to run backend (`venv`, `pip install`, `.env` from `.env.example`, `uvicorn`), how to run frontend (`npm install`, `npm run dev`), and the disclaimer that scheme data is curated for demo purposes and users should verify on official portals.

- [ ] **Step 2: Commit**

```bash
cd /home/shushant/Projects/GovSchemeAssistant
git add README.md
git commit -m "docs: add top-level README with setup instructions"
```
