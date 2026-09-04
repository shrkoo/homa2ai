// Native Android TTS bridge for Homa AI.
//
// The Android WebView wrapper must inject a JavascriptInterface named "HomaTTS"
// (via webView.addJavascriptInterface(ttsBridge, "HomaTTS")) exposing:
//   - boolean isAvailable()
//   - String[] getLanguages()
//   - void speak(String text, String lang, double rate, double volume, String id)
//   - void stop()
//
// When speech finishes (or errors), the native side MUST call back into the
// WebView with: evaluateJavascript("window.__homaTtsResolve('<id>', <true|false>)", null)
//
// This file is the web-side half. The native Android half (Kotlin/Java) is NOT
// part of this web project and must be added to the Android wrapper — see the
// report for the exact files that need changing.

let callbackId = 0;
const pending = {};

if (typeof window !== 'undefined') {
  // Native side calls this to resolve a speak() promise.
  window.__homaTtsResolve = (id, success) => {
    const cb = pending[id];
    if (cb) {
      delete pending[id];
      cb(success === true || success === 'true');
    }
  };
}

export function isNativeTTSAvailable() {
  try {
    return (
      typeof window !== 'undefined' &&
      !!window.HomaTTS &&
      typeof window.HomaTTS.speak === 'function' &&
      typeof window.HomaTTS.isAvailable === 'function' &&
      window.HomaTTS.isAvailable()
    );
  } catch {
    return false;
  }
}

export function getNativeLanguages() {
  try {
    if (isNativeTTSAvailable()) {
      const langs = window.HomaTTS.getLanguages();
      return Array.isArray(langs) ? langs : [];
    }
    return [];
  } catch {
    return [];
  }
}

// Speak via native Android TTS. Resolves true on success, false on failure/timeout.
export function nativeSpeak(text, lang = 'fa-IR', rate = 0.9, volume = 1) {
  return new Promise((resolve) => {
    try {
      if (!isNativeTTSAvailable()) { resolve(false); return; }
      const id = String(++callbackId);
      pending[id] = resolve;
      window.HomaTTS.speak(text, lang, rate, volume, id);
      // Safety timeout: resolve false if native never calls back.
      // 30s hard cap, plus a 5s "no callback" check that does NOT abort native speech
      // (some Android TTS engines take a moment to start).
      setTimeout(() => {
        if (pending[id]) { /* still pending after 5s — keep waiting, native may still fire */ }
      }, 5000);
      setTimeout(() => {
        if (pending[id]) { pending[id](false); delete pending[id]; }
      }, 30000);
    } catch {
      resolve(false);
    }
  });
}

export function nativeStop() {
  try {
    if (isNativeTTSAvailable()) window.HomaTTS.stop();
  } catch {}
}