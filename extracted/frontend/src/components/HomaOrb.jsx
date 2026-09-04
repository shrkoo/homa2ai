import React from 'react';
import './homa-orb.css';

const PARTICLES = [
  { angle: 15, dist: 58, delay: 0, dur: 8, size: 3 },
  { angle: 75, dist: 62, delay: 1.2, dur: 10, size: 2 },
  { angle: 130, dist: 55, delay: 2.4, dur: 9, size: 3 },
  { angle: 185, dist: 60, delay: 0.6, dur: 11, size: 2 },
  { angle: 245, dist: 64, delay: 1.8, dur: 8.5, size: 3 },
  { angle: 310, dist: 57, delay: 3, dur: 9.5, size: 2 },
];

export default function HomaOrb({ size = 120, state = 'idle', className = '' }) {
  const dim = typeof size === 'number' ? `${size}px` : size;
  return (
    <div
      className={`homa-orb ${className}`}
      data-state={state}
      style={{ width: dim, height: dim }}
      role="img"
      aria-label="Homa AI"
    >
      <div className="orb-ambient" />
      <div className="orb-aura" />
      <div className="orb-sphere">
        <div className="orb-surface" />
        <div className="orb-core" />
      </div>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="orb-particle"
          style={{
            '--p-angle': `${p.angle}deg`,
            '--p-dist': `${p.dist}%`,
            '--p-delay': `${p.delay}s`,
            '--p-dur': `${p.dur}s`,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
        />
      ))}
    </div>
  );
}