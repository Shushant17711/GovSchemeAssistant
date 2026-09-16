# Scheme Setu — Advanced Features & Fixes — Design Spec

Date: 2026-09-17

## Problem

The first build (see `2026-09-16-gov-scheme-assistant-design.md`) is a working but conventional "profile → matched list → explain → chat" flow, indistinguishable from existing scheme-finder portals. This spec adds four differentiating capabilities plus a real bug fix, based on direct user feedback:

1. Browse/search is broken — every query returns every scheme.
2. **Scheme Scam Shield**: let a citizen paste a suspicious message claiming to be a government scheme and get a fraud risk assessment, cross-checked against the real curated dataset.
3. **Benefit Maximizer + Eligibility Gap Advisor**: show the total estimated ₹ value of matched schemes, and surface "near-miss" schemes the citizen almost qualifies for.
4. **Voice-first accessibility**: speech-to-text profile intake and speech-to-text/text-to-speech in chat and explanations, for citizens who struggle to read/type.
5. **Runtime LLM settings panel**: let the user change the LLM `base_url`/`model` from the UI without editing `.env` and restarting the backend.

## Non-goals

- No new LLM provider integrations beyond the existing OpenAI-compatible client — the settings panel only changes which OpenAI-compatible endpoint/model is called, it doesn't add SDKs for other provider shapes.
- No server-side speech processing (no Whisper, no cloud STT/TTS) — voice features use only the browser's built-in Web Speech API. If a browser doesn't support it (e.g. Firefox), the mic/listen buttons are hidden rather than shown broken.
- Scam Shield is a risk-assessment aid, not a legal fraud determination — every result carries a disclaimer to report suspected fraud to the National Cyber Crime Portal / 1930 helpline, and never claims certainty.
- The Settings panel does not accept or store an API key from the browser — only `base_url` and `model`. The key remains server-side (`.env`) only, so nothing secret is ever exposed to client-side JS or `localStorage`.
- No user accounts — Settings panel preferences and any "saved schemes" are `localStorage`-only, per-browser, not synced.

## Fix: Browse search bug

**Root cause**: `backend/app/main.py`'s `list_schemes` calls `semantic_search(query, top_k=len(SCHEMES))` — requesting every scheme back from a flat FAISS index means the semantic filter matches 100% of the catalog regardless of query, so search never actually narrows results.

**Fix**: cap `top_k` to a small constant (`15`) and apply a minimum cosine-similarity threshold (`0.35`, empirically chosen against `all-MiniLM-L6-v2`) so results below the threshold are dropped. `semantic_search` returns `(scheme_id, score)` pairs instead of bare ids; `list_schemes` keeps only pairs at or above the threshold, unioned with the existing substring match. Verification: re-run the same manual query checks from the original plan (`"help for farmers whose crops failed"` etc.) and confirm result counts are now small/relevant rather than all 53.

## Feature: Scheme Scam Shield

### Data model addition
No dataset schema change — the shield reasons over the existing scheme fields (`name`, `benefits`, `documents_required`) plus the pasted text.

### API
`POST /api/scam-check`
- Request: `{ message: string, language: Language }`
- Response: `{ risk_level: "low"|"medium"|"high", reasons: string[], matched_scheme: { scheme_id, name, real_benefit: string } | null, disclaimer: string }`

### Logic (`backend/app/scam_shield.py`)
1. **Rule-based red flags** (deterministic, no LLM, always available): regex/keyword checks for payment requests ("pay ₹", "processing fee", "registration fee"), credential requests ("OTP", "PIN", "CVV", "Aadhaar OTP"), urgency language ("act now", "24 hours", "will be cancelled"), and shortened/suspicious links (`bit.ly`, `tinyurl`, non-`.gov.in` domains claiming to be official). Each hit adds a reason and a severity weight.
2. **Scheme cross-reference**: run the pasted text through the existing FAISS semantic search (reusing the fixed search from above) to find the closest real scheme, if any (only above the similarity threshold). If found, compare the message's claimed benefit against the real scheme's actual `benefits` text via a short LLM call whose only job is a yes/no-style structured judgment: "does this message's claim plausibly match the real scheme's benefit, or does it contradict/exaggerate it?" If the LLM is unavailable, skip this sub-check (rule-based flags still work) — the endpoint never 500s.
3. **Verdict**: `risk_level` is computed deterministically from the rule-based weight total (not LLM-decided) — `high` if any credential/payment request is present, `medium` if urgency/link red flags only, `low` otherwise — so the headline verdict is always auditable and available even without the LLM. The LLM-derived mismatch reason (if available) is appended to `reasons` as an additional data point, not the sole determinant.
4. Every response includes a fixed `disclaimer` string pointing to the National Cyber Crime Reporting Portal (cybercrime.gov.in) and helpline 1930.

