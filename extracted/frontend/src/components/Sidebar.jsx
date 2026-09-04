import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, MessageSquare, X, Library, Folder, CheckSquare, Compass,
  HelpCircle, Sparkles, Settings, Code, Archive, Gift, Wand2, Clapperboard, Wallet, Calendar, Heart, AlarmClock
} from 'lucide-react';
import { dataAdapter, chatAdapter } from '@/lib/adapters';
import FolderSection from '@/components/FolderSection';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/lib/AuthContext';

function groupKey(dateStr) {
  if (!dateStr) return 'older';
  const d = new Date(dateStr);
  const now = new Date();
  const dayMs = 86400000;
  const diff = Math.floor((new Date(now).setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / dayMs);
  if (diff <= 0) return 'today';
  if (diff === 1) return 'yesterday';
  if (diff < 7) return 'this_week';
  if (diff < 30) return 'this_month';
  return 'older';
}

export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const [recent, setRecent] = useState([]);
  const [q, setQ] = useState('');

  const [showArchived, setShowArchived] = useState(false);
  const [archived, setArchived] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);

  const loadRecent = async () => {
    try {
      chatAdapter.archiveOldConversations().catch(() => {});
      setRecent(await dataAdapter.filter('Conversation', { archived: { $ne: true } }, '-updated_date', 40));
    } catch {}
  };
  const loadArchived = async () => {
    try { setArchived(await dataAdapter.filter('Conversation', { archived: true }, '-updated_date', 40)); } catch {}
  };
  useEffect(() => { loadRecent(); }, [location.pathname]);
  useEffect(() => { if (showArchived) loadArchived(); }, [showArchived]);

  const go = (path) => { navigate(path); onClose?.(); };
  const filtered = (q ? recent.filter((c) => (c.title || '').includes(q)) : recent).filter((c) => !selectedFolder || c.folder_id === selectedFolder);
  const folderCounts = {};
  recent.forEach((c) => { if (c.folder_id) folderCounts[c.folder_id] = (folderCounts[c.folder_id] || 0) + 1; });

  const handleDragEnd = async (result) => {
    const { destination, draggableId } = result;
    if (!destination || !destination.droppableId.startsWith('folder-')) return;
    const folderId = destination.droppableId.replace('folder-', '');
    try {
      await dataAdapter.update('Conversation', draggableId, { folder_id: folderId });
      loadRecent();
    } catch {}
  };
  const groups = {};
  filtered.forEach((c) => { const k = groupKey(c.updated_date || c.created_date); (groups[k] = groups[k] || []).push(c); });
  const order = ['today', 'yesterday', 'this_week', 'this_month', 'older'];
  const groupLabel = (k) => ({ today: t('today'), yesterday: t('yesterday'), this_week: t('this_week'), this_month: t('this_month'), older: t('older') }[k]);

  const dragIndices = {};
  let di = 0;
  order.forEach((k) => { (groups[k] || []).forEach((c) => { dragIndices[c.id] = di++; }); });

  const bottom = [
    { icon: Library, label: t('library'), path: '/library' },
    { icon: Folder, label: t('projects'), path: '/projects' },
    { icon: CheckSquare, label: t('tasks'), path: '/tasks' },
    { icon: Heart, label: t('gs_favorites'), path: '/favorites' },
    { icon: Compass, label: t('explore'), path: '/explore' },
    { icon: Wand2, label: t('prompt_editor'), path: '/prompt-editor' },
    { icon: Clapperboard, label: t('studio'), path: '/studio' },
    { icon: Wallet, label: t('credits'), path: '/credits' },
    { icon: Calendar, label: t('calendar_tool'), path: '/calendar' },
    { icon: AlarmClock, label: t('alarms_reminders') || 'آلارم و یادآور', path: '/alarms' },
    { icon: Gift, label: t('referral_title'), path: '/referral' },
    { icon: HelpCircle, label: t('help'), path: '/help' },
    { icon: Sparkles, label: t('upgrade'), path: '/upgrade' },
    { icon: Code, label: t('developer'), path: '/developer/keys' }
  ];

  const content = (
    <DragDropContext onDragEnd={handleDragEnd}>
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <span className="font-heading text-lg font-extrabold tracking-tight">هُما</span>
        <button onClick={onClose} className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-accent"><X size={18} /></button>
      </div>
      <div className="px-3">
        <button onClick={() => go('/chat/new')} className="w-full flex items-center justify-center gap-2 px-4 h-11 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium shadow-glow hover:opacity-90 active:scale-[0.98] transition-all"><Plus size={17} strokeWidth={2.5} /> {t('new_chat')}</button>
      </div>
      <div className="px-3 mt-3">
        <div className="relative">
          <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search')} className="w-full h-10 ps-9 pe-3 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm outline-none focus:border-primary/30 focus:bg-white/[0.06] transition-colors" />
        </div>
      </div>
      <div className="px-2 mt-1">
        <FolderSection selectedFolder={selectedFolder} onSelectFolder={setSelectedFolder} counts={folderCounts} />
      </div>
      <Droppable droppableId="chats">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="px-2 mt-1 flex-1 overflow-y-auto">
        {order.map((k) => groups[k] && groups[k].length > 0 && (
          <div key={k} className="mb-2">
            <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">{groupLabel(k)}</p>
            {groups[k].map((c) => (
              <Draggable key={c.id} draggableId={c.id} index={dragIndices[c.id]}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                    <button onClick={() => go('/chat/' + c.id)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-start transition-all tap-feedback ${location.pathname === '/chat/' + c.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-white/[0.04] border border-transparent'}`}>
                      <MessageSquare size={15} className={`shrink-0 ${location.pathname === '/chat/' + c.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-sm truncate flex-1 ${location.pathname === '/chat/' + c.id ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{c.title || t('untitled')}</span>
                    </button>
                  </div>
                )}
              </Draggable>
            ))}
          </div>
        ))}
        {filtered.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">{t('no_chats')}</p>}
        <div className="mt-3 border-t border-border pt-2">
          <button onClick={() => setShowArchived((v) => !v)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-white/[0.04] text-start text-xs text-muted-foreground transition-colors">
            <Archive size={15} className="shrink-0" /> {t('archived')}
          </button>
          {showArchived && archived.map((c) => (
            <button key={c.id} onClick={() => go('/chat/' + c.id)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-white/[0.04] text-start transition-colors">
              <MessageSquare size={15} className="text-muted-foreground shrink-0" />
              <span className="text-sm truncate flex-1 opacity-60">{c.title || t('untitled')}</span>
            </button>
          ))}
        </div>
            {provided.placeholder}
          </div>
        )}
        </Droppable>

        <div className="px-2 py-2 border-t border-border">
        {bottom.map((n) => (
          <button key={n.path} onClick={() => go(n.path)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl hover:bg-white/[0.04] text-start text-sm transition-colors"><n.icon size={16} className="text-muted-foreground" /> {n.label}</button>
        ))}
      </div>
      <button onClick={() => go('/settings')} className="m-2 flex items-center gap-2.5 p-2 rounded-xl hover:bg-accent text-start">
        <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">{(user?.full_name || user?.email || 'U').slice(0, 1).toUpperCase()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user?.full_name || t('profile')}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <Settings size={15} className="text-muted-foreground" />
      </button>
    </div>
    </DragDropContext>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed inset-y-0 start-0 w-64 border-e border-border bg-sidebar z-30">{content}</aside>
      <AnimatePresence>
        {open && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
            <motion.aside className="absolute inset-y-0 start-0 w-72 bg-sidebar border-e border-border" initial={{ x: dir === 'rtl' ? '100%' : '-100%' }} animate={{ x: 0 }} exit={{ x: dir === 'rtl' ? '100%' : '-100%' }} transition={{ type: 'tween', duration: 0.22 }}>{content}</motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}