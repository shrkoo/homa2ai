import React, { useState, useRef } from 'react';
import { Upload, Loader2, Send, FileText, Image as ImageIcon } from 'lucide-react';
import { dataAdapter } from '@/lib/adapters';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';
import { toast } from '@/components/ui/use-toast';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { apiErrorMessage } from '@/utils/apiError';
import { invokeFunctionDirect } from '@/lib/directInvoke';

const TEXT_TYPES = ['text/plain', 'text/csv', 'application/json', 'text/markdown'];

export default function FileAnalysis() {
  const { t, language } = useI18n();
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [outLang, setOutLang] = useState(language);
  const inputRef = useRef(null);

  const onFile = async (f) => {
    if (!f) return;
    setUploading(true);
    setFile(f);
    setFileUrl(null);
    setTextContent('');
    setAnswer('');
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(f);
      });
      const upRes = await invokeFunctionDirect('uploadFile', { base64, filename: f.name, mimeType: f.type });
      const upData = upRes?.data || upRes;
      const file_url = upData?.file_url;
      if (!file_url) throw new Error('Upload failed');
      setFileUrl(file_url);
      if (TEXT_TYPES.includes(f.type) || (f.size < 200000 && f.type.startsWith('text'))) {
        const txt = await f.text();
        setTextContent(txt.slice(0, 8000));
      }
      try {
        await dataAdapter.create('LibraryItem', {
          title: f.name,
          content: f.name,
          kind: f.type.startsWith('image/') ? 'image' : (f.type.startsWith('video/') ? 'video' : 'file'),
          file_url
        });
      } catch {}
      toast({ title: t('file_uploaded') });
    } catch {
      toast({ title: t('error_occurred') });
      setFile(null);
    }
    setUploading(false);
  };

  const ask = async () => {
    if (!question.trim() || asking) return;
    if (!textContent) { toast({ title: t('error_occurred'), description: t('ask_about_file') }); return; }
    setAsking(true);
    setAnswer('');
    try {
      const res = await invokeFunctionDirect('fileAnalyze', {
        text: textContent,
        question: question.trim(),
        language: outLang
      });
      const data = res?.data || res;
      if (data.error) { toast({ title: apiErrorMessage(data.error, t) }); }
      else setAnswer(data.content || '');
    } catch { toast({ title: t('error_occurred') }); }
    setAsking(false);
  };

  return (
    <div className="min-h-dvh">
      <PageHeader title={t('file_analysis')} />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <input ref={inputRef} type="file" accept="image/*,text/*,.csv,.json,.md,.txt,application/pdf" onChange={(e) => onFile(e.target.files?.[0])} className="hidden" />
        <button onClick={() => inputRef.current?.click()} disabled={uploading} className="w-full h-32 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-accent/30 disabled:opacity-50">
          {uploading ? <Loader2 size={24} className="animate-spin" /> : <Upload size={24} />}
          <span className="text-sm">{uploading ? t('loading') : t('menu_upload')}</span>
        </button>

        {fileUrl && (
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              {file?.type?.startsWith('image/') ? <ImageIcon size={18} /> : <FileText size={18} />}
              <p className="text-sm font-medium truncate flex-1">{file?.name}</p>
            </div>
            {file?.type?.startsWith('image/') && <img src={fileUrl} alt={file?.name} className="w-full rounded-xl mt-2" />}
          </div>
        )}

        {fileUrl && !textContent && (
          <p className="text-xs text-muted-foreground bg-accent/40 rounded-xl p-3 leading-6">{language === 'en' ? 'Only text files (txt, csv, json, md) can be analyzed. Images and PDFs are not supported yet.' : language === 'ku' ? 'تەنها فایلە دەقییەکان (txt, csv, json, md) دەتوانرێت شیکاری بکرێن. وێنە و PDF پشتیوانی ناکرێن.' : 'فقط فایل‌های متنی (txt, csv, json, md) قابل تحلیل هستند. تصویر و PDF فعلاً پشتیبانی نمی‌شوند.'}</p>
        )}

        {textContent && (
          <div className="space-y-2">
            <div className="flex gap-1.5 mb-1">
              {[{ code: 'fa', label: 'فا' }, { code: 'ku', label: 'کوردی' }, { code: 'en', label: 'EN' }].map((l) => (
                <button key={l.code} onClick={() => setOutLang(l.code)} className={`flex-1 h-8 rounded-full text-xs font-medium ${outLang === l.code ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>{l.label}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()} placeholder={t('ask_about_file')} className="flex-1 h-11 px-4 rounded-2xl border border-border bg-card text-[15px] outline-none focus:border-primary" />
              <button onClick={ask} disabled={asking || !question.trim()} className="w-11 h-11 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40">{asking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}</button>
            </div>
            {asking && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> {t('thinking')}</p>}
            {answer && <div className="rounded-2xl border border-border bg-card p-3 text-sm leading-7"><MarkdownRenderer content={answer} /></div>}
          </div>
        )}
      </div>
    </div>
  );
}