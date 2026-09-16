import { Link } from "react-router-dom";
import { SchemeCard } from "../components/SchemeCard";
import { useResults } from "../context/ResultsContext";

export function Results() {
  const { matches } = useResults();

  if (matches.length === 0) {
    return (
      <div className="text-center">
        <p className="text-gray-600">No results yet.</p>
        <Link to="/profile" className="text-brand-600 underline">Fill in your profile</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-900">
        {matches.length} scheme{matches.length !== 1 ? "s" : ""} you may be eligible for
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Always verify final eligibility on the scheme's official portal before applying.
      </p>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {matches.map((s) => (
          <SchemeCard key={s.scheme_id} scheme={s} />
        ))}
      </div>
    </div>
  );
}
