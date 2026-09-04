import React, { useRef } from 'react';
import { Copy, Trash2, Save, Download, Upload } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { pe } from './promptEditorStrings';
import { toast } from '@/components/ui/use-toast';

export default function PromptPreview({ prompt, onClear, onSave, onImport }) {
  const { language } = useI18n();
  const fileRef = useRef(null);

  const copy = async () => {
    try { await navigator.clipboard.writeText(prompt); toast({ title: pe(language, 'pe_copied') }); } catch {}
  };

  const exportTxt = () => {
    const blob = new Blob([prompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'homa-prompt.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { const txt = await f.text(); onImport(txt); toast({ title: pe(language, 'pe_import_ok') }); }
    catch { toast({ title: pe(language, 'pe_import_err') }); }
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border bg-card p-3 min-h-24">
        <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">{pe(language, 'pe_preview')}</p>
        <p className="text-sm whitespace-pre-wrap break-words leading-6">{prompt || pe(language, 'pe_empty')}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={copy} className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium active:scale-[0.98] transition-transform"><Copy size={16} /> {pe(language, 'pe_copy')}</button>
        <button onClick={onClear} className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-accent text-sm font-medium active:scale-[0.98] transition-transform"><Trash2 size={16} /> {pe(language, 'pe_clear')}</button>
        <button onClick={onSave} className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-accent text-sm font-medium active:scale-[0.98] transition-transform"><Save size={16} /> {pe(language, 'pe_save')}</button>
        <button onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-1.5 h-10 rounded-xl bg-accent text-sm font-medium active:scale-[0.98] transition-transform"><Upload size={16} /> {pe(language, 'pe_import')}</button>
      </div>
      <button onClick={exportTxt} className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl border border-border text-sm font-medium active:scale-[0.98] transition-transform"><Download size={16} /> {pe(language, 'pe_export')}</button>
      <input ref={fileRef} type="file" accept=".txt,text/plain" onChange={onFile} className="hidden" />
    </div>
  );
}