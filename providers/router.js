/**
 * Homa AI — Provider Router (B5)
 *
 * Capability-based AI provider routing with fallback chains.
 * Homa is NOT dependent on any single provider.
 */

import { ErrorCodes } from '../lib/errors.js';

function hasGroq(env) { return !!env.GROQ_API_KEY; }
function hasOpenRouter(env) { return !!env.OPENROUTER_API_KEY; }
function hasAnthropic(env) { return !!env.ANTHROPIC_API_KEY; }
function hasOpenAI(env) { return !!env.OPENAI_API_KEY; }
function hasReplicate(env) { return !!env.REPLICATE_API_TOKEN; }

function getProviderChain(capability, env) {
  const chains = {
    chat:      () => ['groq', 'openrouter'].filter(p => isProviderAvailable(p, env)),
    reasoning: () => ['openrouter', 'anthropic'].filter(p => isProviderAvailable(p, env)),
    coding:    () => ['groq', 'openrouter'].filter(p => isProviderAvailable(p, env)),
    vision:    () => ['groq_vision', 'openrouter_vision'].filter(p => isProviderAvailable(p, env)),
    image:     () => ['replicate'].filter(p => isProviderAvailable(p, env)),
    image_edit: () => ['replicate'].filter(p => isProviderAvailable(p, env)),
    video:     () => ['replicate'].filter(p => isProviderAvailable(p, env)),
    video_analysis: () => ['groq_vision', 'openrouter_vision'].filter(p => isProviderAvailable(p, env)),
    stt:       () => ['groq_stt'].filter(p => isProviderAvailable(p, env)),
    tts:       () => ['groq_tts'].filter(p => isProviderAvailable(p, env)),
    file_analysis: () => ['groq'].filter(p => isProviderAvailable(p, env)),
    web_search: () => ['groq'].filter(p => isProviderAvailable(p, env)),
    deep_research: () => ['openrouter', 'groq'].filter(p => isProviderAvailable(p, env)),
  };
  return (chains[capability] || (() => []))(env);
}

function isProviderAvailable(provider, env) {
  switch (provider) {
    case 'groq': case 'groq_stt': case 'groq_tts': case 'groq_vision': return hasGroq(env);
    case 'openrouter': case 'openrouter_vision': return hasOpenRouter(env);
    case 'anthropic': return hasAnthropic(env);
    case 'openai': return hasOpenAI(env);
    case 'replicate': return hasReplicate(env);
    default: return false;
  }
}

const GROQ_MODELS = ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b', 'llama-3.1-8b-instant'];
const GROQ_VISION_MODELS = ['meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct'];
const TIMEOUT_MS = 20000;
const MAX_TOKENS = 8192;

async function execGroq(env, messages, opts) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) return { error: 'no_api_key' };
  for (const model of GROQ_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), opts?.timeout || TIMEOUT_MS);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: opts?.max_tokens || MAX_TOKENS }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.status === 429 || !res.ok) continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || '';
      if (content) return { content, model: 'groq/' + model, provider: 'groq' };
    } catch {}
  }
  return { error: 'provider_failed' };
}

async function execGroqVision(env, messages, opts) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) return { error: 'no_api_key' };
  for (const model of GROQ_VISION_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), opts?.timeout || TIMEOUT_MS);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.status === 429 || !res.ok) continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || '';
      if (content) return { content, model: 'groq_vision/' + model, provider: 'groq_vision' };
    } catch {}
  }
  return { error: 'provider_failed' };
}

async function execOpenRouter(env, messages, opts) {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) return { error: 'no_api_key' };
  const model = opts?.model || 'nvidia/nemotron-3-ultra-550b-a55b:free';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts?.timeout || TIMEOUT_MS);
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: opts?.max_tokens || MAX_TOKENS }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.status === 429) return { error: 'rate_limit' };
    if (!res.ok) return { error: 'provider_failed' };
    const data = await res.json();
    const msg = data?.choices?.[0]?.message;
    const content = msg?.content || msg?.reasoning_content || '';
    if (content) return { content, model: 'openrouter/' + model, provider: 'openrouter' };
    return { error: 'provider_failed' };
  } catch {
    return { error: 'provider_failed' };
  }
}

async function executeProvider(provider, env, params) {
  switch (provider) {
    case 'groq': return await execGroq(env, params.messages, params);
    case 'groq_vision': return await execGroqVision(env, params.messages, params);
    case 'openrouter': return await execOpenRouter(env, params.messages, params);
    case 'openrouter_vision': return await execOpenRouter(env, params.messages, { ...params, model: 'meta-llama/llama-4-scout-17b-16e-instruct:free' });
    default: return { error: 'unknown_provider' };
  }
}

export const router = {
  getProviders(capability, env) { return getProviderChain(capability, env); },
  isAvailable(capability, env) { return getProviderChain(capability, env).length > 0; },
  async execute(env, capability, params) {
    const chain = getProviderChain(capability, env);
    if (chain.length === 0) return { error: ErrorCodes.NO_PROVIDER, capability };
    const errors = [];
    for (const provider of chain) {
      const start = Date.now();
      const result = await executeProvider(provider, env, params);
      const latency = Date.now() - start;
      if (result.content) return { ...result, latency_ms: latency, attempted_providers: errors.length };
      errors.push({ provider, error: result.error, latency_ms: latency });
    }
    return { error: ErrorCodes.PROVIDER_ERROR, capability, attempted: errors };
  },
};