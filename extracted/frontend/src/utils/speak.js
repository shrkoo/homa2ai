// Browser-native TTS for Homa AI alarms — uses window.speechSynthesis.
// No Base44 runtime dependency, no network, works offline.
// Persian/Kurdish/English aware; picks the best available system voice.
//
// IMPORTANT: Browser/WebView TTS reliability varies by device and OS locale.
// On Android WebView, speechSynthesis may be unavailable or produce no audio
// when the app is backgrounded or the screen is locked. This module logs every
// step to console ([HOMA VOICE]) so failures are never silent.

import { isNativeTTSAvailable, nativeSpeak, nativeStop } from '@/utils/nativeTTS';

let cachedVoices = null;
let activeUtterance = null; // strong ref so the utterance isn't GC'd mid-speech

function loadVoices() {
  try {
    if (!window.speechSynthesis) return [];
    if (cachedVoices && cachedVoices.length) return cachedVoices;
    cachedVoices = window.speechSynthesis.getVoices() || [];
    return cachedVoices;
  } catch { return []; }
}

try {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => { cachedVoices = window.speechSynthesis.getVoices() || []; };
  }
} catch {}

function pickVoice(lang) {
  const voices = loadVoices();
  if (!voices.length) return null;
  const code = lang === 'fa' ? 'fa' : lang === 'ku' ? 'ku' : 'en';
  const exact = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith(code));
  return exact || voices[0];
}

function langCode(lang) {
  if (lang === 'fa') return 'fa-IR';
  if (lang === 'ku') return 'ku';
  return 'en-US';
}

function logVoice(stage, extra = {}) {
  console.log('[HOMA VOICE]', stage, extra);
}

// Speak text using the browser's native speech synthesis. Resolves when done.
export function speakText(text, lang = 'fa') {
  return new Promise((resolve) => {
    const trimmed = (text || '').trim();
    logVoice('speakText', {
      text: trimmed.slice(0, 80),
      lang,
      available: !!window.speechSynthesis,
    });
    try {
      if (!window.speechSynthesis || !trimmed) {
        logVoice('skip', { reason: !window.speechSynthesis ? 'no_speechSynthesis' : 'empty_text' });
        resolve(false);
        return;
      }
      // Cancel anything in flight, then speak SYNCHRONOUSLY.
      // iOS Safari requires speak() to run inside the user-gesture call chain;
      // wrapping it in setTimeout breaks that chain and produces no audio.
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(trimmed);
      u.lang = langCode(lang);
      const v = pickVoice(lang);
      if (v) u.voice = v;
      u.rate = 0.9;
      u.pitch = 1;
      u.volume = 1;
      activeUtterance = u; // prevent GC before speech finishes
      logVoice('utterance created', { lang: u.lang, rate: u.rate, volume: u.volume, voice: v?.name || 'default' });
      let resolved = false;
      const done = (ok) => { if (!resolved) { resolved = true; activeUtterance = null; resolve(ok); } };
      u.onstart = () => logVoice('speech started');
      u.onend = () => { logVoice('speech ended'); done(true); };
      u.onerror = (e) => { logVoice('speech error', { error: e?.error || 'unknown' }); done(false); };
      // Call speak() synchronously — no setTimeout — to preserve the gesture chain on iOS.
      window.speechSynthesis.speak(u);
      // Safety net: some WebViews never fire onend/onerror. Resolve after a generous window.
      const safeMs = Math.max(8000, trimmed.length * 120);
      setTimeout(() => done(false), safeMs);
    } catch (e) {
      logVoice('exception', { error: e?.message });
      resolve(false);
    }
  });
}

// User-facing Persian error messages for TTS failures (shown as toasts, not just console).
export const VOICE_ERROR_MESSAGES = {
  no_speechSynthesis: 'مرورگر این دستگاه از پخش صدا پشتیبانی نمی‌کند. لطفاً در مرورگر دیگری امتحان کنید.',
  no_voice: 'صدای فارسی روی دستگاه نصب نیست. با صدای پیش‌فرض پخش می‌شود.',
  speak_failed: 'پخش صدا ناموفق بود. دوباره تلاش کنید — اگر نشد، صدا دستگاه را چک کنید.',
  empty_text: 'متن صوتی خالی است.',
};

// Speak a Homa voice reminder: prefixes "هُما: " and speaks the given text.
// text should already be the resolved fallback (voiceText → message → title).
// Returns { ok: boolean, error: string|null } so callers can show user-facing toasts.
export async function speakHomaReminder(text, lang = 'fa') {
  const selected = (text || '').trim();
  const langFull = lang === 'fa' ? 'fa-IR' : lang === 'ku' ? 'ku' : 'en-US';
  logVoice('speakHomaReminder', {
    voiceEnabled: true,
    selectedText: selected.slice(0, 100),
    nativeAvailable: isNativeTTSAvailable(),
    browserAvailable: isSpeechSupported(),
    lang: langFull,
  });
  if (!selected) {
    logVoice('fallback', { reason: 'empty — no voiceText/message/title' });
    return { ok: false, error: 'empty_text' };
  }
  const spoken = `هُما: ${selected}`;
  // 1. Native Android TTS bridge (preferred path on Android WebView)
  if (isNativeTTSAvailable()) {
    logVoice('native TTS — attempting', { lang: langFull });
    const nativeOk = await nativeSpeak(spoken, langFull, 0.9, 1);
    logVoice('native TTS result', { ok: nativeOk });
    if (nativeOk) return { ok: true, error: null, via: 'native' };
    logVoice('native TTS failed — falling back to browser');
  }
  // 2. Browser speechSynthesis fallback
  if (!isSpeechSupported()) {
    logVoice('skip', { reason: 'no native bridge and no speechSynthesis' });
    return { ok: false, error: 'no_speechSynthesis' };
  }
  const ok = await speakText(spoken, lang);
  const error = ok ? null : 'speak_failed';
  logVoice('result', { ok, error, via: 'browser' });
  return { ok, error, via: 'browser' };
}

export function stopSpeech() {
  try {
    nativeStop();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      logVoice('stopSpeech');
    }
  } catch {}
}

export function isSpeechSupported() {
  return typeof window !== 'undefined' && !!window.speechSynthesis && !!window.SpeechSynthesisUtterance;
}