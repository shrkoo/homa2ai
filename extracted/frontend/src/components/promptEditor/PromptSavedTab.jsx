import React, { useState, useEffect } from 'react';
import { Trash2, SquarePen } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { pe } from './promptEditorStrings';

const FAV_KEY = 'homa_prompt_favorites';

export function loadFavs() {
  try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch { return []; }
}
export function saveFavs(list) {
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
}

export default function PromptSavedTab({ onLoad, refreshKey }) {
  const { language } = useI18n();
  const [favs, setFavs] = useState(loadFavs);

  useEffect(() => { setFavs(loadFavs()); }, [refreshKey]);

  const del = (id) => {
    const l = favs.filter((f) => f.id !== id);
    saveFavs(l); setFavs(l);
  };

  if (!favs.length) return <p className="text-sm text-muted-foreground text-center py-8">{pe(language, 'pe_no_saved')}</p>;

  return (
    <div className="space-y-2">
      {favs.map((f) => (
        <div key={f.id} className="p-3 rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold flex-1 truncate">{f.name}</span>
            <button onClick={() => del(f.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-accent text-destructive"><Trash2 size={14} /></button>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{f.prompt}</p>
          <button onClick={() => onLoad(f)} className="flex items-center gap-1.5 text-xs font-medium text-primary"><SquarePen size={13} /> {pe(language, 'pe_load')}</button>
        </div>
      ))}
    </div>
  );
}