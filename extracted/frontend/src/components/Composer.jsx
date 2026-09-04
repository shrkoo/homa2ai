import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, ArrowUp, Mic,
  Paperclip, Camera, Image, X, Square, Globe, ShoppingBag, Brain
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from '@/components/ui/use-toast';
import { invokeFunctionDirect } from '@/lib/directInvoke';
import { mediaAdapter } from '@/lib/adapters';
import ChatModeChips from '@/components/ChatModeChips';
import SlashMenu from '@/components/chat/SlashMenu';
import QuickReminderButton from '@/components/chat/QuickReminderButton';
import { getPartialSlash } from '@/lib/slashCommands';

const MENU = [
  { key: 'menu_upload', icon: Paperclip, action: 'file' },
  { key: 'menu_images', icon: Image, action: 'image' },
  { key: 'menu_camera', icon: Camera, action: 'camera' },
];

const MODE_ICON = { web: Globe, global: ShoppingBag, research: Brain };

export default function Composer({ input, setInput, onSend, sending, onStop, uploading, attachments, onAttach, onRemoveAttachment, mode, onSetMode, deepThink, onToggleDeepThink, temporary, conversationId }) {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const recRef = useRef(null);
  const mediaRecRef = useRef(null);
  const chunksRef = useRef([]);
  const baseTextRef = useRef('');
  const fileRef = useRef(null);
  const imageRef = useRef(null);
  const cameraRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  const sttLang = () => language === 'en' ? 'en-US' : language === 'ku' ? 'ku-IQ' : 'fa-IR';

  const transcribeAudio = async (blob) => {
    setTranscribing(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const uploadRes = await invokeFunctionDirect('uploadFile', { base64, filename: 'voice.webm', mimeType: 'audio/webm' });
      const audioUrl = uploadRes?.data?.file_url || uploadRes?.file_url;
      if (!audioUrl) throw new Error('upload_failed');
      const sttRes = await mediaAdapter.transcribeAudio(audioUrl);
      const data = sttRes?.data || sttRes;
      const text = data.text || '';
      if (text) {
        const base = baseTextRef.current;
        setInput(base ? base + ' ' + text : text);
      } else {
        toast({ title: t('no_speech_detected') });
      }
    } catch (e) {
      const msg = String(e?.message || '');
      if (msg.includes('402') || msg.includes('403')) toast({ title: 'سرویس تشخیص صوت موقتاً محدود است.' });
      else if (msg.includes('Failed to fetch') || msg.includes('Network')) toast({ title: 'ارتباط با سرور برقرار نشد.' });
      else toast({ title: t('voice_unsupported') });
    }
    setTranscribing(false);
  };

  const startMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) { toast({ title: t('no_speech_detected') }); return; }
        await transcribeAudio(blob);
      };
      mr.start();
      mediaRecRef.current = mr;
      setListening(true);
    } catch (e) {
      setListening(false);
      const name = e?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        toast({ title: t('mic_permission_denied') });
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        toast({ title: 'میکروفنی روی دستگاه پیدا نشد.' });
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        toast({ title: 'میکروفن اشغال است یا در دسترس نیست.' });
      } else {
        toast({ title: t('voice_unsupported') });
      }
      console.warn('[Homa Mic] getUserMedia error', name, e?.message);
    }
  };

  const toggleMic = () => {
    if (listening) {
      try { recRef.current?.stop(); } catch {}
      if (mediaRecRef.current && mediaRecRef.current.state === 'recording') {
        try { mediaRecRef.current.stop(); } catch {}
      }
      setListening(false);
      return;
    }
    baseTextRef.current = (input || '').trim();
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      try { recRef.current?.abort(); } catch {}
      const rec = new SR();
      rec.lang = sttLang();
      rec.interimResults = true;
      rec.continuous = true;
      rec.maxAlternatives = 1;
      let finalText = '';
      rec.onresult = (e) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interim += r[0].transcript;
        }
        const prefix = baseTextRef.current ? baseTextRef.current + ' ' : '';
        setInput(prefix + finalText + interim);
      };
      rec.onerror = (e) => {
        setListening(false);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') toast({ title: t('mic_permission_denied') });
        else if (e.error === 'no-speech') toast({ title: t('no_speech_detected') });
        else if (e.error === 'audio-capture') toast({ title: t('mic_permission_denied') });
      };
      rec.onend = () => setListening(false);
      try { rec.start(); recRef.current = rec; setListening(true); } catch { setListening(false); toast({ title: t('voice_unsupported') }); }
    } else {
      // Fallback: MediaRecorder + STT API (works when credits are available)
      startMediaRecorder();
    }
  };

  const onMenu = (item) => {
    setMenuOpen(false);
    if (item.action === 'file') fileRef.current?.click();
    else if (item.action === 'image') imageRef.current?.click();
    else if (item.action === 'camera') cameraRef.current?.click();
  };

  return (
    <div className="relative">
      <input ref={fileRef} type="file" className="hidden" onChange={(e) => { onAttach(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onAttach(e.target.files?.[0]); e.target.value = ''; }} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { onAttach(e.target.files?.[0]); e.target.value = ''; }} />

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute bottom-full mb-2 start-0 z-40 w-64 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-xl shadow-premium p-2 max-h-[70vh] overflow-y-auto">
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t('tools')}</div>
            {MENU.map((item) => (
              <button key={item.key} onClick={() => onMenu(item)} className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl hover:bg-white/[0.08] text-sm text-start transition-colors tap-feedback">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon size={16} className="text-primary" />
                </div>
                <span className="flex-1">{t(item.key)}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {mode && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          <span className="inline-flex items-center gap-1 ps-1.5 pe-1 h-7 rounded-full bg-chatControl text-chatControl-foreground">
            {(() => { const Icon = MODE_ICON[mode]; return Icon ? <Icon size={14} /> : null; })()}
            <button onClick={() => onSetMode(null)} className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-chatControl-foreground/20"><X size={12} /></button>
          </span>
        </div>
      )}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((a) => (
            a.kind === 'image' ? (
              <div key={a.id} className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <img src={a.preview_url || a.file_url} alt={a.name} className="w-full h-full object-cover" />
                <button onClick={() => onRemoveAttachment(a.id)} className="absolute top-0.5 end-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center"><X size={12} /></button>
              </div>
            ) : (
              <span key={a.id} className="inline-flex items-center gap-1.5 ps-2.5 pe-1.5 h-7 rounded-full bg-accent text-xs font-medium max-w-[60vw]">
                <span className="truncate">📄 {a.name}</span>
                <button onClick={() => onRemoveAttachment(a.id)} className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-background"><X size={12} /></button>
              </span>
            )
          ))}
        </div>
      )}

      {(() => { const sq = getPartialSlash(input); return sq ? <SlashMenu query={sq} onSelect={(c) => { setInput(c.cmd + ' '); textareaRef.current?.focus(); }} /> : null; })()}
      <div className="mb-1.5">
        <ChatModeChips input={input} setInput={setInput} textareaRef={textareaRef} mode={mode} onSetMode={onSetMode} />
      </div>
      <div className="flex items-end gap-2 rounded-[1.75rem] bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] px-2 py-2 transition-all shadow-premium focus-within:border-primary/50 focus-within:shadow-glow">
        <button onClick={() => setMenuOpen((v) => !v)} className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-white/[0.06] text-white/70 hover:bg-white/[0.12] transition-colors"><Paperclip size={20} /></button>
        <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} placeholder={temporary ? t('temp_chat') : t('composer_placeholder')} rows={1} className="flex-1 resize-none bg-transparent px-1 py-2 text-[15px] outline-none max-h-40 leading-6 placeholder:text-muted-foreground/70 min-w-0" />
        <QuickReminderButton conversationId={conversationId} />
        <button onClick={toggleMic} className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full transition-all ${listening ? 'bg-destructive text-destructive-foreground' : 'bg-primary/15 text-primary shadow-[0_0_12px_hsl(217_91%_60%/0.3)] hover:bg-primary/25'}`}><Mic size={19} /></button>
        {sending ? (
          <button onClick={onStop} className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow active:scale-95 transition-all"><Square size={15} fill="currentColor" /></button>
        ) : (
          <button onClick={onSend} disabled={!input.trim() || uploading} className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow disabled:opacity-30 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none active:scale-95 transition-all"><ArrowUp size={19} /></button>
        )}
      </div>

      {(listening || transcribing) && (
        <div className="flex items-center gap-1.5 mt-1.5 px-2 text-xs text-destructive font-medium">
          <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
          {transcribing ? 'در حال تشخیص صوت...' : t('listening')}
        </div>
      )}
    </div>
  );
}