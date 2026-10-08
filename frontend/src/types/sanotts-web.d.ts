// sanotts-web ships no TypeScript types — minimal ambient declaration for the
// surface used by src/lib/speech.ts.
declare module "sanotts-web" {
  interface SanoTtsInstance {
    synthesize(text: string, opts: { voice: string }): Promise<unknown>;
  }
  export const SanoTTS: { load(opts?: { assetBase?: string }): Promise<SanoTtsInstance> };
  export function playAudio(result: unknown, opts?: { audioContext?: AudioContext }): void;
}
