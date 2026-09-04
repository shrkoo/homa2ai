import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function Group({ label, children }) {
  return (
    <div>
      {label && <p className="px-2 mb-1.5 text-xs font-semibold text-muted-foreground">{label}</p>}
      <div className="rounded-2xl bg-card overflow-hidden divide-y divide-border">{children}</div>
    </div>
  );
}

export function Row({ icon: Icon, label, value, onClick, right, danger, accent }) {
  const Cmp = onClick ? 'button' : 'div';
  return (
    <Cmp onClick={onClick} className={`w-full flex items-center gap-3 px-3.5 h-12 text-start ${onClick ? 'hover:bg-accent/50 transition-colors' : ''}`}>
      {Icon && <Icon size={18} className={`shrink-0 ${accent ? 'text-primary' : danger ? 'text-destructive' : 'text-muted-foreground'}`} />}
      <span className={`flex-1 text-sm font-medium truncate ${danger ? 'text-destructive' : accent ? 'text-primary' : ''}`}>{label}</span>
      {value && <span className="text-xs text-muted-foreground truncate max-w-[45%]">{value}</span>}
      {right}
    </Cmp>
  );
}

export function ExpandableRow({ icon: Icon, label, value, children, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 px-3.5 h-12 text-start hover:bg-accent/50 transition-colors">
        {Icon && <Icon size={18} className="text-muted-foreground shrink-0" />}
        <span className="flex-1 text-sm font-medium truncate">{label}</span>
        {value && <span className="text-xs text-muted-foreground truncate max-w-[45%]">{value}</span>}
        <ChevronDown size={16} className={`text-muted-foreground transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3.5 pb-3.5 pt-1">{children}</div>}
    </div>
  );
}