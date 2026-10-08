import { Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getProviders } from "../lib/api";
import { useSettings } from "../context/SettingsContext";
import type { ProviderOption } from "../lib/types";

export function SettingsPanel() {
  const { settings, setProvider, setModelForProvider, reset } = useSettings();
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [modelInput, setModelInput] = useState("");

  useEffect(() => {
    getProviders()
      .then((res) => setProviders(res.providers))
      .catch(() => {});
  }, []);

  // Whenever the selected provider changes, show the model remembered for it (if any).
  useEffect(() => {
    if (settings.provider) {
      setModelInput(settings.modelsByProvider[settings.provider] ?? "");
    } else {
      setModelInput("");
    }
  }, [settings.provider, settings.modelsByProvider]);

  function onProviderChange(id: string) {
    setProvider(id || null);
  }

  function saveModel() {
    if (settings.provider && modelInput.trim()) {
      setModelForProvider(settings.provider, modelInput.trim());
    }
    setOpen(false);
  }

  function doReset() {
    reset();
    setModelInput("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-brand-600"
        aria-label="LLM settings"
      >
        <Settings className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-lg border bg-white p-4 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">AI provider</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          <label className="mb-1 block text-xs font-medium text-gray-600">Provider</label>
          <select
            value={settings.provider ?? ""}
            onChange={(e) => onProviderChange(e.target.value)}
            className="mb-3 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          >
            <option value="">Default (server-configured)</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id} disabled={!p.available}>
                {p.label}{!p.available ? " (not configured)" : ""}
              </option>
            ))}
          </select>

          {settings.provider && (
            <>
              <label className="mb-1 block text-xs font-medium text-gray-600">Model name</label>
              <input
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                placeholder="e.g. llama-3.3-70b-versatile"
                className="mb-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
              />
              <p className="mb-3 text-xs text-gray-400">
                Remembered per provider — switch providers and back, and this comes back automatically.
              </p>
            </>
          )}

          <div className="flex gap-2">
            <button
              onClick={saveModel}
              className="flex-1 rounded-md bg-brand-600 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Save
            </button>
            <button
              onClick={doReset}
              className="flex-1 rounded-md border border-gray-300 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
