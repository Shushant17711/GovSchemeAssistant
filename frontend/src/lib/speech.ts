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

// sanoTTS pre-allocates its output buffer as sampleRate * maxSeconds and fails
// (error -11, "frames*HOP would exceed out_cap") if the rendered audio would
// exceed it. Its own default is 20s, which a multi-sentence explanation easily
// exceeds — this is what was actually causing "no sound at all" silently
// failing over to the (also broken, no-OS-voices) browser fallback.
const MAX_SPEECH_SECONDS = 90;

let sanoTtsLoad: Promise<{
  tts: { synthesize: (text: string, opts: { voice: string; maxSeconds: number }) => Promise<unknown> };
  playAudio: (result: unknown, opts?: { audioContext?: AudioContext }) => void;
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

// Browsers suspend a newly-created AudioContext unless it's created/resumed
// synchronously inside a user-gesture handler (a click). sanoTTS's synthesize()
// does an async fetch + wasm compute first, so by the time playAudio() would
// create its own AudioContext, the gesture is stale and audio silently never
// plays (no error, nothing). Fix: the caller creates+resumes this context
// synchronously in its onClick, *before* calling speak(), and we reuse it here.
export function createSpeechAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return Ctor ? new Ctor() : null;
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

export type SpeakOutcome = { engine: "sanotts" | "browser" } | { engine: "none"; error: string };

export async function speak(
  text: string,
  language: LanguageCode,
  audioContext?: AudioContext | null
): Promise<SpeakOutcome> {
  const voice = SANO_VOICE[language];
  if (voice) {
    try {
      const { tts, playAudio } = await loadSanoTts();
      const result = await tts.synthesize(text, { voice, maxSeconds: MAX_SPEECH_SECONDS });
      if (audioContext && audioContext.state === "suspended") {
        await audioContext.resume().catch(() => {});
      }
      playAudio(result, audioContext ? { audioContext } : undefined);
      return { engine: "sanotts" };
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[speech] sanoTTS failed, falling back to browser TTS:", err);
    }
  }
  if (isSpeechSynthesisSupported()) {
    speakWithBrowser(text, language);
    return { engine: "browser" };
  }
  return { engine: "none", error: "No text-to-speech engine is available in this browser." };
}
