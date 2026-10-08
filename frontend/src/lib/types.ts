export type LanguageCode = "en" | "hi" | "bn" | "ta" | "te" | "mr";

export interface Profile {
  age: number;
  annual_income: number;
  state: string;
  occupation: string;
  social_category: string;
  gender: "male" | "female" | "other";
  disability: boolean;
}

export interface MatchedScheme {
  scheme_id: string;
  name: string;
  category: string;
  why_matched: string[];
  documents_required: string[];
  benefits: string;
  official_url: string;
  benefit_amount: number | null;
  benefit_frequency: "annual" | "one_time" | "loan_ceiling" | "monthly" | "non_monetary";
}

export interface SchemeSummary {
  scheme_id: string;
  name: string;
  category: string;
  description: string;
  ministry: string;
}

export interface LanguageOption {
  code: LanguageCode;
  label: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface NearMissScheme {
  scheme_id: string;
  name: string;
  category: string;
  blocking_reason: string;
  official_url: string;
}

export interface ProviderOption {
  id: string;
  label: string;
  available: boolean;
}

export interface LlmSettings {
  provider: string | null;
  modelsByProvider: Record<string, string>;
}

export interface ScamMatchedScheme {
  scheme_id: string;
  name: string;
  real_benefit: string;
}

export interface ScamCheckResult {
  risk_level: "low" | "medium" | "high";
  reasons: string[];
  matched_scheme: ScamMatchedScheme | null;
  disclaimer: string;
}
