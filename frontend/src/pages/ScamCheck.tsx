import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { checkScamMessage } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import type { ScamCheckResult } from "../lib/types";

const RISK_STYLES: Record<ScamCheckResult["risk_level"], { bg: string; text: string; icon: typeof ShieldCheck }> = {
  low: { bg: "bg-green-50", text: "text-green-800", icon: ShieldCheck },
  medium: { bg: "bg-amber-50", text: "text-amber-800", icon: AlertTriangle },
  high: { bg: "bg-red-50", text: "text-red-800", icon: ShieldAlert },
};

export function ScamCheck() {
  const { language } = useLanguage();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScamCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onCheck() {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await checkScamMessage(message, language);
      setResult(res);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const style = result ? RISK_STYLES[result.risk_level] : null;
  const Icon = style?.icon;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Scheme Scam Shield</h1>
      <p className="mb-6 text-sm text-gray-600">
        Paste a suspicious WhatsApp/SMS message or link claiming to be about a government scheme, and we'll check
        it for common fraud red flags and compare it against real scheme data.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        placeholder="Paste the message here..."
        className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-brand-500 focus:outline-none"
      />
      <button
        onClick={onCheck}
        disabled={loading || !message.trim()}
        className="mt-3 rounded-lg bg-brand-600 px-5 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Checking..." : "Check this message"}
      </button>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {result && style && Icon && (
        <div className={`mt-6 rounded-xl p-5 ${style.bg}`}>
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${style.text}`} />
            <span className={`font-semibold uppercase ${style.text}`}>{result.risk_level} risk</span>
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {result.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          {result.matched_scheme && (
            <div className="mt-4 rounded-lg bg-white p-3 text-sm">
              <p className="font-medium text-gray-900">Closest real scheme: {result.matched_scheme.name}</p>
              <p className="mt-1 text-gray-600">{result.matched_scheme.real_benefit}</p>
              <Link
                to={`/scheme/${result.matched_scheme.scheme_id}`}
                className="mt-1 inline-block text-brand-600 hover:underline"
              >
                View real scheme details
              </Link>
            </div>
          )}
          <p className="mt-4 text-xs text-gray-500">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
