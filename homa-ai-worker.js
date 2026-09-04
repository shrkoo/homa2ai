/**
 * Homa AI Worker — Cloudflare Worker
 * Independent AI proxy for Homa AI chat + Connector backend.
 * Does NOT use Base44 Integration Credits — calls OpenRouter/Groq directly.
 * Returns JSON (non-streaming) for reliability with long inputs.
 *
 * Connector backend (independent of Base44):
 *   POST /connect            — validate + encrypt + store credential in KV
 *   POST /disconnect         — delete credential from KV
 *   GET  /connection/status  — real validated status of a connection
 * User identity is derived from the caller's Base44 access token (X-User-Token),
 * NEVER from a body-supplied user_id. Credentials are isolated per user via
 * a SHA-256 hash of the access token, used as the KV key prefix.
 *
 * Deploy: wrangler deploy
 * Secrets: wrangler secret put OPENROUTER_API_KEY
 *          wrangler secret put GROQ_API_KEY
 *          wrangler secret put HOMA_WORKER_KEY
 *          wrangler secret put HOMA_ENCRYPTION_KEY   (AES-GCM for credentials)
 * KV:      USER_CONNECTIONS  (encrypted connector credentials, per-user)
 *          GOOGLE_TOKENS     (encrypted Google OAuth tokens)
 */
import { getAdapter, getAdapterCapabilities, classify } from './providers/index.js';
import { ENTITY_MAP, isValidEntity } from './lib/db.js';
import { handleApiRoutes } from './routes/api.js';
import { handleAdminRoutes } from './routes/admin.js';
import { handleSupportRoutes } from './routes/support.js';
import { handleReferralRoutes } from './routes/referral.js';
import { handlePaymentRoutes } from './routes/payments.js';
import { handleAuthRoutes } from './routes/auth.js';
import { requireAuth, requireAdmin, requireUserAuth, issueHomaToken } from './lib/auth.js';

const MODEL_ALLOWLIST = {
  auto:       { openrouterId: null },
  minimax:    { openrouterId: 'minimax/minimax-m3:free' },
  ultra:      { openrouterId: 'nvidia/nemotron-3-ultra-550b-a55b:free' },
  super:      { openrouterId: 'nvidia/nemotron-3-super-120b-a12b:free' },
  lightning:  { openrouterId: 'nvidia/nemotron-3.5-lightning:free' },
  nano:       { openrouterId: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free' },
  ling:       { openrouterId: 'inclusionai/ling-3.0-flash-fin:free' }
};

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'llama-3.1-8b-instant'];
const GROQ_VISION_MODELS = ['meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct'];
const OR_VISION_MODELS = ['minimax/minimax-m3:free', 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free'];
const MAX_TOKENS = 8192;
const TIMEOUT_MS = 20000;

function pickAutoModel(messages) {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  const text = (lastUser?.content || '').toLowerCase();
  if (text.length > 800 || /تحقیق|پژوهش|تحلیل عمیق|گزارش جامع|معماری|پروژه|research|deep|complex|architecture|project/.test(text)) return 'ultra';
  return 'ling';
}

function buildSystemPrompt(language, codeMode, codeAction, systemExtra) {
  const langInst = language === 'en' ? 'Respond in English.'
    : language === 'ku' ? 'بە کوردی وەڵام بدەوە.'
    : 'به فارسی پاسخ بده.';
  let codeInst = '';
  if (codeMode) {
    const actions = {
      build: 'حالت کدنویسی — ساخت کد. کد کامل و قابل‌اجرا بنویس.',
      fix: 'حالت کدنویسی — رفع باگ. خطا را پیدا کن و راه‌حل بده.',
      explain: 'حالت کدنویسی — توضیح کد. ساده و قابل‌فهم توضیح بده.',
      optimize: 'حالت کدنویسی — بهینه‌سازی. سریع‌تر و بهینه‌تر کن.',
      project: 'حالت کدنویسی — ساخت پروژه. ساختار کامل پروژه.'
    };
    codeInst = '\n\n' + (actions[codeAction] || actions.build);
  }
  const extra = systemExtra ? '\n\n' + systemExtra : '';
  return 'تو «هُما» هستی، دستیار هوشمند فارسی. با مارک‌داون خوانا پاسخ بده. کد HTML/CSS/JS را در بلوک ```html بده. وقتی درخواست زمان‌بر است، در انتهای پاسخ با لحنی دوستانه اتمام کار را اعلام کن. ' + langInst + codeInst + extra;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Token'
  };
}

function jsonBody(data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders() });
}

async function callGroq(messages, env) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) return { error: 'no_api_key' };
  for (const model of GROQ_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: MAX_TOKENS }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.status === 429) continue;
      if (!res.ok) continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || '';
      if (content) return { content, model: 'groq' };
    } catch {}
  }
  return { error: 'provider_failed' };
}

async function callOpenRouter(modelKey, messages, env) {
  const entry = MODEL_ALLOWLIST[modelKey];
  if (!entry?.openrouterId) return { error: 'invalid_model' };
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) return { error: 'no_api_key' };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: entry.openrouterId, messages, temperature: 0.7, max_tokens: MAX_TOKENS, reasoning: { enabled: false } }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.status === 429) return { error: 'rate_limit' };
    if (!res.ok) return { error: 'provider_failed' };
    const data = await res.json();
    const msg = data?.choices?.[0]?.message;
    const content = msg?.content || msg?.reasoning_content || '';
    if (content) return { content, model: modelKey };
    return { error: 'provider_failed' };
  } catch {
    return { error: 'provider_failed' };
  }
}

async function callGroqVision(messages, env) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) return { error: 'no_api_key' };
  for (const model of GROQ_VISION_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.status === 429) continue;
      if (!res.ok) continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || '';
      if (content) return { content, model: 'vision' };
    } catch {}
  }
  return { error: 'provider_failed' };
}

async function callOpenRouterVision(messages, env) {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) return { error: 'no_api_key' };
  for (const model of OR_VISION_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096, reasoning: { enabled: false } }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.status === 429) continue;
      if (!res.ok) continue;
      const data = await res.json();
      const msg = data?.choices?.[0]?.message;
      const content = msg?.content || msg?.reasoning_content || '';
      if (content) return { content, model: 'vision' };
    } catch {}
  }
  return { error: 'provider_failed' };
}

// ===== DuckDuckGo Search (free, no API key) =====
function stripHtml(s) { return s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim(); }
function siteOf(url) { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return 'duckduckgo.com'; } }
function faviconFor(url) { const d = siteOf(url); return d ? `https://www.google.com/s2/favicons?domain=${d}&sz=64` : ''; }
function youtubeId(url) { const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/); return m ? m[1] : null; }

async function ddgLite(query, max) {
  const r = await fetch(`https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'Mozilla/5.0 (HomaAI)' } });
  if (!r.ok) throw new Error('ddg_lite_' + r.status);
  const html = await r.text();
  const sources = [];
  const blocks = html.split('<a rel="nofollow"').slice(1);
  for (const block of blocks) {
    if (sources.length >= max) break;
    const urlMatch = block.match(/href="\/\/duckduckgo\.com\/l\/\?uddg=([^&"]+)/);
    if (!urlMatch) continue;
    let u;
    try { u = decodeURIComponent(urlMatch[1]); } catch { continue; }
    if (!u.startsWith('http')) continue;
    const titleMatch = block.match(/class='result-link'>(.*?)<\/a>/);
    const snippetMatch = block.match(/class='result-snippet'>([\s\S]*?)<\/td>/);
    const title = titleMatch ? stripHtml(titleMatch[1]) : siteOf(u);
    const description = snippetMatch ? stripHtml(snippetMatch[1]) : '';
    sources.push({ title: title.slice(0, 100), url: u, description, site: siteOf(u) });
  }
  return sources;
}

async function ddgInstant(query, max) {
  const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=homa`);
  if (!r.ok) return [];
  let data;
  try { data = await r.json(); } catch { return []; }
  const sources = [];
  if (data.AbstractText && data.AbstractURL) sources.push({ title: data.Heading || query, url: data.AbstractURL, description: data.AbstractText, site: siteOf(data.AbstractURL) });
  for (const t of (data.RelatedTopics || [])) {
    if (sources.length >= max) break;
    if (t.Text && t.FirstURL) sources.push({ title: t.Text.split(' - ')[0].slice(0, 80), url: t.FirstURL, description: t.Text, site: siteOf(t.FirstURL) });
    else if (t.Topics) for (const sub of t.Topics.slice(0, 2)) { if (sources.length >= max) break; if (sub.Text && sub.FirstURL) sources.push({ title: sub.Text.split(' - ')[0].slice(0, 80), url: sub.FirstURL, description: sub.Text, site: siteOf(sub.FirstURL) }); }
  }
  return sources;
}

async function duckDuckGoSearch(query, maxResults) {
  const max = maxResults || 6;
  let sources = [];
  try { sources = await ddgLite(query, max); } catch {}
  if (sources.length < 2) { try { sources = sources.concat(await ddgInstant(query, max)); } catch {} }
  const seen = {}; const out = [];
  for (const s of sources) { if (s.url && !seen[s.url]) { seen[s.url] = 1; out.push(s); } if (out.length >= max) break; }
  return out;
}

async function groqCompleteSimple(system, userMsg, maxTokens, env) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) throw new Error('no_groq_key');
  const models = ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
  const messages = [{ role: 'system', content: system }, { role: 'user', content: userMsg }];
  for (const mdl of models) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: mdl, messages, temperature: 0.4, max_tokens: maxTokens || 1024 }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (r.status === 429 || r.status >= 500) continue;
      if (!r.ok) continue;
      const data = await r.json();
      const content = data?.choices?.[0]?.message?.content || '';
      if (content) return content;
    } catch {}
  }
  throw new Error('groq_failed');
}

function langInstruction(language) {
  if (language === 'en') return 'Respond in English.';
  if (language === 'ku') return 'بە کوردی (سۆرانی) وەڵام بدەوە.';
  return 'به فارسی پاسخ بده.';
}

function detectIntent(query) {
  const q = query.toLowerCase();
  if (/(ارزون|ارزان|قیمت|خرید|فروش|دیجی‌کالا|دیجی کالا|گوشی|لپ‌تاپ|product|shop|price|buy|cheapest|تخفیف)/.test(q)) return 'product';
  if (/(youtube|ویدیو|ویدئو|video|آموزش ویدیو)/.test(q)) return 'video';
  if (/(دانلود|download|برنامه|app|اپلیکیشن|نرم‌افزار|software|لینک رسمی)/.test(q)) return 'app';
  if (/(آموزش|tutorial|how to|چگونه)/.test(q)) return 'tutorial';
  if (/(مقایسه|compare|vs|بهتر از)/.test(q)) return 'compare';
  if (/(مقاله|article|news|اخبار|علمی)/.test(q)) return 'article';
  return 'general';
}

function queryForIntent(query, intent) {
  switch (intent) {
    case 'product': return `${query} قیمت خرید`;
    case 'video': return `${query} site:youtube.com آموزش`;
    case 'app': return `${query} official download`;
    case 'tutorial': return `${query} آموزش tutorial`;
    case 'compare': return `${query} مقایسه compare vs`;
    case 'article': return `${query} مقاله article`;
    default: return query;
  }
}

