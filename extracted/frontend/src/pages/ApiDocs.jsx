import React from 'react';
import PageHeader from '@/components/PageHeader';
import DevNav from '@/components/DevNav';
import { useI18n } from '@/i18n/I18nContext';

const API_BASE = 'https://homa-ai-core.shahramalidazeh620.workers.dev';

function Code({ children }) {
  return (
    <pre className="text-xs overflow-x-auto bg-accent/60 rounded-lg p-3 leading-relaxed whitespace-pre-wrap break-all">
      {children}
    </pre>
  );
}

function Section({ method, path, status, desc, req, res }) {
  const statusColor = status === 'live'
    ? 'bg-emerald-500/15 text-emerald-500'
    : status === 'self-host ready'
      ? 'bg-amber-500/15 text-amber-600'
      : 'bg-muted text-muted-foreground';
  return (
    <div className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary text-primary-foreground">{method}</span>
        <code className="text-xs break-all">{path}</code>
        {status && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide ${statusColor}`}>
            {status}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{desc}</p>
      {req && (
        <div>
          <p className="text-[11px] font-semibold mb-1">Request</p>
          <Code>{req}</Code>
        </div>
      )}
      {res && (
        <div>
          <p className="text-[11px] font-semibold mb-1">Response</p>
          <Code>{res}</Code>
        </div>
      )}
    </div>
  );
}

export default function ApiDocs() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('api_docs')} />
      <DevNav />
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl">
        <p className="text-sm text-muted-foreground">{t('docs_intro')}</p>

        <div className="rounded-xl border border-border p-4 space-y-2">
          <p className="text-xs text-muted-foreground">{t('api_base_url')}</p>
          <code className="block text-xs break-all bg-accent/60 rounded-lg p-2">{API_BASE}</code>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">{t('api_auth_header')}</p>
          <Code>Authorization: Bearer HOMA_xxxxxxxxx</Code>
        </div>

        <div className="rounded-xl border border-border p-4 space-y-2 bg-amber-500/5">
          <p className="text-sm font-semibold">Self-hosted model server</p>
          <p className="text-xs text-muted-foreground leading-6">
            Homa API routes to a self-hosted model server first (HOMA_MODEL_SERVER_URL), then falls back to built-in
            adapters (Groq / Pollinations / Replicate). When your own GPU model server is connected, the API belongs
            entirely to you. Capabilities marked <b>SELF-HOST READY</b> work the moment you connect the matching model.
            Credentials never leave the server.
          </p>
        </div>

        <Section method="GET" path={API_BASE + '/homaApiHealth'} status="live"
          desc="Health check + auth verification. Costs 0 credits."
          req={`Authorization: Bearer HOMA_xxxxxxxxx`}
          res={`{ "success": true, "data": { "status": "ok", "version": "v1" }, "usage": { "credits_used": 0 } }`} />

        <Section method="POST" path={API_BASE + '/homaApiChat'} status="live"
          desc="Chat / text completion. 1 credit. Provider: Groq (self-host ready via HOMA_TEXT_MODEL)."
          req={`{ "message": "سلام", "language": "fa" }`}
          res={`{ "success": true, "data": { "content": "..." }, "usage": { "credits_used": 1, "remaining": 99 } }`} />

        <Section method="POST" path={API_BASE + '/homaApiReason'} status="live"
          desc="Deep step-by-step reasoning. 2 credits. Provider: Groq deepseek-r1 (self-host ready via HOMA_REASONING_MODEL)."
          req={`{ "message": "اثبات کنید که...", "language": "fa" }`}
          res={`{ "success": true, "data": { "content": "..." }, "usage": { "credits_used": 2, "remaining": 98 } }`} />

        <Section method="POST" path={API_BASE + '/homaApiCode'} status="live"
          desc="Coding assistance. 2 credits. Provider: Groq (self-host ready via HOMA_TEXT_MODEL)."
          req={`{ "message": "یک تابع پایتون بنویس", "language": "fa" }`}
          res={`{ "success": true, "data": { "content": "..." }, "usage": { "credits_used": 2, "remaining": 96 } }`} />

        <Section method="POST" path={API_BASE + '/homaApiImageEdit'} status="self-host ready"
          desc="Image editing. 5 credits. Self-hosted only (HOMA_IMAGE_MODEL). Returns NO_PROVIDER (0 credits) until connected."
          req={`{ "image_url": "https://...", "prompt": "make it night" }`}
          res={`{ "success": true, "data": { "url": "https://..." }, "usage": { "credits_used": 5 } }`} />

        <Section method="POST" path={API_BASE + '/homaApiImageAnalyze'} status="self-host ready"
          desc="Image analysis / vision (description, OCR, Q&A, Persian). 3 credits. Self-hosted only (HOMA_VISION_MODEL). NO_PROVIDER until connected."
          req={`{ "image_url": "https://...", "question": "چه چیزی در این تصویر است؟" }`}
          res={`{ "success": true, "data": { "content": "..." }, "usage": { "credits_used": 3 } }`} />

        <Section method="POST" path={API_BASE + '/homaApiFileAnalyze'} status="live"
          desc="Real text/document analysis (contents fetched, never invented). 2 credits. Images in files need vision (self-host ready)."
          req={`{ "file_url": "https://...", "question": "Summarize" }`}
          res={`{ "success": true, "data": { "content": "..." }, "usage": { "credits_used": 2 } }`} />

        <Section method="POST" path={API_BASE + '/homaApiWebSearch'} status="live"
          desc="Real web search with cited sources. 1 credit. DuckDuckGo + synthesis (self-host ready via HOMA_TEXT_MODEL)."
          req={`{ "input": "latest AI news", "language": "en" }`}
          res={`{ "success": true, "data": { "content": "...", "sources": [{ "title": "...", "url": "..." }] }, "usage": { "credits_used": 1 } }`} />

        <Section method="POST" path={API_BASE + '/homaApiDeepResearch'} status="live"
          desc="Deep research with retrieved sources. 3 credits. Multi-query search + report (self-host ready)."
          req={`{ "input": "compare EV batteries", "language": "en" }`}
          res={`{ "success": true, "data": { "content": "...", "sources": [...] }, "usage": { "credits_used": 3 } }`} />

        <Section method="POST" path={API_BASE + '/homaApiVideoAnalyze'} status="self-host ready"
          desc="Video understanding. 5 credits. Self-hosted only (HOMA_VISION_MODEL). NO_PROVIDER until connected."
          req={`{ "video_url": "https://...", "question": "What happens?" }`}
          res={`{ "success": true, "data": { "content": "..." }, "usage": { "credits_used": 5 } }`} />

        <Section method="POST" path={API_BASE + '/homaApiAudioTranscribe'} status="live"
          desc="Speech-to-text. 2 credits. Provider: Replicate Whisper (self-host ready via HOMA_AUDIO_MODEL)."
          req={`{ "audio_url": "https://..." }`}
          res={`{ "success": true, "data": { "text": "..." }, "usage": { "credits_used": 2 } }`} />

        <Section method="POST" path={API_BASE + '/homaApiAudioSpeak'} status="self-host ready"
          desc="Text-to-speech. 2 credits. Self-hosted only (HOMA_AUDIO_MODEL). NO_PROVIDER until connected."
          req={`{ "text": "سلام دنیا" }`}
          res={`{ "success": true, "data": { "url": "https://..." }, "usage": { "credits_used": 2 } }`} />

        <div className="rounded-xl border border-border p-4 space-y-2">
          <p className="text-sm font-semibold">Errors</p>
          <Code>{`{
  "success": false,
  "error": { "code": "NO_PROVIDER", "message": "No provider configured for this capability." }
}`}
          </Code>
          <p className="text-xs text-muted-foreground">
            Codes: UNAUTHORIZED (401), RATE_LIMITED (429), INSUFFICIENT_CREDITS (402), BAD_REQUEST (400),
            NO_PROVIDER (503), PROVIDER_FAILED (503, auto-refund), NOT_FOUND (404), INTERNAL (500).
          </p>
        </div>
      </div>
    </div>
  );
}