import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { authAdapter } from '@/lib/adapters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import ToolIntro from '@/components/chat/ToolIntro';

const AGES = [
  { id: 'lt13', key: 'age_lt13' },
  { id: '13_15', key: 'age_13_15' },
  { id: '16_17', key: 'age_16_17' },
  { id: '18_24', key: 'age_18_24' },
  { id: '25_34', key: 'age_25_34' },
  { id: '35_44', key: 'age_35_44' },
  { id: '45plus', key: 'age_45plus' }
];

const USE_CASES = [
  { id: 'business', icon: '💼', key: 'uc_business' },
  { id: 'coding', icon: '💻', key: 'uc_coding' },
  { id: 'learning', icon: '📚', key: 'uc_learning' },
  { id: 'content', icon: '✍️', key: 'uc_content' },
  { id: 'design', icon: '🎨', key: 'uc_design' },
  { id: 'ideas', icon: '💡', key: 'uc_ideas' },
  { id: 'social', icon: '📱', key: 'uc_social' },
  { id: 'research', icon: '🔎', key: 'uc_research' },
  { id: 'daily', icon: '💬', key: 'uc_daily' },
  { id: 'ai', icon: '🤖', key: 'uc_ai' }
];

const EXPERIENCES = [
  { id: 'beginner', key: 'exp_beginner', descKey: 'exp_beginner_desc' },
  { id: 'intermediate', key: 'exp_intermediate', descKey: 'exp_intermediate_desc' },
  { id: 'professional', key: 'exp_professional', descKey: 'exp_professional_desc' }
];

const GOALS = [
  { id: 'business', icon: '🚀', key: 'goal_business' },
  { id: 'income', icon: '💰', key: 'goal_income' },
  { id: 'skill', icon: '📚', key: 'goal_skill' },
  { id: 'product', icon: '💻', key: 'goal_product' },
  { id: 'social', icon: '📱', key: 'goal_social' },
  { id: 'target', icon: '🎯', key: 'goal_target' },
  { id: 'productivity', icon: '🧠', key: 'goal_productivity' },
  { id: 'unsure', icon: '✨', key: 'goal_unsure' }
];

const SOURCES = [
  { id: 'instagram', icon: '📸', key: 'src_instagram' },
  { id: 'tiktok', icon: '🎵', key: 'src_tiktok' },
  { id: 'youtube', icon: '▶️', key: 'src_youtube' },
  { id: 'telegram', icon: '💬', key: 'src_telegram' },
  { id: 'google', icon: '🔎', key: 'src_google' },
  { id: 'friend', icon: '👥', key: 'src_friend' },
  { id: 'myket', icon: '📱', key: 'src_myket' },
  { id: 'website', icon: '🌐', key: 'src_website' },
  { id: 'advertising', icon: '📢', key: 'src_advertising' },
  { id: 'ai', icon: '🤖', key: 'src_ai' },
  { id: 'other', icon: '✨', key: 'src_other' }
];

const TOTAL_STEPS = 6;

