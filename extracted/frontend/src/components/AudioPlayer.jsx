import React from 'react';
import { X, Play, Pause, Loader2 } from 'lucide-react';

function formatTime(s) {
  if (!s || isNaN(s)) return '00:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function AudioPlayer({ speaking, paused, loading, currentTime, duration, onPause, onResume, onStop }) {
  if (!speaking && !loading) return null;

  const bars = Array.from({ length: 28 });

  return (
    <div className="px-3 pb-2">
      <div className="flex items-center gap-2.5 px-3 h-12 rounded-2xl bg-card border border-border shadow-sm">
        <button onClick={onStop} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-accent transition-colors shrink-0 text-muted-foreground">
          <X size={16} />
        </button>
        <div className="flex items-center gap-[2px] h-6 flex-1 overflow-hidden">
          {bars.map((_, i) => {
            const baseHeight = 25 + ((i * 37) % 60);
            return (
              <div
                key={i}
                className="flex-1 rounded-full bg-primary min-w-[2px]"
                style={{
                  height: `${baseHeight}%`,
                  opacity: paused ? 0.3 : 0.85,
                  animation: loading
                    ? 'none'
                    : `ttsWave 0.7s ease-in-out ${((i % 7) * 0.08).toFixed(2)}s infinite alternate`,
                  animationPlayState: paused ? 'paused' : 'running',
                }}
              />
            );
          })}
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums shrink-0 w-10 text-center">
          {loading ? '...' : formatTime(currentTime)}
        </span>
        <button
          onClick={paused ? onResume : onPause}
          disabled={loading}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0 disabled:opacity-50 active:scale-95 transition-transform"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : paused ? <Play size={15} className="ms-0.5" /> : <Pause size={15} />}
        </button>
      </div>
    </div>
  );
}