// ===== Web Search Handler =====
async function handleWebSearch(body, env) {
  const input = (body.input || '').trim();
  if (!input) return jsonBody({ error: 'input required' });
  const language = body.language || 'fa';
  const intent = detectIntent(input);
  const searchQuery = queryForIntent(input, intent);

  let sources = [];
  try { sources = await duckDuckGoSearch(searchQuery, 8); } catch {}
  if (sources.length < 4) { try { sources = sources.concat(await duckDuckGoSearch(input, 4)); } catch {} }
  const seen = {}; const deduped = [];
  for (const s of sources) { if (s.url && !seen[s.url]) { seen[s.url] = 1; deduped.push(s); } }
  sources = deduped.slice(0, 8);

  const results = sources.map((s) => {
    const ytId = youtubeId(s.url);
    return {
      title: s.title, description: s.description, url: s.url,
      source_name: s.site, source_logo: faviconFor(s.url),
      image: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '',
      type: ytId ? 'video' : intent, price: '', rating: '', metadata: '', published_at: '', is_free: null, limitations: ''
    };
  });

  const context = sources.map((s, i) => `[${i + 1}] ${s.title} (${s.site}): ${s.description}\nURL: ${s.url}`).join('\n');
  let summary = '';
  let enhancedResults = results;
  try {
    const system = `You are Homa, a smart search assistant. The user searched for: "${input}". Intent: ${intent}.
Analyze the search results and provide a helpful summary in Persian (or the user's language).
Also extract any structured data available from the descriptions (prices, ratings, free/paid status, limitations).
Return ONLY a JSON object:
{"summary": "your summary text", "results": [{"url": "...", "price": "...", "rating": "...", "is_free": true/false/null, "limitations": "...", "metadata": "..."}]}
Only include fields you can confidently extract from the data. Do NOT fabricate information. If you can't find a field, omit it.
${langInstruction(language)}`;
    const analysisText = await groqCompleteSimple(system, `Search results:\n${context}`, 2048, env);
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.summary) summary = parsed.summary;
      if (parsed.results && Array.isArray(parsed.results)) {
        const analysisMap = {};
        for (const r of parsed.results) { if (r.url) analysisMap[r.url] = r; }
        enhancedResults = results.map(r => {
          const extra = analysisMap[r.url];
          if (extra) return { ...r, price: extra.price || r.price, rating: extra.rating || r.rating, is_free: extra.is_free !== undefined ? extra.is_free : r.is_free, limitations: extra.limitations || r.limitations, metadata: extra.metadata || r.metadata };
          return r;
        });
      }
    }
  } catch {}
  if (!summary) {
    try { summary = await groqCompleteSimple('You are Homa. Summarize the search results for the user in Persian. Be concise and helpful. ' + langInstruction(language), `Query: ${input}\n\nResults:\n${context}`, 1024, env); } catch { summary = 'نتایج جستجو یافت شد. برای جزئیات روی هر کارت کلیک کنید.'; }
  }
  return jsonBody({ content: summary, sources: sources.map(s => ({ title: s.title, url: s.url, description: s.description, site: s.site })), results: enhancedResults, intent });
}

// ===== Deep Research Handler =====
async function handleDeepResearch(body, env) {
  const input = (body.input || '').trim();
  if (!input) return jsonBody({ error: 'input required' });
  const language = body.language || 'fa';
  const subQueries = [input, `${input} overview`, `${input} analysis comparison`];
  let all = [];
  for (const sq of subQueries) { try { all = all.concat(await duckDuckGoSearch(sq, 4)); } catch {} }
  const seen = {}; const sources = [];
  for (const s of all) { if (s.url && !seen[s.url]) { seen[s.url] = 1; sources.push(s); } if (sources.length >= 10) break; }
  const context = sources.length ? sources.map((s, i) => `[${i + 1}] ${s.title} (${s.site}): ${s.description}`).join('\n') : '(no sources)';
  const system = 'You are Homa, a deep research analyst. Produce a structured report with Markdown sections: خلاصه (Summary), یافته‌های اصلی (Key Findings), تحلیل (Analysis), مقایسه (Comparison), نتیجه (Conclusion). Use the sources and cite inline as [n]. ' + langInstruction(language);
  let content;
  try { content = await groqCompleteSimple(system, `Research question: ${input}\n\nSources:\n${context}`, 2048, env); } catch { content = 'تحقیق عمیق موقتاً در دسترس نیست. لطفاً دوباره تلاش کنید.'; }
  return jsonBody({ content, sources: sources.map(s => ({ title: s.title, url: s.url, description: s.description, site: s.site })) });
}

// ===== TTS Handler (Piper) =====
function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function handleTTS(body, env) {
  const text = (body.text || '').toString();
  const voice = body.voice || 'female';
  const speed = parseFloat(body.speed) || 1;
  const language = body.language || 'fa';
  if (!text.trim()) return jsonBody({ success: false, error: 'empty_text' });
  if (text.length > 5000) return jsonBody({ success: false, error: 'text_too_long' });

  const piperUrl = env.PIPER_TTS_URL;
  const piperKey = env.PIPER_TTS_API_KEY;
  if (!piperUrl) return jsonBody({ success: false, error: 'piper_not_configured' });

  const voiceMap = { female: 'fa_IR-amir-medium', male: 'fa_IR-amir-medium', en: 'en_US-lessac-medium', ku: 'fa_IR-amir-medium' };
  const piperVoice = voiceMap[language] || voiceMap.fa;

  const chunkSize = 250;
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) chunks.push(text.slice(i, i + chunkSize));
  const audioUrls = [];
  for (const chunk of chunks) {
    try {
      const params = new URLSearchParams({ text: chunk, voice: piperVoice, speed: String(speed), format: 'mp3' });
      const headers = { 'Content-Type': 'application/json' };
      if (piperKey) headers['Authorization'] = 'Bearer ' + piperKey;
      const r = await fetch(piperUrl + '/tts?' + params.toString(), { method: 'GET', headers });
      if (!r.ok) continue;
      const audioBytes = new Uint8Array(await r.arrayBuffer());
      const dataUrl = `data:audio/mpeg;base64,${bytesToBase64(audioBytes)}`;
      audioUrls.push(dataUrl);
    } catch {}
  }
  if (audioUrls.length === 0) return jsonBody({ success: false, error: 'piper_failed' });
  return jsonBody({ success: true, audio_urls: audioUrls, voice, format: 'mp3' });
}

// ===== Analyze Handler (Website / Instagram / TikTok / Facebook) =====
const ANALYZE_PROMPTS = {
  website: 'You are Homa, a web analyst. Analyze the website using the web sources below. Cover content, structure, SEO, possible technologies (mark uncertain ones as "possible"), design, and performance indicators. Use well-formatted Markdown. Cite sources inline as [1], [2]. Be honest about what is uncertain.',
  instagram: 'You are Homa, a social media analyst. Using ONLY publicly available information from the web sources, analyze the Instagram profile. Cover: Profile Summary, Content Categories, Posting Frequency, Engagement Notes (if available), Strengths, Weaknesses, Content Suggestions, Reel Ideas, Caption Ideas, Bio Suggestions, Content Calendar. Do NOT invent private data. Use Markdown. Cite sources inline as [n].',
  tiktok: 'You are Homa, a social media analyst. Using ONLY publicly available information from the web sources, analyze the TikTok profile. Cover: Profile Summary, Content Categories, Posting Frequency, Engagement Notes (if available), Strengths, Weaknesses, Content Suggestions, Video Ideas, Caption & Hashtag Ideas, Bio Suggestions, Content Calendar, Trending Sounds. Do NOT invent private data. Use Markdown. Cite sources inline as [n].',
  facebook: 'You are Homa, a social media analyst. Using ONLY publicly available information from the web sources, analyze the Facebook page/profile. Cover: Page Summary, Content Categories, Posting Frequency, Engagement Notes (if available), Strengths, Weaknesses, Content Suggestions, Post Ideas, Caption Ideas, About Section Suggestions, Content Calendar, Ad Strategy Tips. Do NOT invent private data. Use Markdown. Cite sources inline as [n].'
};

async function handleAnalyze(body, env) {
  const input = (body.input || '').trim();
  if (!input) return jsonBody({ error: 'input required' });
  const language = body.language || 'fa';
  const analyzeType = body.analyze_type || 'website';
  const suffix = analyzeType === 'instagram' ? ' instagram' : analyzeType === 'tiktok' ? ' tiktok' : analyzeType === 'facebook' ? ' facebook page' : '';
  let sources = [];
  try { sources = await duckDuckGoSearch(input + suffix, 8); } catch {}
  const context = sources.length ? sources.map((s) => `- ${s.title} (${s.site}): ${s.description}`).join('\n') : '(no direct sources found)';
  const system = (ANALYZE_PROMPTS[analyzeType] || ANALYZE_PROMPTS.website) + ' ' + langInstruction(language);
  let content;
  try { content = await groqCompleteSimple(system, `Target: ${input}\n\nSources:\n${context}`, 2048, env); } catch { content = 'تحلیل در حال حاضر در دسترس نیست. لطفاً دوباره تلاش کنید.'; }
  return jsonBody({ content, sources: sources.map(s => ({ title: s.title, url: s.url, description: s.description, site: s.site })) });
}

// ===== Generate Prompt Handler =====
async function handleGeneratePrompt(body, env) {
  const description = (body.description || '').trim();
  const type = body.type || 'image';
  const language = body.language || 'fa';
  if (!description) return jsonBody({ error: 'missing description' });
  const langName = language === 'en' ? 'English' : language === 'ku' ? 'Kurdish' : 'Persian';
  const system = `You are a professional AI prompt engineer. The user wants to create a ${type} prompt. They described: "${description}".\n\nGenerate a professional, detailed prompt with these sections. Each section should be rich, specific, and professional. All values in ${langName}:\n- subject: The main subject/scene (detailed description)\n- environment: The setting/surroundings\n- lighting: Lighting setup and mood\n- camera: Camera angle, lens, shot type\n- motion: For video: camera movement and subject motion. For image: leave empty\n- style: Art style, quality modifiers, aesthetic\n- negative: What to avoid (blurry, low quality, etc.)\n\nReturn ONLY a JSON object with these 7 string fields. No markdown, no explanation.`;
  try {
    const raw = await groqCompleteSimple(system, description, 2048, env);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const sections = JSON.parse(jsonMatch[0]);
      return jsonBody({ sections });
    }
    return jsonBody({ error: 'parse_failed' });
  } catch { return jsonBody({ error: 'provider_failed' }); }
}

