import React, { useEffect, useState } from 'react';
import { apiAdapter } from '@/lib/adapters';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Loader2, Sparkles, Coins, Zap } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import DevNav from '@/components/DevNav';
import { useI18n } from '@/i18n/I18nContext';

const getApiBase = () => {
  try {
    return (localStorage.getItem('homa_worker_url') || 'https://homa-ai-core.shahramalidazeh620.workers.dev').trim().replace(/\/$/, '');
  } catch {
    return 'https://homa-ai-core.shahramalidazeh620.workers.dev';
  }
};

const ENDPOINTS = [
  { id: 'homaApiChat', label: 'Chat / گفتگو', cost: 1, placeholder: 'سلام، چطوری؟', field: 'message' },
  { id: 'homaApiCode', label: 'Code / کدنویسی', cost: 2, placeholder: 'یک تابع پایتون برای مرتب‌سازی بنویس', field: 'message' },
  { id: 'homaApiReason', label: 'Reason / استدلال', cost: 2, placeholder: 'اثبات کنید که ۲ + ۲ = ۴', field: 'message' },
  { id: 'homaApiWebSearch', label: 'Web Search / جستجوی وب', cost: 1, placeholder: 'آخرین اخبار هوش مصنوعی', field: 'input' },
  { id: 'homaApiDeepResearch', label: 'Deep Research / پژوهش', cost: 3, placeholder: 'مقایسه باتری‌های الکتریکی', field: 'input' },
];

export default function ApiPlayground() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [keys, setKeys] = useState([]);
  const [selectedKey, setSelectedKey] = useState('');
  const [endpoint, setEndpoint] = useState(ENDPOINTS[0]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiAdapter.invokeKeys({ action: 'list' });
        const list = res.data?.data?.keys || [];
        setKeys(list.filter((k) => k.active));
        if (list.length > 0 && list[0].active) {
          // We don't have the raw key after generation, so user must paste it
        }
      } catch {}
    })();
  }, []);

  const run = async () => {
    if (!selectedKey.trim()) {
      toast({ title: 'کلید API را وارد کنید' });
      return;
    }
    if (!input.trim()) {
      toast({ title: 'متن درخواست را وارد کنید' });
      return;
    }
    setLoading(true);
    setResponse(null);
    setError(null);
    try {
      const body = { language: 'fa' };
      body[endpoint.field] = input;
      const res = await fetch(`${getApiBase()}/${endpoint.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${selectedKey.trim()}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const code = data.error?.code || 'ERROR';
        const msg = data.error?.message || 'خطای ناشناخته';
        setError(`${code}: ${msg}`);
      } else {
        setResponse(data);
      }
    } catch (e) {
      setError(e.message || 'خطای شبکه');
    } finally {
      setLoading(false);
    }
  };

  const renderResponse = () => {
    if (!response) return null;
    const d = response.data;
    const u = response.usage;
    return (
      <div className="space-y-3">
        {u && (
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-600">
              <Coins size={12} /> {u.credits_used} اعتبار
            </span>
            {u.remaining != null && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary">
                باقی‌مانده: {u.remaining}
              </span>
            )}
            {u.provider && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent text-muted-foreground">
                <Zap size={12} /> {u.provider}
              </span>
            )}
          </div>
        )}
        {d?.content && (
          <div className="rounded-xl border border-border p-3 bg-accent/30">
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">پاسخ هوش مصنوعی</p>
            <div className="text-sm leading-7 whitespace-pre-wrap break-words">{d.content}</div>
          </div>
        )}
        {d?.sources?.length > 0 && (
          <div className="rounded-xl border border-border p-3">
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">منابع</p>
            <div className="space-y-1">
              {d.sources.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noreferrer" className="block text-xs text-primary hover:underline truncate">
                  [{i + 1}] {s.title || s.site}
                </a>
              ))}
            </div>
          </div>
        )}
        {d?.text && (
          <div className="rounded-xl border border-border p-3 bg-accent/30">
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">متن</p>
            <div className="text-sm leading-7 whitespace-pre-wrap break-words">{d.text}</div>
          </div>
        )}
        {d?.url && (
          <div className="rounded-xl border border-border p-3">
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">نتیجه</p>
            <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline break-all">{d.url}</a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Playground — تست API" />
      <DevNav />
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-primary" />
            <p className="text-sm font-semibold">آزمایش واقعی روی هوش مصنوعی</p>
          </div>
          <p className="text-xs text-muted-foreground leading-6">
            کلید API خود را وارد کنید، یک قابلیت انتخاب کنید و درخواست بفرستید. پاسخ مستقیماً از سرور هوش مصنوعی (Groq) برمی‌گردد و اعتبار مصرف می‌شود.
          </p>
        </div>

        <div className="rounded-xl border border-border p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">کلید API (HOMA_...)</label>
            <Input
              type="password"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              placeholder="HOMA_xxxxxxxxxxxx"
              className="font-mono text-xs"
            />
            {keys.length > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {keys.length} کلید فعال دارید — کلید خام را از زمان ساخت کپی کنید (فقط یک‌بار نمایش داده شد).
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">قابلیت</label>
            <div className="flex flex-wrap gap-1.5">
              {ENDPOINTS.map((ep) => (
                <button
                  key={ep.id}
                  onClick={() => { setEndpoint(ep); setInput(''); setResponse(null); setError(null); }}
                  className={`px-3 h-9 rounded-lg text-xs font-medium transition-colors ${
                    endpoint.id === ep.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-accent text-foreground hover:bg-accent/70'
                  }`}
                >
                  {ep.label} · {ep.cost} اعتبار
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">درخواست</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={endpoint.placeholder}
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Button onClick={run} disabled={loading} className="w-full">
            {loading ? <><Loader2 size={16} className="animate-spin" /> در حال اجرا...</> : <><Play size={16} /> اجرای درخواست</>}
          </Button>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <p className="text-sm font-semibold text-destructive mb-1">خطا</p>
            <p className="text-xs text-destructive/80 break-words">{error}</p>
          </div>
        )}

        {response && (
          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-sm font-semibold">نتیجه</p>
            {renderResponse()}
          </div>
        )}
      </div>
    </div>
  );
}