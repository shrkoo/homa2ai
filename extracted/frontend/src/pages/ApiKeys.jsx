import React, { useEffect, useState } from 'react';
import { apiAdapter } from '@/lib/adapters';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Plus, Copy, Check, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import DevNav from '@/components/DevNav';
import { useI18n } from '@/i18n/I18nContext';

export default function ApiKeys() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiAdapter.invokeKeys({ action: 'list' });
      setKeys(res.data?.data?.keys || []);
    } catch (e) {
      toast({ title: e.message || 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setBusy(true);
    try {
      const res = await apiAdapter.invokeKeys({ action: 'generate', label });
      setNewKey(res.data?.data?.key || null);
      setLabel('');
      load();
    } catch (e) {
      toast({ title: e.message || 'error' });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id) => {
    if (!window.confirm(t('revoke_confirm'))) return;
    try {
      await apiAdapter.invokeKeys({ action: 'revoke', id });
      load();
    } catch (e) {
      toast({ title: e.message || 'error' });
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('api_keys')} />
      <DevNav />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl border border-border p-4 space-y-3">
          <div>
            <p className="font-medium">{t('generate_key')}</p>
            <p className="text-xs text-muted-foreground">{t('generate_key_desc')}</p>
          </div>
          <div className="flex gap-2">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('key_label')} />
            <Button onClick={generate} disabled={busy}>
              <Plus size={16} /> {t('generate_key')}
            </Button>
          </div>
        </div>

        {newKey && (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-2">
            <p className="font-semibold text-primary">{t('key_created')}</p>
            <p className="text-xs text-muted-foreground">{t('key_created_desc')}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-xs break-all">{newKey}</code>
              <Button size="icon" variant="outline" onClick={() => copy(newKey)}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setNewKey(null)}>{t('done')}</Button>
          </div>
        )}

        <div className="space-y-2">
          {loading ? (
            <p className="text-sm text-muted-foreground">{t('loading')}</p>
          ) : keys.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Key className="mx-auto mb-2 opacity-40" size={28} />
              <p className="text-sm">{t('no_keys')}</p>
              <p className="text-xs">{t('no_keys_desc')}</p>
            </div>
          ) : (
            keys.map((k) => (
              <div key={k.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <Key size={16} className="text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{k.label || k.key_prefix}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{k.key_prefix}</p>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${k.active ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                  {k.active ? t('active_key') : t('revoked_key')}
                </span>
                {k.active && (
                  <Button size="icon" variant="ghost" onClick={() => revoke(k.id)}>
                    <Trash2 size={15} className="text-destructive" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}