import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/lib/AuthContext';
import { billingAdapter } from '@/lib/adapters';
import { Lightbulb, PenLine, Code, BookOpen, Search } from 'lucide-react';
import HomeDashboard from '@/components/home/HomeDashboard';

const QUICK_CARDS = [
  { key: 'home_quick_idea', icon: Lightbulb, prompt: 'یک ایده خلاقانه به من بده' },
  { key: 'home_quick_write', icon: PenLine, prompt: 'برایم یک متن بنویس' },
  { key: 'home_quick_code', icon: Code, prompt: 'در کدنویسی کمکم کن' },
  { key: 'home_quick_learn', icon: BookOpen, prompt: 'چیزی جدید به من یاد بده' },
  { key: 'home_quick_research', icon: Search, prompt: 'درباره یک موضوع تحقیق کن' }
];

export default function Home() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    billingAdapter.refreshUsage().then((res) => setUsage(res?.data || res)).catch(() => {});
  }, []);

  const name = user?.display_name || user?.full_name || '';

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-lg border-b border-border pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-4 h-14">
          <h1 className="font-heading text-base font-bold">{t('app_name')}</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="mb-6">
          <h2 className="font-heading text-2xl font-bold">{t('home_greeting').replace('👋', '')} {name} 👋</h2>
          <p className="text-muted-foreground text-sm mt-1">{t('home_work_today')}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {QUICK_CARDS.map((c) => (
            <button
              key={c.key}
              onClick={() => navigate('/chat/new')}
              className="flex flex-col items-start gap-2 p-4 rounded-2xl border border-border bg-card hover:bg-accent transition-colors text-start"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center"><c.icon size={20} /></div>
              <span className="text-sm font-semibold">{t(c.key)}</span>
            </button>
          ))}
        </div>

        <HomeDashboard />

        {usage && (
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-2">{t('quota_models')}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Kimi</span>
              <span className="text-sm font-bold">{usage.kimi_used || 0} / {usage.kimi_limit || 50}</span>
            </div>
            <div className="h-1.5 bg-accent rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, ((usage.kimi_used || 0) / (usage.kimi_limit || 50)) * 100)}%` }} />
            </div>
          </div>
        )}

        <button onClick={() => navigate('/chat/new')} className="mt-auto w-full flex items-center gap-3 px-4 h-14 rounded-2xl border border-border bg-card hover:bg-accent transition-colors">
          <Search size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t('home_chat_placeholder')}</span>
        </button>
      </div>
    </div>
  );
}