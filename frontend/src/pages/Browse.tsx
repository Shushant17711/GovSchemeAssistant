import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listSchemes } from "../lib/api";
import type { SchemeSummary } from "../lib/types";

// Must match the exact category strings used in backend/data/schemes.json verbatim.
const CATEGORIES = [
  "Agriculture", "Health", "Housing", "Education", "Employment", "Women and Child",
  "Senior Citizens", "Disability", "MSME", "Financial Inclusion", "Food Security", "Skill Development",
];

export function Browse() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [schemes, setSchemes] = useState<SchemeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listSchemes(query || undefined, category || undefined)
      .then((res) => setSchemes(res.schemes))
      .finally(() => setLoading(false));
  }, [query, category]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Browse all schemes</h1>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search schemes, e.g. 'loan for small business'"
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {schemes.map((s) => (
            <Link
              key={s.scheme_id}
              to={`/scheme/${s.scheme_id}`}
              className="block rounded-xl border bg-white p-4 shadow-sm hover:shadow-md"
            >
              <span className="text-xs font-medium text-brand-600">{s.category}</span>
              <h3 className="font-semibold text-gray-900">{s.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-gray-600">{s.description}</p>
            </Link>
          ))}
          {schemes.length === 0 && <p className="text-gray-500">No schemes found.</p>}
        </div>
      )}
    </div>
  );
}
