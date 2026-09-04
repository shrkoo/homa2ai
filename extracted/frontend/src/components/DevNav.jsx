import React from 'react';
import { NavLink } from 'react-router-dom';
import { Key, BarChart3, Coins, BookOpen, UserCircle, Play } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const items = [
  { to: '/developer/keys', icon: Key, key: 'api_keys' },
  { to: '/developer/usage', icon: BarChart3, key: 'api_usage' },
  { to: '/developer/credits', icon: Coins, key: 'api_credits' },
  { to: '/developer/docs', icon: BookOpen, key: 'api_docs' },
  { to: '/developer/account', icon: UserCircle, key: 'api_account' },
  { to: '/developer/playground', icon: Play, key: 'Playground' }
];

export default function DevNav() {
  const { t } = useI18n();
  return (
    <div className="flex gap-1 overflow-x-auto px-3 py-2 border-b border-border">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) =>
            `flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`
          }
        >
          <it.icon size={15} /> {t(it.key)}
        </NavLink>
      ))}
    </div>
  );
}