import React from 'react';
import { Menu, SquarePen, Sparkles, MoreVertical, Check, Trash2, Flag, Brain, Code2, BookmarkPlus, FolderInput } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import ChatStatus from '@/components/ChatStatus';
import CodeModeBar from '@/components/chat/CodeModeBar';
import HomaOrb from '@/components/HomaOrb';

export default function ChatHeader({
  navigate, openSidebar,
  temporary, toggleTemp,
  deepThink, setDeepThink,
  codeMode, setCodeMode, codeAction, setCodeAction,
  folders, conversation, moveToFolder,
  clearChat, saveAsTemplate,
  status, model, error, usage, mode,
}) {
  const { t } = useI18n();
  return (
    <header className="sticky top-0 z-20 glass border-b border-white/[0.06] pt-[env(safe-area-inset-top)] shadow-premium">
      <div className="flex items-center gap-1 px-3 h-14">
        <button onClick={openSidebar} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.06] transition-colors"><Menu size={20} /></button>
        <div className="flex items-center gap-2 ps-0.5">
          <HomaOrb size={24} state={status === 'processing' || status === 'uploading' ? 'processing' : 'idle'} />
          <span className="text-sm font-bold tracking-tight">Homa AI</span>
        </div>
        <div className="flex-1" />
        <button onClick={() => navigate('/chat/new')} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.06] transition-colors" title={t('new_chat')}><SquarePen size={18} /></button>
        <button onClick={() => setCodeMode((v) => !v)} className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${codeMode ? 'bg-primary text-primary-foreground shadow-glow' : 'hover:bg-white/[0.06]'}`} title={t('code_mode')}>
          <Code2 size={18} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/[0.06] transition-colors"><MoreVertical size={20} /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 rounded-2xl p-1.5">
            <DropdownMenuItem onClick={() => navigate('/chat/new')}><SquarePen /> <span className="flex-1">{t('new_chat')}</span></DropdownMenuItem>
            <DropdownMenuItem onClick={toggleTemp}><Sparkles /> <span className="flex-1">{t('temp_chat')}</span>{temporary && <Check className="text-primary" />}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeepThink((v) => !v)}><Brain /> <span className="flex-1">{t('deep_think')}</span>{deepThink && <Check className="text-primary" />}</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger><FolderInput /> <span className="flex-1">{t('move_to_folder')}</span></DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48 rounded-2xl p-1.5">
                <DropdownMenuItem onClick={() => moveToFolder('')}><span className="flex-1">{t('no_folder')}</span>{!conversation?.folder_id && <Check className="text-primary" />}</DropdownMenuItem>
                {folders.map((f) => (
                  <DropdownMenuItem key={f.id} onClick={() => moveToFolder(f.id)}>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: `hsl(${f.color || '217 91% 60%'})` }} />
                    <span className="flex-1 truncate">{f.name}</span>
                    {conversation?.folder_id === f.id && <Check className="text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearChat} className="text-destructive"><Trash2 /> <span className="flex-1">{t('delete')}</span></DropdownMenuItem>
            <DropdownMenuItem onClick={saveAsTemplate}><BookmarkPlus /> <span className="flex-1">{t('template_save')}</span></DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/bug-report')}><Flag /> <span className="flex-1">{t('report_bug')}</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {temporary && (
        <div className="flex justify-center pb-1.5">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-accent text-primary" title={t('temp_chat_active')}><Sparkles size={11} /></span>
        </div>
      )}
      <ChatStatus status={status} model={model} error={error} usage={usage} mode={mode} />
      {codeMode && <CodeModeBar codeAction={codeAction} setCodeAction={setCodeAction} />}
    </header>
  );
}