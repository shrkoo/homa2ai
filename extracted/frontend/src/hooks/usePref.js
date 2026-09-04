import { useState, useCallback } from 'react';

export function usePref(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v === null ? defaultValue : JSON.parse(v);
    } catch {
      return defaultValue;
    }
  });
  const set = useCallback((next) => {
    setValue((prev) => {
      const v = typeof next === 'function' ? next(prev) : next;
      try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
      return v;
    });
  }, [key]);
  return [value, set];
}