// ===== Upload File Handler (proxy to 0x0.st) =====
async function handleUploadFile(body, env) {
  const base64 = body.base64 || '';
  const filename = body.filename || 'file';
  const mimeType = body.mimeType || 'application/octet-stream';
  if (!base64) return jsonBody({ error: 'missing base64' }, 400);
  const cleanBase64 = base64.includes(',') ? base64.split(',').pop() : base64;
  const bytes = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, filename);
  try {
    const r = await fetch('https://0x0.st', { method: 'POST', body: formData });
    if (r.ok) {
      const url = (await r.text()).trim();
      if (url.startsWith('http')) return jsonBody({ file_url: url });
    }
  } catch {}
  try {
    const formData2 = new FormData();
    formData2.append('file', blob, filename);
    const r2 = await fetch('https://tmpfiles.org/api/v1/upload', { method: 'POST', body: formData2 });
    if (r2.ok) {
      const d = await r2.json();
      const url = d?.data?.url;
      if (url && url.startsWith('http')) return jsonBody({ file_url: url.replace('tmpfiles.org/', 'tmpfiles.org/dl/') });
    }
  } catch {}
  return jsonBody({ error: 'upload_failed' }, 502);
}

// ===== File Analysis Handler (text/document) =====
async function handleFileAnalyze(body, env) {
  const text = body.text || '';
  const question = body.question || '';
  const language = body.language || 'fa';
  if (!text.trim()) return jsonBody({ error: 'empty text' }, 400);
  const system = 'You are Homa, a file analyst. Analyze the file content and answer the question about it. Use well-formatted Markdown. Be concise and accurate. ' + langInstruction(language);
  try {
    const content = await groqCompleteSimple(system, `File content:\n${text.slice(0, 8000)}\n\nQuestion: ${question || 'خلاصه و تحلیل این فایل را ارائه بده.'}`, 2048, env);
    return jsonBody({ content });
  } catch { return jsonBody({ error: 'provider_failed' }); }
}

// ===== Image Generation Handler (Pollinations — free, no key) =====
async function handleImageGenerate(body, env) {
  const prompt = (body.prompt || '').trim();
  if (!prompt) return jsonBody({ error: 'prompt required' }, 400);
  const width = body.width || 1024;
  const height = body.height || 1024;
  const seed = body.seed || Math.floor(Math.random() * 1000000);
  const model = body.model || 'flux';
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0, 500))}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;
  return jsonBody({ url, provider: 'pollinations', model });
}

// ===== Image Edit Handler (placeholder — needs dedicated provider) =====
async function handleImageEdit(body, env) {
  return jsonBody({ error: 'no_provider', message: 'Image editing provider not configured. Set REPLICATE_API_TOKEN to enable.' });
}

// ===== Video Generation Handler (placeholder — needs dedicated provider) =====
async function handleVideoGenerate(body, env) {
  return jsonBody({ error: 'no_provider', message: 'Video generation provider not configured.' });
}

// ===== Speech-to-Text Handler (Groq Whisper) =====
async function handleSTT(body, env) {
  const audioUrl = (body.audio_url || '').trim();
  if (!audioUrl) return jsonBody({ error: 'audio_url required' }, 400);
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) return jsonBody({ error: 'no_api_key' });
  try {
    const audioResp = await fetch(audioUrl);
    if (!audioResp.ok) return jsonBody({ error: 'fetch_failed' });
    const audioBlob = await audioResp.blob();
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', body.language === 'en' ? 'en' : body.language === 'ku' ? 'ku' : 'fa');
    const r = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      body: formData
    });
    if (!r.ok) return jsonBody({ error: 'stt_failed' });
    const data = await r.json();
    return jsonBody({ text: data.text || '', provider: 'groq', model: 'whisper-large-v3' });
  } catch { return jsonBody({ error: 'stt_failed' }); }
}

// ===== Global Search Handler (multi-source product/price comparison with SSE streaming) =====
async function globalSearchCompute(query, language, requestId, env, send) {
  const emit = send || (() => {});
  try {
    emit({ request_id: requestId, status: 'starting', progress: 3, message: query });

    emit({ request_id: requestId, status: 'searching_web', progress: 12, message: query });
    let webSources = [];
    try { webSources = await duckDuckGoSearch(query, 8); } catch {}

    emit({ request_id: requestId, status: 'checking_stores', progress: 28, message: query });
    let storeSources = [];
    try { storeSources = await duckDuckGoSearch(query + ' price buy قیمت خرید فروشگاه', 8); } catch {}

    emit({ request_id: requestId, status: 'checking_social', progress: 42, message: query });

    emit({ request_id: requestId, status: 'verifying_sources', progress: 52, message: query });

    const seenUrl = {};
    const dedupedAll = [...storeSources, ...webSources].filter(s => {
      if (seenUrl[s.url]) return false;
      seenUrl[s.url] = 1; return true;
    });
    const context = dedupedAll.map((s, i) => `[${i + 1}] ${s.title} (${s.site}): ${s.description}\nURL: ${s.url}`).join('\n');

    emit({ request_id: requestId, status: 'comparing_prices', progress: 62, message: query });

    let products = [];
    let webResults = [];
    let summary = '';
    try {
      const system = `You are Homa, a global product search assistant. The user searched for: "${query}".
Analyze the search results and extract structured data.

Return ONLY a valid JSON object:
{
  "products": [{"name":"...","price":"..." or number,"currency":"...","seller":"...","country":"...","in_stock":true/false/null,"specs":"...","image":"image URL if found in results or empty string","url":"...","checked_at":"ISO date"}],
  "web_results": [{"title":"...","url":"...","description":"...","site":"..."}],
  "summary":"..."
}
Rules:
- Only include products if pricing or a store listing is identifiable. Do NOT fabricate prices.
- Sort products by price (cheapest first); unknown prices at the end.
- image: only include if an actual image URL is found in the search results; otherwise use empty string. Do NOT fabricate image URLs.
- web_results = informational pages (reviews, articles, tutorials) without product listings.
- If no products found, return empty array.
- Summary must be concise and in the user's language.
${langInstruction(language)}`;
      const analysisText = await groqCompleteSimple(system, `Search results:\n${context}`, 4096, env);
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        products = parsed.products || [];
        webResults = parsed.web_results || [];
        summary = parsed.summary || '';
      }
    } catch {}

    // Validate: only keep products with URLs from real search results (no hallucinated URLs)
    const validUrls = new Set(dedupedAll.map(s => s.url));
    products = products.filter(p => !p.url || validUrls.has(p.url));

    emit({ request_id: requestId, status: 'fetching_images', progress: 72, message: query });

    // Enrich products with real images from their product pages (og:image)
    try { products = await enrichProductImages(products, 5); } catch {}

    emit({ request_id: requestId, status: 'analyzing', progress: 78, message: query });

    const priced = products.map(p => {
      const num = typeof p.price === 'number' ? p.price : parseFloat(String(p.price || '').replace(/[^0-9.]/g, ''));
      return { ...p, _sortPrice: isNaN(num) ? Infinity : num };
    });
    priced.sort((a, b) => a._sortPrice - b._sortPrice);
    const ranked = priced.map((p, i) => {
      const { _sortPrice, ...rest } = p;
      return { ...rest, rank: i + 1 };
    });

    emit({ request_id: requestId, status: 'preparing_sources', progress: 90, message: query });

    const sourceObjs = dedupedAll.map(s => ({ title: s.title, url: s.url, site: s.site, favicon: faviconFor(s.url) }));
    if (!summary) {
      if (dedupedAll.length === 0) {
        summary = `برای «${query}» نتیجه‌ای در منابع قابل دسترس یافت نشد. لطفاً عبارت را دقیق‌تر کنید یا دوباره تلاش کنید.`;
      } else {
        summary = `${ranked.length} محصول و ${webResults.length} نتیجه وب برای «${query}» یافت شد.`;
      }
    }

    const result = {
      request_id: requestId, status: 'completed', progress: 100,
      results: ranked, web_results: webResults, sources: sourceObjs, summary, limited: false,
    };
    emit(result);
    return result;
  } catch (e) {
    const err = { request_id: requestId, status: 'error', error: 'search_failed', message: e?.message || 'unknown_error' };
    emit(err);
    return err;
  }
}

async function handleGlobalSearch(body, env, request) {
  const query = (body.query || '').trim();
  if (!query) return jsonBody({ error: 'query required' }, 400);
  const language = body.language || 'fa';
  const requestId = body.request_id || 'gs_' + Date.now();
  const acceptHeader = (request?.headers?.get('Accept') || '');
  const wantsSSE = acceptHeader.includes('text/event-stream');

  if (!wantsSSE) {
    const result = await globalSearchCompute(query, language, requestId, env, null);
    return jsonBody(result);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => { try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch {} };
      await globalSearchCompute(query, language, requestId, env, send);
      controller.close();
    }
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', ...corsHeaders() }
  });
}

// ===== Product Image Extraction (og:image from product pages) =====
async function fetchOgImage(url, timeoutMs) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs || 5000);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HomaAI/1.0)' },
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!res.ok) return '';
    const html = await res.text();
    // Try og:image first, then twitter:image
    const ogMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i)
      || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) return resolveUrl(ogMatch[1], url);
    const twMatch = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i)
      || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']twitter:image["']/i);
    if (twMatch && twMatch[1]) return resolveUrl(twMatch[1], url);
    return '';
  } catch {
    return '';
  }
}

