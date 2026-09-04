import React, { useState, useMemo } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { pe } from '@/components/promptEditor/promptEditorStrings';
import PromptForm from '@/components/promptEditor/PromptForm';
import PromptPreview from '@/components/promptEditor/PromptPreview';
import PromptTemplatesTab from '@/components/promptEditor/PromptTemplatesTab';
import PromptSavedTab, { loadFavs, saveFavs } from '@/components/promptEditor/PromptSavedTab';
import AIGenerate from '@/components/promptEditor/AIGenerate';
import PageHeader from '@/components/PageHeader';
import { toast } from '@/components/ui/use-toast';

const ORDER = ['subject', 'environment', 'lighting', 'camera', 'motion', 'style'];
const emptySections = () => ({ subject: '', environment: '', lighting: '', camera: '', motion: '', style: '', negative: '' });

export default function PromptEditor() {
  const { t, language } = useI18n();
  const [tab, setTab] = useState('editor');
  const [type, setType] = useState('image');
  const [category, setCategory] = useState('cinematic');
  const [aspect, setAspect] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [sections, setSections] = useState(emptySections);
  const [favKey, setFavKey] = useState(0);

  const prompt = useMemo(() => {
    const body = ORDER.map((k) => sections[k]).filter(Boolean).join(', ');
    let p = body || '';
    if (sections.negative) p += ` --no ${sections.negative}`;
    p += ` --ar ${aspect}`;
    p += ` --res ${resolution}`;
    return p;
  }, [sections, aspect, resolution]);

  const applyTemplate = (tm) => {
    setType(tm.type); setCategory(tm.category);
    setSections({ ...emptySections(), ...tm.sections });
    setTab('editor');
  };

  const clear = () => { setSections(emptySections()); toast({ title: pe(language, 'pe_cleared') }); };

  const save = () => {
    if (!prompt.trim()) { toast({ title: pe(language, 'pe_empty') }); return; }
    const name = (sections.subject || 'Prompt').slice(0, 40);
    const list = loadFavs();
    list.unshift({ id: Date.now().toString(), name, type, category, aspect, resolution, sections, prompt, created: Date.now() });
    saveFavs(list);
    setFavKey((k) => k + 1);
    toast({ title: pe(language, 'pe_saved_ok') });
  };

  const loadFav = (f) => {
    setType(f.type); setCategory(f.category); setAspect(f.aspect); setResolution(f.resolution);
    setSections({ ...emptySections(), ...f.sections });
    setTab('editor');
  };

  const importTxt = (txt) => { setSections((p) => ({ ...p, subject: txt.slice(0, 2000) })); };

  const tabs = ['ai', 'editor', 'templates', 'saved'];

  return (
    <div className="min-h-dvh">
      <PageHeader title={t('prompt_editor')} />
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex gap-1.5 mb-4">
          {tabs.map((tb) => (
            <button key={tb} onClick={() => setTab(tb)} className={`flex-1 h-9 rounded-full text-xs font-semibold transition-colors ${tab === tb ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>{pe(language, 'tab_' + tb)}</button>
          ))}
        </div>
        {tab === 'editor' && (
          <>
            <PromptForm type={type} setType={setType} category={category} setCategory={setCategory} aspect={aspect} setAspect={setAspect} resolution={resolution} setResolution={setResolution} sections={sections} setSections={setSections} />
            <div className="mt-5"><PromptPreview prompt={prompt} onClear={clear} onSave={save} onImport={importTxt} /></div>
          </>
        )}
        {tab === 'ai' && <AIGenerate type={type} setType={setType} onApply={(r) => { setSections({ ...emptySections(), ...r.sections }); setTab('editor'); }} />}
        {tab === 'templates' && <PromptTemplatesTab onApply={applyTemplate} />}
        {tab === 'saved' && <PromptSavedTab onLoad={loadFav} refreshKey={favKey} />}
      </div>
    </div>
  );
}