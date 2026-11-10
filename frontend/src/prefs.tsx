import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { detectLang, langInfo, translate } from './i18n';
import type { LangCode, StringKey } from './i18n';

// User preferences: interface language, how Jeff looks, and how Jeff sounds.
// Saved in localStorage so they survive a reload (and quietly skipped if storage is blocked).

export type Gender = 'masculine' | 'feminine';
export type SkinTone = 'light' | 'medium' | 'tan' | 'deep';
export type HairColor = 'brown' | 'black' | 'auburn' | 'blonde' | 'gray';

export interface JeffLook { gender: Gender; skin: SkinTone; hair: HairColor }
export interface VoicePrefs { enabled: boolean; voiceURI: string | null; pitch: number; rate: number }
export interface Prefs { lang: LangCode; look: JeffLook; voice: VoicePrefs }

export const SKIN_TONES: Record<SkinTone, { base: string; shade: string }> = {
  light: { base: '#f3d2b8', shade: '#e0b394' },
  medium: { base: '#e8b794', shade: '#d6a07e' },
  tan: { base: '#c98d64', shade: '#b0744e' },
  deep: { base: '#8a5a3c', shade: '#71462d' },
};

export const HAIR_COLORS: Record<HairColor, string> = {
  brown: '#3a2a20',
  black: '#17120f',
  auburn: '#7a3420',
  blonde: '#c9a15a',
  gray: '#8f8d8a',
};

export const DEFAULT_LOOK: JeffLook = { gender: 'masculine', skin: 'medium', hair: 'brown' };
export const DEFAULT_VOICE: VoicePrefs = { enabled: false, voiceURI: null, pitch: 1, rate: 0.98 };

const KEY = 'jeff.prefs.v1';

function load(): Prefs {
  const fallback: Prefs = { lang: detectLang(), look: DEFAULT_LOOK, voice: DEFAULT_VOICE };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const p = JSON.parse(raw) as Partial<Prefs>;
    return {
      lang: p.lang ?? fallback.lang,
      look: { ...DEFAULT_LOOK, ...p.look },
      voice: { ...DEFAULT_VOICE, ...p.voice },
    };
  } catch {
    return fallback;
  }
}

interface PrefsApi extends Prefs {
  setLang: (l: LangCode) => void;
  setLook: (l: Partial<JeffLook>) => void;
  setVoice: (v: Partial<VoicePrefs>) => void;
  t: (key: StringKey) => string;
}

const Ctx = createContext<PrefsApi | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* storage blocked: keep in memory only */ }
  }, [prefs]);

  // Keep <html lang/dir> in sync so screen readers and right-to-left scripts behave.
  useEffect(() => {
    const info = langInfo(prefs.lang);
    document.documentElement.lang = info.code;
    document.documentElement.dir = info.dir;
  }, [prefs.lang]);

  const setLang = useCallback((lang: LangCode) => setPrefs((p) => ({ ...p, lang })), []);
  const setLook = useCallback((look: Partial<JeffLook>) => setPrefs((p) => ({ ...p, look: { ...p.look, ...look } })), []);
  const setVoice = useCallback((voice: Partial<VoicePrefs>) => setPrefs((p) => ({ ...p, voice: { ...p.voice, ...voice } })), []);
  const t = useCallback((key: StringKey) => translate(prefs.lang, key), [prefs.lang]);

  const value = useMemo(() => ({ ...prefs, setLang, setLook, setVoice, t }), [prefs, setLang, setLook, setVoice, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs(): PrefsApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePrefs must be used inside <PrefsProvider>');
  return v;
}

// ---------- read-aloud voices ----------

export const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Voices the browser offers, refreshed when it finishes loading them. */
export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => (hasSpeech ? window.speechSynthesis.getVoices() : []));
  useEffect(() => {
    if (!hasSpeech) return;
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);
  return voices;
}

export function voicesFor(voices: SpeechSynthesisVoice[], lang: LangCode) {
  return voices.filter((v) => v.lang.toLowerCase().startsWith(lang));
}

// Common names of built-in female voices (macOS, Windows, Chrome). Only used to pick a sensible
// default when the user hasn't chosen a voice; any voice can still be picked by hand.
const FEMININE_HINTS = /female|woman|samantha|victoria|karen|moira|tessa|fiona|allison|ava|susan|zira|hazel|monica|paulina|m[oó]nica|helena|lucia|amelie|am[eé]lie|audrey|marie|julie|anna|petra|luciana|joana|francisca|ting-?ting|mei-?jia|sin-?ji|xiaoxiao|lekha|kalpana|swara|heera|hoda|zariyah|laila|salma/i;
const MASCULINE_HINTS = /\bmale\b|daniel|alex|fred|tom|aaron|arthur|david|mark|george|james|jorge|diego|pablo|juan|thomas|nicolas|markus|yannick|stefan|li-?mu|kangkang|yunxi|rishi|hemant|ravi|maged|tarik|naayf|hamed/i;

export function pickVoice(voices: SpeechSynthesisVoice[], prefs: Prefs): SpeechSynthesisVoice | null {
  const matching = voicesFor(voices, prefs.lang);
  const chosen = matching.find((v) => v.voiceURI === prefs.voice.voiceURI);
  if (chosen) return chosen;
  if (!matching.length) return null;
  const hint = prefs.look.gender === 'feminine' ? FEMININE_HINTS : MASCULINE_HINTS;
  return matching.find((v) => hint.test(v.name)) ?? matching.find((v) => v.default) ?? matching[0];
}

/** Read text aloud with the user's chosen voice, pitch and speed. */
export function speak(text: string, prefs: Prefs, voices: SpeechSynthesisVoice[], handlers: { onstart?: () => void; onend?: () => void } = {}) {
  if (!hasSpeech) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = langInfo(prefs.lang).speech;
  const v = pickVoice(voices, prefs);
  if (v) u.voice = v;
  u.pitch = prefs.voice.pitch;
  u.rate = prefs.voice.rate;
  u.onstart = () => handlers.onstart?.();
  u.onend = () => handlers.onend?.();
  u.onerror = () => handlers.onend?.();
  window.speechSynthesis.speak(u);
}
