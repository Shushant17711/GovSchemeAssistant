import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { MatchedScheme } from "../lib/types";

function benefitLabel(scheme: MatchedScheme): string | null {
  if (scheme.benefit_amount == null) return null;
  const amount = `₹${scheme.benefit_amount.toLocaleString("en-IN")}`;
  switch (scheme.benefit_frequency) {
    case "annual":
      return `${amount}/year`;
    case "monthly":
      return `${amount}/month`;
    case "one_time":
      return `${amount} one-time`;
    case "loan_ceiling":
      return `Up to ${amount} loan`;
    default:
      return null;
  }
}

export function SchemeCard({ scheme }: { scheme: MatchedScheme }) {
  const label = benefitLabel(scheme);
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          {scheme.category}
        </span>
        {label && (
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">{label}</span>
        )}
      </div>
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
