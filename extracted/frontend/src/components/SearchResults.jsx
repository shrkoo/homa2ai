import React from 'react';
import { Globe, ExternalLink } from 'lucide-react';

function SourceCard({ result, index }) {
  const domain = result.source_name || (result.url ? (() => { try { return new URL(result.url).hostname.replace(/^www\./, ''); } catch { return ''; } })() : '');
  const date = result.published_at || '';

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border border-border bg-card p-3 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        {result.source_logo ? (
          <img src={result.source_logo} alt="" className="w-4 h-4 rounded-full shrink-0" loading="lazy" />
        ) : (
          <Globe size={13} className="text-muted-foreground shrink-0" />
        )}
        <span className="text-[11px] text-muted-foreground truncate flex-1">{domain}</span>
        {date && <span className="text-[10px] text-muted-foreground/70 shrink-0">{date}</span>}
      </div>
      <h3 className="font-semibold text-[13px] leading-5 mb-1 line-clamp-1">{result.title}</h3>
      <p className="text-[11px] text-muted-foreground leading-5 line-clamp-2">{result.description}</p>
    </a>
  );
}

export default function SearchResults({ data }) {
  const { intent, results } = data;
  if (!results || !results.length) return null;

  return (
    <div className="my-3">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
        <span className="text-[12px] font-medium text-muted-foreground">منابع</span>
      </div>
      <div className="space-y-2">
        {results.map((r, i) => (
          <SourceCard key={i} result={r} index={i} />
        ))}
      </div>
    </div>
  );
}