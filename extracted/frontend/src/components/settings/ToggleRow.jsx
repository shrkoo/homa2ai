import React from 'react';

export default function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="w-full flex items-center gap-3 py-2 text-start">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <span className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? 'bg-primary' : 'bg-input'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-all ${checked ? 'start-[1.375rem]' : 'start-0.5'}`} />
      </span>
    </button>
  );
}