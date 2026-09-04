import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Monitor, Globe, Volume2, Brain, Bell, Shield, KeyRound, Trash2, Loader2, Mail, LogOut, Sparkles, Info, FileText, Flag, Play, Check, ChevronLeft, Wrench, Plug } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/lib/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { usePref } from '@/hooks/usePref';
import { dataAdapter, authAdapter } from '@/lib/adapters';
import { toast } from '@/components/ui/use-toast';
import { Group, Row, ExpandableRow } from '@/components/settings/List';
import ToggleRow from '@/components/settings/ToggleRow';
import GoogleConnectionSection from '@/components/settings/GoogleConnectionSection';
import ToolPreferenceSection from '@/components/settings/ToolPreferenceSection';
import WeeklySummaryButton from '@/components/settings/WeeklySummaryButton';

const MODES = [
  { id: 'light', icon: Sun, key: 'light' },
  { id: 'dark', icon: Moon, key: 'dark' },
  { id: 'system', icon: Monitor, key: 'system' }
];
const LANGS = [{ id: 'fa', label: 'فارسی' }, { id: 'ku', label: 'کوردی' }, { id: 'en', label: 'English' }];
const RATES = [{ id: 0.8, key: 'rate_slow' }, { id: 1, key: 'rate_normal' }, { id: 1.3, key: 'rate_fast' }];
const VOICE_LANGS = [{ id: 'female', label: 'زن' }, { id: 'male', label: 'مرد' }];
const TTS_SPEEDS = [{ id: 0.75, label: '0.75x' }, { id: 1, label: '1x' }, { id: 1.25, label: '1.25x' }, { id: 1.5, label: '1.5x' }];
const SIZES = [{ id: 'small', k: 'small' }, { id: 'medium', k: 'medium' }, { id: 'large', k: 'large' }];

