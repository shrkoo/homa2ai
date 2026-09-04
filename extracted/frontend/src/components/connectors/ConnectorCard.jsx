import React, { useState } from 'react';
import { Link as LinkIcon, ExternalLink, Check, Loader2, Star, KeyRound, X, Power, Trash2, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { invokeFunctionDirect } from '@/lib/directInvoke';
import { dataAdapter } from '@/lib/adapters';
import { toast } from '@/components/ui/use-toast';
import { getProviderById } from '@/lib/providerRegistry';
import { getCapabilityById } from '@/lib/toolCatalog';

function Stars({ score, size = 11 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < score ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'} />
      ))}
    </div>
  );
}

export default function ConnectorCard({ provider, connection, onConnected, onToggled, onDisconnected }) {
  const { t, language } = useI18n();
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const isConnected = connection?.status === 'active';
  const isRevoked = connection?.status === 'revoked';
  const enabled = connection?.metadata !== 'disabled';

  const errorMessages = {
    invalid_credentials: language === 'fa' ? 'کلید API نامعتبر یا منقضی است' : language === 'ku' ? 'کلیلی API نادروستە' : 'API key is invalid or expired',
    api_unavailable: language === 'fa' ? 'سرویس Provider موقتاً در دسترس نیست' : language === 'ku' ? 'خزمەتگوزاری بەردەست نییە' : 'Provider service temporarily unavailable',
    not_configured: language === 'fa' ? 'رمزنگاری روی Worker پیکربندی نشده' : 'Encryption not configured on Worker',
    unknown_provider: language === 'fa' ? 'Provider ناشناخته' : 'Unknown provider',
    storage_failed: language === 'fa' ? 'ذخیره‌سازی ناموفق بود' : 'Storage failed',
    no_user_token: language === 'fa' ? 'احراز هویت کاربر لازم است' : 'User authentication required',
    validation_failed: language === 'fa' ? 'اعتبارسنجی ناموفق بود' : 'Validation failed',
  };

  const handleConnect = async () => {
    if (!apiKey.trim()) return;
    setConnecting(true);
    try {
      const data = await invokeFunctionDirect('connectTool', { tool_id: provider.id, api_key: apiKey.trim() });
      if (data?.error) {
        toast({ title: errorMessages[data.code] || t('tool_connection_error') });
        setConnecting(false);
        return;
      }
      if (data?.status === 'CONNECTED') {
        // Real key is stored encrypted in Worker KV; UserConnection is a local index only.
        if (connection) {
          // Retry case — update existing connection to active
          await dataAdapter.update('UserConnection', connection.id, {
            status: 'active',
            key_hint: data.key_hint || apiKey.slice(-4),
            metadata: '',
            last_used: new Date().toISOString(),
          });
        } else {
          await dataAdapter.create('UserConnection', {
            tool_id: provider.id,
            provider_id: provider.id,
            connection_type: 'api_key',
            encrypted_key: 'kv:managed',
            key_hint: data.key_hint || apiKey.slice(-4),
            status: 'active',
          });
        }
        onConnected?.(provider.id);
        toast({ title: t('tool_connected') });
        setShowKey(false);
        setApiKey('');
      } else {
        toast({ title: t('tool_connection_error') });
      }
    } catch (e) {
      const code = e?.code || (e?.status === 401 ? 'no_user_token' : '');
      toast({ title: errorMessages[code] || t('error_occurred') });
    }
    setConnecting(false);
  };

  const handleToggle = async () => {
    if (!connection) return;
    setToggling(true);
    try {
      await dataAdapter.update('UserConnection', connection.id, {
        metadata: enabled ? 'disabled' : '',
      });
      onToggled?.(connection.id, !enabled);
    } catch {
      toast({ title: t('error_occurred') });
    }
    setToggling(false);
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    setDisconnecting(true);
    try {
      // Delete the encrypted credential from Worker KV first.
      try { await invokeFunctionDirect('disconnectTool', { tool_id: provider.id }); } catch {}
      await dataAdapter.delete('UserConnection', connection.id);
      onDisconnected?.(connection.id);
      toast({ title: language === 'fa' ? 'اتصال قطع شد' : language === 'ku' ? 'بەستەر بڕایەوە' : 'Disconnected' });
    } catch {
      toast({ title: t('error_occurred') });
    }
    setDisconnecting(false);
  };

  const pricingLabel = provider.pricing === 'free' ? t('tool_free') : provider.pricing === 'freemium' ? t('tool_freemium') : t('tool_paid');
  const capLabels = provider.capabilities.slice(0, 3).map((c) => getCapabilityById(c)?.label?.[language] || c);

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden transition-all ${isConnected ? (enabled ? 'border-primary/40' : 'border-border opacity-60') : (connection?.status === 'error' ? 'border-destructive/40' : isRevoked ? 'border-amber-500/40' : 'border-border')}`}>
      <div className="p-3.5">
        <div className="flex items-start gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0 text-sm font-bold uppercase">
            {provider.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-semibold text-sm">{provider.name}</p>
              {isConnected && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-medium">
                  <Check size={9} /> {t('tool_connected_status')}
                </span>
              )}
              {isConnected && !enabled && (
                <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">{language === 'fa' ? 'خاموش' : 'Off'}</span>
              )}
              {connection?.status === 'error' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive text-[10px] font-medium">
                  <AlertCircle size={9} /> {language === 'fa' ? 'خطا' : language === 'ku' ? 'هەڵە' : 'Error'}
                </span>
              )}
              {isRevoked && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-medium">
                  <XCircle size={9} /> {language === 'fa' ? 'رد شد' : language === 'ku' ? 'ڕەتکرا' : 'Revoked'}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{provider.description?.[language] || provider.description?.en || ''}</p>
            {connection?.status === 'error' && (
              <p className="text-[11px] text-destructive mt-1 leading-snug">
                {language === 'fa' ? 'دسترسی رد شد. کلید API را بررسی و دوباره تلاش کنید.' : language === 'ku' ? 'دەستگەیشتن ڕەتکرا. کلیلی API بپشکنە.' : 'Access denied. Check your API key and retry.'}
              </p>
            )}
            {isRevoked && (
              <p className="text-[11px] text-amber-600 mt-1 leading-snug">
                {language === 'fa' ? 'دسترسی توسط سرویس لغو شد. دوباره متصل شوید.' : language === 'ku' ? 'دەستگەیشتن هەڵوەشایەوە. دووبارە ببەستەوە.' : 'Access revoked by service. Reconnect.'}
              </p>
            )}
            {isConnected && connection?.last_used && (
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                {language === 'fa' ? 'آخرین استفاده: ' : 'Last used: '}{new Date(connection.last_used).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US')}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-2">
          {capLabels.map((c) => (
            <span key={c} className="px-1.5 py-0.5 rounded-md bg-accent text-[10px] text-muted-foreground">{c}</span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2.5 text-xs">
          <Stars score={provider.quality_score || 0} />
          <span className="text-muted-foreground/40">•</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${provider.pricing === 'free' ? 'bg-emerald-500/10 text-emerald-600' : provider.pricing === 'freemium' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'}`}>{pricingLabel}</span>
          {provider.free_plan && provider.free_plan !== 'None' && <span className="text-muted-foreground text-[10px]">{provider.free_plan}</span>}
        </div>

        {provider.paid_plans && (
          <p className="text-[10px] text-muted-foreground/70 mt-1.5" dir="ltr">{provider.paid_plans}</p>
        )}

        <div className="flex items-center gap-1.5 mt-2.5">
          {!provider.api_available && (
            <span className="flex-1 h-8 rounded-full bg-accent text-muted-foreground text-xs font-medium flex items-center justify-center gap-1.5">
              <ExternalLink size={12} /> {language === 'fa' ? 'فقط وب‌سایت' : language === 'ku' ? 'تەنها ماڵپەڕ' : 'Website only'}
            </span>
          )}
          {provider.api_available && !isConnected && !connection && (
            <button onClick={() => setShowKey((v) => !v)} className="flex-1 h-8 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
              <KeyRound size={12} /> {t('tool_connect')}
            </button>
          )}
          {provider.api_available && (connection?.status === 'error' || isRevoked) && (
            <button onClick={() => setShowKey((v) => !v)} className="flex-1 h-8 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
              <RefreshCw size={12} /> {language === 'fa' ? 'دوباره تلاش کن' : language === 'ku' ? 'دووبارە هەوڵبدە' : 'Retry'}
            </button>
          )}
          {provider.api_available && isConnected && (
            <>
              <button onClick={handleToggle} disabled={toggling} className="flex-1 h-8 rounded-full bg-accent text-foreground text-xs font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                {toggling ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />} {enabled ? (language === 'fa' ? 'خاموش کن' : 'Disable') : (language === 'fa' ? 'روشن کن' : 'Enable')}
              </button>
              <button onClick={handleDisconnect} disabled={disconnecting} className="h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0 active:scale-95 transition-transform disabled:opacity-40">
                {disconnecting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              </button>
            </>
          )}
          <a href={provider.website} target="_blank" rel="noreferrer" className="h-8 px-3 rounded-full bg-accent text-foreground text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-accent/70 transition-colors shrink-0">
            <ExternalLink size={12} /> {t('tool_view')}
          </a>
        </div>

        {showKey && !isConnected && (
          <div className="mt-2.5 pt-2.5 border-t border-border space-y-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('tool_api_key_placeholder')}
              className="w-full h-9 px-3 rounded-xl bg-accent text-xs outline-none focus:bg-accent/70"
              dir="ltr"
            />
            <div className="flex gap-2">
              <button onClick={handleConnect} disabled={connecting || !apiKey.trim()} className="flex-1 h-8 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-40 active:scale-95 transition-transform">
                {connecting ? <Loader2 size={12} className="animate-spin" /> : <LinkIcon size={12} />} {t('tool_connect_to_homa')}
              </button>
              <button onClick={() => setShowKey(false)} className="h-8 w-8 rounded-full bg-accent flex items-center justify-center shrink-0">
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