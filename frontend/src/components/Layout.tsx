import { Landmark } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { LanguageSelector } from "./LanguageSelector";
import { SettingsPanel } from "./SettingsPanel";

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-brand-700">
            <Landmark className="h-6 w-6" />
            <span>Scheme Setu</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-gray-600">
            <Link to="/profile" className="hover:text-brand-600">Find my schemes</Link>
            <Link to="/browse" className="hover:text-brand-600">Browse all</Link>
            <Link to="/scam-check" className="hover:text-brand-600">Scam check</Link>
            <LanguageSelector />
            <SettingsPanel />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
