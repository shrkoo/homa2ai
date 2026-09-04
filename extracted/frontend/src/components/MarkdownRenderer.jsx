import React from 'react';
import ReactMarkdown from 'react-markdown';
import CodeBlock from '@/components/CodeBlock';
import SearchResults from '@/components/SearchResults';

function renderContent(content) {
  const parts = [];
  const regex = /```search-results\n([\s\S]*?)\n```/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'markdown', content: content.slice(lastIndex, match.index) });
    }
    try {
      const data = JSON.parse(match[1]);
      parts.push({ type: 'search', content: data });
    } catch {
      parts.push({ type: 'markdown', content: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'markdown', content: content.slice(lastIndex) });
  }
  return parts.length ? parts : [{ type: 'markdown', content }];
}

const mdComponents = {
  h1: ({ node, ...p }) => <h1 className="text-xl font-bold mt-4 mb-2" {...p} />,
  h2: ({ node, ...p }) => <h2 className="text-lg font-bold mt-3 mb-2" {...p} />,
  h3: ({ node, ...p }) => <h3 className="text-base font-semibold mt-3 mb-1.5" {...p} />,
  p: ({ node, ...p }) => <p className="my-2 leading-7" {...p} />,
  ul: ({ node, ...p }) => <ul className="list-disc ps-5 my-2 space-y-1" {...p} />,
  ol: ({ node, ...p }) => <ol className="list-decimal ps-5 my-2 space-y-1" {...p} />,
  li: ({ node, ...p }) => <li className="leading-7" {...p} />,
  a: ({ node, ...p }) => <a className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer" {...p} />,
  blockquote: ({ node, ...p }) => <blockquote className="border-s-2 border-primary/40 ps-3 my-2 text-muted-foreground italic" {...p} />,
  pre: ({ node, ...p }) => <CodeBlock {...p} />,
  code: ({ node, className, children, ...p }) => {
    const isBlock = className && className.includes('language-');
    return (
      <code className={isBlock ? 'font-mono text-[13px] leading-6' : 'bg-muted px-1.5 py-0.5 rounded-md font-mono text-[13px]'} {...p}>
        {children}
      </code>
    );
  },
  table: ({ node, ...p }) => <div className="overflow-x-auto my-2"><table className="w-full border-collapse text-sm" {...p} /></div>,
  th: ({ node, ...p }) => <th className="border border-border px-3 py-1.5 bg-muted/50 font-semibold text-start" {...p} />,
  td: ({ node, ...p }) => <td className="border border-border px-3 py-1.5" {...p} />,
  strong: ({ node, ...p }) => <strong className="font-bold" {...p} />
};

export default function MarkdownRenderer({ content }) {
  const parts = renderContent(content);
  return (
    <div className="text-[15px] leading-7" dir="auto">
      {parts.map((part, i) => {
        if (part.type === 'search') {
          return <SearchResults key={i} data={part.content} />;
        }
        return (
          <ReactMarkdown key={i} components={mdComponents}>
            {part.content}
          </ReactMarkdown>
        );
      })}
    </div>
  );
}