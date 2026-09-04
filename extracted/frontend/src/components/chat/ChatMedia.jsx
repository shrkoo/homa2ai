import React, { useState } from 'react';
import { Bookmark, Check, Download, AlertCircle } from 'lucide-react';
import { Image as UIImage } from '@/components/ui/image';
import { dataAdapter } from '@/lib/adapters';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Extract AI-generated media (images, videos, audio) from assistant message content.
 */
export function extractMedia(content) {
  const images = [];
  const videos = [];
  const audios = [];
  let m;

  // Images: ![](url) — AI-generated images
  const imgRegex = /!\[\]\(([^)]+)\)/g;
  while ((m = imgRegex.exec(content)) !== null) {
    if (!images.includes(m[1])) images.push(m[1]);
  }

  // Videos: <video src="url" ...> or 🎎 [text](url)
  const vidHtmlRegex = /<video[^>]*src="([^"]+)"[^>]*>/g;
  while ((m = vidHtmlRegex.exec(content)) !== null) {
    if (!videos.includes(m[1])) videos.push(m[1]);
  }
  const vidLinkRegex = /🎬\s*\[[^\]]*\]\(([^)]+)\)/g;
  while ((m = vidLinkRegex.exec(content)) !== null) {
    if (!videos.includes(m[1])) videos.push(m[1]);
  }

  // Audio: <audio src="url" ...> or 🔊 [text](url)
  const audHtmlRegex = /<audio[^>]*src="([^"]+)"[^>]*>/g;
  while ((m = audHtmlRegex.exec(content)) !== null) {
    if (!audios.includes(m[1])) audios.push(m[1]);
  }
  const audLinkRegex = /🔊\s*\[[^\]]*\]\(([^)]+)\)/g;
  while ((m = audLinkRegex.exec(content)) !== null) {
    if (!audios.includes(m[1])) audios.push(m[1]);
  }

  return { images, videos, audios };
}

/**
 * Strip AI-generated media from content so it's not duplicated by MarkdownRenderer.
 */
export function stripMedia(content) {
  return content
    .replace(/!\[\]\(([^)]+)\)/g, '')
    .replace(/<video[^>]*>[\s\S]*?<\/video>/g, '')
    .replace(/<video[^>]*\/?>/g, '')
    .replace(/<audio[^>]*>[\s\S]*?<\/audio>/g, '')
    .replace(/<audio[^>]*\/?>/g, '')
    .replace(/🎬\s*\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/🔊\s*\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function ChatMedia({ content }) {
  const { t } = useI18n();
  const [saved, setSaved] = useState({});
  const [videoErrors, setVideoErrors] = useState({});
  const { images, videos, audios } = extractMedia(content);

  if (!images.length && !videos.length && !audios.length) return null;

  const save = async (url, kind, index) => {
    const key = `${kind}_${index}`;
    if (saved[key]) return;
    try {
      await dataAdapter.create('LibraryItem', {
        title: `AI ${kind} — ${new Date().toLocaleDateString()}`,
        content: url,
        kind,
        file_url: url,
        provider: 'ai_tool',
      });
      setSaved((p) => ({ ...p, [key]: true }));
      toast({ title: t('saved_to_saved') });
    } catch {
      toast({ title: t('error_occurred') });
    }
  };

  return (
    <div className="space-y-2 mt-2">
      {images.map((url, i) => (
        <div key={`img_${i}`} className="relative group rounded-xl overflow-hidden">
          <UIImage src={url} alt="AI generated" fittingType="fill" className="w-full max-h-80" />
          <div className="absolute top-2 end-2 flex gap-1.5">
            <a href={url} download target="_blank" rel="noreferrer"
              className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
              <Download size={15} />
            </a>
            <button onClick={() => save(url, 'image', i)}
              className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
              {saved[`image_${i}`] ? <Check size={15} className="text-emerald-400" /> : <Bookmark size={15} />}
            </button>
          </div>
        </div>
      ))}
      {videos.map((url, i) => (
        <div key={`vid_${i}`} className="relative rounded-xl overflow-hidden">
          <video src={url} controls className="w-full max-h-80 rounded-xl"
            onError={() => setVideoErrors((p) => ({ ...p, [i]: true }))} />
          {videoErrors[i] && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white text-center p-4 gap-1.5">
              <AlertCircle size={22} className="opacity-60" />
              <p className="text-xs">پخش ویدیو ممکن نیست</p>
              <a href={url} download target="_blank" rel="noreferrer" className="text-xs text-primary underline">دانلود ویدیو</a>
            </div>
          )}
          <div className="absolute top-2 end-2 flex gap-1.5">
            <a href={url} download target="_blank" rel="noreferrer"
              className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
              <Download size={15} />
            </a>
            <button onClick={() => save(url, 'video', i)}
              className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors">
              {saved[`video_${i}`] ? <Check size={15} className="text-emerald-400" /> : <Bookmark size={15} />}
            </button>
          </div>
        </div>
      ))}
      {audios.map((url, i) => (
        <div key={`aud_${i}`} className="flex items-center gap-2 rounded-xl bg-accent/60 p-2">
          <audio src={url} controls className="flex-1 min-w-0" onError={() => toast({ title: 'پخش صدا ممکن نیست. فایل را دانلود کنید.' })} />
          <a href={url} download target="_blank" rel="noreferrer"
            className="w-8 h-8 shrink-0 rounded-full bg-chatButton text-chatButton-foreground flex items-center justify-center hover:opacity-80 transition-opacity">
            <Download size={15} />
          </a>
          <button onClick={() => save(url, 'audio', i)}
            className="w-8 h-8 shrink-0 rounded-full bg-chatButton text-chatButton-foreground flex items-center justify-center hover:opacity-80 transition-opacity">
            {saved[`audio_${i}`] ? <Check size={15} className="text-emerald-400" /> : <Bookmark size={15} />}
          </button>
        </div>
      ))}
    </div>
  );
}