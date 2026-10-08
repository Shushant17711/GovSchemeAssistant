import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getLanguages } from "../lib/api";
import type { LanguageCode, LanguageOption } from "../lib/types";

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  options: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [options, setOptions] = useState<LanguageOption[]>([{ code: "en", label: "English" }]);

  useEffect(() => {
    getLanguages()
      .then((res) => setOptions(res.languages))
      .catch(() => {});
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, options }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
