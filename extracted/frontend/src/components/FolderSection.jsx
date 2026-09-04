import React, { useState, useEffect } from 'react';
import { FolderPlus, X, Check, Pencil, Trash2 } from 'lucide-react';
import { Droppable } from '@hello-pangea/dnd';
import { dataAdapter } from '@/lib/adapters';
import { useI18n } from '@/i18n/I18nContext';

const COLORS = [
  '217 91% 60%',
  '142 71% 45%',
  '0 84% 60%',
  '25 95% 53%',
  '265 84% 65%',
  '330 75% 60%',
  '240 5% 65%',
];

export default function FolderSection({ selectedFolder, onSelectFolder, counts = {} }) {
  const { t } = useI18n();
  const [folders, setFolders] = useState([]);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const load = async () => {
    try { setFolders(await dataAdapter.list('ChatFolder',)); } catch {}
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    try {
      await dataAdapter.create('ChatFolder', { name: name.trim(), color });
      setName(''); setCreating(false); load();
    } catch {}
  };

  const rename = async (id) => {
    if (!editName.trim()) { setEditingId(null); return; }
    try {
      await dataAdapter.update('ChatFolder', id, { name: editName.trim() });
      setEditingId(null); load();
    } catch {}
  };

  const remove = async (id) => {
    if (!confirm(t('delete_folder_confirm'))) return;
    try {
      await dataAdapter.delete('ChatFolder', id);
      if (selectedFolder === id) onSelectFolder(null);
      load();
    } catch {}
  };

  return (
    <div className="mb-2">
      <div className="flex items-center justify-between px-3 mb-1">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{t('folders')}</span>
        <button onClick={() => setCreating((v) => !v)} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-accent"><FolderPlus size={13} /></button>
      </div>
      {creating && (
        <div className="px-2 mb-2 space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('folder_name')} className="w-full h-8 px-2 rounded-lg bg-accent text-xs outline-none" autoFocus onKeyDown={(e) => e.key === 'Enter' && create()} />
          <div className="flex items-center gap-1.5 flex-wrap">
            {COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)} className={`w-5 h-5 rounded-full ${color === c ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background' : ''}`} style={{ background: `hsl(${c})` }} />
            ))}
          </div>
          <div className="flex gap-1.5">
            <button onClick={create} className="flex-1 h-8 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1"><Check size={13} /> {t('save')}</button>
            <button onClick={() => setCreating(false)} className="h-8 px-3 rounded-lg bg-accent text-xs"><X size={13} /></button>
          </div>
        </div>
      )}
      {folders.map((f) => (
        <Droppable key={f.id} droppableId={`folder-${f.id}`}>
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className={`group relative rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-primary/10 ring-2 ring-primary/30' : ''}`}>
              {editingId === f.id ? (
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 h-7 px-2 rounded-lg bg-accent text-xs outline-none" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') rename(f.id); if (e.key === 'Escape') setEditingId(null); }} />
                  <button onClick={() => rename(f.id)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-primary-foreground"><Check size={13} /></button>
                  <button onClick={() => setEditingId(null)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-accent"><X size={13} /></button>
                </div>
              ) : (
                <>
                  <button onClick={() => onSelectFolder(selectedFolder === f.id ? null : f.id)} className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-start transition-colors ${selectedFolder === f.id ? 'bg-accent' : 'hover:bg-accent'}`}>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: `hsl(${f.color || '217 91% 60%'})` }} />
                    <span className="text-sm truncate flex-1">{f.name}</span>
                    {counts[f.id] > 0 && <span className="text-[10px] text-muted-foreground shrink-0">{counts[f.id]}</span>}
                  </button>
                  <div className="absolute end-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setEditingId(f.id); setEditName(f.name); }} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-background"><Pencil size={11} className="text-muted-foreground" /></button>
                    <button onClick={(e) => { e.stopPropagation(); remove(f.id); }} className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-background"><Trash2 size={11} className="text-destructive" /></button>
                  </div>
                </>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      ))}
    </div>
  );
}