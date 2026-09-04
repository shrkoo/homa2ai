import React from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { pe } from './promptEditorStrings';
import { CATEGORIES } from './promptTemplates';

const ASPECTS = ['16:9', '9:16', '1:1', '4:3'];
const RESOLUTIONS = ['720p', '1080p', '4K'];
const SECTION_KEYS = ['subject', 'environment', 'lighting', 'camera', 'motion', 'style', 'negative'];

function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`px-3 h-8 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${active ? 'bg-primary text-primary-foreground' : 'bg-accent text-foreground hover:bg-accent/70'}`}>{children}</button>
  );
}

export default function PromptForm({ type, setType, category, setCategory, aspect, setAspect, resolution, setResolution, sections, setSections }) {
  const { language } = useI18n();
  const set = (k, v) => setSections((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Pill active={type === 'image'} onClick={() => setType('image')}>{pe(language, 'pe_image')}</Pill>
        <Pill active={type === 'video'} onClick={() => setType('video')}>{pe(language, 'pe_video')}</Pill>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">{pe(language, 'pe_category')}</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => <Pill key={c} active={category === c} onClick={() => setCategory(c)}>{pe(language, 'cat_' + c)}</Pill>)}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">{pe(language, 'pe_aspect')}</p>
        <div className="flex flex-wrap gap-1.5">{ASPECTS.map((a) => <Pill key={a} active={aspect === a} onClick={() => setAspect(a)}>{a}</Pill>)}</div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-1.5">{pe(language, 'pe_resolution')}</p>
        <div className="flex flex-wrap gap-1.5">{RESOLUTIONS.map((r) => <Pill key={r} active={resolution === r} onClick={() => setResolution(r)}>{r}</Pill>)}</div>
      </div>

      <div className="space-y-2.5">
        <p className="text-xs font-semibold text-muted-foreground">{pe(language, 'pe_sections')}</p>
        {SECTION_KEYS.map((k) => (
          <div key={k}>
            <label className="text-[11px] text-muted-foreground">{pe(language, 'pe_' + k)}</label>
            <textarea value={sections[k] || ''} onChange={(e) => set(k, e.target.value)} rows={2} className="w-full mt-0.5 px-3 py-2 rounded-xl bg-accent/50 text-sm outline-none focus:bg-accent resize-none leading-6" />
          </div>
        ))}
      </div>
    </div>
  );
}