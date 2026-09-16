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
  return post<{
    scheme_id: string;
    language: LanguageCode;
    explanation?: string;
    error?: string;
    // Raw scheme record (backend's schemes.json entry) returned only when the AI call fails,
    // so the UI can still show the scheme's real info instead of nothing.
    fallback?: { name: string; description: string; benefits: string; documents_required: string[] };
  }>("/api/explain", { scheme_id, language });
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
