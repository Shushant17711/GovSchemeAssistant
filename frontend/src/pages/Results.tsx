import { Link } from "react-router-dom";
import { SchemeCard } from "../components/SchemeCard";
import { useResults } from "../context/ResultsContext";
import type { MatchedScheme } from "../lib/types";

function sumBenefits(matches: MatchedScheme[]) {
  let recurring = 0;
  let oneTime = 0;
  let loan = 0;
  for (const m of matches) {
    if (m.benefit_amount == null) continue;
    if (m.benefit_frequency === "annual") recurring += m.benefit_amount;
    else if (m.benefit_frequency === "monthly") recurring += m.benefit_amount * 12;
    else if (m.benefit_frequency === "one_time") oneTime += m.benefit_amount;
    else if (m.benefit_frequency === "loan_ceiling") loan += m.benefit_amount;
  }
  return { recurring, oneTime, loan };
}

function formatInr(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export function Results() {
  const { matches, nearMisses } = useResults();

  if (matches.length === 0) {
    return (
      <div className="text-center">
        <p className="text-gray-600">No results yet.</p>
        <Link to="/profile" className="text-brand-600 underline">Fill in your profile</Link>
      </div>
    );
  }

  const { recurring, oneTime, loan } = sumBenefits(matches);
  const bannerLines: string[] = [];
  if (recurring > 0) bannerLines.push(`up to ${formatInr(recurring)} per year in direct benefits`);
  if (oneTime > 0) bannerLines.push(`${formatInr(oneTime)} in one-time grants`);
  if (loan > 0) bannerLines.push(`access to ${formatInr(loan)} in loans`);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">
        {matches.length} scheme{matches.length !== 1 ? "s" : ""} you may be eligible for
      </h1>
      <p className="mb-4 text-sm text-gray-500">
        Always verify final eligibility on the scheme's official portal before applying.
      </p>
      {bannerLines.length > 0 && (
        <div className="mb-6 rounded-xl bg-green-50 p-4 text-green-800">
          <p className="font-medium">Based on your matches, you may be eligible for {bannerLines.join(", plus ")}.</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {matches.map((s) => (
          <SchemeCard key={s.scheme_id} scheme={s} />
        ))}
      </div>
      {nearMisses.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">You're close to qualifying for these</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {nearMisses.map((n) => (
              <div key={n.scheme_id} className="rounded-xl border border-dashed bg-white p-4">
                <span className="text-xs font-medium text-gray-500">{n.category}</span>
                <h3 className="font-semibold text-gray-900">{n.name}</h3>
                <p className="mt-1 text-sm text-amber-700">{n.blocking_reason}</p>
                <a
                  href={n.official_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm text-brand-600 hover:underline"
                >
                  Official site
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
