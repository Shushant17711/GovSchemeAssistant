import { createContext, useContext, useState, type ReactNode } from "react";
import type { MatchedScheme, NearMissScheme } from "../lib/types";

interface ResultsContextValue {
  matches: MatchedScheme[];
  nearMisses: NearMissScheme[];
  setResults: (matches: MatchedScheme[], nearMisses: NearMissScheme[]) => void;
}

const ResultsContext = createContext<ResultsContextValue | undefined>(undefined);

export function ResultsProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<MatchedScheme[]>([]);
  const [nearMisses, setNearMisses] = useState<NearMissScheme[]>([]);

  function setResults(m: MatchedScheme[], n: NearMissScheme[]) {
    setMatches(m);
    setNearMisses(n);
  }

  return (
    <ResultsContext.Provider value={{ matches, nearMisses, setResults }}>{children}</ResultsContext.Provider>
  );
}

export function useResults() {
  const ctx = useContext(ResultsContext);
  if (!ctx) throw new Error("useResults must be used within ResultsProvider");
  return ctx;
}
