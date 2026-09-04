import React, { useState } from 'react';
import { Link as LinkIcon, ExternalLink, Check, Loader2, Star, Zap, DollarSign, KeyRound, Sparkles, X } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { dataAdapter } from '@/lib/adapters';
import { invokeFunctionDirect } from '@/lib/directInvoke';
import { toast } from '@/components/ui/use-toast';

function Stars({ score, size = 11 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < score ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'} />
      ))}
    </div>
  );
}

function ToolRow({ tool, language, onUse }) {
  const { t } = useI18n();
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(tool.connected);

  const handleConnect = async () => {
    if (!apiKey.trim()) return;
    setConnecting(true);
    try {
      const res = await invokeFunctionDirect('connectTool', { tool_id: tool.id, api_key: apiKey.trim() });
      const data = res?.data || res;
      if (data.encrypted_key) {
        await dataAdapter.create('UserConnection', {
          tool_id: tool.id,
          provider_id: tool.id,
          encrypted_key: data.encrypted_key,
          key_hint: data.key_hint || '',
          status: 'active',
        });
        setConnected(true);
        toast({ title: t('tool_connected') });
        setShowKeyInput(false);
        setApiKey('');
      } else {
        toast({ title: t('tool_connection_error') });
      }
    } catch (e) {
      const msg = String(e?.message || '');
      if (msg.includes('401') || msg.includes('auth')) toast({ title: 'احراز هویت Worker ناموفق بود.' });
      else if (msg.includes('Failed to fetch') || msg.includes('Network')) toast({ title: 'ارتباط با سرور برقرار نشد.' });
      else if (msg.includes('not_configured')) toast({ title: 'Worker تنظیم نشده. به Settings بروید.' });
      else toast({ title: t('error_occurred') });
      console.warn('[Homa ToolCard] connect error', msg);
    }
    setConnecting(false);
  };

  const pricingLabel = tool.pricing === 'free' ? t('tool_free') : tool.pricing === 'freemium' ? t('tool_freemium') : t('tool_paid');

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm">{tool.name}</p>
              {connected && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-medium">
                  <Check size={9} /> {t('tool_connected_status')}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.description?.[language] || tool.description?.en || ''}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5 text-xs">
          <div className="flex items-center gap-1"><Stars score={tool.quality_score || 0} /></div>
          <span className="text-muted-foreground/40">•</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${tool.pricing === 'free' ? 'bg-emerald-500/10 text-emerald-600' : tool.pricing === 'freemium' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}>{pricingLabel}</span>
          {tool.free_plan && <span className="text-muted-foreground text-[10px]">{tool.free_plan}</span>}
        </div>

        <div className="flex items-center gap-1.5 mt-2.5">
          {tool.api_available && !connected && (
            <button onClick={() => setShowKeyInput(v => !v)} className="flex-1 h-8 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
              <KeyRound size={12} /> {t('tool_connect')}
            </button>
          )}
          {tool.api_available && connected && (
            <button onClick={() => {
              if (onUse) { onUse(tool); return; }
              window.dispatchEvent(new CustomEvent('homa-use-tool', { detail: { tool_id: tool.id, capability: tool.capabilities?.[0] } }));
            }} className="flex-1 h-8 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
              <Sparkles size={12} /> {t('tool_use')}
            </button>
          )}
          {!tool.api_available && (
            <span className="flex-1 h-8 rounded-full bg-accent text-muted-foreground text-xs font-medium flex items-center justify-center gap-1.5">
              <ExternalLink size={12} /> {language === 'en' ? 'Website only' : language === 'ku' ? 'تەنها ماڵپەڕ' : 'فقط وب‌سایت'}
            </span>
          )}
          <a href={tool.website} target="_blank" rel="noreferrer" className="h-8 px-3 rounded-full bg-accent text-foreground text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-accent/70 transition-colors shrink-0">
            <ExternalLink size={12} /> {t('tool_view')}
          </a>
        </div>

        {showKeyInput && !connected && (
          <div className="mt-2.5 pt-2.5 border-t border-border space-y-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('tool_api_key_placeholder')}
              className="w-full h-9 px-3 rounded-xl bg-accent text-xs outline-none focus:bg-accent/70"
            />
            <div className="flex gap-2">
              <button onClick={handleConnect} disabled={connecting || !apiKey.trim()} className="flex-1 h-8 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition-transform">
                {connecting ? <Loader2 size={12} className="animate-spin" /> : <LinkIcon size={12} />} {t('tool_connect_to_homa')}
              </button>
              <button onClick={() => setShowKeyInput(false)} className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                <X size={14} />
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{t('tool_security_note')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ToolCard({ capability, capability_label, query, tools, onUse }) {
  const { t, language } = useI18n();

  if (!tools || tools.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 text-center">
        <p className="text-sm text-muted-foreground">{t('tool_no_tools_found')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 px-1">
        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Sparkles size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">{t('tool_discovery')}</p>
          <p className="text-sm font-bold">{capability_label}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground px-1 -mt-1">{t('tool_suggested_desc')}</p>
      {tools.map((tool) => (
        <ToolRow key={tool.id} tool={tool} language={language} onUse={onUse} />
      ))}
    </div>
  );
}