function Seg({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${active ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>{children}</button>
  );
}

export default function Settings() {
  const { t, language, setLanguage } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { mode, setMode, colorTheme, setColorTheme, textSize, setTextSize, colorThemes } = useTheme();
  const [vRate, setVRate] = usePref('homa_tts_speed', 1);
  const [vLang, setVLang] = usePref('homa_tts_voice', 'female');
  const [ttsEnabled, setTtsEnabled] = usePref('homa_tts_enabled', true);
  const [ttsAutoplay, setTtsAutoplay] = usePref('homa_tts_autoplay', false);
  const [memEnabled, setMemEnabled] = usePref('homa_memory_enabled', true);
  const [notifSend, setNotifSend] = usePref('homa_notif_send', true);
  const [notifReceive, setNotifReceive] = usePref('homa_notif_receive', false);
  const [note, setNote] = useState('');
  const [savingMem, setSavingMem] = useState(false);
  const [sendingPw, setSendingPw] = useState(false);
  const [busy, setBusy] = useState(null);
  const [usage, setUsage] = useState(null);
  const [workerUrl, setWorkerUrl] = useState('');
  const [workerKey, setWorkerKey] = useState('');

  useEffect(() => { setNote(user?.memory || ''); }, [user]);
  useEffect(() => {
    try {
      setWorkerUrl(localStorage.getItem('homa_worker_url') || 'https://homa-ai-core.shahramalidazeh620.workers.dev');
      setWorkerKey(localStorage.getItem('homa_worker_key') || '');
    } catch {}
  }, []);
  useEffect(() => { dataAdapter.filter('Usage', {}, '-created_date', 1).then((res) => { if (res[0]) setUsage(res[0]); }).catch(() => {}); }, []);

  const formatReset = (iso) => {
    if (!iso) return t('quota_reset_tomorrow');
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return t('quota_reset_tomorrow');
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return `${h} ${t('studio_minutes')} ${m} ${t('studio_seconds_short')}`;
  };
  const initial = (user?.full_name || user?.email || '?').charAt(0).toUpperCase();

  const saveMemory = async () => {
    setSavingMem(true);
    try { await authAdapter.updateProfile({ memory: note.trim() }); toast({ title: t('changes_saved') }); } catch { toast({ title: t('error_occurred') }); }
    setSavingMem(false);
  };
  const changePassword = async () => {
    if (!user?.email) return;
    setSendingPw(true);
    try { await authAdapter.resetPasswordRequest(user.email); toast({ title: t('auth_reset_sent') }); } catch { toast({ title: t('error_occurred') }); }
    setSendingPw(false);
  };
  const clearChats = async () => {
    if (!confirm(t('delete_data_confirm'))) return;
    setBusy('chats');
    try { await dataAdapter.deleteMany('Message', {}); await dataAdapter.deleteMany('Conversation', {}); toast({ title: t('data_cleared') }); } catch { toast({ title: t('error_occurred') }); }
    setBusy(null);
  };
  const clearSaved = async () => {
    if (!confirm(t('delete_data_confirm'))) return;
    setBusy('saved');
    try { await dataAdapter.deleteMany('LibraryItem', {}); toast({ title: t('data_cleared') }); } catch { toast({ title: t('error_occurred') }); }
    setBusy(null);
  };
  const deleteAccount = async () => {
    if (!confirm(t('delete_account_warning'))) return;
    setBusy('acct');
    try { await dataAdapter.deleteMany('Message', {}); await dataAdapter.deleteMany('Conversation', {}); await dataAdapter.deleteMany('LibraryItem', {}); toast({ title: t('data_cleared') }); } catch { toast({ title: t('error_occurred') }); }
    setBusy(null);
  };
  const saveWorkerConfig = () => {
    try {
      localStorage.setItem('homa_worker_url', workerUrl.trim());
      localStorage.setItem('homa_worker_key', workerKey.trim());
      toast({ title: t('changes_saved') });
    } catch { toast({ title: t('error_occurred') }); }
  };
  const testVoice = () => {
    try {
      const text = 'سلام، من هُما هستم. این یک تست صدا است.';
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'fa-IR'; u.rate = vRate;
      window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    } catch {}
  };

  return (
    <div className="min-h-dvh pb-6">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-lg border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-2 px-4 h-14">
          <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent transition-colors"><ChevronLeft size={20} className="rtl:rotate-180" /></button>
          <h1 className="font-heading text-base font-semibold flex-1 text-center">{t('settings')}</h1>
          <div className="w-9" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-5">
        <div className="flex flex-col items-center gap-1 pt-2">
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">{initial}</div>
          <p className="font-heading text-base font-semibold mt-2">{user?.full_name || t('untitled')}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>

        <Group>
          <ExpandableRow icon={Sun} label={t('appearance')} value={t(mode)}>
            <div className="flex gap-2">
              {MODES.map((m) => <Seg key={m.id} active={mode === m.id} onClick={() => setMode(m.id)}><span className="flex items-center justify-center gap-1.5"><m.icon size={15} /> {t(m.key)}</span></Seg>)}
            </div>
            <p className="text-xs font-semibold text-muted-foreground mt-3 mb-2">{t('accent_color')}</p>
            <div className="flex gap-2.5 flex-wrap">
              {colorThemes.map((c) => <button key={c.id} onClick={() => setColorTheme(c.id)} className={`w-9 h-9 rounded-full transition-all ${colorTheme === c.id ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground' : ''}`} style={{ background: `hsl(${c.primary})` }} />)}
            </div>
            <p className="text-xs font-semibold text-muted-foreground mt-3 mb-2">{t('text_size')}</p>
            <div className="flex gap-2">
              {SIZES.map((s) => <Seg key={s.id} active={textSize === s.id} onClick={() => setTextSize(s.id)}>{t(s.k)}</Seg>)}
            </div>
          </ExpandableRow>
        </Group>

        <Group label={t('account')}>
          <Row icon={Sparkles} label={t('upgrade')} accent onClick={() => navigate('/upgrade')} />
          <Row icon={Mail} label={t('email')} value={user?.email} />
        </Group>

        <Group label={t('quota_models')}>
          <Row icon={Brain} label="Kimi" value={usage ? `${usage.kimi_used || 0} / ${usage.kimi_limit || 50}` : '—'} />
          <Row icon={Sparkles} label={t('quota_kimi_remaining')} value={usage ? `${Math.max(0, (usage.kimi_limit || 50) - (usage.kimi_used || 0))}` : '—'} />
          <Row icon={Brain} label={t('quota_next_reset')} value={usage?.kimi_reset_at ? formatReset(usage.kimi_reset_at) : t('quota_reset_tomorrow')} />
        </Group>

        <Group label={t('profile_info')}>
          <Row icon={Brain} label={t('profile_age')} value={user?.age_range ? t('age_' + user.age_range) : '—'} />
          <Row icon={Sparkles} label={t('profile_experience')} value={user?.experience_level ? t('exp_' + user.experience_level) : '—'} />
          <Row icon={Sparkles} label={t('profile_goal')} value={user?.primary_goal ? t('goal_' + user.primary_goal) : '—'} />
          <Row icon={Sparkles} label={t('profile_source')} value={user?.referral_source ? t('src_' + user.referral_source) : '—'} />
          <Row icon={Brain} label={t('profile_default_model')} value={user?.default_model ? t('model_' + user.default_model) : t('model_auto')} />
        </Group>

        <Group label={t('general')}>
          <ExpandableRow icon={Globe} label={t('language')} value={LANGS.find((l) => l.id === language)?.label}>
            <div className="flex gap-2">
              {LANGS.map((l) => <Seg key={l.id} active={language === l.id} onClick={() => setLanguage(l.id)}>{l.label}</Seg>)}
            </div>
          </ExpandableRow>
          <ExpandableRow icon={Volume2} label={t('tts_voice_settings')}>
            <ToggleRow label={t('tts_enabled')} checked={ttsEnabled} onChange={setTtsEnabled} />
            <div className="h-px bg-border my-2" />
            <p className="text-xs font-semibold text-muted-foreground mb-2">{t('tts_voice')}</p>
            <div className="flex gap-2 mb-3">{VOICE_LANGS.map((l) => <Seg key={l.id} active={vLang === l.id} onClick={() => setVLang(l.id)}>{l.label}</Seg>)}</div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">{t('tts_speed')}</p>
            <div className="flex gap-2 mb-3">{TTS_SPEEDS.map((s) => <Seg key={s.id} active={vRate === s.id} onClick={() => setVRate(s.id)}>{s.label}</Seg>)}</div>
            <ToggleRow label={t('tts_autoplay')} desc={t('tts_autoplay_desc')} checked={ttsAutoplay} onChange={setTtsAutoplay} />
            <button onClick={testVoice} className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-accent text-sm font-medium hover:bg-accent/70 transition-colors mt-2"><Play size={15} /> {t('test_voice')}</button>
          </ExpandableRow>
          <ExpandableRow icon={Brain} label={t('memory')}>
            <ToggleRow label={t('enable_personalization')} checked={memEnabled} onChange={setMemEnabled} />
            <p className="text-xs text-muted-foreground mb-2">{t('memory_desc')}</p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} disabled={!memEnabled} rows={3} placeholder={t('memory_placeholder')} className="w-full rounded-xl border border-input bg-transparent p-3 text-sm outline-none focus:border-primary disabled:opacity-50 resize-none" />
            <button onClick={saveMemory} disabled={savingMem || !memEnabled} className="mt-2 w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors">{savingMem ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} {t('save')}</button>
          </ExpandableRow>
          <ExpandableRow icon={Bell} label={t('notifications')}>
            <ToggleRow label={t('sound_on_send')} desc={t('notifications_desc')} checked={notifSend} onChange={setNotifSend} />
            <div className="h-px bg-border my-1" />
            <ToggleRow label={t('sound_on_receive')} checked={notifReceive} onChange={setNotifReceive} />
          </ExpandableRow>
        </Group>

        <Group label={language === 'en' ? 'Reminders' : language === 'ku' ? 'بیرخستنەوەکان' : 'یادآورها'}>
          <WeeklySummaryButton />
        </Group>

        <Group label={language === 'en' ? 'Tools' : language === 'ku' ? 'ئامرازەکان' : 'ابزارها'}>
          <Row icon={Plug} label={language === 'en' ? 'Connectors' : language === 'ku' ? 'بەستەرەکان' : 'کانکتورها'} onClick={() => navigate('/connectors')} />
          <ExpandableRow icon={Wrench} label={language === 'en' ? 'Tool Preference' : language === 'ku' ? 'پەسەندی ئامراز' : 'ترجیح ابزار'}>
            <ToolPreferenceSection />
          </ExpandableRow>
        </Group>

        <Group label={t('privacy_security')}>
          <ExpandableRow icon={Shield} label={t('privacy')}>
            <p className="text-xs text-muted-foreground mb-3">{t('privacy_intro')}</p>
            <button onClick={clearChats} disabled={!!busy} className="w-full flex items-center gap-2 h-10 px-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium disabled:opacity-50 transition-colors">{busy === 'chats' ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} {t('clear_chats')}</button>
            <button onClick={clearSaved} disabled={!!busy} className="mt-2 w-full flex items-center gap-2 h-10 px-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium disabled:opacity-50 transition-colors">{busy === 'saved' ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} {t('clear_saved')}</button>
          </ExpandableRow>
          <ExpandableRow icon={KeyRound} label={t('security')}>
            <p className="text-xs text-muted-foreground mb-2">{t('change_password_desc')}</p>
            <button onClick={changePassword} disabled={sendingPw} className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-accent text-sm font-medium disabled:opacity-50 hover:bg-accent/70 transition-colors">{sendingPw ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />} {t('change_password')}</button>
            <button onClick={deleteAccount} disabled={busy === 'acct'} className="mt-2 w-full flex items-center gap-2 h-10 px-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium disabled:opacity-50 transition-colors">{busy === 'acct' ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} {t('delete_account')}</button>
            <p className="mt-2 text-[11px] text-muted-foreground leading-5">{t('delete_account_data_note')}</p>
          </ExpandableRow>
          <Row icon={Flag} label={t('report_bug')} onClick={() => navigate('/bug-report')} />
          <Row icon={Info} label={t('about')} onClick={() => navigate('/about')} />
          <Row icon={FileText} label={t('terms')} onClick={() => navigate('/terms')} />
        </Group>

        <Group label="اتصال مستقیم به Homa Worker">
          <ExpandableRow icon={KeyRound} label="اتصال مستقیم چت" value={workerUrl ? 'فعال' : 'غیرفعال'}>
            <p className="text-xs text-muted-foreground mb-3 leading-5">آدرس Worker و کلید آن را وارد کنید تا چت مستقیم و بدون محدودیت اعتبار پلتفرم کار کند. کلید به‌صورت امن در دستگاه شما ذخیره می‌شود و در دیتابیس یا کد عمومی نمایش داده نمی‌شود.</p>
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">آدرس Worker</p>
            <input value={workerUrl} onChange={(e) => setWorkerUrl(e.target.value)} placeholder="https://homa-ai-api.xxx.workers.dev" className="w-full rounded-xl border border-input bg-transparent p-3 text-sm outline-none focus:border-primary mb-3" dir="ltr" />
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">کلید Worker (HOMA_WORKER_KEY)</p>
            <input type="password" value={workerKey} onChange={(e) => setWorkerKey(e.target.value)} placeholder="کلید امنیتی" className="w-full rounded-xl border border-input bg-transparent p-3 text-sm outline-none focus:border-primary mb-3" dir="ltr" />
            <button onClick={saveWorkerConfig} className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-colors"><Check size={15} /> {t('save')}</button>
          </ExpandableRow>
        </Group>

        <Group label={t('gs_google_connect')}>
          <GoogleConnectionSection />
        </Group>

        <button onClick={() => logout(true)} className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-card text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"><LogOut size={16} /> {t('logout')}</button>
        <p className="text-center text-[11px] text-muted-foreground">{t('app_name')} · {t('version')} 1.0</p>
      </div>
    </div>
  );
}