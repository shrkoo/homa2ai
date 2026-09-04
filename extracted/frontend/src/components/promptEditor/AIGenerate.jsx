import React, { useState } from 'react';
import { Sparkles, Loader2, Wand2, Copy, Check, RefreshCw } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { pe } from './promptEditorStrings';
import { toast } from '@/components/ui/use-toast';
import { invokeFunctionDirect } from '@/lib/directInvoke';
import { generateProfessionalPrompt, detectPromptIntent } from '@/lib/professionalPrompt';

export default function AIGenerate({ type, setType, onApply }) {
  const { language } = useI18n();
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [textResult, setTextResult] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    try {
      if (type === 'text') {
        // Client-side professional prompt generation — works without API credits.
        const result = generateProfessionalPrompt(description, language);
        setTextResult(result);
        toast({ title: pe(language, 'pe_ai_use') });
      } else {
        // Image/Video prompt generation via backend (Worker or Base44 function).
        const res = await invokeFunctionDirect('generatePrompt', { description, type, language });
        const data = res?.data || res;
        if (data.sections) {
          onApply({ type, sections: data.sections });
          toast({ title: pe(language, 'pe_ai_use') });
        } else if (data.error) {
          toast({ title: pe(language, 'pe_ai_error'), description: data.error });
        } else {
          toast({ title: pe(language, 'pe_ai_error') });
        }
      }
    } catch (e) {
      const msg = String(e?.message || '');
      if (msg.includes('402') || msg.includes('403')) {
        toast({ title: 'اعتبار سرویس هوش مصنوعی موقتاً محدود است. بعد از بازنشانی دوباره تلاش کنید.' });
      } else if (msg.includes('Failed to fetch') || msg.includes('Network')) {
        toast({ title: 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.' });
      } else {
        toast({ title: pe(language, 'pe_ai_error') });
      }
    }
    setLoading(false);
  };

  const regenerate = () => {
    if (!description.trim()) return;
    setLoading(true);
    // Small delay for UX feedback
    setTimeout(() => {
      const result = generateProfessionalPrompt(description, language);
      setTextResult(result);
      setLoading(false);
      toast({ title: pe(language, 'pe_ai_use') });
    }, 300);
  };

  const copyResult = async () => {
    if (!textResult) return;
    try {
      await navigator.clipboard.writeText(textResult);
      setCopied(true);
      toast({ title: pe(language, 'pe_copied') });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'کپی ناموفق بود' });
    }
  };

  const intent = description.trim() ? detectPromptIntent(description) : null;
  const intentLabel = intent
    ? { fa: `نوع تشخیص‌داده‌شده: ${intent.id}`, en: `Detected: ${intent.id}`, ku: `ناسراو: ${intent.id}` }[language]
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Wand2 size={16} className="text-primary shrink-0" />
        <span>{pe(language, 'pe_ai_desc')}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { setType('text'); setTextResult(''); }} className={`px-3 h-8 rounded-full text-xs font-medium transition-colors ${type === 'text' ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'}`}>{pe(language, 'pe_text')}</button>
        <button onClick={() => { setType('image'); setTextResult(''); }} className={`px-3 h-8 rounded-full text-xs font-medium transition-colors ${type === 'image' ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'}`}>{pe(language, 'pe_image')}</button>
        <button onClick={() => { setType('video'); setTextResult(''); }} className={`px-3 h-8 rounded-full text-xs font-medium transition-colors ${type === 'video' ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground'}`}>{pe(language, 'pe_video')}</button>
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={type === 'text' ? pe(language, 'pe_ai_text_placeholder') : pe(language, 'pe_ai_placeholder')}
        rows={4}
        className="w-full px-3 py-2.5 rounded-xl bg-accent/50 text-sm outline-none focus:bg-accent resize-none leading-6"
      />
      {intentLabel && type === 'text' && (
        <div className="text-[11px] text-muted-foreground px-1">{intentLabel}</div>
      )}
      <button
        onClick={generate}
        disabled={!description.trim() || loading}
        className="w-full h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-transform"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
        {loading ? pe(language, 'pe_ai_generating') : pe(language, 'pe_ai_generate')}
      </button>

      {type === 'text' && textResult && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-muted-foreground">{pe(language, 'pe_preview')}</span>
            <div className="flex gap-1.5">
              <button onClick={copyResult} className="flex items-center gap-1 px-2.5 h-7 rounded-full bg-accent text-xs font-medium active:scale-95 transition-transform">
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                {pe(language, 'pe_copy')}
              </button>
              <button onClick={regenerate} disabled={loading} className="flex items-center gap-1 px-2.5 h-7 rounded-full bg-accent text-xs font-medium active:scale-95 transition-transform disabled:opacity-40">
                <RefreshCw size={13} />
                {pe(language, 'pe_regenerate')}
              </button>
            </div>
          </div>
          <textarea
            value={textResult}
            onChange={(e) => setTextResult(e.target.value)}
            rows={10}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:ring-1 focus:ring-primary/40 resize-none leading-6"
          />
        </div>
      )}
    </div>
  );
}