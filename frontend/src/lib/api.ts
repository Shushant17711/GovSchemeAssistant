import type {
  ChatMessage,
  LanguageCode,
  LanguageOption,
  LlmSettings,
  MatchedScheme,
  NearMissScheme,
  Profile,
  ProviderOption,
  ScamCheckResult,
  SchemeSummary,
} from "./types";

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

function llmFields(settings: LlmSettings) {
  const provider = settings.provider || undefined;
  const model = provider ? settings.modelsByProvider[provider] || undefined : undefined;
  return {
    llm_provider: provider,
    llm_model: model,
  };
}

export function matchProfile(profile: Profile) {
  return post<{ matches: MatchedScheme[]; near_misses: NearMissScheme[] }>("/api/match", profile);
}

export function explainScheme(scheme_id: string, language: LanguageCode, settings: LlmSettings) {
  return post<{
    scheme_id: string;
    language: LanguageCode;
    explanation?: string;
    error?: string;
    fallback?: { name: string; description: string; benefits: string; documents_required: string[] };
    llm_settings_ignored?: boolean;
  }>("/api/explain", { scheme_id, language, ...llmFields(settings) });
}

export function chatWithScheme(
  scheme_id: string,
  message: string,
  language: LanguageCode,
  history: ChatMessage[],
  settings: LlmSettings
) {
  return post<{ reply?: string; error?: string; llm_settings_ignored?: boolean }>("/api/chat", {
    scheme_id,
    message,
    language,
    history,
    ...llmFields(settings),
  });
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

export function getProviders() {
  return get<{ providers: ProviderOption[] }>("/api/providers");
}

export function checkScamMessage(message: string, language: LanguageCode) {
  return post<ScamCheckResult>("/api/scam-check", { message, language });
}
