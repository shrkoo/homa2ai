import React, { useState, useMemo } from 'react';
import {
  Copy, Check, ThumbsUp, ThumbsDown, Volume2, RefreshCw, Share2, Bookmark, Pencil, Flag, MoreHorizontal, FileText, Loader2, Calendar, File as FileIcon, Download, Table, Play, Pause, Square, ChevronDown, ChevronUp
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { connectorAdapter } from '@/lib/adapters';
import { toast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import MarkdownRenderer from './MarkdownRenderer';
import FeedbackModal from './FeedbackModal';
import { Image as UIImage } from '@/components/ui/image';
import { generateMessageSuggestions } from '@/lib/messageSuggestions';
import GlobalSearchStatus from './GlobalSearchStatus';
import GlobalSearchResults from './GlobalSearchResults';
import ToolCard from './ToolCard';
import ReminderCard from './chat/ReminderCard';
import SmartReminderCard from './chat/SmartReminderCard';
import SmartWatchTrigger from './chat/SmartWatchTrigger';
import ToolExecutionStatus from './chat/ToolExecutionStatus';
import ChatMedia, { stripMedia } from './chat/ChatMedia';

function parseUserContent(content) {
  const images = [];
  const videos = [];
  const files = [];
  const imageRegex = /!\[\]\(([^)]+)\)/g;
  const videoRegex = /🎬\s*\[([^\]]*)\]\(([^)]+)\)/g;
  const fileRegex = /📎\s*\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  while ((match = imageRegex.exec(content)) !== null) images.push(match[1]);
  while ((match = videoRegex.exec(content)) !== null) videos.push({ name: match[1], url: match[2] });
  while ((match = fileRegex.exec(content)) !== null) files.push({ name: match[1], url: match[2] });
  const text = content.replace(imageRegex, '').replace(videoRegex, '').replace(fileRegex, '').trim();
  return { text, images, videos, files };
}

function ActionBtn({ children, onClick, title, active, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title} className="w-8 h-8 flex items-center justify-center rounded-full transition-colors disabled:opacity-40 disabled:pointer-events-none text-muted-foreground hover:text-foreground hover:bg-white/[0.06]">
      {children}
    </button>
  );
}

function UserActionBtn({ children, onClick, title }) {
  return (
    <button onClick={onClick} title={title} className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:bg-white/[0.06] hover:text-foreground transition-colors">
      {children}
    </button>
  );
}

