import React, { useState } from 'react';
import { Sparkles, Check, ChevronDown, Zap, Brain, Flame, Star, Gauge, FileText, Code2, Bot, Eye, Layers, Trophy, Info } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const MODELS = [
  {
    id: 'auto', icon: Sparkles, key: 'model_auto', descKey: 'model_auto_desc',
    techName: 'Homa Auto', level: 0, speed: null, context: null, reasoning: 0, tools: false, multimodal: false,
    tags: [], useCaseKey: 'model_auto_use'
  },
  {
    id: 'minimax', icon: Trophy, key: 'model_minimax', descKey: 'model_minimax_desc',
    techName: 'MiniMax M3', level: 5, speed: null, context: '1M', reasoning: 5, tools: true, multimodal: false,
    tags: ['recommended','reasoning','longctx'], useCaseKey: 'model_minimax_use'
  },
  {
    id: 'ultra', icon: Flame, key: 'model_ultra', descKey: 'model_ultra_desc',
    techName: 'Nemotron 3 Ultra', level: 5, speed: 9, context: '1M', reasoning: 5, tools: true, multimodal: false,
    tags: ['reasoning','agent','longctx'], useCaseKey: 'model_ultra_use'
  },
  {
    id: 'super', icon: Bot, key: 'model_super', descKey: 'model_super_desc',
    techName: 'Nemotron 3 Super', level: 4, speed: null, context: '1M', reasoning: 4, tools: true, multimodal: false,
    tags: ['agent','reasoning','longctx'], useCaseKey: 'model_super_use'
  },
  {
    id: 'lightning', icon: Zap, key: 'model_lightning', descKey: 'model_lightning_desc',
    techName: 'Nemotron 3.5 Lightning', level: 4, speed: 28, context: '1M', reasoning: 3, tools: true, multimodal: false,
    tags: ['fast','longctx'], useCaseKey: 'model_lightning_use'
  },
  {
    id: 'nano', icon: Eye, key: 'model_nano', descKey: 'model_nano_desc',
    techName: 'Nemotron 3 Nano Omni', level: 4, speed: null, context: '256K', reasoning: 4, tools: true, multimodal: true,
    tags: ['multimodal'], useCaseKey: 'model_nano_use'
  },
  {
    id: 'ling', icon: Brain, key: 'model_ling', descKey: 'model_ling_desc',
    techName: 'Ling 3.0 Flash Fin', level: 5, speed: 58, context: '262K', reasoning: 4, tools: false, multimodal: false,
    tags: ['fast','reasoning'], useCaseKey: 'model_ling_use'
  },
];

const FILTERS = [
  { id: 'all',          icon: null,     key: 'filter_all' },
  { id: 'recommended',  icon: Trophy,  key: 'filter_recommended' },
  { id: 'fast',         icon: Zap,     key: 'filter_fast' },
  { id: 'reasoning',    icon: Brain,   key: 'filter_reasoning' },
  { id: 'coding',       icon: Code2,   key: 'filter_coding' },
  { id: 'agent',        icon: Bot,     key: 'filter_agent' },
  { id: 'multimodal',   icon: Eye,     key: 'filter_multimodal' },
  { id: 'longctx',      icon: Layers,  key: 'filter_longctx' }
];

function Stars({ level, size = 10 }) {
  if (!level) return null;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < level ? 'text-amber-400 fill-amber-400' : 'text-border'} />
      ))}
    </div>
  );
}