export default function Onboarding() {
  const { t, dir } = useI18n();
  const { checkUserAuth } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [data, setData] = useState({
    display_name: '', age_range: '', use_cases: [], experience_level: '',
    primary_goal: '', referral_source: '', source_other: ''
  });

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  const toggleUseCase = (id) => {
    setData((d) => ({
      ...d,
      use_cases: d.use_cases.includes(id) ? d.use_cases.filter((x) => x !== id) : [...d.use_cases, id]
    }));
  };

  const canProceed = () => {
    if (step === 0) return data.display_name.trim().length >= 2;
    if (step === 1) return !!data.age_range;
    if (step === 2) return data.use_cases.length > 0;
    if (step === 3) return !!data.experience_level;
    if (step === 4) return !!data.primary_goal;
    if (step === 5) return !!data.referral_source && (data.referral_source !== 'other' || data.source_other.trim().length >= 2);
    return false;
  };

  const finish = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2200));
    setLoading(false);
    setDone(true);
  };

  const next = async () => {
    if (step < TOTAL_STEPS - 1) { setStep(step + 1); return; }
    setSaving(true);
    try {
      await authAdapter.updateProfile({
        display_name: data.display_name.trim(),
        full_name: data.display_name.trim(),
        age_range: data.age_range,
        use_cases: data.use_cases,
        experience_level: data.experience_level,
        primary_goal: data.primary_goal,
        referral_source: data.referral_source,
        onboarding_completed: true,
        default_model: 'auto'
      });
      try { await checkUserAuth(); } catch {}
    } catch {}
    setSaving(false);
    await finish();
  };

  const back = () => { if (step > 0) setStep(step - 1); };

  if (done) {
    return (
      <div className="min-h-dvh flex flex-col bg-background">
        <div className="pt-[env(safe-area-inset-top)]" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
          <div className="w-full max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl mx-auto">👋</div>
              <h1 className="font-heading text-2xl font-bold">{t('onboarding_welcome_title').replace('[name]', data.display_name.trim())}</h1>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-7">{t('onboarding_welcome_desc')}</p>
            </div>
            <ToolIntro />
            <div className="flex justify-center pt-2">
              <Button className="h-12 px-10 text-sm font-medium" onClick={() => navigate('/chat/new', { replace: true })}>{t('onboarding_start')}</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    const steps = ['onboarding_loading_step1', 'onboarding_loading_step2', 'onboarding_loading_step3', 'onboarding_loading_step4'];
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-6" />
        <h2 className="font-heading text-lg font-semibold mb-5">{t('onboarding_loading')}</h2>
        <div className="space-y-3 max-w-xs w-full">
          {steps.map((s) => (
            <div key={s} className="flex items-center gap-2.5 text-sm text-muted-foreground justify-start">
              <Check size={16} className="text-primary shrink-0" /> {t(s)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <div className="pt-[env(safe-area-inset-top)] px-4 pt-4">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary' : 'bg-accent'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 py-6 max-w-md mx-auto w-full">
        {step === 0 && (
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-heading text-xl font-bold mb-2">{t('onboarding_step_name_title')}</h1>
            <p className="text-sm text-muted-foreground mb-4 leading-6">{t('onboarding_step_name_desc')}</p>
            <Input value={data.display_name} onChange={(e) => setData({ ...data, display_name: e.target.value })} placeholder={t('onboarding_step_name_placeholder')} className="h-12" autoFocus />
          </div>
        )}

        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-heading text-xl font-bold mb-2">{t('onboarding_step_age_title')}</h1>
            <p className="text-sm text-muted-foreground mb-4 leading-6">{t('onboarding_step_age_desc')}</p>
            <div className="space-y-2">
              {AGES.map((a) => (
                <button key={a.id} onClick={() => setData({ ...data, age_range: a.id })} className={`w-full flex items-center justify-between px-4 h-12 rounded-xl border transition-all ${data.age_range === a.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}>
                  <span className="text-sm font-medium">{t(a.key)}</span>
                  {data.age_range === a.id && <Check size={18} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-heading text-xl font-bold mb-1">{t('onboarding_step_usecase_title')}</h1>
            <p className="text-sm text-muted-foreground mb-4">{t('onboarding_step_usecase_subtitle')}</p>
            <div className="grid grid-cols-2 gap-2">
              {USE_CASES.map((u) => (
                <button key={u.id} onClick={() => toggleUseCase(u.id)} className={`flex items-center gap-2 px-3 h-12 rounded-xl border text-sm font-medium transition-all ${data.use_cases.includes(u.id) ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}>
                  <span className="text-lg">{u.icon}</span>
                  <span className="flex-1 text-start">{t(u.key)}</span>
                  {data.use_cases.includes(u.id) && <Check size={16} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-heading text-xl font-bold mb-4">{t('onboarding_step_experience_title')}</h1>
            <div className="space-y-2">
              {EXPERIENCES.map((e) => (
                <button key={e.id} onClick={() => setData({ ...data, experience_level: e.id })} className={`w-full text-start px-4 py-3 rounded-xl border transition-all ${data.experience_level === e.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}>
                  <p className="text-sm font-semibold">{t(e.key)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(e.descKey)}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-heading text-xl font-bold mb-4">{t('onboarding_step_goal_title')}</h1>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => (
                <button key={g.id} onClick={() => setData({ ...data, primary_goal: g.id })} className={`flex items-center gap-2 px-3 h-12 rounded-xl border text-sm font-medium transition-all ${data.primary_goal === g.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}>
                  <span className="text-lg">{g.icon}</span>
                  <span className="flex-1 text-start">{t(g.key)}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setData({ ...data, primary_goal: 'later' })} className="mt-3 text-xs text-muted-foreground hover:underline">{t('onboarding_step_goal_later')}</button>
          </div>
        )}

        {step === 5 && (
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-heading text-xl font-bold mb-1">{t('onboarding_step_source_title')}</h1>
            <p className="text-sm text-muted-foreground mb-4">{t('onboarding_step_source_subtitle')}</p>
            <div className="grid grid-cols-2 gap-2">
              {SOURCES.map((s) => (
                <button key={s.id} onClick={() => setData({ ...data, referral_source: s.id })} className={`flex items-center gap-2 px-3 h-11 rounded-xl border text-sm font-medium transition-all ${data.referral_source === s.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}>
                  <span className="text-lg">{s.icon}</span>
                  <span className="flex-1 text-start">{t(s.key)}</span>
                </button>
              ))}
            </div>
            {data.referral_source === 'other' && (
              <Input value={data.source_other} onChange={(e) => setData({ ...data, source_other: e.target.value })} placeholder={t('onboarding_step_source_other')} className="mt-3 h-11" autoFocus />
            )}
          </div>
        )}

        <div className="flex items-center gap-2 pt-6">
          {step > 0 && (
            <Button variant="outline" className="h-12 w-12 p-0" onClick={back}><BackIcon size={18} /></Button>
          )}
          <Button className="flex-1 h-12 font-medium" disabled={!canProceed() || saving} onClick={next}>
            {saving ? <Loader2 size={18} className="animate-spin" /> : (step === TOTAL_STEPS - 1 ? t('onboarding_finish') : t('onboarding_next'))}
          </Button>
        </div>
      </div>
    </div>
  );
}