export default function MessageItem({ msg, onRegenerate, onFeedback, onSave, onEdit, onReport, sending, tts, onSuggestionPick }) {
  const { t, language } = useI18n();
  const [copied, setCopied] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sheetsExporting, setSheetsExporting] = useState(false);
  const [calExporting, setCalExporting] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const suggestions = useMemo(() => generateMessageSuggestions(msg.content, language), [msg.content, language]);
  const { speaking, paused, loading: ttsLoading, error: ttsError, currentMsgId, speak: ttsSpeak, pause: ttsPause, resume: ttsResume, stop: ttsStop } = tts;
  const isUser = msg.role === 'user';
  const isThisMsg = currentMsgId === msg.id;
  const isThisLoading = ttsLoading && currentMsgId === msg.id;

  const copy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const share = async () => {
    if (navigator.share) { try { await navigator.share({ text: msg.content }); } catch {} }
    else { navigator.clipboard.writeText(msg.content); toast({ title: t('copied') }); }
  };

  const exportToDocs = async () => {
    setExporting(true);
    try {
      const res = await connectorAdapter.exportToDocs({ title: msg.content.slice(0, 40), content: msg.content });
      const data = res?.data || res;
      if (data.url) window.open(data.url, '_blank');
      toast({ title: t('docs_saved') });
    } catch { toast({ title: t('error_occurred') }); }
    setExporting(false);
  };

  const exportToSheets = async () => {
    setSheetsExporting(true);
    try {
      const res = await connectorAdapter.exportToSheets({ title: msg.content.slice(0, 40), content: msg.content });
      const data = res?.data || res;
      if (data.url) window.open(data.url, '_blank');
      toast({ title: 'در گوگل شیت ذخیره شد' });
    } catch { toast({ title: t('error_occurred') }); }
    setSheetsExporting(false);
  };

  const exportToCalendar = async () => {
    setCalExporting(true);
    try {
      await connectorAdapter.createCalendarEvent({ content: msg.content, language });
      toast({ title: t('event_added') });
    } catch { toast({ title: t('error_occurred') }); }
    setCalExporting(false);
  };

  if (isUser) {
    const { text, images, videos, files } = parseUserContent(msg.content);
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[85%] rounded-[1.75rem] bg-gradient-to-br from-primary/25 via-primary/10 to-white/[0.04] text-foreground overflow-hidden shadow-glow border border-primary/20 backdrop-blur-md">
          {text && <p className="whitespace-pre-wrap break-words px-4 pt-2.5 text-[14px] leading-6">{text}</p>}
          {images.map((url, i) => (
            <div key={i} className="px-1.5 pb-1.5 pt-1">
              <div className="rounded-2xl overflow-hidden">
                <UIImage src={url} alt="" fittingType="fill" className="w-full h-44" />
              </div>
            </div>
          ))}
          {videos.map((v, i) => (
            <div key={i} className="px-1.5 pb-1.5 pt-1">
              <video src={v.url} controls className="w-full max-h-60 rounded-2xl" />
            </div>
          ))}
          {files.map((f, i) => (
            <a key={i} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 mx-2.5 mb-2 px-3 py-2.5 rounded-2xl bg-white/10 text-white">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <FileIcon size={16} />
              </div>
              <span className="text-xs font-medium truncate flex-1">{f.name}</span>
              <Download size={14} className="shrink-0 opacity-60" />
            </a>
          ))}
          {msg.created_date && (
            <div className="px-4 pb-2 pt-1 text-end">
              <span className="text-[10px] text-white/50">{new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 mt-1 -me-0.5">
          <UserActionBtn onClick={copy} title={t('copy')}>{copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}</UserActionBtn>
          <UserActionBtn onClick={() => onEdit(msg)} title={t('edit')}><Pencil size={14} /></UserActionBtn>
        </div>
      </div>
    );
  }

  const toolSuggestionMatch = msg.content.match(/```tool-suggestion\n([\s\S]*?)```/);
  let toolSuggestionData = null;
  if (toolSuggestionMatch) { try { toolSuggestionData = JSON.parse(toolSuggestionMatch[1]); } catch {} }
  const jobStatusMatch = msg.content.match(/```job-status\n([\s\S]*?)```/);
  let jobStatusData = null;
  if (jobStatusMatch) { try { jobStatusData = JSON.parse(jobStatusMatch[1]); } catch {} }
  const gsPendingMatch = msg.content.match(/```global-search-pending\n([\s\S]*?)```/);
  const gsMatch = msg.content.match(/```global-search\n([\s\S]*?)```/);
  const cleanContent = stripMedia(msg.content.replace(/```global-search-pending\n[\s\S]*?```/g, '').replace(/```global-search\n[\s\S]*?```/g, '').replace(/```tool-suggestion\n[\s\S]*?```/g, '').replace(/```job-status\n[\s\S]*?```/g, '').replace(/```reminder-card\n[\s\S]*?```/g, '').replace(/```reminder-list\n[\s\S]*?```/g, '').replace(/```smart-watch-card\n[\s\S]*?```/g, '').replace(/```smart-watch-trigger\n[\s\S]*?```/g, '').trim());
  let gsPendingData = null;
  let gsData = null;
  if (gsPendingMatch) { try { gsPendingData = JSON.parse(gsPendingMatch[1]); } catch {} }
  if (gsMatch) { try { gsData = JSON.parse(gsMatch[1]); } catch {} }
  const reminderCardMatch = msg.content.match(/```reminder-card\n([\s\S]*?)```/);
  let reminderCardData = null;
  if (reminderCardMatch) { try { reminderCardData = JSON.parse(reminderCardMatch[1]); } catch {} }
  const reminderListMatch = msg.content.match(/```reminder-list\n([\s\S]*?)```/);
  let reminderListData = null;
  if (reminderListMatch) { try { reminderListData = JSON.parse(reminderListMatch[1]); } catch {} }
  const smartWatchCardMatch = msg.content.match(/```smart-watch-card\n([\s\S]*?)```/);
  let smartWatchCardData = null;
  if (smartWatchCardMatch) { try { smartWatchCardData = JSON.parse(smartWatchCardMatch[1]); } catch {} }
  const smartWatchTriggerMatch = msg.content.match(/```smart-watch-trigger\n([\s\S]*?)```/);
  let smartWatchTriggerData = null;
  if (smartWatchTriggerMatch) { try { smartWatchTriggerData = JSON.parse(smartWatchTriggerMatch[1]); } catch {} }

  return (
    <div className="flex flex-col items-start w-full">
      <div className="w-full space-y-3">
        {cleanContent && (
          <div className="rounded-[1.75rem] rounded-es-xl bg-white/[0.08] border border-white/[0.1] p-4 backdrop-blur-md shadow-premium">
            <MarkdownRenderer content={cleanContent} />
          </div>
        )}
        <ChatMedia content={msg.content} />
        {gsPendingData && <GlobalSearchStatus status={gsPendingData} />}
        {gsData && <GlobalSearchResults data={gsData} />}
        {jobStatusData && <ToolExecutionStatus statusData={jobStatusData} />}
        {toolSuggestionData && <ToolCard {...toolSuggestionData} />}
        {reminderCardData && <ReminderCard reminder={reminderCardData} />}
        {reminderListData && reminderListData.length > 0 && (
          <div className="space-y-2">{reminderListData.map((r) => <ReminderCard key={r.id} reminder={r} />)}</div>
        )}
        {smartWatchCardData && <SmartReminderCard watch={smartWatchCardData} />}
        {smartWatchTriggerData && <SmartWatchTrigger data={smartWatchTriggerData} />}
      </div>
      <div className="flex items-center gap-0.5 mt-1 -ms-1">
        {msg.created_date && <span className="text-[10px] text-muted-foreground/70 me-1">{new Date(msg.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
        <ActionBtn onClick={copy} title={t('copy')}>{copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}</ActionBtn>
        <ActionBtn onClick={share} title={t('share')}><Share2 size={14} /></ActionBtn>
        <ActionBtn onClick={exportToDocs} title={t('export_docs')} disabled={exporting}>{exporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}</ActionBtn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors">
              <MoreHorizontal size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-2xl p-1.5">
            <DropdownMenuItem onClick={() => onFeedback(msg, 'like')}><ThumbsUp /> <span className="flex-1">{t('like')}</span>{msg.feedback === 'like' && <Check className="text-primary" />}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFeedback(msg, 'dislike')}><ThumbsDown /> <span className="flex-1">{t('dislike')}</span>{msg.feedback === 'dislike' && <Check className="text-primary" />}</DropdownMenuItem>
            <DropdownMenuItem onClick={exportToSheets} disabled={sheetsExporting}>{sheetsExporting ? <Loader2 size={14} className="animate-spin" /> : <Table />} <span className="flex-1">ذخیره در شیت</span></DropdownMenuItem>
            <DropdownMenuItem onClick={onRegenerate} disabled={sending}><RefreshCw /> <span className="flex-1">{t('regenerate')}</span></DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSave(msg)}><Bookmark /> <span className="flex-1">{t('save_to_library')}</span></DropdownMenuItem>
            <DropdownMenuItem onClick={exportToCalendar} disabled={calExporting}>{calExporting ? <Loader2 size={14} className="animate-spin" /> : <Calendar />} <span className="flex-1">{t('add_to_calendar')}</span></DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFeedbackOpen(true)}><Flag /> <span className="flex-1">{t('report')}</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {suggestions.length > 0 && (
          <button
            onClick={() => setSuggestionsOpen((v) => !v)}
            aria-expanded={suggestionsOpen}
            aria-label={suggestionsOpen ? 'بستن نمونه‌ها' : 'باز کردن نمونه‌ها'}
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
          >
            {suggestionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>
      {suggestionsOpen && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionPick?.(s)}
              className="px-3 h-7 rounded-full bg-accent/60 hover:bg-primary/10 hover:text-primary text-xs font-medium text-muted-foreground transition-colors border border-transparent hover:border-primary/20"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} onSubmit={(reason, details) => { onReport(msg, reason, details); setFeedbackOpen(false); }} />
    </div>
  );
}