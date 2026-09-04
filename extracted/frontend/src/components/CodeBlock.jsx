import React, { useRef, useState } from 'react';
import { Maximize2, X, Copy, Check, Eye } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export default function CodeBlock({ children, ...p }) {
  const { t } = useI18n();
  const ref = useRef(null);
  const [fs, setFs] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const childProps = children?.props || {};
  const className = childProps.className || '';
  const langMatch = className.match(/language-(\w+)/);
  const lang = langMatch ? langMatch[1] : '';
  const isHTML = lang === 'html' || lang === 'html5';

  const text = () => {
    if (typeof children === 'string') return children;
    const c = childProps.children;
    if (typeof c === 'string') return c;
    return ref.current?.textContent || '';
  };

  const copy = () => {
    try {
      navigator.clipboard?.writeText(text());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <>
      <div className="relative my-2 rounded-xl overflow-hidden border border-border/50 bg-muted/60">
        <div className="flex items-center justify-between px-3 h-8 bg-muted/80 border-b border-border/50">
          <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wide">{lang || 'code'}</span>
          <div className="flex items-center gap-0.5">
            {isHTML && (
              <button onClick={() => { setShowPreview(true); setFs(true); }} className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors" title={t('preview')}>
                <Eye size={13} />
              </button>
            )}
            <button onClick={copy} className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors" title={t('copy')}>
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            </button>
            <button onClick={() => setFs(true)} className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors" title={t('fullscreen')}>
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
        <pre ref={ref} className="overflow-x-auto p-3 text-[13px] leading-6" dir="ltr" {...p}>
          {children}
        </pre>
      </div>
      {fs && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col" onClick={() => { setFs(false); setShowPreview(false); }}>
          <div className="flex items-center justify-between px-4 h-12 border-b border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <button onClick={() => { setFs(false); setShowPreview(false); }} className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:bg-white/10"><X size={20} /></button>
              {isHTML && (
                <button onClick={() => setShowPreview(v => !v)} className={`px-3 h-9 rounded-full text-sm font-medium transition-colors ${showPreview ? 'bg-white text-black' : 'text-white/80 hover:bg-white/10'}`}>
                  {showPreview ? t('code_label') : t('preview')}
                </button>
              )}
            </div>
            <button onClick={copy} className="w-9 h-9 flex items-center justify-center rounded-full text-white/80 hover:bg-white/10">{copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}</button>
          </div>
          {showPreview && isHTML ? (
            <iframe srcDoc={text()} className="flex-1 w-full bg-white" onClick={(e) => e.stopPropagation()} sandbox="allow-scripts" title="preview" />
          ) : (
            <pre className="flex-1 overflow-auto p-4 text-[13px] leading-6 font-mono text-white/90 whitespace-pre" dir="ltr" onClick={(e) => e.stopPropagation()}>
              {text()}
            </pre>
          )}
        </div>
      )}
    </>
  );
}