function resolveUrl(imgUrl, baseUrl) {
  if (!imgUrl) return '';
  if (/^https?:\/\//i.test(imgUrl)) return imgUrl;
  if (imgUrl.startsWith('//')) return 'https:' + imgUrl;
  try {
    return new URL(imgUrl, baseUrl).href;
  } catch {
    return '';
  }
}

async function enrichProductImages(products, maxFetch) {
  const limit = maxFetch || 5;
  const toEnrich = products.filter(p => p.url && !p.image).slice(0, limit);
  const results = await Promise.all(
    toEnrich.map(async (p) => {
      const img = await fetchOgImage(p.url, 4000);
      return { url: p.url, image: img };
    })
  );
  const imgMap = {};
  for (const r of results) { if (r.image) imgMap[r.url] = r.image; }
  return products.map(p => (imgMap[p.url] ? { ...p, image: imgMap[p.url] } : p));
}

// ===== Encryption helpers (AES-GCM via Web Crypto API) =====
async function getEncryptionKey(env) {
  if (!env.HOMA_ENCRYPTION_KEY) throw new Error('no_encryption_key');
  const rawKey = new TextEncoder().encode(env.HOMA_ENCRYPTION_KEY);
  const hash = await crypto.subtle.digest('SHA-256', rawKey);
  return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptKey(plaintext, env) {
  const key = await getEncryptionKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptKey(encryptedB64, env) {
  const key = await getEncryptionKey(env);
  const combined = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

// ===== User identity (server-derived, never trusts frontend user_id) =====
// The caller's Base44 access token (sent in X-User-Token) is the proof of identity.
// We derive a stable per-user key by hashing it with HOMA_WORKER_KEY as salt.
// A user cannot forge another user's hash without that user's access token.
// Body-supplied user_id is ignored for all connector operations.
async function deriveUserKey(userToken, env) {
  if (!userToken) throw new Error('no_user_token');
  const enc = new TextEncoder();
  const salt = enc.encode(env.HOMA_WORKER_KEY || '');
  const data = new Uint8Array(salt.length + userToken.length);
  data.set(salt);
  data.set(enc.encode(userToken), salt.length);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function connKvKey(userKey, providerId) {
  return `conn:${userKey}:${providerId}`;
}

// ===== Connector credential storage (USER_CONNECTIONS KV) =====
// Each record: { encrypted_key, key_hint, provider_id, status, stored_at, last_verified }
async function storeConnection(userKey, providerId, encryptedKey, keyHint, env) {
  if (!env.USER_CONNECTIONS) throw new Error('kv_not_configured');
  const record = JSON.stringify({
    encrypted_key: encryptedKey,
    key_hint: keyHint,
    provider_id: providerId,
    status: 'CONNECTED',
    stored_at: new Date().toISOString(),
    last_verified: new Date().toISOString(),
  });
  await env.USER_CONNECTIONS.put(connKvKey(userKey, providerId), record);
}

async function getConnection(userKey, providerId, env) {
  if (!env.USER_CONNECTIONS) return null;
  const raw = await env.USER_CONNECTIONS.get(connKvKey(userKey, providerId));
  return raw ? JSON.parse(raw) : null;
}

async function deleteConnection(userKey, providerId, env) {
  if (!env.USER_CONNECTIONS) return;
  await env.USER_CONNECTIONS.delete(connKvKey(userKey, providerId));
}

async function listConnections(userKey, env) {
  if (!env.USER_CONNECTIONS) return [];
  const prefix = `conn:${userKey}:`;
  const list = await env.USER_CONNECTIONS.list({ prefix });
  const out = [];
  for (const k of list.keys) {
    const providerId = k.name.slice(prefix.length);
    const raw = await env.USER_CONNECTIONS.get(k.name);
    if (raw) {
      const rec = JSON.parse(raw);
      out.push({ provider_id: providerId, key_hint: rec.key_hint, status: rec.status, last_verified: rec.last_verified });
    }
  }
  return out;
}

// ===== Job System (USER_CONNECTIONS KV, prefix: job:) =====
// Job record: { job_id, provider_id, capability, status, provider_job_id, input,
//   result_url, result_text, error, code, context, created_at, updated_at, completed_at, credits_charged }
// Statuses: QUEUED, SUBMITTING, PROCESSING, COMPLETED, FAILED, CANCELLED
function jobKvKey(userKey, jobId) {
  return `job:${userKey}:${jobId}`;
}

async function storeJob(userKey, jobId, record, env) {
  if (!env.USER_CONNECTIONS) throw new Error('kv_not_configured');
  await env.USER_CONNECTIONS.put(jobKvKey(userKey, jobId), JSON.stringify({ ...record, updated_at: new Date().toISOString() }));
}

async function getJobRecord(userKey, jobId, env) {
  if (!env.USER_CONNECTIONS) return null;
  const raw = await env.USER_CONNECTIONS.get(jobKvKey(userKey, jobId));
  return raw ? JSON.parse(raw) : null;
}

function genJobId() {
  return 'job_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

// POST /jobs — create and start a job
// Body: { tool_id, capability, input, model? }
async function handleCreateJob(body, env, userKey) {
  const toolId = (body.tool_id || '').trim();
  const capability = (body.capability || '').trim();
  const input = body.input || {};
  if (!toolId || !capability) return jsonBody({ error: 'tool_id and capability required' }, 400);
  if (!env.USER_CONNECTIONS) return jsonBody({ error: 'storage_not_configured', code: 'not_configured' }, 500);

  const adapter = getAdapter(toolId);
  if (!adapter) return jsonBody({ error: 'unknown_provider', code: 'unknown_provider' }, 400);
  if (!adapter.getCapabilities().includes(capability)) {
    return jsonBody({ error: 'capability_not_supported', code: 'not_supported', status: 'NOT_SUPPORTED' }, 400);
  }

  // Decrypt the user's stored credential for this provider
  const conn = await getConnection(userKey, toolId, env);
  if (!conn) return jsonBody({ error: 'not_connected', code: 'not_connected' }, 401);
  let apiKey;
  try { apiKey = await decryptKey(conn.encrypted_key, env); }
  catch { return jsonBody({ error: 'decryption_failed', code: 'not_configured' }, 500); }

  const jobId = genJobId();
  const now = new Date().toISOString();
  const baseRecord = {
    job_id: jobId, provider_id: toolId, capability, status: 'SUBMITTING',
    provider_job_id: '', input: JSON.stringify(input).slice(0, 4000),
    result_url: '', result_text: '', error: '', code: '', context: null,
    created_at: now, updated_at: now, completed_at: '', credits_charged: body.credits_charged || 0,
  };
  await storeJob(userKey, jobId, baseRecord, env);

  // Execute
  let result;
  try {
    result = await adapter.execute({ apiKey, capability, input, env });
  } catch (e) {
    await storeJob(userKey, jobId, { ...baseRecord, status: 'FAILED', error: e.message || 'execution_failed', code: 'provider_error' }, env);
    return jsonBody({ job_id: jobId, status: 'FAILED', error: e.message || 'execution_failed', code: 'provider_error' });
  }

  if (result.status === 'NOT_SUPPORTED') {
    await storeJob(userKey, jobId, { ...baseRecord, status: 'FAILED', error: result.error, code: 'not_supported' }, env);
    return jsonBody({ job_id: jobId, status: 'NOT_SUPPORTED', error: result.error, code: 'not_supported' });
  }
  if (result.status === 'FAILED') {
    await storeJob(userKey, jobId, { ...baseRecord, status: 'FAILED', error: result.error, code: result.code }, env);
    return jsonBody({ job_id: jobId, status: 'FAILED', error: result.error, code: result.code });
  }
  if (result.status === 'COMPLETED') {
    const done = { ...baseRecord, status: 'COMPLETED', result_url: result.result_url, result_text: result.result_text, context: result.metadata, completed_at: new Date().toISOString() };
    await storeJob(userKey, jobId, done, env);
    return jsonBody({ job_id: jobId, status: 'COMPLETED', result_url: result.result_url, result_text: result.result_text, metadata: result.metadata });
  }
  // PROCESSING (async)
  const proc = { ...baseRecord, status: 'PROCESSING', provider_job_id: result.provider_job_id, context: result.context };
  await storeJob(userKey, jobId, proc, env);
  return jsonBody({ job_id: jobId, status: 'PROCESSING', provider_job_id: result.provider_job_id });
}

// GET /jobs/:id — get job status (lazy-polls the provider if still PROCESSING)
async function handleGetJob(jobId, env, userKey) {
  if (!jobId) return jsonBody({ error: 'job_id required' }, 400);
  const job = await getJobRecord(userKey, jobId, env);
  if (!job) return jsonBody({ error: 'job_not_found', code: 'not_found' }, 404);
  // Verify ownership (userKey isolation)
  if (job.provider_job_id === undefined && job.status === undefined) return jsonBody({ error: 'job_not_found' }, 404);

  // If still processing and adapter is async, poll the provider now
  if (job.status === 'PROCESSING' && job.provider_id) {
    const adapter = getAdapter(job.provider_id);
    if (adapter && adapter.isAsync && adapter.isAsync() && job.provider_job_id) {
      const conn = await getConnection(userKey, job.provider_id, env);
      if (conn) {
        let apiKey;
        try { apiKey = await decryptKey(conn.encrypted_key, env); } catch { apiKey = null; }
        if (apiKey) {
          try {
            const polled = await adapter.getJobStatus({ provider_job_id: job.provider_job_id, apiKey, env, context: job.context });
            if (polled.status === 'COMPLETED') {
              const done = { ...job, status: 'COMPLETED', result_url: polled.result_url, result_text: polled.result_text, context: polled.metadata, completed_at: new Date().toISOString() };
              await storeJob(userKey, jobId, done, env);
              return jsonBody(sanitizeJob(done));
            }
            if (polled.status === 'FAILED') {
              const fail = { ...job, status: 'FAILED', error: polled.error, code: polled.code };
              await storeJob(userKey, jobId, fail, env);
              return jsonBody(sanitizeJob(fail));
            }
            // Still processing — update context/timestamp
            await storeJob(userKey, jobId, { ...job, context: polled.context || job.context }, env);
            return jsonBody(sanitizeJob({ ...job, context: polled.context || job.context }));
          } catch (e) {
            return jsonBody(sanitizeJob({ ...job, error: e.message }));
          }
        }
      }
    }
  }
  return jsonBody(sanitizeJob(job));
}

// POST /jobs/:id/cancel — best-effort cancel
async function handleCancelJob(jobId, env, userKey) {
  if (!jobId) return jsonBody({ error: 'job_id required' }, 400);
  const job = await getJobRecord(userKey, jobId, env);
  if (!job) return jsonBody({ error: 'job_not_found' }, 404);
  if (job.status === 'COMPLETED' || job.status === 'FAILED' || job.status === 'CANCELLED') {
    return jsonBody({ job_id: jobId, status: job.status });
  }
  // Best-effort: mark cancelled. Provider-side cancel not universally supported.
  const cancelled = { ...job, status: 'CANCELLED', completed_at: new Date().toISOString() };
  await storeJob(userKey, jobId, cancelled, env);
  return jsonBody({ job_id: jobId, status: 'CANCELLED' });
}

// Strip internal fields before returning to the client (never expose encrypted keys etc.)
function sanitizeJob(job) {
  const { ...rest } = job;
  return rest;
}

// ===== Tool Router (intent classification) =====
async function handleToolRoute(body, env) {
  const message = (body.message || '').trim();
  if (!message) return jsonBody({ error: 'message required' }, 400);
  const language = body.language || 'fa';
  const system = `You are Homa's Tool Router. Analyze the user's message and determine what capability is needed.
Return ONLY a JSON object:
{"capability":"CAPABILITY_ID or null","confidence":0.0-1.0,"needs_attachment":true/false,"summary":"brief description"}
Capability IDs: TEXT_GENERATION, REASONING, CODE_GENERATION, CODE_DEBUGGING, WEB_SEARCH, DEEP_RESEARCH, WEBSITE_ANALYSIS, IMAGE_GENERATION, IMAGE_ANALYSIS, IMAGE_EDITING, IMAGE_UPSCALING, BACKGROUND_REMOVAL, VIDEO_GENERATION, IMAGE_TO_VIDEO, VIDEO_ANALYSIS, VIDEO_EDITING, TEXT_TO_SPEECH, SPEECH_TO_TEXT, VOICE_CLONING, MUSIC_GENERATION, FILE_ANALYSIS, GLOBAL_SEARCH, INSTAGRAM_ANALYSIS, TIKTOK_ANALYSIS, FACEBOOK_ANALYSIS
If the message is general conversation that doesn't need a specific tool, return capability: null.
${langInstruction(language)}`;
  try {
    const raw = await groqCompleteSimple(system, message, 256, env);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return jsonBody(JSON.parse(jsonMatch[0]));
    return jsonBody({ capability: null, confidence: 0, summary: '' });
  } catch { return jsonBody({ capability: null, confidence: 0, summary: '' }); }
}

// GET /connection/status?tool_id=... (query-param variant)
async function handleConnectionStatusGet(request, env, url) {
  const userToken = request.headers.get('X-User-Token') || '';
  if (!userToken) return jsonBody({ error: 'user_identity_required', code: 'no_user_token' }, 401);
  let userKey;
  try { userKey = await deriveUserKey(userToken, env); } catch { return jsonBody({ error: 'user_identity_required', code: 'no_user_token' }, 401); }
  return await handleConnectionStatus({ tool_id: url.searchParams.get('tool_id') || '' }, env, userKey);
}

// ===== Connect Tool (validate + encrypt + store in KV) =====
// Real credential validation against the provider, then encrypted storage.
// Never returns the API key (encrypted or not) to the client.
async function handleConnectTool(body, env, userKey) {
  const toolId = (body.tool_id || '').trim();
  const apiKey = (body.api_key || '').trim();
  if (!toolId || !apiKey) return jsonBody({ error: 'tool_id and api_key required' }, 400);
  if (!env.HOMA_ENCRYPTION_KEY) return jsonBody({ error: 'encryption_not_configured', code: 'not_configured' }, 500);
  if (!env.USER_CONNECTIONS) return jsonBody({ error: 'storage_not_configured', code: 'not_configured' }, 500);

  const adapter = getAdapter(toolId);
  if (!adapter) return jsonBody({ error: 'unknown_provider', code: 'unknown_provider' }, 400);

  // 1. Real credential test against the provider
  let probe;
  try { probe = await adapter.validate(apiKey); }
  catch { return jsonBody({ error: 'validation_failed', code: 'api_unavailable', status: 'API_UNAVAILABLE' }, 502); }

  if (!probe.valid) {
    return jsonBody({
      error: 'credential_invalid',
      code: probe.status === 'EXPIRED' ? 'invalid_credentials' : probe.status === 'API_UNAVAILABLE' ? 'api_unavailable' : 'validation_failed',
      status: probe.status,
    }, 401);
  }

  // 2. Encrypt + store
  try {
    const encryptedKey = await encryptKey(apiKey, env);
    const keyHint = apiKey.length > 8 ? apiKey.slice(0, 4) + '••••' + apiKey.slice(-4) : '••••';
    await storeConnection(userKey, toolId, encryptedKey, keyHint, env);
    return jsonBody({ status: 'CONNECTED', key_hint: keyHint, provider_id: toolId, verified: true });
  } catch (e) { return jsonBody({ error: 'storage_failed', code: 'storage_failed' }, 500); }
}

// ===== Disconnect Tool (delete credential from KV) =====
async function handleDisconnectTool(body, env, userKey) {
  const toolId = (body.tool_id || '').trim();
  if (!toolId) return jsonBody({ error: 'tool_id required' }, 400);
  try {
    await deleteConnection(userKey, toolId, env);
    return jsonBody({ status: 'DISCONNECTED', provider_id: toolId });
  } catch (e) { return jsonBody({ error: 'disconnect_failed', code: 'storage_failed' }, 500); }
}

// ===== Connection Status (real validated status) =====
// Re-validates the stored credential against the provider to return a live status:
//   NOT_CONNECTED | CONNECTING | CONNECTED | EXPIRED | ERROR | API_UNAVAILABLE | NOT_CONFIGURED
async function handleConnectionStatus(body, env, userKey) {
  const toolId = (body.tool_id || '').trim();
  if (!toolId) return jsonBody({ error: 'tool_id required' }, 400);
  if (!env.USER_CONNECTIONS) return jsonBody({ status: 'NOT_CONFIGURED', provider_id: toolId });
  if (!env.HOMA_ENCRYPTION_KEY) return jsonBody({ status: 'NOT_CONFIGURED', provider_id: toolId });

  const record = await getConnection(userKey, toolId, env);
  if (!record) return jsonBody({ status: 'NOT_CONNECTED', provider_id: toolId });

  const adapter = getAdapter(toolId);
  if (!adapter) return jsonBody({ status: 'ERROR', provider_id: toolId, key_hint: record.key_hint, code: 'unknown_provider' });

  // Re-validate the decrypted credential
  try {
    const apiKey = await decryptKey(record.encrypted_key, env);
    const probe = await adapter.validate(apiKey);
    const status = probe.valid ? 'CONNECTED' : probe.status;
    // Persist last_verified
    record.last_verified = new Date().toISOString();
    record.status = status;
    await env.USER_CONNECTIONS.put(connKvKey(userKey, toolId), JSON.stringify(record));
    return jsonBody({ status, provider_id: toolId, key_hint: record.key_hint, verified: true });
  } catch (e) {
    return jsonBody({ status: 'ERROR', provider_id: toolId, key_hint: record.key_hint, code: 'validation_failed' });
  }
}

// ===== Google Independent OAuth (Tasks + Calendar) =====
// Bypasses Base44 Integration Credits entirely.
// Tokens encrypted with HOMA_ENCRYPTION_KEY, stored in GOOGLE_TOKENS KV.
// Client secret never reaches frontend.
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/calendar.events';

// ===== Alarm / Reminder / History storage (KV, per-user isolation) =====
// Key format: alarms:<userKey>, reminders:<userKey>, history:<userKey>
// Value: JSON array of records. Full fetch/replace per user — fine for small datasets.
async function getUserCollection(env, userKey, kind) {
  if (!env.USER_DATA) return [];
  const raw = await env.USER_DATA.get(`${kind}:${userKey}`);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
async function putUserCollection(env, userKey, kind, list) {
  if (!env.USER_DATA) return;
  await env.USER_DATA.put(`${kind}:${userKey}`, JSON.stringify(list));
}

function applyAlarmUpdate(record, data) {
  return { ...record, ...data, id: record.id, updated_date: new Date().toISOString() };
}

// kvKind: KV collection name ('alarms' | 'reminders' | 'history')
// pathPrefix: URL prefix ('/alarms' | '/reminders' | '/alarms/history')
async function handleAlarmCRUD(request, env, url, userKey, kvKind, pathPrefix) {
  const escaped = pathPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const idMatch = url.pathname.match(new RegExp(`^${escaped}/([^/]+)$`));
  const isList = url.pathname === pathPrefix;
  // GET list
  if (request.method === 'GET' && isList) {
    const list = await getUserCollection(env, userKey, kvKind);
    return jsonBody({ items: list });
  }
  // GET /:id
  if (request.method === 'GET' && idMatch) {
    const list = await getUserCollection(env, userKey, kvKind);
    const rec = list.find((r) => r.id === decodeURIComponent(idMatch[1]));
    return rec ? jsonBody(rec) : jsonBody({ error: 'not_found' }, 404);
  }
  // POST (create)
  if (request.method === 'POST' && isList) {
    const body = await request.json();
    const list = await getUserCollection(env, userKey, kvKind);
    const now = new Date().toISOString();
    const record = { ...body, id: body.id || ('al_' + crypto.randomUUID()), created_date: body.created_date || now, updated_date: now };
    list.push(record);
    await putUserCollection(env, userKey, kvKind, list);
    return jsonBody(record);
  }
  // PATCH /:id (update / upsert)
  if (request.method === 'PATCH' && idMatch) {
    const body = await request.json();
    const list = await getUserCollection(env, userKey, kvKind);
    const idx = list.findIndex((r) => r.id === decodeURIComponent(idMatch[1]));
    if (idx < 0) {
      const now = new Date().toISOString();
      const record = { ...body, id: decodeURIComponent(idMatch[1]), created_date: body.created_date || now, updated_date: now };
      list.push(record);
      await putUserCollection(env, userKey, kvKind, list);
      return jsonBody(record);
    }
    list[idx] = applyAlarmUpdate(list[idx], body);
    await putUserCollection(env, userKey, kvKind, list);
    return jsonBody(list[idx]);
  }
  // DELETE /:id
  if (request.method === 'DELETE' && idMatch) {
    const list = await getUserCollection(env, userKey, kvKind);
    const filtered = list.filter((r) => r.id !== decodeURIComponent(idMatch[1]));
    await putUserCollection(env, userKey, kvKind, filtered);
    return jsonBody({ success: true });
  }
  return jsonBody({ error: 'method_not_allowed' }, 405);
}

async function handleGoogleAuth(request, env) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const redirect = url.searchParams.get('redirect') || '';
  const loginMode = url.searchParams.get('login') === '1';
  if (!userId && !loginMode) return new Response('user_id or login=1 required', { status: 400 });
  if (!env.GOOGLE_CLIENT_ID) return new Response('Google OAuth not configured on Worker', { status: 500 });
  const callbackUrl = `${url.origin}/google/callback`;
  const state = loginMode ? `login|${redirect}` : `${userId}|${redirect}`;
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', callbackUrl);
  authUrl.searchParams.set('response_type', 'code');
  // Add email scope for login mode (to get user's email)
  const scopes = loginMode ? GOOGLE_SCOPES + ' https://www.googleapis.com/auth/userinfo.email' : GOOGLE_SCOPES;
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);
  return Response.redirect(authUrl.toString(), 302);
}

async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || '';
  const error = url.searchParams.get('error');
  const [userIdOrMode, redirect] = state.split('|');
  if (error) return Response.redirect(redirect || '/?google_error=1', 302);
  if (!code) return new Response('Missing code', { status: 400 });
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return new Response('Google OAuth not configured', { status: 500 });
  if (!env.GOOGLE_TOKENS) return new Response('KV namespace not configured', { status: 500 });
  const callbackUrl = `${url.origin}/google/callback`;
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl, grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) { const t = await tokenRes.text(); return new Response(`Token exchange failed: ${t}`, { status: 502 }); }
    const tokens = await tokenRes.json();
    const tokenData = JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry: Date.now() + (tokens.expires_in || 3600) * 1000,
      scope: tokens.scope || GOOGLE_SCOPES,
    });

    if (userIdOrMode === 'login') {
      // Login mode: get user email, find/create user, issue Homa token
      if (!env.DB) return new Response('Database not configured', { status: 500 });
      const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (!profileRes.ok) return new Response('Failed to get Google profile', { status: 502 });
      const profile = await profileRes.json();
      const email = (profile.email || '').trim().toLowerCase();
      if (!email) return new Response('No email in Google profile', { status: 400 });

      // Find or create user
      let user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
      if (!user) {
        const newUserId = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
        await env.DB.prepare('INSERT INTO users (id, email, role, password_hash) VALUES (?, ?, ?, ?)')
          .bind(newUserId, email, 'user', '').run();
        user = { id: newUserId, email };
      }

      // Issue Homa token
      const homaToken = await issueHomaToken(user.id, env);

      // Store Google tokens for the user
      const encrypted = await encryptKey(tokenData, env);
      await env.GOOGLE_TOKENS.put(`user:${user.id}`, encrypted);

      // Redirect with Homa token
      const sep = (redirect || '').includes('?') ? '&' : '?';
      return Response.redirect(`${redirect || '/'}${sep}homa_token=${homaToken}`, 302);
    }

    // Connect mode: store tokens for existing user
    const userId = userIdOrMode;
    if (!userId) return new Response('Missing user_id', { status: 400 });
    const encrypted = await encryptKey(tokenData, env);
    await env.GOOGLE_TOKENS.put(`user:${userId}`, encrypted);
    const sep = (redirect || '').includes('?') ? '&' : '?';
    return Response.redirect(`${redirect || '/'}${sep}google_connected=1`, 302);
  } catch (e) { return new Response(`OAuth error: ${e.message}`, { status: 500 }); }
}

