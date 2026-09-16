import { createContext, useContext, useState, type ReactNode } from "react";
import type { MatchedScheme } from "../lib/types";

interface ResultsContextValue {
  matches: MatchedScheme[];
  setMatches: (m: MatchedScheme[]) => void;
}

const ResultsContext = createContext<ResultsContextValue | undefined>(undefined);

export function ResultsProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<MatchedScheme[]>([]);
  return <ResultsContext.Provider value={{ matches, setMatches }}>{children}</ResultsContext.Provider>;
}

export function useResults() {
  const ctx = useContext(ResultsContext);
  if (!ctx) throw new Error("useResults must be used within ResultsProvider");
  return ctx;
}
