import { Settings, X } from "lucide-react";
import { useState } from "react";
import { useSettings } from "../context/SettingsContext";

export function SettingsPanel() {
  const { settings, setSettings, reset } = useSettings();
  const [open, setOpen] = useState(false);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl ?? "");
  const [model, setModel] = useState(settings.model ?? "");

  function save() {
    setSettings({ baseUrl: baseUrl.trim() || null, model: model.trim() || null });
    setOpen(false);
  }

  function doReset() {
    reset();
    setBaseUrl("");
    setModel("");
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
            <h3 className="text-sm font-semibold text-gray-900">AI settings</h3>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Base URL</label>
          <input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.groq.com/openai/v1"
            className="mb-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
          <p className="mb-3 text-xs text-gray-400">
            Only api.groq.com, api.openai.com, or openrouter.ai are accepted — other URLs are ignored for security.
          </p>
          <label className="mb-1 block text-xs font-medium text-gray-600">Model</label>
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="llama-3.3-70b-versatile"
            className="mb-3 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
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