### Frontend
New page `/scam-check`: a textarea to paste the message, a "Check this message" button, and a result card showing the risk level (color-coded), the itemized reasons, the matched real scheme (with a link to its detail page) if any, and the disclaimer. Linked from the main nav.

## Feature: Benefit Maximizer + Eligibility Gap Advisor

### Data model addition
Every scheme in `backend/data/schemes.json` gains two new fields:
- `benefit_amount`: number | null — the headline monetary value if quantifiable (e.g. `6000` for PM-KISAN), `null` for non-monetary benefits (e.g. ADIP's aids/appliances, JSY's variable amount) or benefits that are ranges too wide to summarize meaningfully as one number (loan schemes use the loan ceiling, e.g. Mudra's `2000000`).
- `benefit_frequency`: `"annual"` | `"one_time"` | `"loan_ceiling"` | `"monthly"` | `"non_monetary"` — describes what `benefit_amount` means, so the frontend can label it correctly ("₹6,000/year" vs "up to ₹20,00,000 loan" vs "monthly pension of ₹3,000").

This is backfilled for all 53 existing schemes based on each one's already-written `benefits` text (no new research needed, just structuring what's already there).

### API changes
- `MatchedScheme` (in `/api/match` response) gains `benefit_amount` and `benefit_frequency` fields.
- `/api/match` response gains a top-level `near_misses` array alongside `matches`: `{ scheme_id, name, category, blocking_reason: string, official_url }[]`.

### Near-miss logic (`backend/app/eligibility.py`)
A scheme is a "near miss" if the profile fails **exactly one** hard criterion, and that failure is within a defined margin:
- Age: within 3 years of `age_min`/`age_max`.
- Income: within 20% above `income_max_annual`.
- Social category / gender / disability: excluded entirely from near-miss (these are categorical, not a "close" miss — a General-category citizen is not "near" an SC-only scheme).
- State/occupation are also excluded (categorical, not a graduated threshold).

Only age and income produce near-misses, since they're the only continuous/numeric criteria. `blocking_reason` is a fixed-template string naming the exact gap, e.g. `"Annual income is ₹10,000 above the ₹1,50,000 limit"` or `"You are 2 years above the age limit of 60"`.

### Frontend
Results page gets a summary banner above the scheme grid: "Based on your matches, you may be eligible for up to ₹X per year in direct benefits" (sum of `annual`/`monthly`×12 amounts; loan ceilings and one-time amounts are called out separately as "+ access to ₹Y in loans" rather than added into the same total, since summing a loan ceiling with a cash grant would be misleading). Below the main grid, a "You're close to qualifying for these" section lists near-misses with their `blocking_reason`.

## Feature: Voice-first accessibility

### Approach
Browser-native Web Speech API only:
- `SpeechRecognition` (`webkitSpeechRecognition` fallback) for speech-to-text, language set from the current `LanguageContext` selection (mapped to BCP-47 tags: `hi-IN`, `bn-IN`, `ta-IN`, `te-IN`, `mr-IN`, `en-IN`).
- `speechSynthesis` for text-to-speech on explanation text and chat replies, same language mapping.