async function getGoogleTokens(userId, env) {
  if (!env.GOOGLE_TOKENS) throw new Error('kv_not_configured');
  const encrypted = await env.GOOGLE_TOKENS.get(`user:${userId}`);
  if (!encrypted) return null;
  return JSON.parse(await decryptKey(encrypted, env));
}

async function refreshGoogleTokens(tokens, env) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: tokens.refresh_token, client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET, grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error('refresh_failed');
  const data = await res.json();
  return { access_token: data.access_token, refresh_token: tokens.refresh_token, expiry: Date.now() + (data.expires_in || 3600) * 1000, scope: tokens.scope };
}

async function getValidAccessToken(userId, env) {
  let tokens = await getGoogleTokens(userId, env);
  if (!tokens) throw new Error('not_connected');
  if (Date.now() >= tokens.expiry - 60000) {
    tokens = await refreshGoogleTokens(tokens, env);
    const encrypted = await encryptKey(JSON.stringify(tokens), env);
    await env.GOOGLE_TOKENS.put(`user:${userId}`, encrypted);
  }
  return tokens.access_token;
}

async function handleGoogleStatus(body, env, userKey) {
  const userId = userKey;
  if (!userId) return jsonBody({ error: 'user_id required' }, 400);
  try { const tokens = await getGoogleTokens(userId, env); return jsonBody({ connected: !!tokens }); }
  catch { return jsonBody({ connected: false }); }
}

