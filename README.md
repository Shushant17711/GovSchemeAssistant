# Scheme Setu — AI Multilingual Government Scheme Assistant

An assistant that helps citizens find out which central government schemes they're eligible for, explains matches in plain language in their own language, and answers follow-up questions — grounded in a curated dataset of 53 real Indian central government schemes.

Built for the "AI Multilingual Government Information Assistant" problem statement: citizens struggle to find scheme information because it's scattered across many websites and written in complex language.

## How it works

1. A citizen fills a short profile (age, income, state, occupation, social category, gender, disability).
2. A **deterministic rule engine** (`backend/app/eligibility.py`) matches the profile against the scheme dataset — no LLM involved, so matching is accurate and works even if the AI provider is down.
3. Each matched scheme can be **explained simply** in English, Hindi, Bengali, Tamil, Telugu, or Marathi via an LLM (Groq).
4. A **follow-up chat** per scheme answers questions (documents needed, how to apply, etc.), grounded in that scheme's own data.
5. A **Browse/search** page lets citizens explore all schemes via semantic search (sentence-transformers + FAISS) without filling a profile.

See `docs/superpowers/specs/2026-09-16-gov-scheme-assistant-design.md` for the full design and `docs/superpowers/plans/2026-09-16-gov-scheme-assistant.md` for the implementation plan.

## Architecture

```
GovSchemeAssistant/
├── backend/    FastAPI — eligibility rule engine, FAISS semantic search, Groq LLM client
└── frontend/   React + Vite + TailwindCSS SPA
```

## Running it

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # then fill in GROQ_API_KEY (free key at https://console.groq.com/keys)
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL (e.g. `http://localhost:5173`). The frontend expects the backend at `http://localhost:8000` (configurable via `frontend/.env`'s `VITE_API_URL`).

## Notes

- **Data accuracy**: scheme eligibility data is hand-curated for this demo from public knowledge of well-known schemes. Numeric thresholds (income ceilings, etc.) change over time — every scheme card links to its official government portal, and citizens should always verify final eligibility there before applying.
- **No accounts, no persistence**: profile data is used in-session only and never stored server-side.
- Eligibility matching works even without a Groq API key; only the "Explain simply" and chat features require one.
