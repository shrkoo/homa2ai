import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Sparkles, ExternalLink, Globe } from 'lucide-react';
import { dataAdapter } from '@/lib/adapters';
import { useI18n } from '@/i18n/I18nContext';
import PageHeader from '@/components/PageHeader';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { toast } from '@/components/ui/use-toast';
import { apiErrorMessage } from '@/utils/apiError';
import { invokeFunctionDirect } from '@/lib/directInvoke';

export default function AnalysisToolPage({ titleKey, placeholderKey, functionName, multiline, model, actionKey, costFeature }) {
  const { t, language } = useI18n();
  const [input, setInput] = useState('');
  const [outLang, setOutLang] = useState(language);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [creditInfo, setCreditInfo] = useState(null);

  useEffect(() => {
    if (!costFeature) return;
    (async () => {
      try {
        const res = await dataAdapter.filter('Usage', {}, '-created_date', 1);
        const u = res?.[0];
        setCreditInfo({ cost: 0, credits: u?.credits ?? 0 });
      } catch { setCreditInfo(null); }
    })();
  }, [costFeature]);

  const run = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await invokeFunctionDirect(functionName, { input: input.trim(), model, language: outLang });
      const data = res?.data || res;
      if (data.error) toast({ title: apiErrorMessage(data.error, t) });
      else setResult(data);
    } catch {
      toast({ title: t('error_occurred') });
    }
    setLoading(false);
  };

  const domain = (url) => {
    try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
  };

  return (
    <div className="min-h-dvh">
      <PageHeader title={t(titleKey)} />
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {multiline ? (
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t(placeholderKey)}
            rows={3}
            className="w-full resize-none rounded-2xl border border-border bg-card p-3 text-[15px] outline-none focus:border-primary"
          />
        ) : (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t(placeholderKey)}
            className="w-full h-11 px-4 rounded-2xl border border-border bg-card text-[15px] outline-none focus:border-primary"
          />
        )}
        <div className="flex gap-1.5">
          {[{ code: 'fa', label: 'فا' }, { code: 'ku', label: 'کوردی' }, { code: 'en', label: 'EN' }].map((l) => (
            <button key={l.code} onClick={() => setOutLang(l.code)} className={`flex-1 h-8 rounded-full text-xs font-medium ${outLang === l.code ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>{l.label}</button>
          ))}
        </div>
        {costFeature && creditInfo && (
          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-accent">
            <span className="text-muted-foreground">{t('cost_label')}: <span className="font-bold text-foreground">{creditInfo.cost}</span> {t('credits_label')}</span>
            <span className="text-muted-foreground">{t('credits_balance')}: <span className="font-bold text-foreground">{creditInfo.credits}</span></span>
          </div>
        )}
        {costFeature && creditInfo && creditInfo.credits < creditInfo.cost && (
          <div className="flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-xl bg-destructive/10 text-destructive">
            <span className="flex-1">{t('err_quota')}</span>
            <Link to="/credits" className="font-semibold underline shrink-0">{t('credits_buy')}</Link>
          </div>
        )}
        <button
          onClick={run}
          disabled={!input.trim() || loading || (creditInfo && creditInfo.credits < creditInfo.cost)}
          className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.98] transition-all"
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> {t('thinking')}</> : <><Sparkles size={18} /> {t(actionKey || 'analyze')}</>}
        </button>

        {loading && <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-4 rounded bg-accent/50 animate-pulse" />)}</div>}

        {result && (
          <>
            <div className="rounded-2xl border border-border bg-card p-4">
              <MarkdownRenderer content={result.content} />
            </div>
            {Array.isArray(result.sources) && result.sources.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Globe size={13} /> {t('sources')}
                </p>
                <div className="space-y-2">
                  {result.sources.map((s, i) => (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block p-3 rounded-xl border border-border bg-card hover:bg-accent/40 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <ExternalLink size={13} className="text-primary shrink-0" />
                        <span className="truncate">{s.title}</span>
                      </div>
                      <div className="text-xs text-primary mt-0.5">{domain(s.url)}</div>
                      {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}