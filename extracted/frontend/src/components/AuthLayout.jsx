import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import HomaOrb from '@/components/HomaOrb';

export default function AuthLayout({ title, subtitle, footer, children, orbState = 'idle', orbSize = 110 }) {
  const navigate = useNavigate();

  return (
    <div className="dark min-h-dvh relative overflow-hidden">
      {/* Deep space gradient — dark slate to blue-purple */}
      <div className="fixed inset-0" style={{ background: 'linear-gradient(180deg, #1e2538 0%, #262d4d 45%, #334175 100%)' }} />

      {/* Soft ambient glow at top */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[130%] h-[50%] pointer-events-none lg:left-[25%]"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, hsl(217 91% 55% / 0.12) 0%, transparent 60%)' }}
      />

      {/* Close button */}
      <button
        onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/'); }}
        className="absolute top-[calc(env(safe-area-inset-top)+1rem)] end-4 z-20 w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.16] flex items-center justify-center transition-colors"
        aria-label="Close"
      >
        <X size={18} className="text-white/70" />
      </button>

      {/* Two-panel grid: visual world + auth form on desktop, single column on mobile */}
      <div className="relative z-10 min-h-dvh grid lg:grid-cols-2">

        {/* Left panel — Visual world (desktop only) */}
        <div className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center relative p-12">
          <div className="flex flex-col items-center gap-10">
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading text-3xl font-bold tracking-tight text-white">Homa</span>
              <span className="font-heading text-3xl font-bold tracking-tight text-primary">AI</span>
            </div>
            <div className="relative flex flex-col items-center">
              <HomaOrb size={300} state={orbState} />
              <div
                className="mt-2 w-[65%] h-4 rounded-[50%]"
                style={{ background: 'radial-gradient(ellipse, hsl(217 91% 55% / 0.22) 0%, transparent 70%)', filter: 'blur(8px)' }}
              />
            </div>
          </div>
        </div>

        {/* Right panel — Auth form (full width on mobile, half on desktop) */}
        <div className="min-h-dvh flex flex-col items-center px-5 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)] lg:justify-center lg:px-12">
          <div className="my-auto w-full max-w-sm flex flex-col items-center">

            {/* Mobile brand — hidden on desktop */}
            <div className="mb-7 flex items-baseline gap-1 lg:hidden">
              <span className="font-heading text-lg font-bold tracking-tight text-white">Homa</span>
              <span className="font-heading text-lg font-bold tracking-tight text-primary">AI</span>
            </div>

            {/* Mobile orb — hidden on desktop */}
            <div className="relative flex flex-col items-center mb-2 lg:hidden">
              <HomaOrb size={orbSize} state={orbState} />
              <div
                className="mt-1 w-[65%] h-3 rounded-[50%]"
                style={{ background: 'radial-gradient(ellipse, hsl(217 91% 55% / 0.22) 0%, transparent 70%)', filter: 'blur(6px)' }}
              />
            </div>

            {/* Headline + description */}
            <div className="text-center mb-7 max-w-xs mt-4 lg:mt-0 lg:max-w-md">
              <h1 className="font-heading text-[26px] font-bold tracking-tight text-white leading-tight lg:text-3xl">{title}</h1>
              {subtitle && <p className="text-white/60 mt-2 text-sm leading-relaxed">{subtitle}</p>}
            </div>

            {/* Form */}
            <div className="w-full">
              {children}
            </div>

            {/* Footer */}
            {footer && <p className="text-center text-sm text-white/50 mt-6">{footer}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}