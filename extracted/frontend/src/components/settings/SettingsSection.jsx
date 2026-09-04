import React from 'react';

export default function SettingsSection({ title, icon: Icon, children }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      {(title || Icon) && (
        <div className="flex items-center gap-2 mb-3">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-accent text-muted-foreground flex items-center justify-center">
              <Icon size={16} />
            </div>
          )}
          {title && <p className="text-xs font-semibold text-muted-foreground">{title}</p>}
        </div>
      )}
      {children}
    </section>
  );
}