### Frontend changes
- New `frontend/src/lib/speech.ts`: thin wrapper exposing `isSpeechRecognitionSupported()`, `isSpeechSynthesisSupported()`, `startListening(lang, onResult)`, `speak(text, lang)`.
- `ProfileForm`: a mic icon button next to the Occupation field (the one genuinely free-text field) that fills it from speech. (Age/income/state/category/gender stay as structured inputs — voice input for free text is the highest-value spot, not every field.)
- `SchemeDetail`: a "Listen" button next to the explanation text and next to each chat reply, calling `speak()`.
- All voice controls are conditionally rendered based on the support-check functions — hidden (not disabled/erroring) when unsupported.

### Error handling
No new backend involvement, so no new server-side failure modes. Speech recognition errors (no mic permission, no speech detected) surface as a small inline toast-style message near the mic button, not a page-level error.

## Feature: Runtime LLM settings panel

### Frontend
- New `frontend/src/context/SettingsContext.tsx`: holds `{ baseUrl: string | null, model: string | null }`, persisted to `localStorage` under key `scheme-setu-llm-settings`, defaults to `null` (meaning "use backend default").
- New `frontend/src/components/SettingsPanel.tsx`: a gear icon in the top-right nav (next to the language selector) opening a small popover with two text fields (Base URL, Model) and a Save/Reset. Reset clears `localStorage` back to `null`/`null`.
- `api.ts`'s `explainScheme` and `chatWithScheme` calls include `llm_base_url`/`llm_model` in the request body when set (omitted/`null` otherwise).

### Backend changes
- `ExplainRequest` and `ChatRequest` gain optional fields `llm_base_url: str | None = None`, `llm_model: str | None = None`.
- `llm.py`'s `explain_scheme`/`chat_answer` accept optional `base_url`/`model` overrides; when provided, a **short-lived** `OpenAI` client is constructed for that single call with the override values (the API key is still read from the server's own env — never accepted from the request), instead of mutating the shared global client. This keeps concurrent requests from different browser tabs/settings from racing on shared global state.
- If the override `base_url` is unreachable or the `model` name is invalid, the existing error-fallback path (friendly error + `fallback` scheme data) applies exactly as today — no special-casing needed since it already wraps any `Exception` from the LLM call.

## Error handling summary (additions only)

- `/api/scam-check` never 500s: if the LLM cross-reference sub-check fails, it's silently skipped and the rule-based verdict is still returned.
- Voice features never block core functionality — they're additive UI affordances behind support checks.
- Settings overrides never bypass the error-fallback contract already established for `/api/explain`/`/api/chat`.

## Testing / verification plan

Same manual/functional approach as the original spec (no automated test suite):
- Re-run the original Browse search manual checks and confirm result counts are now sensibly filtered.
- Paste 2-3 known scam-message patterns (fee request, OTP request, a legitimate-sounding but fake portal link) and confirm risk levels and reasons look right; paste a real, honestly-described scheme summary and confirm it comes back `low` risk.
- Submit a profile that near-misses at least one age- or income-gated scheme by a small margin and confirm it appears in `near_misses` with the correct `blocking_reason`; confirm the ₹ total on Results matches manual arithmetic on the matched schemes' `benefit_amount`/`benefit_frequency`.
- In a Chromium-based browser, use the mic button on Profile's Occupation field and confirm it transcribes; use Listen on an explanation and confirm audio plays in the selected language voice (best-effort — exact voice availability depends on the OS's installed TTS voices).
- Change the Settings panel's model to a different valid Groq model and confirm `/api/explain` responses reflect it; set an invalid model and confirm the existing friendly-fallback error appears instead of a crash.

## Open risks / assumptions

- `benefit_amount` figures are derived from the same approximate, hand-curated data as the rest of the dataset — same "verify on official portal" disclaimer applies, now also next to the ₹ total.
- Web Speech API browser support and voice quality vary (best in Chrome; Firefox has none, Safari is partial) — this is disclosed as a best-effort accessibility aid, not a guaranteed feature.
- Scam Shield's LLM-based mismatch check adds one more Groq call per check on top of the existing rate-limit risk noted in the original spec; the rule-based verdict staying independent of the LLM keeps the feature useful even under rate-limiting.
- Public GitHub repo means the code (including the curated dataset and this spec) is visible to anyone; no secrets are committed (`.env` files are gitignored) — this was verified for the original build and remains true here since no new secret-bearing file is introduced.
