/**
 * Homa AI — Provider Router (B5)
 *
 * Capability-based AI provider routing with fallback chains.
 * Homa is NOT dependent on any single provider. Claude, Groq, OpenRouter,
 * etc. are all just providers — interchangeable and replaceable.
 *
 * Flow:
 *   1. router.execute(env, capability, params)
 *   2. Select provider chain for capability (based on available env vars)
 *   3. Try provider A → on failure, try B → on failure, try C
 *   4. Log usage (provider, latency, success/failure)
 *   5. Return result or { error: 'NO_PROVIDER' } / { error: 'PROVIDER_ERROR' }
 *
 * Capabilities:
 *   chat, reasoning, coding, vision, image, image_edit, video,
 *   video_analysis, audio, stt, tts, file_analysis, web_search, deep_research
 */

import { ErrorCodes } from '../lib/errors.js';

// ===== Provider availability checks =====
function hasGroq(env) { return !!env.GROQ_API_KEY; }
function hasOpenRouter(env) { return !!env.OPENROUTER_API_KEY; }
function hasAnthropic(env) { return !!env.ANTHROPIC_API_KEY; }
function hasOpenAI(env) { return !!env.OPENAI_API_KEY; }
function hasReplicate(env) { return !!env.REPLICATE_API_TOKEN; }

// ===== Provider chains per capability =====
// Each capability has an ordered list of providers. The router tries
// them in order until one succeeds.
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
    case 'groq':
    case 'groq_stt':
    case 'groq_tts':
    case 'groq_vision':
      return hasGroq(env);
    case 'openrouter':
    case 'openrouter_vision':
      return hasOpenRouter(env);
    case 'anthropic':
      return hasAnthropic(env);
    case 'openai':
      return hasOpenAI(env);
    case 'replicate':
      return hasReplicate(env);
    default:
      return false;
  }
}

// ===== Provider executors =====
// Each returns { content, model, provider } or { error }

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
      if (res.status === 429) continue;
      if (!res.ok) continue;
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
      if (res.status === 429) continue;
      if (!res.ok) continue;
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

async function execAnthropic(env, messages, opts) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return { error: 'no_api_key' };
  const model = opts?.model || 'claude-sonnet-4-20250514';
  // Convert OpenAI-style messages to Anthropic format
  const systemMsg = messages.find(m => m.role === 'system')?.content || '';
  const userMsgs = messages.filter(m => m.role !== 'system');
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts?.timeout || TIMEOUT_MS);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: opts?.max_tokens || MAX_TOKENS,
        system: systemMsg,
        messages: userMsgs.map(m => ({ role: m.role, content: m.content })),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { error: 'provider_failed' };
    const data = await res.json();
    const content = data?.content?.[0]?.text || '';
    if (content) return { content, model: 'anthropic/' + model, provider: 'anthropic' };
    return { error: 'provider_failed' };
  } catch {
    return { error: 'provider_failed' };
  }
}

async function execOpenAI(env, messages, opts) {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) return { error: 'no_api_key' };
  const model = opts?.model || 'gpt-4o-mini';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts?.timeout || TIMEOUT_MS);
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: opts?.max_tokens || MAX_TOKENS }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { error: 'provider_failed' };
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '';
    if (content) return { content, model: 'openai/' + model, provider: 'openai' };
    return { error: 'provider_failed' };
  } catch {
    return { error: 'provider_failed' };
  }
}

async function execGroqSTT(env, audioUrl, opts) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) return { error: 'no_api_key' };
  try {
    const audioRes = await fetch(audioUrl);
    const audioBlob = await audioRes.blob();
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    if (opts?.language) formData.append('language', opts.language);

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey },
      body: formData,
    });
    if (!res.ok) return { error: 'provider_failed' };
    const data = await res.json();
    if (data.text) return { content: data.text, model: 'groq/whisper-large-v3', provider: 'groq_stt' };
    return { error: 'provider_failed' };
  } catch {
    return { error: 'provider_failed' };
  }
}

// ===== Provider dispatch =====
async function executeProvider(provider, env, params) {
  switch (provider) {
    case 'groq':
      return await execGroq(env, params.messages, params);
    case 'groq_vision':
      return await execGroqVision(env, params.messages, params);
    case 'openrouter':
      return await execOpenRouter(env, params.messages, params);
    case 'openrouter_vision':
      return await execOpenRouter(env, params.messages, { ...params, model: 'meta-llama/llama-4-scout-17b-16e-instruct:free' });
    case 'anthropic':
      return await execAnthropic(env, params.messages, params);
    case 'openai':
      return await execOpenAI(env, params.messages, params);
    case 'groq_stt':
      return await execGroqSTT(env, params.audio_url, params);
    case 'groq_tts':
      // TTS handled by existing TTS code in the worker
      return { error: 'use_existing_tts' };
    case 'replicate':
      // Replicate handled by existing providers/index.js
      return { error: 'use_existing_replicate' };
    default:
      return { error: 'unknown_provider' };
  }
}

// ===== Main router =====
export const router = {
  // Get available providers for a capability
  getProviders(capability, env) {
    return getProviderChain(capability, env);
  },

  // Check if any provider is available for a capability
  isAvailable(capability, env) {
    return getProviderChain(capability, env).length > 0;
  },

  // Execute a capability with fallback chain
  async execute(env, capability, params) {
    const chain = getProviderChain(capability, env);
    if (chain.length === 0) {
      return { error: ErrorCodes.NO_PROVIDER, capability };
    }

    const errors = [];
    for (const provider of chain) {
      const start = Date.now();
      const result = await executeProvider(provider, env, params);
      const latency = Date.now() - start;

      if (result.content) {
        return {
          ...result,
          latency_ms: latency,
          attempted_providers: errors.length,
        };
      }

      errors.push({ provider, error: result.error, latency_ms: latency });
    }

    return {
      error: ErrorCodes.PROVIDER_ERROR,
      capability,
      attempted: errors,
    };
  },
};