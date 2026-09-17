import type { LanguageCode } from "./types";

// The Web Speech API is not part of TypeScript's default DOM lib — minimal ambient
// declarations for just the surface this file uses.
interface SpeechRecognitionResultLike {
  transcript: string;
}
interface SpeechRecognitionEventLike {
  results: { [index: number]: { [index: number]: SpeechRecognitionResultLike } };
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  start(): void;
  stop(): void;
}

const BCP47: Record<LanguageCode, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
};

// The Web Speech API's SpeechRecognition is still vendor-prefixed in Chrome.
type SpeechRecognitionCtor = new () => SpeechRecognition;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// sanoTTS (https://github.com/Ampixa/sanoTTS) is a tiny neural TTS that runs fully
// in-browser via WebAssembly — no OS-level voice pack needed, unlike the Web Speech
// API below, which silently does nothing on a system with no TTS voices installed.
// It only ships voices for English ("amy") and Hindi ("hindi") among our 6 languages;
// the other 4 fall back to the Web Speech API.
const SANO_VOICE: Partial<Record<LanguageCode, string>> = {
  en: "amy",
  hi: "hindi",
};

let sanoTtsLoad: Promise<{
  tts: { synthesize: (text: string, opts: { voice: string }) => Promise<unknown> };
  playAudio: (result: unknown) => void;
}> | null = null;

function loadSanoTts() {
  if (!sanoTtsLoad) {
    sanoTtsLoad = import("sanotts-web").then(async (mod) => ({
      tts: await mod.SanoTTS.load(),
      playAudio: mod.playAudio,
    }));
  }
  return sanoTtsLoad;
}

export function canSpeak(language: LanguageCode): boolean {
  return language in SANO_VOICE || isSpeechSynthesisSupported();
}

export function startListening(
  language: LanguageCode,
  onResult: (text: string) => void,
  onError?: (message: string) => void
): () => void {
  const Ctor = getRecognitionCtor();
  if (!Ctor) {
    onError?.("Speech recognition is not supported in this browser.");
    return () => {};
  }
  const recognition = new Ctor();
  recognition.lang = BCP47[language];
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript;
    if (transcript) onResult(transcript);
  };
  recognition.onerror = (event) => {
    onError?.(`Could not hear you (${event.error}). Try again or type instead.`);
  };

  recognition.start();
  return () => recognition.stop();
}

function speakWithBrowser(text: string, language: LanguageCode): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = BCP47[language];
  window.speechSynthesis.speak(utterance);
}

export async function speak(text: string, language: LanguageCode): Promise<void> {
  const voice = SANO_VOICE[language];
  if (voice) {
    try {
      const { tts, playAudio } = await loadSanoTts();
      const result = await tts.synthesize(text, { voice });
      playAudio(result);
      return;
    } catch {
      // sanoTTS unavailable (offline, blocked asset host, etc.) — fall back below.
    }
  }
  speakWithBrowser(text, language);
}
