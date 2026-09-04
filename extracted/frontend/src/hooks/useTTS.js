import { useRef, useState, useEffect, useCallback } from 'react';
import { usePref } from '@/hooks/usePref';
import { isNativeTTSAvailable, nativeSpeak, nativeStop } from '@/utils/nativeTTS';
import { toast } from '@/components/ui/use-toast';

// Browser-native TTS hook for Homa AI chat messages.
// Priority: Native Android TTS bridge → browser speechSynthesis.
// CRITICAL: speechSynthesis.speak() MUST be called synchronously within the
// user gesture chain — any await/setTimeout before it breaks audio on mobile.
export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentMsgId, setCurrentMsgId] = useState(null);

  const speakingRef = useRef(false);
  const currentMsgIdRef = useRef(null);
  const utteranceRef = useRef(null);
  const resumeHackRef = useRef(null);
  const safetyTimerRef = useRef(null);

  const [speed] = usePref('homa_tts_speed', 1);

  useEffect(() => { currentMsgIdRef.current = currentMsgId; }, [currentMsgId]);

  const clearResumeHack = () => {
    if (resumeHackRef.current) { clearInterval(resumeHackRef.current); resumeHackRef.current = null; }
  };

  const clearSafety = () => {
    if (safetyTimerRef.current) { clearTimeout(safetyTimerRef.current); safetyTimerRef.current = null; }
  };

  // Chrome stops speechSynthesis after ~15s — pause/resume hack keeps it alive.
  const startResumeHack = () => {
    clearResumeHack();
    resumeHackRef.current = setInterval(() => {
      try {
        if (window.speechSynthesis?.speaking && !window.speechSynthesis?.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      } catch {}
    }, 10000);
  };

  const resetState = useCallback(() => {
    clearResumeHack();
    clearSafety();
    speakingRef.current = false;
    setSpeaking(false);
    setPaused(false);
    setCurrentMsgId(null);
    currentMsgIdRef.current = null;
    utteranceRef.current = null;
  }, []);

  const stop = useCallback(() => {
    if (isNativeTTSAvailable()) nativeStop();
    if ('speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch {} }
    resetState();
  }, [resetState]);

  const pause = () => {
    if ('speechSynthesis' in window) { try { window.speechSynthesis.pause(); } catch {} }
    setPaused(true);
  };

  const resume = () => {
    if ('speechSynthesis' in window) { try { window.speechSynthesis.resume(); } catch {} }
    setPaused(false);
  };

  // Browser speechSynthesis — fully synchronous, no awaits.
  const speakBrowser = (msgId, trimmed, lang, langFull) => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      currentMsgIdRef.current = null;
      setCurrentMsgId(null);
      return;
    }

    try {
      // Cancel any previous speech — but don't await, just fire
      window.speechSynthesis.cancel();

      // Get voices synchronously (may be empty on first call — browser uses default)
      const voices = window.speechSynthesis.getVoices() || [];

      const utterance = new SpeechSynthesisUtterance(trimmed);
      utterance.lang = langFull;
      utterance.rate = speed || 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      const matchVoice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(lang));
      if (matchVoice) utterance.voice = matchVoice;
      utteranceRef.current = utterance;

      speakingRef.current = true;
      setSpeaking(true);
      setPaused(false);

      utterance.onend = () => resetState();
      utterance.onerror = (ev) => {
        setError(true);
        resetState();
        toast({ title: 'پخش صدا ناموفق بود. دوباره تلاش کنید.' });
        console.warn('[HOMA TTS] speech error', ev?.error || 'unknown');
      };

      // MUST be called synchronously — no await/setTimeout before this line.
      // Any async boundary here breaks the user-gesture chain on mobile.
      window.speechSynthesis.speak(utterance);
      startResumeHack();

      // Safety: if onend/onerror never fires (some WebViews), reset after generous window.
      const safeMs = Math.max(10000, trimmed.length * 120);
      clearSafety();
      safetyTimerRef.current = setTimeout(() => {
        if (currentMsgIdRef.current === msgId) resetState();
      }, safeMs);
    } catch (e) {
      setError(true);
      resetState();
      toast({ title: 'پخش صدا ممکن نیست. مرورگر را بررسی کنید.' });
      console.warn('[HOMA TTS] speakBrowser exception', e?.message);
    }
  };

  // Main entry — async for .catch() compatibility, but browser path is synchronous.
  const speak = async (msgId, text, language) => {
    // If clicking the same message that's playing → toggle pause/resume
    if (currentMsgIdRef.current === msgId && speakingRef.current) {
      if (paused) { resume(); } else { pause(); }
      return;
    }
    // Stop any current playback
    stop();

    const trimmed = (text || '').trim();
    if (!trimmed) return;

    const lang = language === 'en' ? 'en' : language === 'ku' ? 'ku' : 'fa';
    const langFull = lang === 'fa' ? 'fa-IR' : lang === 'ku' ? 'ku' : 'en-US';

    setError(false);
    currentMsgIdRef.current = msgId;
    setCurrentMsgId(msgId);

    // 1. Native Android TTS bridge — fire-and-forget (no-op in browser preview)
    if (isNativeTTSAvailable()) {
      setLoading(true);
      speakingRef.current = true;
      setSpeaking(true);
      setPaused(false);
      nativeSpeak(trimmed, langFull, speed || 0.9, 1).then((ok) => {
        setLoading(false);
        if (ok) { resetState(); }
        else { resetState(); speakBrowser(msgId, trimmed, lang, langFull); }
      });
      return;
    }

    // 2. Browser speechSynthesis — synchronous, preserves user gesture
    speakBrowser(msgId, trimmed, lang, langFull);
  };

  // Preload voices on mount so they're ready for the first speak()
  useEffect(() => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
      } catch {}
    }
    return () => {
      if ('speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch {} }
      if (isNativeTTSAvailable()) nativeStop();
      clearResumeHack();
      clearSafety();
    };
  }, []);

  return { speaking, paused, loading, error, currentMsgId, currentTime: 0, duration: 0, speak, pause, resume, stop };
}