export default function ModelSelector({ model, onChange }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [detailFor, setDetailFor] = useState(null);

  const current = MODELS.find((m) => m.id === model) || MODELS[0];
  const filtered = filter === 'all' ? MODELS.filter((m) => m.id !== 'auto') : MODELS.filter((m) => m.id !== 'auto' && m.tags.includes(filter));
  const detailModel = detailFor ? MODELS.find((m) => m.id === detailFor) : null;

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors max-w-[150px]">
        <current.icon size={14} className="shrink-0" />
        <span className="truncate">{t(current.key)}</span>
        <ChevronDown size={13} className="shrink-0 opacity-60" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => { setOpen(false); setDetailFor(null); }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-card rounded-t-3xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] max-w-md mx-auto w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4 shrink-0" />
            <h3 className="font-heading text-base font-bold mb-3 text-center shrink-0">{t('model_select')}</h3>

            {/* Homa Auto — always at top */}
            <button
              onClick={() => { onChange('auto'); setOpen(false); }}
              className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border text-start transition-all mb-3 shrink-0 ${model === 'auto' ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent'}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${model === 'auto' ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                <Sparkles size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{t('model_auto')}</span>
                  {model === 'auto' && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground flex items-center gap-0.5"><Check size={9} /> {t('model_active')}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-5">{t('model_auto_desc')}</p>
              </div>
            </button>

            {/* Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-2 shrink-0 -mx-1 px-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-1 px-2.5 h-7 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground'}`}
                >
                  {f.icon && <f.icon size={11} />}
                  {t(f.key)}
                </button>
              ))}
            </div>

            {/* Model cards */}
            <div className="flex-1 overflow-y-auto space-y-2.5 -mx-1 px-1">
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">{t('no_results')}</p>
              )}
              {filtered.map((m) => {
                const isActive = model === m.id;
                return (
                  <div key={m.id} className={`p-3.5 rounded-2xl border transition-all ${isActive ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                        <m.icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold">{t(m.key)}</span>
                          {isActive && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground flex items-center gap-0.5"><Check size={9} /> {t('model_active')}</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{m.techName}</p>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {m.level > 0 && <Stars level={m.level} />}
                          {m.speed && (
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Gauge size={10} /> {m.speed} tok/s
                            </span>
                          )}
                          {m.context && (
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <FileText size={10} /> {m.context}
                            </span>
                          )}
                          {m.reasoning > 0 && (
                            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <Brain size={10} /> {t('model_reasoning')} {m.reasoning}/5
                            </span>
                          )}
                        </div>

                        {/* Capabilities */}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          {m.tools && <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-accent/60 px-1.5 py-0.5 rounded-md"><Bot size={10} className="text-primary" /> {t('cap_agent')}</span>}
                          {m.multimodal && <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-accent/60 px-1.5 py-0.5 rounded-md"><Eye size={10} className="text-primary" /> {t('cap_vision')}</span>}
                          <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-md">🆓 Free</span>
                        </div>

                        {/* Use case */}
                        <p className="text-xs text-muted-foreground mt-2 leading-5">{t(m.useCaseKey)}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => { onChange(m.id); setOpen(false); }}
                        className={`flex-1 h-8 rounded-xl text-xs font-bold transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'bg-primary text-primary-foreground'}`}
                      >
                        {isActive ? t('model_active') : t('model_select_btn')}
                      </button>
                      <button
                        onClick={() => setDetailFor(m.id)}
                        className="flex items-center gap-1 h-8 px-3 rounded-xl text-xs font-medium bg-accent text-muted-foreground hover:bg-accent/70 transition-colors"
                      >
                        <Info size={12} /> {t('model_details')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail overlay */}
            {detailModel && (
              <div className="absolute inset-0 z-10 bg-card rounded-t-3xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="w-10 h-1 rounded-full bg-border mx-auto mb-4 shrink-0" />
                <div className="flex items-center justify-between mb-4 shrink-0">
                  <h3 className="font-heading text-base font-bold">{t(detailModel.key)}</h3>
                  <button onClick={() => setDetailFor(null)} className="text-muted-foreground text-sm font-medium px-3 h-8 rounded-full hover:bg-accent">{t('back')}</button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center"><detailModel.icon size={24} /></div>
                    <div>
                      <p className="text-sm font-mono text-muted-foreground">{detailModel.techName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Stars level={detailModel.level} size={12} />
                        <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-md">🆓 Free</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm leading-6 text-muted-foreground">{t(detailModel.descKey)}</p>

                  <div className="grid grid-cols-2 gap-2">
                    {detailModel.speed && (
                      <div className="p-3 rounded-xl bg-accent/50">
                        <p className="text-[10px] text-muted-foreground mb-1">{t('model_speed')}</p>
                        <p className="text-sm font-bold">{detailModel.speed} tok/s</p>
                      </div>
                    )}
                    {detailModel.context && (
                      <div className="p-3 rounded-xl bg-accent/50">
                        <p className="text-[10px] text-muted-foreground mb-1">{t('model_context')}</p>
                        <p className="text-sm font-bold">{detailModel.context}</p>
                      </div>
                    )}
                    {detailModel.reasoning > 0 && (
                      <div className="p-3 rounded-xl bg-accent/50">
                        <p className="text-[10px] text-muted-foreground mb-1">{t('model_reasoning')}</p>
                        <div className="flex items-center gap-1"><Stars level={detailModel.reasoning} size={12} /></div>
                      </div>
                    )}
                    <div className="p-3 rounded-xl bg-accent/50">
                      <p className="text-[10px] text-muted-foreground mb-1">{t('model_tools')}</p>
                      <p className="text-sm font-bold">{detailModel.tools ? '✅' : '—'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold mb-2">{t('model_use_cases')}</p>
                    <p className="text-sm text-muted-foreground leading-6">{t(detailModel.useCaseKey)}</p>
                  </div>

                  <button
                    onClick={() => { onChange(detailModel.id); setOpen(false); setDetailFor(null); }}
                    className={`w-full h-10 rounded-xl text-sm font-bold transition-colors ${model === detailModel.id ? 'bg-primary/10 text-primary' : 'bg-primary text-primary-foreground'}`}
                  >
                    {model === detailModel.id ? t('model_active') : t('model_select_btn')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}