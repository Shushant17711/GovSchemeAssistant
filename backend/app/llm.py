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
    _model_name = os.environ.get("LLM_MODEL") or os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
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
