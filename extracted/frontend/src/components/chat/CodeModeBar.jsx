import React from 'react';
import { Code2, Bug, FileCode2, Wrench, Rocket } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const ACTIONS = [
  { id: 'build', icon: Code2, key: 'code_build' },
  { id: 'fix', icon: Bug, key: 'code_fix' },
  { id: 'explain', icon: FileCode2, key: 'code_explain' },
  { id: 'optimize', icon: Wrench, key: 'code_optimize' },
  { id: 'project', icon: Rocket, key: 'code_project' },
];

export default function CodeModeBar({ codeAction, setCodeAction }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto">
      {ACTIONS.map((a) => (
        <button key={a.id} onClick={() => setCodeAction(a.id)} className={`flex items-center gap-1 px-2.5 h-7 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${codeAction === a.id ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'}`}>
          <a.icon size={11} /> {t(a.key)}
        </button>
      ))}
    </div>
  );
}