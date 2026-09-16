# AI Multilingual Government Information Assistant — Design Spec

Date: 2026-09-16

## Problem

Citizens struggle to find out which government schemes they're eligible for because information is scattered across many websites and written in complex language, often only in English or Hindi. This project builds a working assistant that:

- Takes a short citizen profile (age, income, state, occupation, social category, gender, disability status)
- Deterministically matches it against a curated database of real central government schemes
- Explains matched schemes in simple language, in a language of the citizen's choice (English, Hindi, Bengali, Tamil, Telugu, Marathi)
- Lists eligibility requirements and required documents per scheme
- Supports follow-up Q&A per scheme via retrieval-augmented generation (RAG)
- Lets citizens browse/search all schemes without filling a profile

## Non-goals

- No real-time scraping/ingestion pipeline from live government websites (out of scope for this build — a curated, hand-researched dataset is used instead, each entry links to its official portal for authoritative details).
- No user accounts, auth, or persistence of citizen data — profile data is used in-session only, not stored server-side.
- No legal/financial advice — every scheme card carries a "verify on the official portal" disclaimer.
- Not attempting to cover all 22 scheduled languages — starts with English + 5 major regional languages (Hindi, Bengali, Tamil, Telugu, Marathi), extensible later via a config list.

## Architecture

```
GovSchemeAssistant/
├── backend/                        FastAPI app
│   ├── data/schemes.json           curated dataset (~40-50 real central govt schemes)
│   ├── app/
│   │   ├── main.py                 FastAPI app + routes
│   │   ├── eligibility.py          deterministic rule engine (profile -> matched schemes + reasons)
│   │   ├── rag.py                  sentence-transformers embeddings + FAISS index over scheme text
│   │   ├── llm.py                  Groq (OpenAI-compatible) client: explain_scheme(), chat_answer()
│   │   └── models.py               Pydantic request/response schemas
│   ├── .env.example
│   └── requirements.txt
└── frontend/                       React + Vite + TailwindCSS SPA
    ├── src/pages/                  Home, ProfileForm, Results, SchemeDetail (+ follow-up chat), Browse
    ├── src/components/             SchemeCard, LanguageSelector, ChatBox, ProfileForm fields, etc.
    └── src/lib/api.ts               typed fetch wrappers to backend
```

### Data model (per scheme)

- `id`, `name`, `category`, `ministry`
- `description` (plain-language summary)
- `eligibility`: `age_min`, `age_max`, `income_max_annual`, `states` (list or `"all"`), `occupation` (list or `"all"`), `social_category` (list or `"all"`), `gender` (`"all"` / `"male"` / `"female"`), `disability_required` (bool)
- `benefits` (text)
- `documents_required` (list of strings)
- `official_url`
- `how_to_apply` (short text)

### Matching flow

1. Citizen submits profile via form.
2. `eligibility.py` filters the dataset deterministically against the profile fields, producing matched schemes each with a plain-English "why you match" reason. This is rule-based, not LLM-based — accurate and auditable, and works even if the LLM is unreachable.
3. Results page renders matched scheme cards (name, category, why-matched, documents required, benefits, official link).
4. "Explain simply" per card calls `POST /api/explain` → RAG-grounded LLM call (Groq) that rewrites that scheme's own data into a simple explanation in the selected language.
5. Each scheme detail view has a follow-up chat box → `POST /api/chat`, which retrieves relevant scheme chunks via FAISS and answers grounded in that context, in the selected language.
6. `Browse` page: `GET /api/schemes` with search/category filters, for exploring without a profile.

### Backend

- FastAPI, Python.
- Retrieval: `sentence-transformers` (`all-MiniLM-L6-v2`, runs locally, no API key) embeddings + FAISS index built at startup from the scheme dataset (one chunk per scheme, or a few chunks per scheme for larger fields).
- Generation: Groq via an OpenAI-compatible client wrapper, configured through env vars (`GROQ_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`) so swapping to another OpenAI-compatible provider (OpenRouter, etc.) later is a one-line config change.
- No database — dataset loaded from `data/schemes.json` at startup; FAISS index built in-memory at startup (small dataset, negligible cost).

### Frontend

- React + Vite + TailwindCSS, React Router, lucide-react icons.
- Pages: Home/landing, Profile form, Results (matched scheme cards), Scheme detail (full info + chat), Browse/search all schemes.
- Global language selector (persists via React context) affecting all LLM-generated text; static UI chrome can optionally follow the same selection later but is English-first for this build.
- Visual style: clean, modern, trustworthy (not garish) — gradient hero, card grid, category icons/badges, skeleton loaders while LLM responses stream in, fully responsive.

### Error handling

- Matching (`/api/match`, `/api/schemes`) has zero LLM dependency — always works.
- `/api/explain` and `/api/chat` catch LLM/network failures and return a clear "AI explanation is temporarily unavailable, here's the raw scheme info" fallback rather than a 500, and the frontend shows a friendly inline error instead of breaking the page.
- Missing `GROQ_API_KEY` at startup logs a warning; the app still boots and matching still works.

### Testing / verification plan

- Manual end-to-end run: start backend (`uvicorn`) and frontend (`vite dev`), submit a real profile through the browser, verify matched schemes are sensible, verify "Explain simply" produces a real Groq response, verify follow-up chat answers are grounded and in the right language, verify Browse/search works.
- No automated test suite is planned for this build given the demo/hackathon scope — verification is functional/manual, called out explicitly rather than skipped silently.

## Open risks / assumptions

- Scheme eligibility data is hand-curated from general public knowledge of well-known central schemes; approximate on some numeric thresholds (income ceilings etc. change over time) — every card links to the scheme's official portal and carries a disclaimer.
- Requires a `GROQ_API_KEY` to be set for the AI explanation/chat features; matching still works without one.
