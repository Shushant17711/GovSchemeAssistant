import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { explainScheme, listSchemes } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import { useSettings } from "../context/SettingsContext";
import { ChatBox } from "../components/ChatBox";
import { speak, canSpeak } from "../lib/speech";
import { Volume2 } from "lucide-react";
import type { SchemeSummary } from "../lib/types";

export function SchemeDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const { settings } = useSettings();
  const [scheme, setScheme] = useState<SchemeSummary | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState<{ name: string; description: string; benefits: string; documents_required: string[] } | null>(null);
  const [settingsIgnored, setSettingsIgnored] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setExplanation(null);
    setError(null);
    setFallback(null);
    setSettingsIgnored(false);
    listSchemes()
      .then((res) => setScheme(res.schemes.find((s) => s.scheme_id === id) ?? null))
      .catch(() => {});
    explainScheme(id, language, settings)
      .then((res) => {
        if (res.llm_settings_ignored) setSettingsIgnored(true);
        if (res.explanation) {
          setExplanation(res.explanation);
        } else {
          setError(res.error ?? "Could not load explanation.");
          setFallback(res.fallback ?? null);
        }
      })
      .catch(() => setError("Could not reach the server."))
      .finally(() => setLoading(false));
  }, [id, language, settings]);

  if (!id) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{scheme?.name ?? id}</h1>
        {scheme && <p className="text-sm text-gray-500">{scheme.ministry}</p>}
      </div>
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        {settingsIgnored && (
          <p className="mb-2 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
            Custom base URL not recognized — using the default provider.
          </p>
        )}
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
          </div>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm text-red-600">{error}</p>
            {fallback && (
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                <p className="font-medium">{fallback.name}</p>
                <p>{fallback.description}</p>
                <p className="mt-1">{fallback.benefits}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <p className="text-gray-700">{explanation}</p>
            {canSpeak(language) && explanation && (
              <button
                onClick={() => speak(explanation, language)}
                className="shrink-0 rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
                aria-label="Listen"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
      <ChatBox schemeId={id} />
    </div>
  );
}
