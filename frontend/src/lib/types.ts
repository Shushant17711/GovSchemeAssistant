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
