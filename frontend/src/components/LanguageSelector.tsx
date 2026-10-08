import { Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function LanguageSelector() {
  const { language, setLanguage, options } = useLanguage();
  return (
    <div className="flex items-center gap-2 text-sm">
      <Languages className="h-4 w-4 text-brand-600" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as typeof language)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-700 focus:border-brand-500 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