async function handleGoogleTaskCreate(body, env, userKey) {
  const userId = userKey;
  const title = (body.title || '').trim();
  const notes = body.notes || '';
  if (!userId) return jsonBody({ error: 'user_id required' }, 400);
  if (!title) return jsonBody({ error: 'title required' }, 400);
  try {
    const accessToken = await getValidAccessToken(userId, env);
    const listsRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!listsRes.ok) return jsonBody({ error: 'lists_failed' }, 502);
    const listsData = await listsRes.json();
    const taskListId = listsData.items?.[0]?.id;
    if (!taskListId) return jsonBody({ error: 'no_task_list' }, 404);
    const taskRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
      method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, notes }),
    });
    if (!taskRes.ok) return jsonBody({ error: 'create_failed' }, 502);
    const task = await taskRes.json();
    return jsonBody({ success: true, task_id: task.id });
  } catch (e) { return jsonBody({ error: e.message }, 500); }
}

async function handleGoogleCalendarCreate(body, env, userKey) {
  const userId = userKey;
  const title = (body.title || '').trim();
  const date = body.date || '';
  const time = body.time || '09:00';
  const description = body.description || '';
  if (!userId) return jsonBody({ error: 'user_id required' }, 400);
  if (!title) return jsonBody({ error: 'title required' }, 400);
  try {
    const accessToken = await getValidAccessToken(userId, env);
    const [h, m] = time.split(':').map(Number);
    const [y, mo, d] = date.split('-').map(Number);
    const start = new Date(y, mo - 1, d, h || 9, m || 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const event = { summary: title, description, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } };
    const eventRes = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!eventRes.ok) return jsonBody({ error: 'create_failed' }, 502);
    const created = await eventRes.json();
    return jsonBody({ success: true, event_id: created.id, html_link: created.htmlLink });
  } catch (e) { return jsonBody({ error: e.message }, 500); }
}

async function handleGoogleDisconnect(body, env, userKey) {
  const userId = userKey;
  if (!userId) return jsonBody({ error: 'user_id required' }, 400);
  try { await env.GOOGLE_TOKENS.delete(`user:${userId}`); return jsonBody({ success: true }); }
  catch (e) { return jsonBody({ error: e.message }, 500); }
}

// ===== Product Price Fetcher (used by Smart Watch cron) =====
// Searches DuckDuckGo for the product, uses Groq to extract the best price.
// Returns { price: number|null, currency: string, url: string, in_stock: bool|null, raw: string }
async function fetchProductPrice(query, env) {
  if (!query) return { price: null, currency: '', url: '', in_stock: null, raw: '' };
  let sources = [];
  try { sources = await duckDuckGoSearch(query + ' قیمت خرید price buy', 6); } catch {}
  if (sources.length < 2) { try { sources = sources.concat(await duckDuckGoSearch(query, 4)); } catch {} }
  const seen = {}; const deduped = [];
  for (const s of sources) { if (s.url && !seen[s.url]) { seen[s.url] = 1; deduped.push(s); } }
  sources = deduped.slice(0, 6);

  if (sources.length === 0) return { price: null, currency: '', url: '', in_stock: null, raw: '' };

  const context = sources.map((s, i) => `[${i + 1}] ${s.title} (${s.site}): ${s.description}\nURL: ${s.url}`).join('\n');
  try {
    const system = `You are Homa, a price tracker. Extract the best available price for "${query}" from the search results.
Return ONLY a JSON object: {"price": number_or_null, "currency": "IRR|USD|EUR|...", "url": "best source URL", "in_stock": true/false/null, "raw": "price as found in text"}
If no price is found, return {"price": null, "currency": "", "url": "", "in_stock": null, "raw": ""}.
Do NOT fabricate prices. Only extract prices that appear in the search results.`;
    const text = await groqCompleteSimple(system, `Search results:\n${context}`, 1024, env);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        price: parsed.price != null ? Number(parsed.price) : null,
        currency: parsed.currency || '',
        url: parsed.url || (sources[0]?.url || ''),
        in_stock: parsed.in_stock != null ? parsed.in_stock : null,
        raw: parsed.raw || '',
      };
    }
  } catch {}
  return { price: null, currency: '', url: sources[0]?.url || '', in_stock: null, raw: '' };
}

// ===== Evaluate a reminder condition against fetched price data =====
function evaluateCondition(reminder, priceData) {
  if (!priceData || priceData.price == null) return { met: false, reason: 'no_price_data' };
  const price = priceData.price;
  const target = Number(reminder.target_price || 0);
  const cond = reminder.condition_type || '';

  switch (cond) {
    case 'PRICE_BELOW':
      return { met: target > 0 && price < target, reason: `قیمت ${price} < هدف ${target}` };
    case 'PRICE_ABOVE':
      return { met: target > 0 && price > target, reason: `قیمت ${price} > هدف ${target}` };
    case 'PRICE_DROP_PERCENT': {
      const threshold = Number(reminder.condition_value || 0);
      // Requires a baseline price in condition_data — compare current vs baseline
      try {
        const baseline = JSON.parse(reminder.condition_data || '{}').baseline_price;
        if (baseline && threshold > 0) {
          const drop = ((baseline - price) / baseline) * 100;
          return { met: drop >= threshold, reason: `افت ${drop.toFixed(1)}% ≥ آستانه ${threshold}%` };
        }
      } catch {}
      return { met: false, reason: 'no_baseline' };
    }
    case 'IN_STOCK':
      return { met: priceData.in_stock === true, reason: 'موجود شد' };
    case 'BACK_IN_STOCK':
      return { met: priceData.in_stock === true, reason: 'مجدد موجود شد' };
    case 'OUT_OF_STOCK':
      return { met: priceData.in_stock === false, reason: 'ناموجود شد' };
    default:
      // Generic smart reminder — trigger if any price was found (price changed)
      return { met: true, reason: `قیمت یافت شد: ${price}` };
  }
}

// ===== Smart Watch background checker =====
// Runs every 30 minutes via cron trigger (configured in wrangler.toml).
// Iterates all users' smart/price_alert reminders in USER_DATA KV,
// fetches the current price via DuckDuckGo + Groq, evaluates the condition,
// and triggers when met (updates last_triggered + writes alarm history).
// Repeat prevention: skips reminders whose status !== 'pending' or are within cooldown.
async function runSmartWatchChecks(env) {
  if (!env.USER_DATA) return;
  let cursor;
  try {
    do {
      const list = await env.USER_DATA.list({ prefix: 'reminders:', cursor });
      for (const key of list.keys) {
        const raw = await env.USER_DATA.get(key.name);
        if (!raw) continue;
        let arr;
        try { arr = JSON.parse(raw); } catch { continue; }
        let changed = false;
        for (let i = 0; i < arr.length; i++) {
          const r = arr[i];
          if (r.reminder_type !== 'smart' && r.reminder_type !== 'price_alert') continue;
          if (r.status !== 'pending') continue;

          // Cooldown check — don't re-check too frequently
          const interval = (r.check_interval || 30) * 60 * 1000;
          if (r.last_checked_at && (Date.now() - new Date(r.last_checked_at).getTime()) < interval) continue;

          // Mark as checked
          r.last_checked_at = new Date().toISOString();

          // Fetch current price
          const productQuery = r.product_name || r.product_url || r.title;
          if (!productQuery) continue;
          const priceData = await fetchProductPrice(productQuery, env);

          // Evaluate condition
          const result = evaluateCondition(r, priceData);
          if (!result.met) continue;

          // Condition met — trigger
          r.last_triggered = new Date().toISOString();
          if (r.notify_once) r.status = 'done';
          changed = true;

          // Write to alarm history
          try {
            const histRaw = await env.USER_DATA.get(`history:${key.name.slice('reminders:'.length)}`);
            let hist = [];
            try { hist = JSON.parse(histRaw || '[]'); } catch {}
            hist.unshift({
              id: 'ah_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
              entry_type: r.reminder_type === 'price_alert' ? 'price_alert' : 'smart',
              alarm_id: '',
              reminder_id: r.id,
              title: r.title || r.product_name || 'Smart Reminder',
              action: 'triggered',
              triggered_at: new Date().toISOString(),
              details: `${result.reason} | قیمت: ${priceData.price || 'نامشخص'} ${priceData.currency || ''}`,
            });
            if (hist.length > 200) hist = hist.slice(0, 200);
            await env.USER_DATA.put(`history:${key.name.slice('reminders:'.length)}`, JSON.stringify(hist));
          } catch {}
        }
        if (changed) await env.USER_DATA.put(key.name, JSON.stringify(arr));
      }
      cursor = list.list_complete ? null : list.cursor;
    } while (cursor);
  } catch {}
}

// ===== D1 Generic CRUD (Phase 0: Infrastructure Preparation) =====
// Routes: /data/{entity}          (GET list, POST create)
//         /data/{entity}/{id}     (GET, PATCH, DELETE)
//         /data/{entity}/bulk    (POST bulkCreate, PATCH bulkUpdate/updateMany, DELETE deleteMany)
//         /data/{entity}/schema  (GET schema info)
//
// All queries are scoped by user_id = userKey (derived from X-User-Token).
// Whitelist of allowed entities to prevent SQL injection via table name.

// D1 entity allowlist now imported from lib/db.js as ENTITY_MAP + isValidEntity

// Whitelist of sortable columns (prevent SQL injection via ORDER BY)
const SORTABLE_COLUMNS = new Set([
  'created_at', 'updated_at', 'title', 'status', 'priority', 'amount', 'credits', 'balance',
]);

