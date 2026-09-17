import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { LlmSettings } from "../lib/types";

const STORAGE_KEY = "scheme-setu-llm-settings-v2";
const DEFAULT_SETTINGS: LlmSettings = { provider: null, modelsByProvider: {} };

interface SettingsContextValue {
  settings: LlmSettings;
  setProvider: (provider: string | null) => void;
  setModelForProvider: (provider: string, model: string) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function loadSettings(): LlmSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      provider: parsed.provider ?? null,
      modelsByProvider: parsed.modelsByProvider ?? {},
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persist(settings: LlmSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable — setting still works for this session via state
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LlmSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function setProvider(provider: string | null) {
    setSettings((prev) => {
      const next = { ...prev, provider };
      persist(next);
      return next;
    });
  }

  function setModelForProvider(provider: string, model: string) {
    setSettings((prev) => {
      const next = { ...prev, modelsByProvider: { ...prev.modelsByProvider, [provider]: model } };
      persist(next);
      return next;
    });
  }

  function reset() {
    setSettings(DEFAULT_SETTINGS);
    persist(DEFAULT_SETTINGS);
  }

  return (
    <SettingsContext.Provider value={{ settings, setProvider, setModelForProvider, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
