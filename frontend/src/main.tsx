import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { LanguageProvider } from "./context/LanguageContext.tsx";
import { ResultsProvider } from "./context/ResultsContext.tsx";
import { SettingsProvider } from "./context/SettingsContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <SettingsProvider>
          <ResultsProvider>
            <App />
          </ResultsProvider>
        </SettingsProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>
);
