import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { LlmSettings } from "../lib/types";

const STORAGE_KEY = "scheme-setu-llm-settings";
const DEFAULT_SETTINGS: LlmSettings = { baseUrl: null, model: null };

interface SettingsContextValue {
  settings: LlmSettings;
  setSettings: (s: LlmSettings) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function loadSettings(): LlmSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { baseUrl: parsed.baseUrl ?? null, model: parsed.model ?? null };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<LlmSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettingsState(loadSettings());
  }, []);

  function setSettings(s: LlmSettings) {
    setSettingsState(s);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      // localStorage unavailable — setting still works for this session via state
    }
  }

  function reset() {
    setSettings(DEFAULT_SETTINGS);
  }

  return <SettingsContext.Provider value={{ settings, setSettings, reset }}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
