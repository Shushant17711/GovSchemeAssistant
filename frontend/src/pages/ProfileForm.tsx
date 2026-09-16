import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { matchProfile } from "../lib/api";
import { useResults } from "../context/ResultsContext";
import type { Profile } from "../lib/types";

const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Gujarat", "Haryana",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab",
  "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal",
];

export function ProfileForm() {
  const navigate = useNavigate();
  const { setResults } = useResults();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Profile>({
    age: 30,
    annual_income: 100000,
    state: "Maharashtra",
    occupation: "farmer",
    social_category: "General",
    gender: "male",
    disability: false,
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await matchProfile(form);
      setResults(res.matches, res.near_misses);
      navigate("/results");
    } catch {
      setError("Could not reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Tell us about yourself</h1>
      <form onSubmit={onSubmit} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700">Age</label>
          <input
            type="number"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Annual household income (₹)</label>
          <input
            type="number"
            value={form.annual_income}
            onChange={(e) => setForm({ ...form, annual_income: Number(e.target.value) })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">State</label>
          <select
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          >
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Occupation</label>
          <input
            type="text"
            value={form.occupation}
            onChange={(e) => setForm({ ...form, occupation: e.target.value })}
            placeholder="e.g. farmer, student, unemployed, small business owner"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Social category</label>
          <select
            value={form.social_category}
            onChange={(e) => setForm({ ...form, social_category: e.target.value })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          >
            {["General", "OBC", "SC", "ST", "EWS"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value as Profile["gender"] })}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-brand-500 focus:outline-none"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.disability}
            onChange={(e) => setForm({ ...form, disability: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-brand-600"
          />
          <label className="text-sm text-gray-700">I am a person with a disability</label>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Finding schemes..." : "Find my schemes"}
        </button>
      </form>
    </div>
  );
}