function safeSort(field) {
  const f = (field || 'created_at').replace(/[^a-zA-Z_]/g, '');
  return SORTABLE_COLUMNS.has(f) ? f : 'created_at';
}

function genRecId() {
  return 'rec_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
}

async function handleD1CRUD(request, env, url, userKey, entityName) {
  if (!env.DB) return jsonBody({ error: 'd1_not_configured', code: 'not_configured' }, 500);
  const cfg = ENTITY_MAP[entityName];
  if (!cfg) return jsonBody({ error: 'unknown_entity' }, 400);

  const table = cfg.table;
  const base = `/data/${entityName}`;
  const idMatch = url.pathname.match(new RegExp(`^${base}/([^/]+)$`));
  const isList = url.pathname === base;
  const isBulk = url.pathname === `${base}/bulk`;
  const isSchema = url.pathname === `${base}/schema`;

  // Determine the owner column name for scoping
  const ownerCol = cfg.userScoped ? 'user_id' : (cfg.ownerKey || 'user_id');
  const scopeByUser = !cfg.publicRead;
  const isReadOnly = !!cfg.readOnly;
  const isAdminOnly = !!cfg.adminOnly;

  // Write access control — reject writes to read-only entities, require admin for admin-only
  if (['POST', 'PATCH', 'DELETE'].includes(request.method)) {
    if (isReadOnly) return jsonBody({ error: 'read_only_entity' }, 403);
    if (isAdminOnly) {
      const adminAuth = await requireAdmin(request, env);
      if (!adminAuth.isAdmin) return jsonBody({ error: 'forbidden' }, 403);
    }
  }

  // GET /data/{entity}/schema
  if (request.method === 'GET' && isSchema) {
    return jsonBody({ entity: entityName, table, user_scoped: cfg.userScoped, owner_col: ownerCol });
  }

  // GET /data/{entity} — list with optional filter/sort/limit
  if (request.method === 'GET' && isList) {
    const sort = safeSort(url.searchParams.get('sort'));
    const dir = (url.searchParams.get('dir') || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const limit = Math.min(parseInt(url.searchParams.get('limit')) || 100, 500);
    const queryRaw = url.searchParams.get('query');

    let sql = `SELECT * FROM ${table}`;
    const binds = [];
    const conditions = [];
    if (scopeByUser) { conditions.push(` ${ownerCol} = ?`); binds.push(userKey); }

    if (queryRaw) {
      try {
        const query = JSON.parse(queryRaw);
        for (const [key, value] of Object.entries(query)) {
          if (key.startsWith('$')) continue;
          const safeKey = key.replace(/[^a-zA-Z_]/g, '');
          if (value && typeof value === 'object') {
            if (value.$gte !== undefined) { conditions.push(`${safeKey} >= ?`); binds.push(value.$gte); }
            else if (value.$lte !== undefined) { conditions.push(`${safeKey} <= ?`); binds.push(value.$lte); }
            else if (value.$ne !== undefined) { conditions.push(`${safeKey} != ?`); binds.push(value.$ne); }
          } else {
            conditions.push(`${safeKey} = ?`); binds.push(value);
          }
        }
      } catch {}
    }

    sql += ' WHERE ' + conditions.join(' AND ');
    sql += ` ORDER BY ${sort} ${dir} LIMIT ?`;
    binds.push(limit);

    try {
      const { results } = await env.DB.prepare(sql).bind(...binds).all();
      return jsonBody({ items: results || [] });
    } catch (e) {
      return jsonBody({ error: 'query_failed', message: e.message }, 500);
    }
  }

  // GET /data/{entity}/{id}
  if (request.method === 'GET' && idMatch) {
    const id = decodeURIComponent(idMatch[1]);
    const sql = scopeByUser ? `SELECT * FROM ${table} WHERE id = ? AND ${ownerCol} = ?` : `SELECT * FROM ${table} WHERE id = ?`;
    try {
      const rec = scopeByUser ? await env.DB.prepare(sql).bind(id, userKey).first() : await env.DB.prepare(sql).bind(id).first();
      return rec ? jsonBody(rec) : jsonBody({ error: 'not_found' }, 404);
    } catch (e) {
      return jsonBody({ error: 'query_failed', message: e.message }, 500);
    }
  }

  // POST /data/{entity} — create
  if (request.method === 'POST' && isList) {
    let body;
    try { body = await request.json(); } catch { return jsonBody({ error: 'invalid_json' }, 400); }
    const id = body.id || genRecId();
    const now = new Date().toISOString();
    const record = { ...body, id, created_at: body.created_at || now, updated_at: now };
    if (!record[ownerCol]) record[ownerCol] = userKey;

    const rawCols = Object.keys(record);
    const cols = rawCols.map(c => String(c).replace(/[^a-zA-Z_]/g, '')).filter(c => c);
    const vals = cols.map(c => record[c]);
    const placeholders = cols.map(() => '?').join(', ');

    try {
      await env.DB.prepare(
        `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`
      ).bind(...vals).run();
      return jsonBody(record);
    } catch (e) {
      return jsonBody({ error: 'create_failed', message: e.message }, 500);
    }
  }

  // POST /data/{entity}/bulk — bulk create
  if (request.method === 'POST' && isBulk) {
    let body;
    try { body = await request.json(); } catch { return jsonBody({ error: 'invalid_json' }, 400); }
    const records = Array.isArray(body.records) ? body.records : [];
    if (records.length === 0) return jsonBody({ items: [], count: 0 });
    if (records.length > 500) return jsonBody({ error: 'too_many_records', max: 500 }, 400);

    const now = new Date().toISOString();
    const enriched = records.map(r => ({
      ...r,
      id: r.id || genRecId(),
      created_at: r.created_at || now,
      updated_at: now,
      ...(r[ownerCol] ? {} : { [ownerCol]: userKey }),
    }));

    try {
      const stmts = enriched.map(rec => {
        const rawCols = Object.keys(rec);
        const cols = rawCols.map(c => String(c).replace(/[^a-zA-Z_]/g, '')).filter(c => c);
        const vals = cols.map(c => rec[c]);
        const placeholders = cols.map(() => '?').join(', ');
        return env.DB.prepare(
          `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`
        ).bind(...vals);
      });
      await env.DB.batch(stmts);
      return jsonBody({ items: enriched, count: enriched.length });
    } catch (e) {
      return jsonBody({ error: 'bulk_create_failed', message: e.message }, 500);
    }
  }

  // PATCH /data/{entity}/{id} — update
  if (request.method === 'PATCH' && idMatch) {
    let body;
    try { body = await request.json(); } catch { return jsonBody({ error: 'invalid_json' }, 400); }
    const id = decodeURIComponent(idMatch[1]);
    const now = new Date().toISOString();
    const updateData = { ...body, updated_at: now };
    delete updateData.id;
    delete updateData[ownerCol];

    const cols = Object.keys(updateData);
    if (cols.length === 0) return jsonBody({ error: 'no_fields' }, 400);
    const sets = cols.map(c => `${c.replace(/[^a-zA-Z_]/g, '')} = ?`).join(', ');
    const vals = cols.map(c => updateData[c]);

    try {
      const result = await env.DB.prepare(
        `UPDATE ${table} SET ${sets} WHERE id = ? AND ${ownerCol} = ?`
      ).bind(...vals, id, userKey).run();
      if (result.meta.changes === 0) return jsonBody({ error: 'not_found' }, 404);
      const rec = await env.DB.prepare(
        `SELECT * FROM ${table} WHERE id = ? AND ${ownerCol} = ?`
      ).bind(id, userKey).first();
      return jsonBody(rec);
    } catch (e) {
      return jsonBody({ error: 'update_failed', message: e.message }, 500);
    }
  }

  // PATCH /data/{entity}/bulk — updateMany or bulkUpdate
  if (request.method === 'PATCH' && isBulk) {
    let body;
    try { body = await request.json(); } catch { return jsonBody({ error: 'invalid_json' }, 400); }

    // bulkUpdate: { records: [{id, ...changes}, ...] }
    if (Array.isArray(body.records)) {
      if (body.records.length > 500) return jsonBody({ error: 'too_many_records', max: 500 }, 400);
      const now = new Date().toISOString();
      try {
        const stmts = body.records.map(rec => {
          const id = rec.id;
          const updateData = { ...rec, updated_at: now };
          delete updateData.id;
          delete updateData[ownerCol];
          const cols = Object.keys(updateData);
          if (cols.length === 0) return null;
          const sets = cols.map(c => `${c.replace(/[^a-zA-Z_]/g, '')} = ?`).join(', ');
          const vals = cols.map(c => updateData[c]);
          return env.DB.prepare(
            `UPDATE ${table} SET ${sets} WHERE id = ? AND ${ownerCol} = ?`
          ).bind(...vals, id, userKey);
        }).filter(Boolean);
        if (stmts.length === 0) return jsonBody({ count: 0 });
        await env.DB.batch(stmts);
        return jsonBody({ count: stmts.length });
      } catch (e) {
        return jsonBody({ error: 'bulk_update_failed', message: e.message }, 500);
      }
    }

    // updateMany: { query: {...}, update: {$set: {...}} }
    if (body.query && body.update) {
      const setOps = body.update.$set || body.update;
      const cols = Object.keys(setOps);
      if (cols.length === 0) return jsonBody({ error: 'no_fields' }, 400);
      setOps.updated_at = new Date().toISOString();
      const setCols = Object.keys(setOps);
      const sets = setCols.map(c => `${c.replace(/[^a-zA-Z_]/g, '')} = ?`).join(', ');
      const setVals = setCols.map(c => setOps[c]);

      const conditions = [`${ownerCol} = ?`];
      const binds = [userKey, ...setVals];
      for (const [key, value] of Object.entries(body.query)) {
        const safeKey = key.replace(/[^a-zA-Z_]/g, '');
        conditions.push(`${safeKey} = ?`);
        binds.push(value);
      }

      try {
        const result = await env.DB.prepare(
          `UPDATE ${table} SET ${sets} WHERE ` + conditions.join(' AND ')
        ).bind(...binds).run();
        return jsonBody({ count: result.meta.changes || 0 });
      } catch (e) {
        return jsonBody({ error: 'update_many_failed', message: e.message }, 500);
      }
    }

    return jsonBody({ error: 'invalid_bulk_patch' }, 400);
  }

  // DELETE /data/{entity}/{id}
  if (request.method === 'DELETE' && idMatch) {
    const id = decodeURIComponent(idMatch[1]);
    try {
      const result = await env.DB.prepare(
        `DELETE FROM ${table} WHERE id = ? AND ${ownerCol} = ?`
      ).bind(id, userKey).run();
      if (result.meta.changes === 0) return jsonBody({ error: 'not_found' }, 404);
      return jsonBody({ success: true, id });
    } catch (e) {
      return jsonBody({ error: 'delete_failed', message: e.message }, 500);
    }
  }

  // DELETE /data/{entity}/bulk — deleteMany
  if (request.method === 'DELETE' && isBulk) {
    let body;
    try { body = await request.json(); } catch { body = {}; }
    const conditions = [`${ownerCol} = ?`];
    const binds = [userKey];
    if (body.query && typeof body.query === 'object') {
      for (const [key, value] of Object.entries(body.query)) {
        const safeKey = key.replace(/[^a-zA-Z_]/g, '');
        conditions.push(`${safeKey} = ?`);
        binds.push(value);
      }
    }
    // Require at least owner condition (already present) — safe scoped delete
    try {
      const result = await env.DB.prepare(
        `DELETE FROM ${table} WHERE ` + conditions.join(' AND ')
      ).bind(...binds).run();
      return jsonBody({ count: result.meta.changes || 0 });
    } catch (e) {
      return jsonBody({ error: 'delete_many_failed', message: e.message }, 500);
    }
  }

  return jsonBody({ error: 'method_not_allowed' }, 405);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);

    // ===== New modular routes (B7-B11) =====
    // ZarinPal callback is a GET redirect from the gateway — no auth header.
    if (url.pathname === '/payments/zarinpal/callback') {
      return await handlePaymentRoutes(request, env, url, { id: '' });
    }
    // Auth routes (independent email/password — no Base44 dependency)
    if (url.pathname.startsWith('/auth/')) {
      return await handleAuthRoutes(request, env, url);
    }
    if (url.pathname.startsWith('/api/')) {
      const auth = await requireAuth(request, env);
      if (auth.error) return auth.error;
      return await handleApiRoutes(request, env, url, auth.user);
    }
    if (url.pathname.startsWith('/admin/')) {
      return await handleAdminRoutes(request, env, url);
    }
    if (url.pathname.startsWith('/support/')) {
      const auth = await requireUserAuth(request, env);
      if (auth.error) return auth.error;
      return await handleSupportRoutes(request, env, url, auth.user);
    }
    if (url.pathname.startsWith('/referrals/')) {
      const auth = await requireUserAuth(request, env);
      if (auth.error) return auth.error;
      return await handleReferralRoutes(request, env, url, auth.user);
    }
    if (url.pathname.startsWith('/payments/')) {
      const auth = await requireUserAuth(request, env);
      if (auth.error) return auth.error;
      return await handlePaymentRoutes(request, env, url, auth.user);
    }

    // GET routes — Google OAuth flow (browser redirects, no auth header needed)
    if (request.method === 'GET') {
      if (url.pathname === '/google/auth') return await handleGoogleAuth(request, env);
      if (url.pathname === '/google/callback') return await handleGoogleCallback(request, env);
      if (url.pathname === '/connection/status') return await handleConnectionStatusGet(request, env, url);

      // D1 data routes — /data/{entity} and /data/{entity}/{id}
      const dataMatch = url.pathname.match(/^\/data\/([a-z_]+)(\/[^/]+)?$/);
      if (dataMatch && isValidEntity(dataMatch[1])) {
        const userToken = request.headers.get('X-User-Token') || '';
        if (!userToken) return jsonBody({ error: 'user_identity_required', code: 'no_user_token' }, 401);
        let userKey;
        try { userKey = await deriveUserKey(userToken, env); } catch { return jsonBody({ error: 'user_identity_required', code: 'no_user_token' }, 401); }
        return await handleD1CRUD(request, env, url, userKey, dataMatch[1]);
      }
      // GET /jobs/{id} — job status (requires auth + user identity)
      const jobGetMatch = url.pathname.match(/^\/jobs\/([^/]+)$/);
      if (jobGetMatch) {
        const userToken = request.headers.get('X-User-Token') || '';
        if (!userToken) return jsonBody({ error: 'user_identity_required', code: 'no_user_token' }, 401);
        let userKey;
        try { userKey = await deriveUserKey(userToken, env); } catch { return jsonBody({ error: 'user_identity_required', code: 'no_user_token' }, 401); }
        return await handleGetJob(decodeURIComponent(jobGetMatch[1]), env, userKey);
      }
      // GET /alarms, /reminders, /alarms/history, /alarms/:id, /reminders/:id
      if (/^\/(alarms|reminders)(\/[^/]+){0,2}$/.test(url.pathname)) {
        const userToken = request.headers.get('X-User-Token') || '';
        if (!userToken) return jsonBody({ error: 'user_identity_required', code: 'no_user_token' }, 401);
        let userKey;
        try { userKey = await deriveUserKey(userToken, env); } catch { return jsonBody({ error: 'user_identity_required', code: 'no_user_token' }, 401); }
        if (url.pathname.startsWith('/alarms/history')) return await handleAlarmCRUD(request, env, url, userKey, 'history', '/alarms/history');
        const kvKind = url.pathname.startsWith('/reminders') ? 'reminders' : 'alarms';
        return await handleAlarmCRUD(request, env, url, userKey, kvKind, '/' + kvKind);
      }
      return new Response('Not found', { status: 404 });
    }

    if (request.method !== 'POST' && request.method !== 'PATCH' && request.method !== 'DELETE') {
      return new Response('Method not allowed', { status: 405 });
    }

    // All POST/PATCH/DELETE routes require a valid Homa token (X-User-Token).
    // No Bearer/Worker-key needed — the Homa token alone proves user identity.
    const userToken = request.headers.get('X-User-Token') || '';
    if (!userToken) return jsonBody({ error: 'user_identity_required', code: 'no_user_token' }, 401);
    let userKey = '';
    try { userKey = await deriveUserKey(userToken, env); }
    catch { return jsonBody({ error: 'user_identity_required', code: 'no_user_token' }, 401); }

    try {
      // D1 data CRUD (POST/PATCH/DELETE)
      if (isDataRoute) {
        const entityMatch = url.pathname.match(/^\/data\/([a-z_]+)/);
        if (entityMatch && isValidEntity(entityMatch[1])) {
          return await handleD1CRUD(request, env, url, userKey, entityMatch[1]);
        }
      }

      // Alarm / Reminder / History CRUD (POST/PATCH/DELETE)
      if (isAlarmRoute) {
        if (url.pathname.startsWith('/alarms/history')) return await handleAlarmCRUD(request, env, url, userKey, 'history', '/alarms/history');
        const kvKind = url.pathname.startsWith('/reminders') ? 'reminders' : 'alarms';
        return await handleAlarmCRUD(request, env, url, userKey, kvKind, '/' + kvKind);
      }
      // RESTful connector routes (path-based)
      if (url.pathname === '/connect') {
        const body = await request.json();
        return await handleConnectTool(body, env, userKey);
      }
      if (url.pathname === '/disconnect') {
        const body = await request.json();
        return await handleDisconnectTool(body, env, userKey);
      }
      if (url.pathname === '/connection/status') {
        const body = await request.json();
        return await handleConnectionStatus(body, env, userKey);
      }

      // Job routes
      if (url.pathname === '/jobs' && request.method === 'POST') {
        const body = await request.json();
        return await handleCreateJob(body, env, userKey);
      }
      // /jobs/{id} (GET) and /jobs/{id}/cancel (POST)
      const jobMatch = url.pathname.match(/^\/jobs\/([^/]+)(\/cancel)?$/);
      if (jobMatch) {
        const jobId = decodeURIComponent(jobMatch[1]);
        if (jobMatch[2] === '/cancel') return await handleCancelJob(jobId, env, userKey);
        return await handleGetJob(jobId, env, userKey);
      }

      const body = await request.json();
      const type = body.type || 'chat';

      if (type === 'google_status') return await handleGoogleStatus(body, env, userKey);
      if (type === 'google_tasks_create') return await handleGoogleTaskCreate(body, env, userKey);
      if (type === 'google_calendar_create') return await handleGoogleCalendarCreate(body, env, userKey);
      if (type === 'google_disconnect') return await handleGoogleDisconnect(body, env, userKey);
      if (type === 'web_search') return await handleWebSearch(body, env);
      if (type === 'deep_research') return await handleDeepResearch(body, env);
      if (type === 'tts') return await handleTTS(body, env);
      if (type === 'analyze') return await handleAnalyze(body, env);
      if (type === 'generate_prompt') return await handleGeneratePrompt(body, env);
      if (type === 'upload_file') return await handleUploadFile(body, env);
      if (type === 'file_analyze') return await handleFileAnalyze(body, env);
      if (type === 'image_generate') return await handleImageGenerate(body, env);
      if (type === 'image_edit') return await handleImageEdit(body, env);
      if (type === 'video_generate') return await handleVideoGenerate(body, env);
      if (type === 'stt') return await handleSTT(body, env);
      if (type === 'global_search') return await handleGlobalSearch(body, env, request);
      if (type === 'tool_route') return await handleToolRoute(body, env);

      // Default: chat
      const messages = body.messages;
      if (!Array.isArray(messages) || messages.length === 0) return jsonBody({ error: 'messages required' });

      const language = body.language || 'fa';
      const requestedModel = body.model || 'auto';
      const codeMode = !!body.codeMode;
      const codeAction = body.codeAction || '';
      const systemExtra = body.system_extra || '';
      const imageData = Array.isArray(body.image_data) ? body.image_data.filter(b => typeof b === 'string' && b.startsWith('data:image')) : [];

      if (!MODEL_ALLOWLIST[requestedModel]) return jsonBody({ error: 'invalid_model' });

      const system = buildSystemPrompt(language, codeMode, codeAction, systemExtra);

      // Vision path
      if (imageData.length > 0) {
        const visionMessages = [{ role: 'system', content: system + '\n\nشما تصاویر واقعی دریافت کرده‌اید. محتوای بصری هر تصویر را مستقیماً تحلیل کن — اشیا، رنگ‌ها، متن داخل تصویر و جزئیات بصری را توصیف کن. هرگز به نام فایل تکیه نکن.' }];
        for (const m of messages) {
          if (m.role === 'user' && m === messages[messages.length - 1]) {
            const content = [{ type: 'text', text: m.content || '' }];
            for (const img of imageData.slice(0, 10)) content.push({ type: 'image_url', image_url: { url: img } });
            visionMessages.push({ role: 'user', content });
          } else {
            visionMessages.push({ role: m.role, content: m.content || '' });
          }
        }
        let result = await callGroqVision(visionMessages, env);
        if (result.error) result = await callOpenRouterVision(visionMessages, env);
        return jsonBody(result);
      }

      // Text path
      const apiMessages = [{ role: 'system', content: system }, ...messages];
      let result;

      if (requestedModel === 'auto') {
        result = await callGroq(apiMessages, env);
        if (result.error) {
          const autoModel = pickAutoModel(messages);
          result = await callOpenRouter(autoModel, apiMessages, env);
        }
      } else {
        result = await callOpenRouter(requestedModel, apiMessages, env);
        if (result.error && requestedModel !== 'lightning') {
          const retry = await callOpenRouter('lightning', apiMessages, env);
          if (!retry.error) result = retry;
        }
      }

      return jsonBody(result);
    } catch (error) {
      return jsonBody({ error: error.message || 'internal_error' });
    }
  },

  // Cron-triggered background smart-watch checker.
  // INACTIVE until deployed with [triggers] cron in wrangler.toml AND the
  // fetchProductPrice helper is extracted (see runSmartWatchChecks above).
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runSmartWatchChecks(env));
  }
};