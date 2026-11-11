var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// .wrangler/tmp/bundle-VbBtD4/checked-fetch.js
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
var urls;
var init_checked_fetch = __esm({
  ".wrangler/tmp/bundle-VbBtD4/checked-fetch.js"() {
    urls = /* @__PURE__ */ new Set();
    __name(checkURL, "checkURL");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        const [request, init] = argArray;
        checkURL(request, init);
        return Reflect.apply(target, thisArg, argArray);
      }
    });
  }
});

// .wrangler/tmp/bundle-VbBtD4/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
var init_strip_cf_connecting_ip_header = __esm({
  ".wrangler/tmp/bundle-VbBtD4/strip-cf-connecting-ip-header.js"() {
    __name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
    globalThis.fetch = new Proxy(globalThis.fetch, {
      apply(target, thisArg, argArray) {
        return Reflect.apply(target, thisArg, [
          stripCfConnectingIPHeader.apply(null, argArray)
        ]);
      }
    });
  }
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// lib/errors.js
function genRequestId() {
  requestCounter = (requestCounter + 1) % 1e6;
  return "req_" + Date.now().toString(36) + "_" + requestCounter.toString(36);
}
function successResponse(data, status = 200, requestId) {
  return Response.json(
    { success: true, data, request_id: requestId || genRequestId() },
    { status, headers: corsHeaders() }
  );
}
function errorResponse(code, status, customMessage, requestId) {
  const message = customMessage || PersianMessages[code] || PersianMessages.INTERNAL_ERROR;
  return Response.json(
    { success: false, error: { code, message }, request_id: requestId || genRequestId() },
    { status: status || statusForCode(code), headers: corsHeaders() }
  );
}
function statusForCode(code) {
  switch (code) {
    case ErrorCodes.AUTH_REQUIRED:
      return 401;
    case ErrorCodes.FORBIDDEN:
      return 403;
    case ErrorCodes.NOT_FOUND:
      return 404;
    case ErrorCodes.INVALID_INPUT:
    case ErrorCodes.INVALID_ENTITY:
    case ErrorCodes.FILE_TOO_LARGE:
    case ErrorCodes.UNSUPPORTED_FILE:
      return 400;
    case ErrorCodes.INSUFFICIENT_CREDITS:
      return 402;
    case ErrorCodes.RATE_LIMITED:
      return 429;
    case ErrorCodes.NO_PROVIDER:
    case ErrorCodes.NO_STORAGE_PROVIDER:
    case ErrorCodes.NO_PAYMENT_PROVIDER:
    case ErrorCodes.NO_EMAIL_PROVIDER:
      return 503;
    case ErrorCodes.PROVIDER_ERROR:
    case ErrorCodes.PAYMENT_FAILED:
    case ErrorCodes.INTERNAL_ERROR:
      return 500;
    default:
      return 500;
  }
}
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Token, X-Request-Id",
    "Access-Control-Max-Age": "86400"
  };
}
var ErrorCodes, PersianMessages, requestCounter;
var init_errors = __esm({
  "lib/errors.js"() {
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    ErrorCodes = {
      AUTH_REQUIRED: "AUTH_REQUIRED",
      FORBIDDEN: "FORBIDDEN",
      NOT_FOUND: "NOT_FOUND",
      INVALID_INPUT: "INVALID_INPUT",
      INVALID_ENTITY: "INVALID_ENTITY",
      INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
      RATE_LIMITED: "RATE_LIMITED",
      NO_PROVIDER: "NO_PROVIDER",
      PROVIDER_ERROR: "PROVIDER_ERROR",
      NO_STORAGE_PROVIDER: "NO_STORAGE_PROVIDER",
      NO_PAYMENT_PROVIDER: "NO_PAYMENT_PROVIDER",
      NO_EMAIL_PROVIDER: "NO_EMAIL_PROVIDER",
      FILE_TOO_LARGE: "FILE_TOO_LARGE",
      UNSUPPORTED_FILE: "UNSUPPORTED_FILE",
      PAYMENT_FAILED: "PAYMENT_FAILED",
      INTERNAL_ERROR: "INTERNAL_ERROR"
    };
    PersianMessages = {
      AUTH_REQUIRED: "\u0627\u062D\u0631\u0627\u0632 \u0647\u0648\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0648\u0627\u0631\u062F \u0634\u0648\u06CC\u062F.",
      FORBIDDEN: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632.",
      NOT_FOUND: "\u0645\u0648\u0631\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.",
      INVALID_INPUT: "\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631.",
      INVALID_ENTITY: "\u0646\u0648\u0639 \u062F\u0627\u062F\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631.",
      INSUFFICIENT_CREDITS: "\u0627\u0639\u062A\u0628\u0627\u0631 \u06A9\u0627\u0641\u06CC \u0646\u06CC\u0633\u062A.",
      RATE_LIMITED: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627\u06CC \u0634\u0645\u0627 \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A. \u06A9\u0645\u06CC \u0628\u0639\u062F \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F.",
      NO_PROVIDER: "\u0647\u06CC\u0686 \u0627\u0631\u0627\u0626\u0647\u200C\u062F\u0647\u0646\u062F\u0647\u200C\u0627\u06CC \u0628\u0631\u0627\u06CC \u0627\u06CC\u0646 \u0642\u0627\u0628\u0644\u06CC\u062A \u067E\u06CC\u06A9\u0631\u0628\u0646\u062F\u06CC \u0646\u0634\u062F\u0647 \u0627\u0633\u062A.",
      PROVIDER_ERROR: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 \u0627\u0631\u0627\u0626\u0647\u200C\u062F\u0647\u0646\u062F\u0647 \u062E\u062F\u0645\u0627\u062A \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC.",
      NO_STORAGE_PROVIDER: "\u0633\u06CC\u0633\u062A\u0645 \u0630\u062E\u06CC\u0631\u0647\u200C\u0633\u0627\u0632\u06CC \u0641\u0627\u06CC\u0644 \u067E\u06CC\u06A9\u0631\u0628\u0646\u062F\u06CC \u0646\u0634\u062F\u0647 \u0627\u0633\u062A.",
      NO_PAYMENT_PROVIDER: "\u062F\u0631\u06AF\u0627\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u067E\u06CC\u06A9\u0631\u0628\u0646\u062F\u06CC \u0646\u0634\u062F\u0647 \u0627\u0633\u062A.",
      NO_EMAIL_PROVIDER: "\u0633\u0631\u0648\u06CC\u0633 \u0627\u06CC\u0645\u06CC\u0644 \u067E\u06CC\u06A9\u0631\u0628\u0646\u062F\u06CC \u0646\u0634\u062F\u0647 \u0627\u0633\u062A.",
      FILE_TOO_LARGE: "\u062D\u062C\u0645 \u0641\u0627\u06CC\u0644 \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.",
      UNSUPPORTED_FILE: "\u0646\u0648\u0639 \u0641\u0627\u06CC\u0644 \u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u0646\u0645\u06CC\u200C\u0634\u0648\u062F.",
      PAYMENT_FAILED: "\u067E\u0631\u062F\u0627\u062E\u062A \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F.",
      INTERNAL_ERROR: "\u062E\u0637\u0627\u06CC \u062F\u0627\u062E\u0644\u06CC \u0633\u0631\u0648\u0631. \u0644\u0637\u0641\u0627\u064B \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F."
    };
    requestCounter = 0;
    __name(genRequestId, "genRequestId");
    __name(successResponse, "successResponse");
    __name(errorResponse, "errorResponse");
    __name(statusForCode, "statusForCode");
    __name(corsHeaders, "corsHeaders");
  }
});

// providers/router.js
var router_exports = {};
__export(router_exports, {
  router: () => router
});
function hasGroq(env) {
  return !!env.GROQ_API_KEY;
}
function hasOpenRouter(env) {
  return !!env.OPENROUTER_API_KEY;
}
function hasAnthropic(env) {
  return !!env.ANTHROPIC_API_KEY;
}
function hasOpenAI(env) {
  return !!env.OPENAI_API_KEY;
}
function hasReplicate(env) {
  return !!env.REPLICATE_API_TOKEN;
}
function getProviderChain(capability, env) {
  const chains = {
    chat: () => ["groq", "openrouter"].filter((p) => isProviderAvailable(p, env)),
    reasoning: () => ["openrouter", "anthropic"].filter((p) => isProviderAvailable(p, env)),
    coding: () => ["groq", "openrouter"].filter((p) => isProviderAvailable(p, env)),
    vision: () => ["groq_vision", "openrouter_vision"].filter((p) => isProviderAvailable(p, env)),
    image: () => ["replicate"].filter((p) => isProviderAvailable(p, env)),
    image_edit: () => ["replicate"].filter((p) => isProviderAvailable(p, env)),
    video: () => ["replicate"].filter((p) => isProviderAvailable(p, env)),
    video_analysis: () => ["groq_vision", "openrouter_vision"].filter((p) => isProviderAvailable(p, env)),
    stt: () => ["groq_stt"].filter((p) => isProviderAvailable(p, env)),
    tts: () => ["groq_tts"].filter((p) => isProviderAvailable(p, env)),
    file_analysis: () => ["groq"].filter((p) => isProviderAvailable(p, env)),
    web_search: () => ["groq"].filter((p) => isProviderAvailable(p, env)),
    deep_research: () => ["openrouter", "groq"].filter((p) => isProviderAvailable(p, env))
  };
  return (chains[capability] || (() => []))(env);
}
function isProviderAvailable(provider, env) {
  switch (provider) {
    case "groq":
    case "groq_stt":
    case "groq_tts":
    case "groq_vision":
      return hasGroq(env);
    case "openrouter":
    case "openrouter_vision":
      return hasOpenRouter(env);
    case "anthropic":
      return hasAnthropic(env);
    case "openai":
      return hasOpenAI(env);
    case "replicate":
      return hasReplicate(env);
    default:
      return false;
  }
}
async function execGroq(env, messages, opts) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey)
    return { error: "no_api_key" };
  for (const model of GROQ_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), opts?.timeout || TIMEOUT_MS);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: opts?.max_tokens || MAX_TOKENS }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.status === 429 || !res.ok)
        continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "";
      if (content)
        return { content, model: "groq/" + model, provider: "groq" };
    } catch {
    }
  }
  return { error: "provider_failed" };
}
async function execGroqVision(env, messages, opts) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey)
    return { error: "no_api_key" };
  for (const model of GROQ_VISION_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), opts?.timeout || TIMEOUT_MS);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.status === 429 || !res.ok)
        continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "";
      if (content)
        return { content, model: "groq_vision/" + model, provider: "groq_vision" };
    } catch {
    }
  }
  return { error: "provider_failed" };
}
async function execOpenRouter(env, messages, opts) {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey)
    return { error: "no_api_key" };
  const model = opts?.model || "nvidia/nemotron-3-ultra-550b-a55b:free";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts?.timeout || TIMEOUT_MS);
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: opts?.max_tokens || MAX_TOKENS }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.status === 429)
      return { error: "rate_limit" };
    if (!res.ok)
      return { error: "provider_failed" };
    const data = await res.json();
    const msg = data?.choices?.[0]?.message;
    const content = msg?.content || msg?.reasoning_content || "";
    if (content)
      return { content, model: "openrouter/" + model, provider: "openrouter" };
    return { error: "provider_failed" };
  } catch {
    return { error: "provider_failed" };
  }
}
async function executeProvider(provider, env, params) {
  switch (provider) {
    case "groq":
      return await execGroq(env, params.messages, params);
    case "groq_vision":
      return await execGroqVision(env, params.messages, params);
    case "openrouter":
      return await execOpenRouter(env, params.messages, params);
    case "openrouter_vision":
      return await execOpenRouter(env, params.messages, { ...params, model: "meta-llama/llama-4-scout-17b-16e-instruct:free" });
    default:
      return { error: "unknown_provider" };
  }
}
var GROQ_MODELS, GROQ_VISION_MODELS, TIMEOUT_MS, MAX_TOKENS, router;
var init_router = __esm({
  "providers/router.js"() {
    init_checked_fetch();
    init_strip_cf_connecting_ip_header();
    init_modules_watch_stub();
    init_errors();
    __name(hasGroq, "hasGroq");
    __name(hasOpenRouter, "hasOpenRouter");
    __name(hasAnthropic, "hasAnthropic");
    __name(hasOpenAI, "hasOpenAI");
    __name(hasReplicate, "hasReplicate");
    __name(getProviderChain, "getProviderChain");
    __name(isProviderAvailable, "isProviderAvailable");
    GROQ_MODELS = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant"];
    GROQ_VISION_MODELS = ["meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct"];
    TIMEOUT_MS = 2e4;
    MAX_TOKENS = 8192;
    __name(execGroq, "execGroq");
    __name(execGroqVision, "execGroqVision");
    __name(execOpenRouter, "execOpenRouter");
    __name(executeProvider, "executeProvider");
    router = {
      getProviders(capability, env) {
        return getProviderChain(capability, env);
      },
      isAvailable(capability, env) {
        return getProviderChain(capability, env).length > 0;
      },
      async execute(env, capability, params) {
        const chain = getProviderChain(capability, env);
        if (chain.length === 0)
          return { error: ErrorCodes.NO_PROVIDER, capability };
        const errors = [];
        for (const provider of chain) {
          const start = Date.now();
          const result = await executeProvider(provider, env, params);
          const latency = Date.now() - start;
          if (result.content)
            return { ...result, latency_ms: latency, attempted_providers: errors.length };
          errors.push({ provider, error: result.error, latency_ms: latency });
        }
        return { error: ErrorCodes.PROVIDER_ERROR, capability, attempted: errors };
      }
    };
  }
});

// .wrangler/tmp/bundle-VbBtD4/middleware-loader.entry.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// .wrangler/tmp/bundle-VbBtD4/middleware-insertion-facade.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// homa-ai-worker.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// providers/index.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// providers/openai.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// providers/helpers.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
async function probe(url, headers, timeoutMs = 1e4) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { method: "GET", headers, signal: controller.signal });
    clearTimeout(timeout);
    return { status: res.status, ok: res.ok, netError: false };
  } catch (e) {
    return { status: 0, ok: false, netError: true, reason: e?.name === "AbortError" ? "timeout" : "network" };
  }
}
__name(probe, "probe");
function classify(status, ok, netError) {
  if (netError)
    return { valid: false, status: "API_UNAVAILABLE" };
  if (status === 401 || status === 403)
    return { valid: false, status: "EXPIRED" };
  if (ok)
    return { valid: true, status: "CONNECTED" };
  if (status >= 400 && status < 500)
    return { valid: true, status: "CONNECTED" };
  if (status >= 500)
    return { valid: false, status: "API_UNAVAILABLE" };
  return { valid: false, status: "ERROR" };
}
__name(classify, "classify");
function normalizeError(status, body) {
  if (status === 401 || status === 403)
    return { code: "invalid_credentials", message: "API key is invalid or expired" };
  if (status === 402)
    return { code: "insufficient_credits", message: "Account has insufficient credits" };
  if (status === 429)
    return { code: "rate_limited", message: "Rate limit reached \u2014 try again later" };
  if (status >= 500)
    return { code: "provider_unavailable", message: "Provider is temporarily unavailable" };
  return { code: "provider_error", message: "Provider returned an error" };
}
__name(normalizeError, "normalizeError");
async function postJson(url, headers, body, timeoutMs = 6e4) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeout);
    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data };
  } catch (e) {
    return { status: 0, ok: false, data: null, netError: true, reason: e?.name === "AbortError" ? "timeout" : "network" };
  }
}
__name(postJson, "postJson");
async function getJson(url, headers, timeoutMs = 3e4) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { method: "GET", headers, signal: controller.signal });
    clearTimeout(timeout);
    let data = null;
    const text = await res.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data };
  } catch (e) {
    return { status: 0, ok: false, data: null, netError: true, reason: e?.name === "AbortError" ? "timeout" : "network" };
  }
}
__name(getJson, "getJson");
async function uploadBytesToHost(bytes, filename, mimeType) {
  const blob = new Blob([bytes], { type: mimeType || "application/octet-stream" });
  try {
    const fd = new FormData();
    fd.append("file", blob, filename);
    const r = await fetch("https://0x0.st", { method: "POST", body: fd });
    if (r.ok) {
      const url = (await r.text()).trim();
      if (url.startsWith("http"))
        return url;
    }
  } catch {
  }
  try {
    const fd2 = new FormData();
    fd2.append("file", blob, filename);
    const r2 = await fetch("https://tmpfiles.org/api/v1/upload", { method: "POST", body: fd2 });
    if (r2.ok) {
      const d = await r2.json();
      const url = d?.data?.url;
      if (url && url.startsWith("http"))
        return url.replace("tmpfiles.org/", "tmpfiles.org/dl/");
    }
  } catch {
  }
  return null;
}
__name(uploadBytesToHost, "uploadBytesToHost");
function jobCompleted(resultUrl, resultText, metadata) {
  return { status: "COMPLETED", result_url: resultUrl || "", result_text: resultText || "", metadata: metadata || null };
}
__name(jobCompleted, "jobCompleted");
function jobProcessing(providerJobId, context) {
  return { status: "PROCESSING", provider_job_id: providerJobId, context: context || null };
}
__name(jobProcessing, "jobProcessing");
function jobFailed(code, message) {
  return { status: "FAILED", error: message || code, code };
}
__name(jobFailed, "jobFailed");
function jobNotSupported(capability) {
  return { status: "NOT_SUPPORTED", error: `Capability ${capability} is not supported by this provider`, code: "not_supported" };
}
__name(jobNotSupported, "jobNotSupported");

// providers/openai.js
var MODELS = {
  IMAGE_GENERATION: "dall-e-3",
  IMAGE_EDITING: "gpt-image-1",
  IMAGE_VARIATION: "dall-e-2"
};
var openai_default = {
  id: "openai_image",
  isAsync: () => false,
  getCapabilities: () => ["IMAGE_GENERATION", "IMAGE_EDITING", "IMAGE_VARIATION"],
  estimateCost: (capability) => capability === "IMAGE_GENERATION" ? 1 : capability === "IMAGE_EDITING" ? 2 : 1,
  async validate(apiKey) {
    const r = await probe("https://api.openai.com/v1/models", { Authorization: "Bearer " + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    if (!MODELS[capability])
      return jobNotSupported(capability);
    const prompt = (input.prompt || "").trim();
    if (!prompt && capability !== "IMAGE_VARIATION")
      return jobFailed("invalid_input", "prompt required");
    const headers = { Authorization: "Bearer " + apiKey };
    if (capability === "IMAGE_GENERATION") {
      const size = input.size || "1024x1024";
      const r = await postJson("https://api.openai.com/v1/images/generations", headers, {
        model: MODELS.IMAGE_GENERATION,
        prompt,
        n: 1,
        size,
        quality: input.quality || "standard"
      });
      if (!r.ok)
        return jobFailed(normalizeError(r.status, r.data).code, normalizeError(r.status, r.data).message);
      const url = r.data?.data?.[0]?.url;
      if (!url)
        return jobFailed("provider_error", "No image URL in response");
      return jobCompleted(url, "", { model: MODELS.IMAGE_GENERATION, revised_prompt: r.data?.data?.[0]?.revised_prompt });
    }
    if (capability === "IMAGE_EDITING") {
      const imageUrl = input.image_url;
      if (!imageUrl)
        return jobFailed("invalid_input", "image_url required for editing");
      let imgRes;
      try {
        imgRes = await fetch(imageUrl);
      } catch {
        return jobFailed("fetch_failed", "Could not fetch source image");
      }
      if (!imgRes.ok)
        return jobFailed("fetch_failed", "Could not fetch source image");
      const imgBlob = await imgRes.blob();
      const fd = new FormData();
      fd.append("image", imgBlob, "source.png");
      fd.append("prompt", prompt);
      fd.append("model", MODELS.IMAGE_EDITING);
      if (input.size)
        fd.append("size", input.size);
      if (input.mask_url) {
        try {
          const m = await fetch(input.mask_url);
          if (m.ok)
            fd.append("mask", await m.blob(), "mask.png");
        } catch {
        }
      }
      try {
        const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: "Bearer " + apiKey }, body: fd });
        if (!res.ok) {
          const e = normalizeError(res.status, await res.json().catch({}));
          return jobFailed(e.code, e.message);
        }
        const data = await res.json();
        const url = data?.data?.[0]?.url;
        if (!url)
          return jobFailed("provider_error", "No image URL in response");
        return jobCompleted(url, "", { model: MODELS.IMAGE_EDITING });
      } catch (e) {
        return jobFailed("provider_error", e.message || "edit failed");
      }
    }
    if (capability === "IMAGE_VARIATION") {
      const imageUrl = input.image_url;
      if (!imageUrl)
        return jobFailed("invalid_input", "image_url required for variation");
      let imgRes;
      try {
        imgRes = await fetch(imageUrl);
      } catch {
        return jobFailed("fetch_failed", "Could not fetch source image");
      }
      if (!imgRes.ok)
        return jobFailed("fetch_failed", "Could not fetch source image");
      const imgBlob = await imgRes.blob();
      const fd = new FormData();
      fd.append("image", imgBlob, "source.png");
      fd.append("n", "1");
      fd.append("model", MODELS.IMAGE_VARIATION);
      if (input.size)
        fd.append("size", input.size);
      try {
        const res = await fetch("https://api.openai.com/v1/images/variations", { method: "POST", headers: { Authorization: "Bearer " + apiKey }, body: fd });
        if (!res.ok) {
          const e = normalizeError(res.status, await res.json().catch({}));
          return jobFailed(e.code, e.message);
        }
        const data = await res.json();
        const url = data?.data?.[0]?.url;
        if (!url)
          return jobFailed("provider_error", "No image URL in response");
        return jobCompleted(url, "", { model: MODELS.IMAGE_VARIATION });
      } catch (e) {
        return jobFailed("provider_error", e.message || "variation failed");
      }
    }
    return jobNotSupported(capability);
  },
  normalizeError: (status, body) => normalizeError(status, body)
};

// providers/replicate.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var MODELS2 = {
  IMAGE_GENERATION: { model: "black-forest-labs/flux-schnell", buildInput: (i) => ({ prompt: i.prompt, go_fast: true, num_outputs: 1, aspect_ratio: i.aspect_ratio || "1:1", output_format: "webp" }) },
  IMAGE_EDITING: { model: "timbrooks/instruct-pix2pix", buildInput: (i) => ({ image: i.image_url, prompt: i.prompt, num_outputs: 1 }) },
  IMAGE_UPSCALING: { model: "nightmareai/real-esrgan", buildInput: (i) => ({ image: i.image_url, scale: i.scale || 4, face_enhance: true }) },
  BACKGROUND_REMOVAL: { model: "lucataco/remove-bg", buildInput: (i) => ({ image: i.image_url }) },
  VIDEO_GENERATION: { model: "genmo/mochi-1", buildInput: (i) => ({ prompt: i.prompt, num_frames: i.num_frames || 19 }) },
  IMAGE_TO_VIDEO: { model: "stability-ai/stable-video-diffusion", buildInput: (i) => ({ cond_image: i.image_url, motion_bucket_id: i.motion_bucket_id || 127, frames_per_second: 8 }) },
  VIDEO_TO_VIDEO: { model: "stability-ai/stable-video-diffusion", buildInput: (i) => ({ cond_image: i.image_url, motion_bucket_id: 127 }) }
};
var replicate_default = {
  id: "replicate",
  isAsync: () => true,
  getCapabilities: () => Object.keys(MODELS2),
  estimateCost: (capability) => capability.includes("VIDEO") ? 5 : capability.includes("IMAGE") ? 1 : 1,
  async validate(apiKey) {
    const r = await probe("https://api.replicate.com/v1/account", { Authorization: "Bearer " + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    const spec = MODELS2[capability];
    if (!spec)
      return jobNotSupported(capability);
    const headers = { Authorization: "Bearer " + apiKey, Prefer: "wait=0" };
    const r = await postJson(`https://api.replicate.com/v1/models/${spec.model}/predictions`, headers, { input: spec.buildInput(input) });
    if (!r.ok) {
      const e = normalizeError(r.status, r.data);
      return jobFailed(e.code, e.message);
    }
    const predictionId = r.data?.id;
    if (!predictionId)
      return jobFailed("provider_error", "No prediction id returned");
    if (r.data?.status === "succeeded") {
      const url = Array.isArray(r.data.output) ? r.data.output[0] : r.data.output;
      if (url)
        return jobCompleted(url, "", { model: spec.model });
    }
    return jobProcessing(predictionId, { model: spec.model });
  },
  async getJobStatus({ provider_job_id, apiKey }) {
    const r = await getJson(`https://api.replicate.com/v1/predictions/${provider_job_id}`, { Authorization: "Bearer " + apiKey });
    if (!r.ok && r.netError)
      return jobFailed("provider_unavailable", "Could not reach Replicate");
    if (!r.ok) {
      const e = normalizeError(r.status, r.data);
      return jobFailed(e.code, e.message);
    }
    const status = r.data?.status;
    if (status === "succeeded") {
      const url = Array.isArray(r.data?.output) ? r.data.output[0] : r.data?.output;
      if (url)
        return jobCompleted(url, "", { model: r.data?.version });
      return jobFailed("provider_error", "No output URL");
    }
    if (status === "failed" || status === "canceled")
      return jobFailed("provider_error", r.data?.error || "Generation failed");
    return jobProcessing(provider_job_id, { status });
  },
  normalizeError: (status, body) => normalizeError(status, body)
};

// providers/elevenlabs.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var DEFAULT_VOICE_ID = "21m00Tc4SV5Df4OqCp8v";
var TTS_MODEL = "eleven_multilingual_v2";
var STT_MODEL = "scribe_v1";
var elevenlabs_default = {
  id: "elevenlabs",
  isAsync: () => false,
  getCapabilities: () => ["TEXT_TO_SPEECH", "VOICE_CLONING", "SPEECH_TO_TEXT"],
  estimateCost: (capability) => capability === "TEXT_TO_SPEECH" ? 1 : capability === "VOICE_CLONING" ? 3 : 1,
  async validate(apiKey) {
    const r = await probe("https://api.elevenlabs.io/v1/user", { "xi-api-key": apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    const headers = { "xi-api-key": apiKey };
    if (capability === "TEXT_TO_SPEECH") {
      const text = (input.text || input.prompt || "").trim();
      if (!text)
        return jobFailed("invalid_input", "text required");
      if (text.length > 5e3)
        return jobFailed("invalid_input", "text too long (max 5000 chars)");
      const voiceId = input.voice_id || DEFAULT_VOICE_ID;
      const params = new URLSearchParams({ output_format: "mp3_44100_128" });
      try {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?${params}`, {
          method: "POST",
          headers: { "xi-api-key": apiKey, "Content-Type": "application/json", "Accept": "audio/mpeg" },
          body: JSON.stringify({ text, model_id: TTS_MODEL, voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true } })
        });
        if (!res.ok) {
          const e = normalizeError(res.status, {});
          return jobFailed(e.code, e.message);
        }
        const audioBytes = new Uint8Array(await res.arrayBuffer());
        const url = await uploadBytesToHost(audioBytes, "tts.mp3", "audio/mpeg");
        if (!url)
          return jobFailed("upload_failed", "Generated audio but could not persist it");
        return jobCompleted(url, "", { voice_id: voiceId, model: TTS_MODEL, chars: text.length });
      } catch (e) {
        return jobFailed("provider_error", e.message || "TTS failed");
      }
    }
    if (capability === "VOICE_CLONING") {
      const name = input.name || "Cloned Voice";
      const audioUrl = input.audio_url || input.file_url;
      if (!audioUrl)
        return jobFailed("invalid_input", "audio_url required for cloning");
      try {
        const audioRes = await fetch(audioUrl);
        if (!audioRes.ok)
          return jobFailed("fetch_failed", "Could not fetch audio sample");
        const audioBlob = await audioRes.blob();
        const fd = new FormData();
        fd.append("name", name);
        fd.append("description", input.description || "Cloned via Homa");
        fd.append("files", audioBlob, "sample.mp3");
        const res = await fetch("https://api.elevenlabs.io/v1/voices/add", { method: "POST", headers: { "xi-api-key": apiKey }, body: fd });
        if (!res.ok) {
          const e = normalizeError(res.status, {});
          return jobFailed(e.code, e.message);
        }
        const data = await res.json();
        if (data?.voice_id)
          return jobCompleted("", `Voice cloned: ${data.voice_id}`, { voice_id: data.voice_id });
        return jobFailed("provider_error", "No voice_id returned");
      } catch (e) {
        return jobFailed("provider_error", e.message || "cloning failed");
      }
    }
    if (capability === "SPEECH_TO_TEXT") {
      const audioUrl = input.audio_url || input.file_url;
      if (!audioUrl)
        return jobFailed("invalid_input", "audio_url required");
      try {
        const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ audio_url: audioUrl, model_id: STT_MODEL })
        });
        if (!res.ok) {
          const e = normalizeError(res.status, {});
          return jobFailed(e.code, e.message);
        }
        const data = await res.json();
        const text = data?.text || "";
        if (!text)
          return jobFailed("provider_error", "No transcription returned");
        return jobCompleted("", text, { model: STT_MODEL });
      } catch (e) {
        return jobFailed("provider_error", e.message || "STT failed");
      }
    }
    return jobNotSupported(capability);
  },
  normalizeError: (status, body) => normalizeError(status, body)
};

// providers/stability.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var stability_default = {
  id: "stability",
  isAsync: () => false,
  getCapabilities: () => ["IMAGE_GENERATION", "IMAGE_UPSCALING"],
  estimateCost: (capability) => capability === "IMAGE_GENERATION" ? 1 : 2,
  async validate(apiKey) {
    const r = await probe("https://api.stability.ai/v1/user/balance", { Authorization: "Bearer " + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    const headers = { Authorization: "Bearer " + apiKey, Accept: "image/*" };
    if (capability === "IMAGE_GENERATION") {
      const prompt = (input.prompt || "").trim();
      if (!prompt)
        return jobFailed("invalid_input", "prompt required");
      try {
        const fd = new FormData();
        fd.append("prompt", prompt);
        fd.append("output_format", "png");
        if (input.negative_prompt)
          fd.append("negative_prompt", input.negative_prompt);
        if (input.aspect_ratio)
          fd.append("aspect_ratio", input.aspect_ratio);
        if (input.seed)
          fd.append("seed", String(input.seed));
        const res = await fetch("https://api.stability.ai/v2beta/stable-image/generate/sd3", { method: "POST", headers, body: fd });
        if (!res.ok) {
          const e = normalizeError(res.status, {});
          return jobFailed(e.code, e.message);
        }
        const imgBytes = new Uint8Array(await res.arrayBuffer());
        const url = await uploadBytesToHost(imgBytes, "generated.png", "image/png");
        if (!url)
          return jobFailed("upload_failed", "Generated image but could not persist it");
        return jobCompleted(url, "", { model: "stable-diffusion-3" });
      } catch (e) {
        return jobFailed("provider_error", e.message || "generation failed");
      }
    }
    if (capability === "IMAGE_UPSCALING") {
      const imageUrl = input.image_url;
      if (!imageUrl)
        return jobFailed("invalid_input", "image_url required");
      try {
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok)
          return jobFailed("fetch_failed", "Could not fetch source image");
        const imgBlob = await imgRes.blob();
        const fd = new FormData();
        fd.append("image", imgBlob, "source.png");
        fd.append("output_format", "png");
        if (input.prompt)
          fd.append("positive_prompt", input.prompt);
        const res = await fetch("https://api.stability.ai/v2beta/stable-image/upscale/creative", { method: "POST", headers, body: fd });
        if (!res.ok) {
          const e = normalizeError(res.status, {});
          return jobFailed(e.code, e.message);
        }
        const imgBytes = new Uint8Array(await res.arrayBuffer());
        const url = await uploadBytesToHost(imgBytes, "upscaled.png", "image/png");
        if (!url)
          return jobFailed("upload_failed", "Upscaled image but could not persist it");
        return jobCompleted(url, "", { model: "upscale-creative" });
      } catch (e) {
        return jobFailed("provider_error", e.message || "upscaling failed");
      }
    }
    return jobNotSupported(capability);
  },
  normalizeError: (status, body) => normalizeError(status, body)
};

// providers/removebg.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var removebg_default = {
  id: "removebg",
  isAsync: () => false,
  getCapabilities: () => ["BACKGROUND_REMOVAL"],
  estimateCost: () => 1,
  async validate(apiKey) {
    const r = await probe("https://api.remove.bg/v1.0/", { "X-API-Key": apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    if (capability !== "BACKGROUND_REMOVAL")
      return jobNotSupported(capability);
    const imageUrl = input.image_url;
    if (!imageUrl)
      return jobFailed("invalid_input", "image_url required");
    try {
      const fd = new FormData();
      fd.append("image_url", imageUrl);
      fd.append("size", input.size || "auto");
      if (input.format)
        fd.append("format", input.format);
      const res = await fetch("https://api.remove.bg/v1.0/removebg", { method: "POST", headers: { "X-API-Key": apiKey }, body: fd });
      if (!res.ok) {
        let msg = "Background removal failed";
        try {
          const d = await res.json();
          msg = d?.errors?.[0]?.title || msg;
        } catch {
        }
        const e = normalizeError(res.status, {});
        return jobFailed(e.code, msg);
      }
      const imgBytes = new Uint8Array(await res.arrayBuffer());
      const url = await uploadBytesToHost(imgBytes, "no-bg.png", "image/png");
      if (!url)
        return jobFailed("upload_failed", "Processed image but could not persist it");
      return jobCompleted(url, "", { credits_charged: res.headers.get("X-Credits-Charged") || "" });
    } catch (e) {
      return jobFailed("provider_error", e.message || "remove.bg failed");
    }
  },
  normalizeError: (status, body) => normalizeError(status, body)
};

// providers/heygen.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var DEFAULT_AVATAR_ID = "Wayne_20240727";
var DEFAULT_VOICE_ID2 = "077ab11b14f04ce0b49b5f6e5f8c6a5f";
var heygen_default = {
  id: "heygen",
  isAsync: () => true,
  getCapabilities: () => ["AVATAR_VIDEO", "LIP_SYNC", "VIDEO_GENERATION"],
  estimateCost: (capability) => capability === "AVATAR_VIDEO" ? 6 : capability === "LIP_SYNC" ? 5 : 5,
  async validate(apiKey) {
    const r = await probe("https://api.heygen.com/v1/user/remaining_quota", { "X-Api-Key": apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    const prompt = (input.prompt || input.text || "").trim();
    if (!prompt)
      return jobFailed("invalid_input", "prompt/text required");
    const headers = { "X-Api-Key": apiKey, "Content-Type": "application/json" };
    const characterType = capability === "LIP_SYNC" ? "photo" : "avatar";
    const character = characterType === "avatar" ? { type: "avatar", avatar_id: input.avatar_id || DEFAULT_AVATAR_ID, avatar_style: input.avatar_style || "normal" } : { type: "photo", photo_id: input.photo_id || "" };
    if (characterType === "photo" && !character.photo_id)
      return jobFailed("invalid_input", "photo_id required for lip sync");
    const body = {
      video_inputs: [{
        character,
        voice: { type: "text", voice_id: input.voice_id || DEFAULT_VOICE_ID2, input_text: prompt },
        background: { type: "color", value: "#ffffff" }
      }],
      test: false,
      aspect_ratio: input.aspect_ratio || "16:9"
    };
    const r = await postJson("https://api.heygen.com/v2/video/generate", headers, body);
    if (!r.ok) {
      const e = normalizeError(r.status, r.data);
      return jobFailed(e.code, e.message);
    }
    const videoId = r.data?.data?.video_id || r.data?.video_id;
    if (!videoId)
      return jobFailed("provider_error", "No video_id returned");
    return jobProcessing(videoId, { capability, avatar_id: character.avatar_id });
  },
  async getJobStatus({ provider_job_id, apiKey }) {
    const r = await getJson(`https://api.heygen.com/v1/video_status?video_id=${provider_job_id}`, { "X-Api-Key": apiKey });
    if (!r.ok && r.netError)
      return jobFailed("provider_unavailable", "Could not reach HeyGen");
    if (!r.ok) {
      const e = normalizeError(r.status, r.data);
      return jobFailed(e.code, e.message);
    }
    const status = r.data?.data?.status;
    if (status === "completed") {
      const url = r.data?.data?.video_url;
      if (url)
        return jobCompleted(url, "", { duration: r.data?.data?.duration });
      return jobFailed("provider_error", "Completed but no video URL");
    }
    if (status === "failed" || status === "error")
      return jobFailed("provider_error", r.data?.data?.error || "Generation failed");
    return jobProcessing(provider_job_id, { status });
  },
  normalizeError: (status, body) => normalizeError(status, body)
};

// providers/runway.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var runway_default = {
  id: "runway",
  isAsync: () => true,
  getCapabilities: () => ["VIDEO_GENERATION", "IMAGE_TO_VIDEO", "VIDEO_TO_VIDEO", "VIDEO_EDITING", "VIDEO_UPSCALE"],
  estimateCost: () => 5,
  async validate(apiKey) {
    const r = await probe("https://api.runwayml.com/v1/users", { Authorization: "Bearer " + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    const headers = { Authorization: "Bearer " + apiKey, "Content-Type": "application/json", "X-Runway-Version": "2024-11-06" };
    const prompt = (input.prompt || "").trim();
    let endpoint, body;
    if (capability === "IMAGE_TO_VIDEO" || capability === "VIDEO_TO_VIDEO") {
      const imageUrl = input.image_url;
      if (!imageUrl)
        return jobFailed("invalid_input", "image_url required");
      endpoint = "https://api.runwayml.com/v1/image_to_video";
      body = { promptImage: imageUrl, model: input.model || "gen3a_turbo", duration: input.duration || 5, promptText: prompt };
    } else if (capability === "VIDEO_GENERATION") {
      if (!prompt)
        return jobFailed("invalid_input", "prompt required");
      endpoint = "https://api.runwayml.com/v1/text_to_video";
      body = { prompt, model: input.model || "gen3a_turbo", duration: input.duration || 5 };
    } else if (capability === "VIDEO_UPSCALE") {
      const videoUrl = input.video_url || input.image_url;
      if (!videoUrl)
        return jobFailed("invalid_input", "video_url required");
      endpoint = "https://api.runwayml.com/v1/video_to_video";
      body = { promptVideo: videoUrl, model: "gen3a_turbo", promptText: prompt || "upscale" };
    } else {
      return jobNotSupported(capability);
    }
    const r = await postJson(endpoint, headers, body);
    if (!r.ok) {
      const e = normalizeError(r.status, r.data);
      return jobFailed(e.code, e.message);
    }
    const taskId = r.data?.taskId || r.data?.id;
    if (!taskId)
      return jobFailed("provider_error", "No task id returned");
    return jobProcessing(taskId, { model: body.model });
  },
  async getJobStatus({ provider_job_id, apiKey }) {
    const r = await getJson(`https://api.runwayml.com/v1/tasks/${provider_job_id}`, { Authorization: "Bearer " + apiKey, "X-Runway-Version": "2024-11-06" });
    if (!r.ok && r.netError)
      return jobFailed("provider_unavailable", "Could not reach Runway");
    if (!r.ok) {
      const e = normalizeError(r.status, r.data);
      return jobFailed(e.code, e.message);
    }
    const status = r.data?.status;
    if (status === "SUCCEEDED") {
      const output = r.data?.output;
      const url = Array.isArray(output) ? output[0] : output;
      if (url)
        return jobCompleted(url, "", { model: r.data?.model });
      return jobFailed("provider_error", "Succeeded but no output URL");
    }
    if (status === "FAILED")
      return jobFailed("provider_error", r.data?.failure || "Generation failed");
    return jobProcessing(provider_job_id, { status });
  },
  normalizeError: (status, body) => normalizeError(status, body)
};

// providers/kling.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var kling_default = {
  id: "kling",
  isAsync: () => true,
  getCapabilities: () => ["VIDEO_GENERATION", "IMAGE_TO_VIDEO", "VIDEO_EDITING"],
  estimateCost: () => 5,
  async validate(apiKey) {
    const r = await probe("https://api.klingai.com/v1/user/info", { Authorization: "Bearer " + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    const headers = { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" };
    const prompt = (input.prompt || "").trim();
    let endpoint, pollPath, body;
    if (capability === "IMAGE_TO_VIDEO" || capability === "VIDEO_EDITING") {
      const imageUrl = input.image_url;
      if (!imageUrl)
        return jobFailed("invalid_input", "image_url required");
      endpoint = "https://api.klingai.com/v1/videos/image2video";
      pollPath = "image2video";
      body = { image: imageUrl, prompt, mode: input.mode || "std", duration: input.duration || "5" };
    } else if (capability === "VIDEO_GENERATION") {
      if (!prompt)
        return jobFailed("invalid_input", "prompt required");
      endpoint = "https://api.klingai.com/v1/videos/text2video";
      pollPath = "text2video";
      body = { prompt, mode: input.mode || "std", duration: input.duration || "5" };
    } else {
      return jobNotSupported(capability);
    }
    const r = await postJson(endpoint, headers, body);
    if (!r.ok) {
      const e = normalizeError(r.status, r.data);
      return jobFailed(e.code, e.message);
    }
    const taskId = r.data?.data?.task_id || r.data?.task_id;
    if (!taskId)
      return jobFailed("provider_error", "No task_id returned");
    return jobProcessing(taskId, { poll_path: pollPath });
  },
  async getJobStatus({ provider_job_id, apiKey, context }) {
    const pollPath = context?.poll_path || "text2video";
    const r = await getJson(`https://api.klingai.com/v1/videos/${pollPath}/${provider_job_id}`, { Authorization: "Bearer " + apiKey });
    if (!r.ok && r.netError)
      return jobFailed("provider_unavailable", "Could not reach Kling");
    if (!r.ok) {
      const e = normalizeError(r.status, r.data);
      return jobFailed(e.code, e.message);
    }
    const taskStatus = r.data?.data?.task_status;
    if (taskStatus === "succeed") {
      const videos = r.data?.data?.task_result?.videos;
      const url = Array.isArray(videos) ? videos[0]?.url : videos?.url;
      if (url)
        return jobCompleted(url, "", { duration: r.data?.data?.task_result?.videos?.[0]?.duration });
      return jobFailed("provider_error", "Succeeded but no video URL");
    }
    if (taskStatus === "failed")
      return jobFailed("provider_error", r.data?.data?.task_status_msg || "Generation failed");
    return jobProcessing(provider_job_id, { poll_path: pollPath, status: taskStatus });
  },
  normalizeError: (status, body) => normalizeError(status, body)
};

// providers/pika.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var pika_default = {
  id: "pika",
  isAsync: () => true,
  getCapabilities: () => ["VIDEO_GENERATION", "IMAGE_TO_VIDEO"],
  estimateCost: () => 5,
  async validate(apiKey) {
    const r = await probe("https://api.pika.art/v1/", { Authorization: "Bearer " + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ capability }) {
    return jobNotSupported(capability);
  },
  normalizeError: (status, body) => normalizeError(status, body)
};

// providers/luma.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var luma_default = {
  id: "luma",
  isAsync: () => true,
  getCapabilities: () => ["VIDEO_GENERATION", "IMAGE_TO_VIDEO"],
  estimateCost: () => 5,
  async validate(apiKey) {
    const r = await probe("https://api.lumalabs.ai/api/v1/generations", { Authorization: "Bearer " + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    const headers = { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" };
    const prompt = (input.prompt || "").trim();
    const body = { prompt };
    if (capability === "IMAGE_TO_VIDEO") {
      const imageUrl = input.image_url;
      if (!imageUrl)
        return jobFailed("invalid_input", "image_url required");
      body.keyframes = { frame0: { type: "image", url: imageUrl } };
    } else if (capability !== "VIDEO_GENERATION") {
      return jobNotSupported(capability);
    }
    if (input.aspect_ratio)
      body.aspect_ratio = input.aspect_ratio;
    if (input.loop)
      body.loop = input.loop;
    const r = await postJson("https://api.lumalabs.ai/dream-machine/v1/generations", headers, body);
    if (!r.ok) {
      const e = normalizeError(r.status, r.data);
      return jobFailed(e.code, e.message);
    }
    const genId = r.data?.generation?.id || r.data?.id;
    if (!genId)
      return jobFailed("provider_error", "No generation id returned");
    return jobProcessing(genId, { capability });
  },
  async getJobStatus({ provider_job_id, apiKey }) {
    const r = await getJson(`https://api.lumalabs.ai/dream-machine/v1/generations/${provider_job_id}`, { Authorization: "Bearer " + apiKey });
    if (!r.ok && r.netError)
      return jobFailed("provider_unavailable", "Could not reach Luma");
    if (!r.ok) {
      const e = normalizeError(r.status, r.data);
      return jobFailed(e.code, e.message);
    }
    const state = r.data?.generation?.state || r.data?.state;
    if (state === "completed") {
      const url = r.data?.generation?.assets?.video || r.data?.assets?.video;
      if (url)
        return jobCompleted(url, "", { state });
      return jobFailed("provider_error", "Completed but no video URL");
    }
    if (state === "failed")
      return jobFailed("provider_error", r.data?.failure_reason || "Generation failed");
    return jobProcessing(provider_job_id, { state });
  },
  normalizeError: (status, body) => normalizeError(status, body)
};

// providers/suno.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var suno_default = {
  id: "suno",
  isAsync: () => true,
  getCapabilities: () => ["MUSIC_GENERATION", "SONG_GENERATION", "LYRICS_GENERATION"],
  estimateCost: () => 3,
  async validate(apiKey) {
    const r = await probe("https://api.suno.ai/v1/projects", { Authorization: "Bearer " + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ capability }) {
    return jobNotSupported(capability);
  },
  normalizeError: (status, body) => normalizeError(status, body)
};

// providers/twelvelabs.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var twelvelabs_default = {
  id: "twelvelabs",
  isAsync: () => true,
  getCapabilities: () => ["VIDEO_ANALYSIS"],
  estimateCost: () => 3,
  async validate(apiKey) {
    const r = await probe("https://api.twelvelabs.io/v1.1/users/me", { "x-api-key": apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    if (capability !== "VIDEO_ANALYSIS")
      return jobNotSupported(capability);
    const videoUrl = input.video_url || input.image_url;
    if (!videoUrl)
      return jobFailed("invalid_input", "video_url required");
    const headers = { "x-api-key": apiKey, "Content-Type": "application/json" };
    let indexId;
    try {
      const indexRes = await postJson("https://api.twelvelabs.io/v1.1/indexes", headers, {
        video_url: videoUrl,
        index_name: "homa-analysis-" + Date.now()
      });
      if (!indexRes.ok) {
        const e = normalizeError(indexRes.status, indexRes.data);
        return jobFailed(e.code, e.message);
      }
      indexId = indexRes.data?._id;
      if (!indexId)
        return jobFailed("provider_error", "No index id returned");
    } catch (e) {
      return jobFailed("provider_error", e.message || "index creation failed");
    }
    return jobProcessing(indexId, { stage: "indexing", video_url: videoUrl });
  },
  async getJobStatus({ provider_job_id, apiKey, context }) {
    const headers = { "x-api-key": apiKey, "Content-Type": "application/json" };
    const indexId = provider_job_id;
    const stage = context?.stage || "indexing";
    const indexRes = await getJson(`https://api.twelvelabs.io/v1.1/indexes/${indexId}/videos`, headers);
    if (!indexRes.ok && !indexRes.netError) {
      const e = normalizeError(indexRes.status, indexRes.data);
      return jobFailed(e.code, e.message);
    }
    if (indexRes.netError)
      return jobFailed("provider_unavailable", "Could not reach Twelve Labs");
    const videos = indexRes.data?.data || [];
    const video = videos[0];
    if (!video)
      return jobProcessing(indexId, { stage: "indexing", video_url: context?.video_url });
    if (video.status !== "ready" && video.status !== "available") {
      return jobProcessing(indexId, { stage: "indexing", video_url: context?.video_url });
    }
    if (stage === "indexing" || stage === "summarizing") {
      try {
        const sumRes = await postJson("https://api.twelvelabs.io/v1.1/summarize", headers, {
          index_id: indexId,
          video_id: video._id,
          type: "summary"
        });
        if (sumRes.ok && sumRes.data?.summary) {
          return jobCompleted("", sumRes.data.summary, { index_id: indexId, video_id: video._id });
        }
      } catch {
      }
      try {
        const gistRes = await postJson("https://api.twelvelabs.io/v1.1/gist", headers, {
          index_id: indexId,
          video_id: video._id,
          gist_type: "title,topic,hashtag"
        });
        if (gistRes.ok && gistRes.data?.gist) {
          return jobCompleted("", gistRes.data.gist, { index_id: indexId, video_id: video._id });
        }
      } catch {
      }
      return jobFailed("provider_error", "Video indexed but analysis generation failed");
    }
    return jobProcessing(indexId, { stage, video_url: context?.video_url });
  },
  normalizeError: (status, body) => normalizeError(status, body)
};

// providers/index.js
var ADAPTERS = {
  openai_image: openai_default,
  replicate: replicate_default,
  elevenlabs: elevenlabs_default,
  stability: stability_default,
  removebg: removebg_default,
  heygen: heygen_default,
  runway: runway_default,
  kling: kling_default,
  pika: pika_default,
  luma: luma_default,
  suno: suno_default,
  twelvelabs: twelvelabs_default
};
function getAdapter(providerId) {
  return ADAPTERS[providerId] || null;
}
__name(getAdapter, "getAdapter");

// lib/db.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var ENTITY_MAP = {
  users: { table: "users", userScoped: true, singleton: true },
  conversations: { table: "conversations", userScoped: true },
  chat_folders: { table: "chat_folders", userScoped: true },
  messages: { table: "messages", userScoped: true },
  usage: { table: "usage", userScoped: true, singleton: true },
  credit_transactions: { table: "credit_transactions", userScoped: true, readOnly: true },
  orders: { table: "orders", userScoped: true },
  api_keys: { table: "api_keys", userScoped: true },
  api_credits: { table: "api_credits", userScoped: true, singleton: true },
  api_usage: { table: "api_usage", userScoped: false, ownerKey: "owner_id" },
  api_jobs: { table: "api_jobs", userScoped: false, ownerKey: "owner_id" },
  support_tickets: { table: "support_tickets", userScoped: true },
  referrals: { table: "referrals", userScoped: false, ownerKey: "referrer_id" },
  library_items: { table: "library_items", userScoped: true },
  projects: { table: "projects", userScoped: true },
  tasks: { table: "tasks", userScoped: true },
  prompt_templates: { table: "prompt_templates", userScoped: true },
  favorites: { table: "favorites", userScoped: true },
  shopping_lists: { table: "shopping_lists", userScoped: true },
  price_reminders: { table: "price_reminders", userScoped: true },
  price_history: { table: "price_history", userScoped: true },
  favorite_stores: { table: "favorite_stores", userScoped: true },
  search_history: { table: "search_history", userScoped: true },
  user_connections: { table: "user_connections", userScoped: true },
  tts_cache: { table: "tts_cache", userScoped: true },
  plans: { table: "plans", userScoped: false, adminOnly: true, publicRead: true },
  feature_costs: { table: "feature_costs", userScoped: false, adminOnly: true },
  provider_configs: { table: "provider_configs", userScoped: false, adminOnly: true },
  alarms: { table: "alarms", userScoped: true },
  reminders: { table: "reminders", userScoped: true },
  alarm_history: { table: "alarm_history", userScoped: true }
};
function isValidEntity(name) {
  return !!ENTITY_MAP[name];
}
__name(isValidEntity, "isValidEntity");

// routes/api.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();

// lib/auth.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_errors();
async function getHmacKey(env) {
  if (!env.HOMA_WORKER_KEY)
    throw new Error("no_worker_key");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.HOMA_WORKER_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
__name(getHmacKey, "getHmacKey");
async function issueHomaToken(userId, env) {
  const expiry = Math.floor(Date.now() / 1e3) + 30 * 24 * 60 * 60;
  const payload = `${userId}.${expiry}`;
  const key = await getHmacKey(env);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const hmac = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `homa_${userId}.${expiry}.${hmac}`;
}
__name(issueHomaToken, "issueHomaToken");
async function verifyHomaToken(token, env) {
  if (!token || !token.startsWith("homa_"))
    return null;
  const rest = token.slice(5);
  const lastDot = rest.lastIndexOf(".");
  const secondLastDot = rest.lastIndexOf(".", lastDot - 1);
  if (lastDot < 0 || secondLastDot < 0)
    return null;
  const userId = rest.slice(0, secondLastDot);
  const expiryStr = rest.slice(secondLastDot + 1, lastDot);
  const hmac = rest.slice(lastDot + 1);
  const expiry = parseInt(expiryStr, 10);
  if (isNaN(expiry) || expiry < Math.floor(Date.now() / 1e3))
    return null;
  const payload = `${userId}.${expiry}`;
  const key = await getHmacKey(env);
  const expectedSig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const expectedHmac = Array.from(new Uint8Array(expectedSig)).map((b) => b.toString(16).padStart(2, "0")).join("");
  if (hmac !== expectedHmac)
    return null;
  return { userId, expiry };
}
__name(verifyHomaToken, "verifyHomaToken");
async function deriveUserKey(token, env) {
  if (!token)
    throw new Error("no_token");
  if (token.startsWith("homa_")) {
    const verified = await verifyHomaToken(token, env);
    if (!verified)
      throw new Error("invalid_token");
    return verified.userId;
  }
  const data = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(deriveUserKey, "deriveUserKey");
function requireBearer(request, env) {
  if (!env.HOMA_WORKER_KEY)
    return false;
  const authHeader = request.headers.get("Authorization");
  return authHeader === "Bearer " + env.HOMA_WORKER_KEY;
}
__name(requireBearer, "requireBearer");
async function requireAuth(request, env) {
  const requestId = request.headers.get("X-Request-Id") || "";
  if (!requireBearer(request, env)) {
    return { error: errorResponse(ErrorCodes.AUTH_REQUIRED, 401, void 0, requestId), user: null };
  }
  const userToken = request.headers.get("X-User-Token");
  if (!userToken) {
    return { error: errorResponse(ErrorCodes.AUTH_REQUIRED, 401, void 0, requestId), user: null };
  }
  try {
    const userKey = await deriveUserKey(userToken, env);
    return { error: null, user: { id: userKey, token: userToken }, requestId };
  } catch {
    return { error: errorResponse(ErrorCodes.AUTH_REQUIRED, 401, void 0, requestId), user: null };
  }
}
__name(requireAuth, "requireAuth");
async function requireAdmin(request, env) {
  const auth = await requireAuth(request, env);
  if (auth.error)
    return auth;
  if (env.DB) {
    try {
      const userRow = await env.DB.prepare("SELECT role FROM users WHERE id = ?").bind(auth.user.id).first();
      if (userRow && userRow.role === "admin") {
        return { ...auth, isAdmin: true };
      }
    } catch {
    }
  }
  if (env.USER_DATA) {
    try {
      const adminFlag = await env.USER_DATA.get("admin:" + auth.user.id);
      if (adminFlag === "true")
        return { ...auth, isAdmin: true };
    } catch {
    }
  }
  return {
    error: errorResponse(ErrorCodes.FORBIDDEN, 403, "\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062F\u06CC\u0631\u06CC\u062A \u0644\u0627\u0632\u0645 \u0627\u0633\u062A.", auth.requestId),
    user: auth.user,
    isAdmin: false
  };
}
__name(requireAdmin, "requireAdmin");
async function requireUserAuth(request, env) {
  const requestId = request.headers.get("X-Request-Id") || "";
  const userToken = request.headers.get("X-User-Token");
  if (!userToken) {
    return { error: errorResponse(ErrorCodes.AUTH_REQUIRED, 401, "Authentication required", requestId), user: null };
  }
  try {
    const userKey = await deriveUserKey(userToken, env);
    return { error: null, user: { id: userKey, token: userToken }, requestId };
  } catch {
    return { error: errorResponse(ErrorCodes.AUTH_REQUIRED, 401, "Invalid or expired token", requestId), user: null };
  }
}
__name(requireUserAuth, "requireUserAuth");
var rateLimitMap = /* @__PURE__ */ new Map();
function checkRateLimit(key, max, windowMs) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max)
    return false;
  entry.count++;
  return true;
}
__name(checkRateLimit, "checkRateLimit");
function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
}
__name(getClientIp, "getClientIp");
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 1e5, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(derived)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:100000:${saltHex}:${hashHex}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string")
    return false;
  const parts = storedHash.split(":");
  if (parts.length !== 4 || parts[0] !== "pbkdf2")
    return false;
  const iterations = parseInt(parts[1], 10);
  const salt = new Uint8Array(parts[2].match(/.{2}/g).map((b) => parseInt(b, 16)));
  const expectedHash = parts[3];
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  const actualHash = Array.from(new Uint8Array(derived)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return actualHash === expectedHash;
}
__name(verifyPassword, "verifyPassword");
function generateOtp() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const num = (bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3]) >>> 0;
  return String(num % 1e6).padStart(6, "0");
}
__name(generateOtp, "generateOtp");
function generateResetToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(generateResetToken, "generateResetToken");

// routes/api.js
init_errors();
function generateApiKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return "homa_" + hex;
}
__name(generateApiKey, "generateApiKey");
async function hashApiKey(plaintext) {
  const data = new TextEncoder().encode(plaintext);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashApiKey, "hashApiKey");
async function handleApiRoutes(request, env, url, user) {
  const path = url.pathname;
  const method = request.method;
  if (path === "/api/keys" && method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    if (!env.DB)
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
    const plaintext = generateApiKey();
    const keyHash = await hashApiKey(plaintext);
    const prefix = plaintext.slice(0, 12) + "...";
    const id = "apikey_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
    try {
      await env.DB.prepare(
        "INSERT INTO api_keys (id, user_id, key_hash, key_prefix, label, active) VALUES (?, ?, ?, ?, ?, 1)"
      ).bind(id, user.id, keyHash, prefix, body.label || "").run();
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
    return successResponse({ id, key: plaintext, prefix, label: body.label || "" });
  }
  if (path === "/api/keys" && method === "GET") {
    if (!env.DB)
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
    try {
      const { results } = await env.DB.prepare(
        "SELECT id, key_prefix, label, active, created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC"
      ).bind(user.id).all();
      return successResponse({ keys: results || [] });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  const keyMatch = path.match(/^\/api\/keys\/([^/]+)$/);
  if (keyMatch && method === "DELETE") {
    if (!env.DB)
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
    const keyId = decodeURIComponent(keyMatch[1]);
    try {
      const result = await env.DB.prepare("DELETE FROM api_keys WHERE id = ? AND user_id = ?").bind(keyId, user.id).run();
      if (result.meta.changes === 0)
        return errorResponse(ErrorCodes.NOT_FOUND);
      return successResponse({ revoked: true });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  if (path === "/api/credits" && method === "GET") {
    if (!env.DB)
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
    try {
      let row = await env.DB.prepare("SELECT balance FROM api_credits WHERE user_id = ?").bind(user.id).first();
      if (!row) {
        const id = "ac_" + user.id.slice(0, 12);
        await env.DB.prepare("INSERT INTO api_credits (id, user_id, balance) VALUES (?, ?, 100)").bind(id, user.id).run();
        row = { balance: 100 };
      }
      return successResponse({ balance: row.balance });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  if (path === "/api/usage" && method === "GET") {
    if (!env.DB)
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
    const limit = Math.min(parseInt(url.searchParams.get("limit")) || 50, 200);
    try {
      const { results } = await env.DB.prepare(
        "SELECT * FROM api_usage WHERE owner_id = ? ORDER BY created_at DESC LIMIT ?"
      ).bind(user.id, limit).all();
      return successResponse({ usage: results || [] });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  if (path === "/api/health" && method === "GET") {
    const { router: router2 } = await Promise.resolve().then(() => (init_router(), router_exports));
    const capabilities = ["chat", "reasoning", "coding", "vision", "image", "stt", "tts", "file_analysis", "web_search", "deep_research"];
    const health = {};
    for (const cap of capabilities)
      health[cap] = router2.isAvailable(cap, env);
    return successResponse({ status: "ok", database: !!env.DB, storage: !!env.STORAGE, email: !!env.RESEND_API_KEY, payments: !!env.ZARINPAL_MERCHANT_ID, capabilities: health });
  }
  return errorResponse(ErrorCodes.NOT_FOUND);
}
__name(handleApiRoutes, "handleApiRoutes");

// routes/admin.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_errors();
async function handleAdminRoutes(request, env, url) {
  const auth = await requireAdmin(request, env);
  if (auth.error)
    return auth.error;
  if (!auth.isAdmin)
    return errorResponse(ErrorCodes.FORBIDDEN);
  const path = url.pathname;
  const method = request.method;
  if (!env.DB)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
  if (path === "/admin/dashboard" && method === "GET") {
    try {
      const userCount = await env.DB.prepare("SELECT COUNT(*) as c FROM users").first();
      const orderCount = await env.DB.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'paid'").first();
      const ticketCount = await env.DB.prepare("SELECT COUNT(*) as c FROM support_tickets WHERE status = 'open'").first();
      const totalCredits = await env.DB.prepare("SELECT SUM(credits) as c FROM usage").first();
      const totalRevenue = await env.DB.prepare("SELECT SUM(amount) as c FROM orders WHERE status = 'paid'").first();
      return successResponse({ users: userCount?.c || 0, paid_orders: orderCount?.c || 0, open_tickets: ticketCount?.c || 0, total_credits: totalCredits?.c || 0, total_revenue: totalRevenue?.c || 0 });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  if (path === "/admin/users" && method === "GET") {
    try {
      const { results } = await env.DB.prepare("SELECT id, email, full_name, role, created_at FROM users ORDER BY created_at DESC LIMIT 200").all();
      return successResponse({ users: results || [] });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  const userMatch = path.match(/^\/admin\/users\/([^/]+)$/);
  if (userMatch && method === "PATCH") {
    const userId = decodeURIComponent(userMatch[1]);
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    const allowedFields = ["role", "display_name", "onboarding_completed", "default_model", "memory"];
    const updates = {};
    for (const f of allowedFields) {
      if (body[f] !== void 0)
        updates[f] = body[f];
    }
    const cols = Object.keys(updates);
    if (cols.length === 0)
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u0647\u06CC\u0686 \u0641\u06CC\u0644\u062F \u0645\u0639\u062A\u0628\u0631\u06CC \u0628\u0631\u0627\u06CC \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.");
    const sets = cols.map((c) => `${c} = ?`).join(", ");
    const vals = cols.map((c) => updates[c]);
    try {
      await env.DB.prepare(`UPDATE users SET ${sets}, updated_at = ? WHERE id = ?`).bind(...vals, (/* @__PURE__ */ new Date()).toISOString(), userId).run();
      return successResponse({ updated: true });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  if (path === "/admin/orders" && method === "GET") {
    try {
      const { results } = await env.DB.prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 200").all();
      return successResponse({ orders: results || [] });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  if (path === "/admin/tickets" && method === "GET") {
    try {
      const { results } = await env.DB.prepare("SELECT * FROM support_tickets ORDER BY created_at DESC LIMIT 200").all();
      return successResponse({ tickets: results || [] });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  const ticketMatch = path.match(/^\/admin\/tickets\/([^/]+)$/);
  if (ticketMatch && method === "PATCH") {
    const ticketId = decodeURIComponent(ticketMatch[1]);
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    const allowedFields = ["status", "priority"];
    const updates = {};
    for (const f of allowedFields) {
      if (body[f] !== void 0)
        updates[f] = body[f];
    }
    const cols = Object.keys(updates);
    if (cols.length === 0)
      return errorResponse(ErrorCodes.INVALID_INPUT);
    const sets = cols.map((c) => `${c} = ?`).join(", ");
    const vals = cols.map((c) => updates[c]);
    try {
      await env.DB.prepare(`UPDATE support_tickets SET ${sets}, updated_at = ? WHERE id = ?`).bind(...vals, (/* @__PURE__ */ new Date()).toISOString(), ticketId).run();
      return successResponse({ updated: true });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  if (path === "/admin/provider-health" && method === "GET") {
    const { router: router2 } = await Promise.resolve().then(() => (init_router(), router_exports));
    const capabilities = ["chat", "reasoning", "coding", "vision", "image", "image_edit", "video", "stt", "tts", "file_analysis", "web_search", "deep_research"];
    const health = {};
    for (const cap of capabilities)
      health[cap] = { available: router2.isAvailable(cap, env), providers: router2.getProviders(cap, env) };
    return successResponse(health);
  }
  if (path === "/admin/credits/transactions" && method === "GET") {
    try {
      const { results } = await env.DB.prepare("SELECT * FROM credit_transactions ORDER BY created_at DESC LIMIT 200").all();
      return successResponse({ transactions: results || [] });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  return errorResponse(ErrorCodes.NOT_FOUND);
}
__name(handleAdminRoutes, "handleAdminRoutes");

// routes/support.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_errors();

// lib/email.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_errors();
var RESEND_API = "https://api.resend.com/emails";
async function resendSend(env, { to, subject, html, from_name }) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey)
    return { error: ErrorCodes.NO_EMAIL_PROVIDER };
  const from = env.MAIL_FROM || "Homa AI <noreply@homa.ai>";
  const senderName = from_name ? `Homa AI <${from_name}>` : from;
  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ from: senderName, to: [to], subject, html: html || subject })
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { error: "EMAIL_SEND_FAILED", status: res.status, detail: errText };
    }
    const data = await res.json().catch(() => ({}));
    return { ok: true, id: data.id || "" };
  } catch (e) {
    return { error: "EMAIL_NETWORK_ERROR", message: e.message };
  }
}
__name(resendSend, "resendSend");
function verificationTemplate(code) {
  return `<div dir="rtl" style="font-family: Vazirmatn, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;"><h2 style="color: #1e2538;">\u0647\u064F\u0645\u0627 AI \u2014 \u062A\u0623\u06CC\u06CC\u062F \u0627\u06CC\u0645\u06CC\u0644</h2><p>\u06A9\u062F \u062A\u0623\u06CC\u06CC\u062F \u0634\u0645\u0627:</p><div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; padding: 16px; background: #f0f4ff; border-radius: 12px; text-align: center; margin: 16px 0;">${code}</div><p style="color: #666; font-size: 14px;">\u0627\u06CC\u0646 \u06A9\u062F \u062A\u0627 \u06F1\u06F0 \u062F\u0642\u06CC\u0642\u0647 \u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.</p></div>`;
}
__name(verificationTemplate, "verificationTemplate");
function passwordResetTemplate(link) {
  return `<div dir="rtl" style="font-family: Vazirmatn, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;"><h2 style="color: #1e2538;">\u0647\u064F\u0645\u0627 AI \u2014 \u0628\u0627\u0632\u0646\u0634\u0627\u0646\u06CC \u0631\u0645\u0632 \u0639\u0628\u0648\u0631</h2><p>\u0628\u0631\u0627\u06CC \u0628\u0627\u0632\u0646\u0634\u0627\u0646\u06CC \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0631\u0648\u06CC \u0644\u06CC\u0646\u06A9 \u0632\u06CC\u0631 \u06A9\u0644\u06CC\u06A9 \u06A9\u0646\u06CC\u062F:</p><a href="${link}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">\u0628\u0627\u0632\u0646\u0634\u0627\u0646\u06CC \u0631\u0645\u0632 \u0639\u0628\u0648\u0631</a></div>`;
}
__name(passwordResetTemplate, "passwordResetTemplate");
function receiptTemplate(order) {
  return `<div dir="rtl" style="font-family: Vazirmatn, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;"><h2 style="color: #1e2538;">\u0647\u064F\u0645\u0627 AI \u2014 \u0631\u0633\u06CC\u062F \u067E\u0631\u062F\u0627\u062E\u062A</h2><table style="width: 100%; border-collapse: collapse; margin: 16px 0;"><tr><td style="padding: 8px; border: 1px solid #eee;">\u0634\u0646\u0627\u0633\u0647 \u0633\u0641\u0627\u0631\u0634:</td><td style="padding: 8px; border: 1px solid #eee;">${order.id || ""}</td></tr><tr><td style="padding: 8px; border: 1px solid #eee;">\u0637\u0631\u062D:</td><td style="padding: 8px; border: 1px solid #eee;">${order.plan || ""}</td></tr><tr><td style="padding: 8px; border: 1px solid #eee;">\u0645\u0628\u0644\u063A:</td><td style="padding: 8px; border: 1px solid #eee;">${order.amount || 0} \u062A\u0648\u0645\u0627\u0646</td></tr><tr><td style="padding: 8px; border: 1px solid #eee;">\u0627\u0639\u062A\u0628\u0627\u0631:</td><td style="padding: 8px; border: 1px solid #eee;">${order.credits || 0}</td></tr></table></div>`;
}
__name(receiptTemplate, "receiptTemplate");
function supportNotificationTemplate(ticket) {
  return `<div dir="rtl" style="font-family: Vazirmatn, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;"><h2 style="color: #1e2538;">\u0647\u064F\u0645\u0627 AI \u2014 \u062A\u06CC\u06A9\u062A \u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC</h2><p><strong>\u0645\u0648\u0636\u0648\u0639:</strong> ${ticket.subject || ""}</p><p><strong>\u067E\u06CC\u0627\u0645:</strong></p><div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">${ticket.message || ""}</div></div>`;
}
__name(supportNotificationTemplate, "supportNotificationTemplate");
var email = {
  isAvailable(env) {
    return !!env.RESEND_API_KEY;
  },
  async send(env, opts) {
    return await resendSend(env, opts);
  },
  async sendVerification(env, { to, code }) {
    return await resendSend(env, { to, subject: "\u06A9\u062F \u062A\u0623\u06CC\u06CC\u062F \u0647\u064F\u0645\u0627 AI", html: verificationTemplate(code) });
  },
  async sendPasswordReset(env, { to, link }) {
    return await resendSend(env, { to, subject: "\u0628\u0627\u0632\u0646\u0634\u0627\u0646\u06CC \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u2014 \u0647\u064F\u0645\u0627 AI", html: passwordResetTemplate(link) });
  },
  async sendReceipt(env, { to, order }) {
    return await resendSend(env, { to, subject: "\u0631\u0633\u06CC\u062F \u067E\u0631\u062F\u0627\u062E\u062A \u2014 \u0647\u064F\u0645\u0627 AI", html: receiptTemplate(order) });
  },
  async sendSupportNotification(env, { to, ticket }) {
    return await resendSend(env, { to, subject: "\u062A\u06CC\u06A9\u062A \u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u062C\u062F\u06CC\u062F \u2014 \u0647\u064F\u0645\u0627 AI", html: supportNotificationTemplate(ticket) });
  }
};

// routes/support.js
async function handleSupportRoutes(request, env, url, user) {
  const path = url.pathname;
  const method = request.method;
  if (!env.DB)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
  if (path === "/support/tickets" && method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    if (!body.subject || !body.message)
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u0645\u0648\u0636\u0648\u0639 \u0648 \u067E\u06CC\u0627\u0645 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    const id = "ticket_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
    try {
      await env.DB.prepare(
        "INSERT INTO support_tickets (id, user_id, subject, message, user_email, user_name, status, priority, replies) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(id, user.id, body.subject, body.message, body.user_email || "", body.user_name || "", "open", body.priority || "normal", "[]").run();
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
    if (email.isAvailable(env)) {
      email.sendSupportNotification(env, { to: env.ADMIN_EMAIL || "support@homa.ai", ticket: { subject: body.subject, message: body.message, status: "open" } }).catch(() => {
      });
    }
    return successResponse({ id, status: "open" });
  }
  if (path === "/support/tickets" && method === "GET") {
    try {
      const { results } = await env.DB.prepare("SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC").bind(user.id).all();
      return successResponse({ tickets: results || [] });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  const ticketMatch = path.match(/^\/support\/tickets\/([^/]+)$/);
  if (ticketMatch && method === "GET") {
    const ticketId = decodeURIComponent(ticketMatch[1]);
    try {
      const ticket = await env.DB.prepare("SELECT * FROM support_tickets WHERE id = ? AND user_id = ?").bind(ticketId, user.id).first();
      if (!ticket)
        return errorResponse(ErrorCodes.NOT_FOUND);
      return successResponse(ticket);
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  const replyMatch = path.match(/^\/support\/tickets\/([^/]+)\/reply$/);
  if (replyMatch && method === "POST") {
    const ticketId = decodeURIComponent(replyMatch[1]);
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    if (!body.content)
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u0645\u062D\u062A\u0648\u0627\u06CC \u067E\u0627\u0633\u062E \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    try {
      const ticket = await env.DB.prepare("SELECT * FROM support_tickets WHERE id = ? AND user_id = ?").bind(ticketId, user.id).first();
      if (!ticket)
        return errorResponse(ErrorCodes.NOT_FOUND);
      const replies = JSON.parse(ticket.replies || "[]");
      replies.push({ content: body.content, by_admin: false, author_name: body.author_name || "", created_at: (/* @__PURE__ */ new Date()).toISOString() });
      await env.DB.prepare("UPDATE support_tickets SET replies = ?, status = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(replies), "open", (/* @__PURE__ */ new Date()).toISOString(), ticketId).run();
      return successResponse({ reply_added: true });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  if (ticketMatch && method === "PATCH") {
    const ticketId = decodeURIComponent(ticketMatch[1]);
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    const allowedFields = ["status", "priority"];
    const updates = {};
    for (const f of allowedFields) {
      if (body[f] !== void 0)
        updates[f] = body[f];
    }
    const cols = Object.keys(updates);
    if (cols.length === 0)
      return errorResponse(ErrorCodes.INVALID_INPUT);
    const sets = cols.map((c) => `${c} = ?`).join(", ");
    const vals = cols.map((c) => updates[c]);
    try {
      await env.DB.prepare(`UPDATE support_tickets SET ${sets}, updated_at = ? WHERE id = ? AND user_id = ?`).bind(...vals, (/* @__PURE__ */ new Date()).toISOString(), ticketId, user.id).run();
      return successResponse({ updated: true });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  const adminReplyMatch = path.match(/^\/support\/tickets\/([^/]+)\/admin-reply$/);
  if (adminReplyMatch && method === "POST") {
    const adminAuth = await requireAdmin(request, env);
    if (adminAuth.error)
      return adminAuth.error;
    if (!adminAuth.isAdmin)
      return errorResponse(ErrorCodes.FORBIDDEN);
    const ticketId = decodeURIComponent(adminReplyMatch[1]);
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    if (!body.content)
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u0645\u062D\u062A\u0648\u0627\u06CC \u067E\u0627\u0633\u062E \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    try {
      const ticket = await env.DB.prepare("SELECT * FROM support_tickets WHERE id = ?").bind(ticketId).first();
      if (!ticket)
        return errorResponse(ErrorCodes.NOT_FOUND);
      const replies = JSON.parse(ticket.replies || "[]");
      replies.push({ content: body.content, by_admin: true, author_name: body.author_name || "\u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u0647\u064F\u0645\u0627", created_at: (/* @__PURE__ */ new Date()).toISOString() });
      await env.DB.prepare("UPDATE support_tickets SET replies = ?, status = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(replies), body.status || "in_progress", (/* @__PURE__ */ new Date()).toISOString(), ticketId).run();
      if (email.isAvailable(env) && ticket.user_email) {
        email.send(env, { to: ticket.user_email, subject: "\u067E\u0627\u0633\u062E \u0628\u0647 \u062A\u06CC\u06A9\u062A \u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u2014 \u0647\u064F\u0645\u0627 AI", html: `<div dir="rtl" style="font-family: sans-serif; padding: 20px;"><h2>\u067E\u0627\u0633\u062E \u0628\u0647 \u062A\u06CC\u06A9\u062A \u0634\u0645\u0627</h2><p><strong>\u0645\u0648\u0636\u0648\u0639:</strong> ${ticket.subject}</p><div style="padding: 12px; background: #f5f5f5; border-radius: 8px;">${body.content}</div></div>` }).catch(() => {
        });
      }
      return successResponse({ reply_added: true });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  return errorResponse(ErrorCodes.NOT_FOUND);
}
__name(handleSupportRoutes, "handleSupportRoutes");

// routes/referral.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_errors();

// lib/credits.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_errors();
async function getOrCreateUsage(env, userId) {
  if (!env.DB)
    return null;
  try {
    let row = await env.DB.prepare("SELECT * FROM usage WHERE user_id = ?").bind(userId).first();
    if (!row) {
      const id = "usage_" + userId.slice(0, 12);
      await env.DB.prepare(
        "INSERT INTO usage (id, user_id, credits, plan) VALUES (?, ?, 30, ?)"
      ).bind(id, userId, "free").run();
      row = await env.DB.prepare("SELECT * FROM usage WHERE user_id = ?").bind(userId).first();
    }
    return row;
  } catch (e) {
    return null;
  }
}
__name(getOrCreateUsage, "getOrCreateUsage");
async function grantCredits(env, userId, amount, type, referenceId, capability) {
  if (!env.DB || amount <= 0)
    return { ok: false, error: "INVALID_AMOUNT" };
  const txnId = "txn_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  try {
    await getOrCreateUsage(env, userId);
    const result = await env.DB.prepare(
      "UPDATE usage SET credits = credits + ?, paid_total = paid_total + ?, updated_at = ? WHERE user_id = ?"
    ).bind(amount, amount, now, userId).run();
    if (result.meta.changes === 0)
      return { ok: false, error: "NO_USAGE_RECORD" };
    const usage = await env.DB.prepare("SELECT credits FROM usage WHERE user_id = ?").bind(userId).first();
    const balanceAfter = usage.credits;
    const balanceBefore = balanceAfter - amount;
    await env.DB.prepare(
      "INSERT INTO credit_transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, capability, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(txnId, userId, type || "grant", amount, balanceBefore, balanceAfter, referenceId || "", capability || "", "completed").run();
    return { ok: true, balance_before: balanceBefore, balance_after: balanceAfter, txn_id: txnId };
  } catch (e) {
    return { ok: false, error: "DB_ERROR", message: e.message };
  }
}
__name(grantCredits, "grantCredits");

// routes/referral.js
var REFERRAL_REWARD_CREDITS = 30;
function makeReferralCode(userId) {
  return "homa-" + userId.slice(0, 12);
}
__name(makeReferralCode, "makeReferralCode");
async function handleReferralRoutes(request, env, url, user) {
  const path = url.pathname;
  const method = request.method;
  if (!env.DB)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
  if (path === "/referrals/status" && method === "GET") {
    try {
      const { results: referrals } = await env.DB.prepare("SELECT * FROM referrals WHERE referrer_id = ? ORDER BY created_at DESC").bind(user.id).all();
      const totalReferred = referrals.length;
      const rewarded = referrals.filter((r) => r.status === "rewarded").length;
      const totalCredits = referrals.reduce((sum, r) => sum + (r.credits_awarded || 0), 0);
      return successResponse({ referral_code: makeReferralCode(user.id), total_referred: totalReferred, total_rewarded: rewarded, total_credits_earned: totalCredits, referrals: referrals || [] });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  if (path === "/referrals/process" && method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    const { referred_user_id, referred_email, referrer_code } = body;
    if (!referred_user_id || !referrer_code)
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u0634\u0646\u0627\u0633\u0647 \u06A9\u0627\u0631\u0628\u0631 \u0648 \u06A9\u062F \u0645\u0639\u0631\u0641 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    if (!referrer_code.startsWith("homa-"))
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u06A9\u062F \u0645\u0639\u0631\u0641 \u0646\u0627\u0645\u0639\u062A\u0628\u0631.");
    const referrerId = referrer_code.slice(5);
    try {
      const referrer = await env.DB.prepare("SELECT id FROM users WHERE substr(id, 1, 12) = ? LIMIT 1").bind(referrerId).first();
      if (!referrer)
        return errorResponse(ErrorCodes.NOT_FOUND, 404, "\u0645\u0639\u0631\u0641 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.");
      if (referrer.id === referred_user_id)
        return errorResponse(ErrorCodes.FORBIDDEN, 403, "\u0627\u0631\u062C\u0627\u0639 \u0628\u0647 \u062E\u0648\u062F \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.");
      const existing = await env.DB.prepare("SELECT id FROM referrals WHERE referrer_id = ? AND referred_user_id = ?").bind(referrer.id, referred_user_id).first();
      if (existing)
        return successResponse({ already_processed: true });
      const referralId = "ref_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
      await env.DB.prepare("INSERT INTO referrals (id, referrer_id, referred_user_id, referred_email, status, credits_awarded) VALUES (?, ?, ?, ?, ?, ?)").bind(referralId, referrer.id, referred_user_id, referred_email || "", "pending", 0).run();
      const grantResult = await grantCredits(env, referrer.id, REFERRAL_REWARD_CREDITS, "referral", referralId, "referral");
      if (grantResult.ok) {
        await env.DB.prepare("UPDATE referrals SET status = ?, credits_awarded = ? WHERE id = ?").bind("rewarded", REFERRAL_REWARD_CREDITS, referralId).run();
      }
      return successResponse({ referral_id: referralId, referrer_id: referrer.id, credits_awarded: grantResult.ok ? REFERRAL_REWARD_CREDITS : 0, status: grantResult.ok ? "rewarded" : "pending" });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  return errorResponse(ErrorCodes.NOT_FOUND);
}
__name(handleReferralRoutes, "handleReferralRoutes");

// routes/payments.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_errors();

// lib/payments.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_errors();
var ZARINPAL_API = "https://api.zarinpal.com/pg/v4/payment/request.json";
var ZARINPAL_VERIFY = "https://api.zarinpal.com/pg/v4/payment/verify.json";
var ZARINPAL_REDIRECT = "https://www.zarinpal.com/pg/StartPay/";
async function zarinpalCreate(env, { amount, description, callback_url }) {
  const merchantId = env.ZARINPAL_MERCHANT_ID;
  if (!merchantId)
    return { error: ErrorCodes.NO_PAYMENT_PROVIDER };
  try {
    const res = await fetch(ZARINPAL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant_id: merchantId, amount, description: description || "Homa AI Credits", callback_url })
    });
    const data = await res.json();
    const authority = data?.data?.authority;
    if (!authority)
      return { error: ErrorCodes.PAYMENT_FAILED, detail: data?.errors?.message || "No authority" };
    return { authority, redirect_url: ZARINPAL_REDIRECT + authority };
  } catch (e) {
    return { error: ErrorCodes.PAYMENT_FAILED, message: e.message };
  }
}
__name(zarinpalCreate, "zarinpalCreate");
async function zarinpalVerify(env, { authority, amount }) {
  const merchantId = env.ZARINPAL_MERCHANT_ID;
  if (!merchantId)
    return { error: ErrorCodes.NO_PAYMENT_PROVIDER };
  try {
    const res = await fetch(ZARINPAL_VERIFY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant_id: merchantId, amount, authority })
    });
    const data = await res.json();
    const refId = data?.data?.ref_id;
    const code = data?.data?.code;
    if (code === 100 || code === 101)
      return { ok: true, ref_id: String(refId || code) };
    return { error: ErrorCodes.PAYMENT_FAILED, code, detail: data?.errors?.message || "Verification failed" };
  } catch (e) {
    return { error: ErrorCodes.PAYMENT_FAILED, message: e.message };
  }
}
__name(zarinpalVerify, "zarinpalVerify");
var payments = {
  isAvailable(env) {
    return !!env.ZARINPAL_MERCHANT_ID;
  },
  async createPayment(env, opts) {
    return await zarinpalCreate(env, opts);
  },
  async verifyPayment(env, opts) {
    return await zarinpalVerify(env, opts);
  },
  async createOrder(env, { userId, amount, plan, credits, authority, description }) {
    if (!env.DB)
      return { error: "NO_DB" };
    const id = "order_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
    try {
      await env.DB.prepare(
        "INSERT INTO orders (id, user_id, amount, plan, credits, status, authority, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(id, userId, amount, plan, credits, "pending", authority || "", description || "").run();
      return { id };
    } catch (e) {
      return { error: "DB_ERROR", message: e.message };
    }
  },
  // Idempotent: credits_added flag prevents double-grant on callback replay
  async completeOrder(env, orderId, refId) {
    if (!env.DB)
      return { error: "NO_DB" };
    try {
      const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
      if (!order)
        return { error: "ORDER_NOT_FOUND" };
      if (order.status === "paid")
        return { ok: true, already_paid: true, order };
      const usage = await env.DB.prepare("SELECT credits FROM usage WHERE user_id = ?").bind(order.user_id).first();
      if (!usage)
        return { error: "NO_USAGE_RECORD" };
      const balanceBefore = usage.credits;
      const balanceAfter = balanceBefore + order.credits;
      const txnId = "txn_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
      await env.DB.batch([
        env.DB.prepare("UPDATE orders SET status = ?, ref_id = ?, credits_added = 1, updated_at = ? WHERE id = ?").bind("paid", refId, 1, (/* @__PURE__ */ new Date()).toISOString(), orderId),
        env.DB.prepare("UPDATE usage SET credits = credits + ?, paid_total = paid_total + ?, updated_at = ? WHERE user_id = ?").bind(order.credits, order.credits, (/* @__PURE__ */ new Date()).toISOString(), order.user_id),
        env.DB.prepare(
          "INSERT INTO credit_transactions (id, user_id, type, amount, balance_before, balance_after, reference_id, capability, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(txnId, order.user_id, "purchase", order.credits, balanceBefore, balanceAfter, orderId, "", "completed")
      ]);
      return { ok: true, order_id: orderId, balance_after: balanceAfter };
    } catch (e) {
      return { error: "DB_ERROR", message: e.message };
    }
  }
};

// routes/payments.js
async function handlePaymentRoutes(request, env, url, user) {
  const path = url.pathname;
  const method = request.method;
  if (!env.DB)
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
  if (path === "/payments/create" && method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    const { amount, plan, credits, description } = body;
    if (!amount || !plan || !credits)
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u0645\u0628\u0644\u063A\u060C \u0637\u0631\u062D \u0648 \u0627\u0639\u062A\u0628\u0627\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    if (!payments.isAvailable(env))
      return errorResponse(ErrorCodes.NO_PAYMENT_PROVIDER);
    const orderResult = await payments.createOrder(env, { userId: user.id, amount, plan, credits, description: description || "" });
    if (orderResult.error)
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, orderResult.error);
    const callbackUrl = (env.WORKER_URL || url.origin) + "/payments/zarinpal/callback?order_id=" + orderResult.id;
    const payResult = await payments.createPayment(env, { amount, description: description || "Homa AI - " + plan, callback_url: callbackUrl });
    if (payResult.error)
      return errorResponse(payResult.error, void 0, payResult.detail || payResult.message);
    try {
      await env.DB.prepare("UPDATE orders SET authority = ? WHERE id = ?").bind(payResult.authority, orderResult.id).run();
    } catch {
    }
    return successResponse({ order_id: orderResult.id, redirect_url: payResult.redirect_url, authority: payResult.authority });
  }
  if (path === "/payments/zarinpal/callback" && method === "GET") {
    const authority = url.searchParams.get("Authority") || url.searchParams.get("authority");
    const status = url.searchParams.get("Status") || url.searchParams.get("status");
    const orderId = url.searchParams.get("order_id");
    if (!authority || !orderId)
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u067E\u0627\u0631\u0627\u0645\u062A\u0631\u0647\u0627\u06CC callback \u0646\u0627\u0645\u0639\u062A\u0628\u0631.");
    if (status !== "OK" && status !== "ok") {
      try {
        await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind("cancelled", orderId).run();
      } catch {
      }
      return errorResponse(ErrorCodes.PAYMENT_FAILED, 400, "\u067E\u0631\u062F\u0627\u062E\u062A \u062A\u0648\u0633\u0637 \u06A9\u0627\u0631\u0628\u0631 \u0644\u063A\u0648 \u0634\u062F.");
    }
    try {
      const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
      if (!order)
        return errorResponse(ErrorCodes.NOT_FOUND, 404, "\u0633\u0641\u0627\u0631\u0634 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.");
      const verifyResult = await payments.verifyPayment(env, { authority, amount: order.amount });
      if (verifyResult.error) {
        await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind("failed", orderId).run();
        return errorResponse(ErrorCodes.PAYMENT_FAILED, void 0, verifyResult.detail || verifyResult.message);
      }
      const completeResult = await payments.completeOrder(env, orderId, verifyResult.ref_id);
      if (completeResult.error)
        return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, completeResult.error);
      const appUrl = env.APP_URL || "https://homa.ai";
      return Response.redirect(appUrl + "/credits?paid=" + orderId, 302);
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  const statusMatch = path.match(/^\/payments\/status\/([^/]+)$/);
  if (statusMatch && method === "GET") {
    const orderId = decodeURIComponent(statusMatch[1]);
    try {
      const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?").bind(orderId, user.id).first();
      if (!order)
        return errorResponse(ErrorCodes.NOT_FOUND);
      return successResponse({ order_id: order.id, status: order.status, amount: order.amount, plan: order.plan, credits: order.credits, ref_id: order.ref_id, credits_added: order.credits_added });
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
  }
  return errorResponse(ErrorCodes.NOT_FOUND);
}
__name(handlePaymentRoutes, "handlePaymentRoutes");

// routes/auth.js
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
init_errors();
async function sendOtpEmail(env, email2, otpCode) {
  if (!env.RESEND_API_KEY)
    return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Homa AI <noreply@resend.dev>",
        to: email2,
        subject: "\u06A9\u062F \u062A\u0623\u06CC\u06CC\u062F \u0647\u064F\u0645\u0627",
        html: `<div style="font-family:Vazirmatn,sans-serif;direction:rtl;text-align:center;padding:32px"><h2>\u0647\u064F\u0645\u0627</h2><p style="font-size:18px">\u06A9\u062F \u062A\u0623\u06CC\u06CC\u062F \u0634\u0645\u0627:</p><p style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#217 91% 60%">${otpCode}</p><p style="color:#666">\u0627\u06CC\u0646 \u06A9\u062F \u062A\u0627 \u06F1\u06F0 \u062F\u0642\u06CC\u0642\u0647 \u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.</p></div>`
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}
__name(sendOtpEmail, "sendOtpEmail");
async function sendResetEmail(env, email2, resetToken) {
  if (!env.RESEND_API_KEY)
    return false;
  try {
    const resetUrl = `${env.APP_BASE_URL || "https://capable-aria-chat-flow.base44.app"}/reset-password?token=${resetToken}`;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.RESEND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Homa AI <noreply@resend.dev>",
        to: email2,
        subject: "\u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0647\u064F\u0645\u0627",
        html: `<div style="font-family:Vazirmatn,sans-serif;direction:rtl;text-align:center;padding:32px"><h2>\u0647\u064F\u0645\u0627</h2><p>\u0628\u0631\u0627\u06CC \u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0631\u0648\u06CC \u0644\u06CC\u0646\u06A9 \u0632\u06CC\u0631 \u06A9\u0644\u06CC\u06A9 \u06A9\u0646\u06CC\u062F:</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 32px;background:#2389f5;color:#fff;border-radius:24px;text-decoration:none">\u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0631\u0645\u0632 \u0639\u0628\u0648\u0631</a></p><p style="color:#666">\u0627\u06CC\u0646 \u0644\u06CC\u0646\u06A9 \u062A\u0627 \u06F1 \u0633\u0627\u0639\u062A \u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.</p></div>`
      })
    });
    return res.ok;
  } catch {
    return false;
  }
}
__name(sendResetEmail, "sendResetEmail");
function genUserId() {
  return "usr_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}
__name(genUserId, "genUserId");
async function getUserByEmail(env, email2) {
  if (!env.DB)
    return null;
  try {
    return await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email2).first();
  } catch {
    return null;
  }
}
__name(getUserByEmail, "getUserByEmail");
async function getUserById(env, userId) {
  if (!env.DB)
    return null;
  try {
    return await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  } catch {
    return null;
  }
}
__name(getUserById, "getUserById");
function sanitizeUser(row) {
  if (!row)
    return null;
  const { password_hash, otp_code, otp_expires_at, reset_token, reset_expires_at, ...publicFields } = row;
  return publicFields;
}
__name(sanitizeUser, "sanitizeUser");
async function handleAuthRoutes(request, env, url) {
  const path = url.pathname;
  const method = request.method;
  if (path === "/auth/register" && method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    const email2 = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    if (!email2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email2))
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u0627\u06CC\u0645\u06CC\u0644 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A");
    if (password.length < 6)
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u062D\u062F\u0627\u0642\u0644 \u06F6 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631");
    const ip = getClientIp(request);
    if (!checkRateLimit("register:" + ip, 5, 10 * 60 * 1e3)) {
      return errorResponse("RATE_LIMITED", 429, "\u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u0632\u06CC\u0627\u062F. \u0628\u0639\u062F\u0627\u064B \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F");
    }
    if (!env.DB)
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
    const existing = await getUserByEmail(env, email2);
    if (existing)
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u0627\u06CC\u0646 \u0627\u06CC\u0645\u06CC\u0644 \u0642\u0628\u0644\u0627\u064B \u062B\u0628\u062A \u0634\u062F\u0647");
    const userId = genUserId();
    const passwordHash = await hashPassword(password);
    const otpCode = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1e3).toISOString();
    try {
      await env.DB.prepare(
        "INSERT INTO users (id, email, role, password_hash, otp_code, otp_expires_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(userId, email2, "user", passwordHash, otpCode, otpExpiry).run();
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
    const emailSent = await sendOtpEmail(env, email2, otpCode);
    return successResponse({
      otp_sent: true,
      ...emailSent ? {} : { dev_otp: otpCode, dev_note: "Email not configured \u2014 OTP returned in response" }
    });
  }
  if (path === "/auth/verify-otp" && method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    const email2 = (body.email || "").trim().toLowerCase();
    const otpCode = (body.otp_code || "").trim();
    const ip = getClientIp(request);
    if (!checkRateLimit("otp:" + ip + ":" + email2, 10, 10 * 60 * 1e3)) {
      return errorResponse("RATE_LIMITED", 429, "\u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u0632\u06CC\u0627\u062F. \u0628\u0639\u062F\u0627\u064B \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F");
    }
    if (!env.DB)
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
    const user = await getUserByEmail(env, email2);
    if (!user)
      return errorResponse(ErrorCodes.NOT_FOUND, 404, "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F");
    if (!user.otp_code || user.otp_code !== otpCode)
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u06A9\u062F \u062A\u0623\u06CC\u06CC\u062F \u0627\u0634\u062A\u0628\u0627\u0647");
    if (user.otp_expires_at && new Date(user.otp_expires_at) < /* @__PURE__ */ new Date())
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u06A9\u062F \u062A\u0623\u06CC\u06CC\u062F \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647");
    try {
      await env.DB.prepare("UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?").bind("", "", user.id).run();
    } catch {
    }
    const token = await issueHomaToken(user.id, env);
    return successResponse({ access_token: token, user: sanitizeUser(user) });
  }
  if (path === "/auth/login" && method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    const email2 = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const ip = getClientIp(request);
    if (!checkRateLimit("login:" + ip, 10, 10 * 60 * 1e3)) {
      return errorResponse("RATE_LIMITED", 429, "\u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u0632\u06CC\u0627\u062F. \u0628\u0639\u062F\u0627\u064B \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F");
    }
    if (!env.DB)
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
    const user = await getUserByEmail(env, email2);
    if (!user)
      return errorResponse(ErrorCodes.INVALID_INPUT, 401, "\u0627\u06CC\u0645\u06CC\u0644 \u06CC\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0634\u062A\u0628\u0627\u0647");
    if (!user.password_hash)
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u0644\u0637\u0641\u0627\u064B \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0631\u0627 \u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u06A9\u0646\u06CC\u062F (\u062D\u0633\u0627\u0628 Base44 \u0642\u062F\u06CC\u0645\u06CC)");
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid)
      return errorResponse(ErrorCodes.INVALID_INPUT, 401, "\u0627\u06CC\u0645\u06CC\u0644 \u06CC\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0627\u0634\u062A\u0628\u0627\u0647");
    const token = await issueHomaToken(user.id, env);
    return successResponse({ access_token: token, user: sanitizeUser(user) });
  }
  if (path === "/auth/resend-otp" && method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    const email2 = (body.email || "").trim().toLowerCase();
    const ip = getClientIp(request);
    if (!checkRateLimit("resend:" + ip + ":" + email2, 3, 10 * 60 * 1e3)) {
      return errorResponse("RATE_LIMITED", 429, "\u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u0632\u06CC\u0627\u062F. \u0628\u0639\u062F\u0627\u064B \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F");
    }
    if (!env.DB)
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
    const user = await getUserByEmail(env, email2);
    if (!user)
      return successResponse({ otp_sent: true });
    const otpCode = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1e3).toISOString();
    try {
      await env.DB.prepare("UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?").bind(otpCode, otpExpiry, user.id).run();
    } catch {
    }
    const emailSent = await sendOtpEmail(env, email2, otpCode);
    return successResponse({ otp_sent: true, ...emailSent ? {} : { dev_otp: otpCode } });
  }
  if (path === "/auth/me" && method === "GET") {
    const userToken = request.headers.get("X-User-Token");
    if (!userToken)
      return errorResponse(ErrorCodes.AUTH_REQUIRED, 401, "Token required");
    const verified = await verifyHomaToken(userToken, env);
    if (!verified)
      return errorResponse(ErrorCodes.AUTH_REQUIRED, 401, "Invalid or expired token");
    if (!env.DB)
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
    const user = await getUserById(env, verified.userId);
    if (!user)
      return errorResponse(ErrorCodes.NOT_FOUND, 404, "User not found");
    return successResponse({ user: sanitizeUser(user) });
  }
  if (path === "/auth/profile" && method === "PATCH") {
    const userToken = request.headers.get("X-User-Token");
    if (!userToken)
      return errorResponse(ErrorCodes.AUTH_REQUIRED, 401, "Token required");
    const verified = await verifyHomaToken(userToken, env);
    if (!verified)
      return errorResponse(ErrorCodes.AUTH_REQUIRED, 401, "Invalid or expired token");
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    const allowedFields = ["full_name", "memory", "default_model", "onboarding_completed", "referral_source"];
    const updates = {};
    for (const key of allowedFields) {
      if (body[key] !== void 0)
        updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0)
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "No updatable fields");
    if (!env.DB)
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
    const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
    const binds = [...Object.values(updates), verified.userId];
    try {
      await env.DB.prepare(`UPDATE users SET ${setClauses}, updated_at = datetime('now') WHERE id = ?`).bind(...binds).run();
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
    const user = await getUserById(env, verified.userId);
    return successResponse({ user: sanitizeUser(user) });
  }
  if (path === "/auth/reset-request" && method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    const email2 = (body.email || "").trim().toLowerCase();
    const ip = getClientIp(request);
    if (!checkRateLimit("reset_req:" + ip + ":" + email2, 3, 60 * 60 * 1e3)) {
      return errorResponse("RATE_LIMITED", 429, "\u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u0632\u06CC\u0627\u062F. \u0628\u0639\u062F\u0627\u064B \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F");
    }
    if (!env.DB)
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
    const user = await getUserByEmail(env, email2);
    if (!user)
      return successResponse({ sent: true });
    const resetToken = generateResetToken();
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1e3).toISOString();
    try {
      await env.DB.prepare("UPDATE users SET reset_token = ?, reset_expires_at = ? WHERE id = ?").bind(resetToken, resetExpiry, user.id).run();
    } catch {
    }
    await sendResetEmail(env, email2, resetToken);
    return successResponse({ sent: true });
  }
  if (path === "/auth/reset" && method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse(ErrorCodes.INVALID_INPUT);
    }
    const token = (body.token || "").trim();
    const newPassword = body.new_password || "";
    if (!token || newPassword.length < 6)
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u062D\u062F\u0627\u0642\u0644 \u06F6 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631");
    const ip = getClientIp(request);
    if (!checkRateLimit("reset:" + ip, 5, 60 * 60 * 1e3)) {
      return errorResponse("RATE_LIMITED", 429, "\u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u0632\u06CC\u0627\u062F. \u0628\u0639\u062F\u0627\u064B \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F");
    }
    if (!env.DB)
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database not configured");
    let user;
    try {
      user = await env.DB.prepare("SELECT * FROM users WHERE reset_token = ?").bind(token).first();
    } catch {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, "Database error");
    }
    if (!user)
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u0644\u06CC\u0646\u06A9 \u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631");
    if (user.reset_expires_at && new Date(user.reset_expires_at) < /* @__PURE__ */ new Date())
      return errorResponse(ErrorCodes.INVALID_INPUT, 400, "\u0644\u06CC\u0646\u06A9 \u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647");
    const passwordHash = await hashPassword(newPassword);
    try {
      await env.DB.prepare("UPDATE users SET password_hash = ?, reset_token = ?, reset_expires_at = ?, updated_at = datetime('now') WHERE id = ?").bind(passwordHash, "", "", user.id).run();
    } catch (e) {
      return errorResponse(ErrorCodes.INTERNAL_ERROR, 500, e.message);
    }
    return successResponse({ success: true });
  }
  return errorResponse(ErrorCodes.NOT_FOUND);
}
__name(handleAuthRoutes, "handleAuthRoutes");

// homa-ai-worker.js
var MODEL_ALLOWLIST = {
  auto: { openrouterId: null },
  minimax: { openrouterId: "minimax/minimax-m3:free" },
  ultra: { openrouterId: "nvidia/nemotron-3-ultra-550b-a55b:free" },
  super: { openrouterId: "nvidia/nemotron-3-super-120b-a12b:free" },
  lightning: { openrouterId: "nvidia/nemotron-3.5-lightning:free" },
  nano: { openrouterId: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free" },
  ling: { openrouterId: "inclusionai/ling-3.0-flash-fin:free" }
};
var GROQ_MODELS2 = ["llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant"];
var GROQ_VISION_MODELS2 = ["meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct"];
var OR_VISION_MODELS = ["minimax/minimax-m3:free", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"];
var MAX_TOKENS2 = 8192;
var TIMEOUT_MS2 = 2e4;
function pickAutoModel(messages) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text = (lastUser?.content || "").toLowerCase();
  if (text.length > 800 || /تحقیق|پژوهش|تحلیل عمیق|گزارش جامع|معماری|پروژه|research|deep|complex|architecture|project/.test(text))
    return "ultra";
  return "ling";
}
__name(pickAutoModel, "pickAutoModel");
function buildSystemPrompt(language, codeMode, codeAction, systemExtra) {
  const langInst = language === "en" ? "Respond in English." : language === "ku" ? "\u0628\u06D5 \u06A9\u0648\u0631\u062F\u06CC \u0648\u06D5\u06B5\u0627\u0645 \u0628\u062F\u06D5\u0648\u06D5." : "\u0628\u0647 \u0641\u0627\u0631\u0633\u06CC \u067E\u0627\u0633\u062E \u0628\u062F\u0647.";
  let codeInst = "";
  if (codeMode) {
    const actions = {
      build: "\u062D\u0627\u0644\u062A \u06A9\u062F\u0646\u0648\u06CC\u0633\u06CC \u2014 \u0633\u0627\u062E\u062A \u06A9\u062F. \u06A9\u062F \u06A9\u0627\u0645\u0644 \u0648 \u0642\u0627\u0628\u0644\u200C\u0627\u062C\u0631\u0627 \u0628\u0646\u0648\u06CC\u0633.",
      fix: "\u062D\u0627\u0644\u062A \u06A9\u062F\u0646\u0648\u06CC\u0633\u06CC \u2014 \u0631\u0641\u0639 \u0628\u0627\u06AF. \u062E\u0637\u0627 \u0631\u0627 \u067E\u06CC\u062F\u0627 \u06A9\u0646 \u0648 \u0631\u0627\u0647\u200C\u062D\u0644 \u0628\u062F\u0647.",
      explain: "\u062D\u0627\u0644\u062A \u06A9\u062F\u0646\u0648\u06CC\u0633\u06CC \u2014 \u062A\u0648\u0636\u06CC\u062D \u06A9\u062F. \u0633\u0627\u062F\u0647 \u0648 \u0642\u0627\u0628\u0644\u200C\u0641\u0647\u0645 \u062A\u0648\u0636\u06CC\u062D \u0628\u062F\u0647.",
      optimize: "\u062D\u0627\u0644\u062A \u06A9\u062F\u0646\u0648\u06CC\u0633\u06CC \u2014 \u0628\u0647\u06CC\u0646\u0647\u200C\u0633\u0627\u0632\u06CC. \u0633\u0631\u06CC\u0639\u200C\u062A\u0631 \u0648 \u0628\u0647\u06CC\u0646\u0647\u200C\u062A\u0631 \u06A9\u0646.",
      project: "\u062D\u0627\u0644\u062A \u06A9\u062F\u0646\u0648\u06CC\u0633\u06CC \u2014 \u0633\u0627\u062E\u062A \u067E\u0631\u0648\u0698\u0647. \u0633\u0627\u062E\u062A\u0627\u0631 \u06A9\u0627\u0645\u0644 \u067E\u0631\u0648\u0698\u0647."
    };
    codeInst = "\n\n" + (actions[codeAction] || actions.build);
  }
  const extra = systemExtra ? "\n\n" + systemExtra : "";
  return "\u062A\u0648 \xAB\u0647\u064F\u0645\u0627\xBB \u0647\u0633\u062A\u06CC\u060C \u062F\u0633\u062A\u06CC\u0627\u0631 \u0647\u0648\u0634\u0645\u0646\u062F \u0641\u0627\u0631\u0633\u06CC. \u0628\u0627 \u0645\u0627\u0631\u06A9\u200C\u062F\u0627\u0648\u0646 \u062E\u0648\u0627\u0646\u0627 \u067E\u0627\u0633\u062E \u0628\u062F\u0647. \u06A9\u062F HTML/CSS/JS \u0631\u0627 \u062F\u0631 \u0628\u0644\u0648\u06A9 ```html \u0628\u062F\u0647. \u0648\u0642\u062A\u06CC \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0632\u0645\u0627\u0646\u200C\u0628\u0631 \u0627\u0633\u062A\u060C \u062F\u0631 \u0627\u0646\u062A\u0647\u0627\u06CC \u067E\u0627\u0633\u062E \u0628\u0627 \u0644\u062D\u0646\u06CC \u062F\u0648\u0633\u062A\u0627\u0646\u0647 \u0627\u062A\u0645\u0627\u0645 \u06A9\u0627\u0631 \u0631\u0627 \u0627\u0639\u0644\u0627\u0645 \u06A9\u0646. " + langInst + codeInst + extra;
}
__name(buildSystemPrompt, "buildSystemPrompt");
function corsHeaders2() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Token"
  };
}
__name(corsHeaders2, "corsHeaders");
function jsonBody(data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders2() });
}
__name(jsonBody, "jsonBody");
async function callGroq(messages, env) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey)
    return { error: "no_api_key" };
  for (const model of GROQ_MODELS2) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS2);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: MAX_TOKENS2 }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.status === 429)
        continue;
      if (!res.ok)
        continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "";
      if (content)
        return { content, model: "groq" };
    } catch {
    }
  }
  return { error: "provider_failed" };
}
__name(callGroq, "callGroq");
async function callOpenRouter(modelKey, messages, env) {
  const entry = MODEL_ALLOWLIST[modelKey];
  if (!entry?.openrouterId)
    return { error: "invalid_model" };
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey)
    return { error: "no_api_key" };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS2);
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ model: entry.openrouterId, messages, temperature: 0.7, max_tokens: MAX_TOKENS2, reasoning: { enabled: false } }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (res.status === 429)
      return { error: "rate_limit" };
    if (!res.ok)
      return { error: "provider_failed" };
    const data = await res.json();
    const msg = data?.choices?.[0]?.message;
    const content = msg?.content || msg?.reasoning_content || "";
    if (content)
      return { content, model: modelKey };
    return { error: "provider_failed" };
  } catch {
    return { error: "provider_failed" };
  }
}
__name(callOpenRouter, "callOpenRouter");
async function callGroqVision(messages, env) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey)
    return { error: "no_api_key" };
  for (const model of GROQ_VISION_MODELS2) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS2);
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096 }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.status === 429)
        continue;
      if (!res.ok)
        continue;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "";
      if (content)
        return { content, model: "vision" };
    } catch {
    }
  }
  return { error: "provider_failed" };
}
__name(callGroqVision, "callGroqVision");
async function callOpenRouterVision(messages, env) {
  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey)
    return { error: "no_api_key" };
  for (const model of OR_VISION_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS2);
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 4096, reasoning: { enabled: false } }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (res.status === 429)
        continue;
      if (!res.ok)
        continue;
      const data = await res.json();
      const msg = data?.choices?.[0]?.message;
      const content = msg?.content || msg?.reasoning_content || "";
      if (content)
        return { content, model: "vision" };
    } catch {
    }
  }
  return { error: "provider_failed" };
}
__name(callOpenRouterVision, "callOpenRouterVision");
function stripHtml(s) {
  return s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}
__name(stripHtml, "stripHtml");
function siteOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "duckduckgo.com";
  }
}
__name(siteOf, "siteOf");
function faviconFor(url) {
  const d = siteOf(url);
  return d ? `https://www.google.com/s2/favicons?domain=${d}&sz=64` : "";
}
__name(faviconFor, "faviconFor");
function youtubeId(url) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
__name(youtubeId, "youtubeId");
async function ddgLite(query, max) {
  const r = await fetch(`https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`, { headers: { "User-Agent": "Mozilla/5.0 (HomaAI)" } });
  if (!r.ok)
    throw new Error("ddg_lite_" + r.status);
  const html = await r.text();
  const sources = [];
  const blocks = html.split('<a rel="nofollow"').slice(1);
  for (const block of blocks) {
    if (sources.length >= max)
      break;
    const urlMatch = block.match(/href="\/\/duckduckgo\.com\/l\/\?uddg=([^&"]+)/);
    if (!urlMatch)
      continue;
    let u;
    try {
      u = decodeURIComponent(urlMatch[1]);
    } catch {
      continue;
    }
    if (!u.startsWith("http"))
      continue;
    const titleMatch = block.match(/class='result-link'>(.*?)<\/a>/);
    const snippetMatch = block.match(/class='result-snippet'>([\s\S]*?)<\/td>/);
    const title = titleMatch ? stripHtml(titleMatch[1]) : siteOf(u);
    const description = snippetMatch ? stripHtml(snippetMatch[1]) : "";
    sources.push({ title: title.slice(0, 100), url: u, description, site: siteOf(u) });
  }
  return sources;
}
__name(ddgLite, "ddgLite");
async function ddgInstant(query, max) {
  const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&t=homa`);
  if (!r.ok)
    return [];
  let data;
  try {
    data = await r.json();
  } catch {
    return [];
  }
  const sources = [];
  if (data.AbstractText && data.AbstractURL)
    sources.push({ title: data.Heading || query, url: data.AbstractURL, description: data.AbstractText, site: siteOf(data.AbstractURL) });
  for (const t of data.RelatedTopics || []) {
    if (sources.length >= max)
      break;
    if (t.Text && t.FirstURL)
      sources.push({ title: t.Text.split(" - ")[0].slice(0, 80), url: t.FirstURL, description: t.Text, site: siteOf(t.FirstURL) });
    else if (t.Topics)
      for (const sub of t.Topics.slice(0, 2)) {
        if (sources.length >= max)
          break;
        if (sub.Text && sub.FirstURL)
          sources.push({ title: sub.Text.split(" - ")[0].slice(0, 80), url: sub.FirstURL, description: sub.Text, site: siteOf(sub.FirstURL) });
      }
  }
  return sources;
}
__name(ddgInstant, "ddgInstant");
async function duckDuckGoSearch(query, maxResults) {
  const max = maxResults || 6;
  let sources = [];
  try {
    sources = await ddgLite(query, max);
  } catch {
  }
  if (sources.length < 2) {
    try {
      sources = sources.concat(await ddgInstant(query, max));
    } catch {
    }
  }
  const seen = {};
  const out = [];
  for (const s of sources) {
    if (s.url && !seen[s.url]) {
      seen[s.url] = 1;
      out.push(s);
    }
    if (out.length >= max)
      break;
  }
  return out;
}
__name(duckDuckGoSearch, "duckDuckGoSearch");
async function groqCompleteSimple(system, userMsg, maxTokens, env) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey)
    throw new Error("no_groq_key");
  const models = ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
  const messages = [{ role: "system", content: system }, { role: "user", content: userMsg }];
  for (const mdl of models) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS2);
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ model: mdl, messages, temperature: 0.4, max_tokens: maxTokens || 1024 }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (r.status === 429 || r.status >= 500)
        continue;
      if (!r.ok)
        continue;
      const data = await r.json();
      const content = data?.choices?.[0]?.message?.content || "";
      if (content)
        return content;
    } catch {
    }
  }
  throw new Error("groq_failed");
}
__name(groqCompleteSimple, "groqCompleteSimple");
function langInstruction(language) {
  if (language === "en")
    return "Respond in English.";
  if (language === "ku")
    return "\u0628\u06D5 \u06A9\u0648\u0631\u062F\u06CC (\u0633\u06C6\u0631\u0627\u0646\u06CC) \u0648\u06D5\u06B5\u0627\u0645 \u0628\u062F\u06D5\u0648\u06D5.";
  return "\u0628\u0647 \u0641\u0627\u0631\u0633\u06CC \u067E\u0627\u0633\u062E \u0628\u062F\u0647.";
}
__name(langInstruction, "langInstruction");
function detectIntent(query) {
  const q = query.toLowerCase();
  if (/(ارزون|ارزان|قیمت|خرید|فروش|دیجی‌کالا|دیجی کالا|گوشی|لپ‌تاپ|product|shop|price|buy|cheapest|تخفیف)/.test(q))
    return "product";
  if (/(youtube|ویدیو|ویدئو|video|آموزش ویدیو)/.test(q))
    return "video";
  if (/(دانلود|download|برنامه|app|اپلیکیشن|نرم‌افزار|software|لینک رسمی)/.test(q))
    return "app";
  if (/(آموزش|tutorial|how to|چگونه)/.test(q))
    return "tutorial";
  if (/(مقایسه|compare|vs|بهتر از)/.test(q))
    return "compare";
  if (/(مقاله|article|news|اخبار|علمی)/.test(q))
    return "article";
  return "general";
}
__name(detectIntent, "detectIntent");
function queryForIntent(query, intent) {
  switch (intent) {
    case "product":
      return `${query} \u0642\u06CC\u0645\u062A \u062E\u0631\u06CC\u062F`;
    case "video":
      return `${query} site:youtube.com \u0622\u0645\u0648\u0632\u0634`;
    case "app":
      return `${query} official download`;
    case "tutorial":
      return `${query} \u0622\u0645\u0648\u0632\u0634 tutorial`;
    case "compare":
      return `${query} \u0645\u0642\u0627\u06CC\u0633\u0647 compare vs`;
    case "article":
      return `${query} \u0645\u0642\u0627\u0644\u0647 article`;
    default:
      return query;
  }
}
__name(queryForIntent, "queryForIntent");
async function handleWebSearch(body, env) {
  const input = (body.input || "").trim();
  if (!input)
    return jsonBody({ error: "input required" });
  const language = body.language || "fa";
  const intent = detectIntent(input);
  const searchQuery = queryForIntent(input, intent);
  let sources = [];
  try {
    sources = await duckDuckGoSearch(searchQuery, 8);
  } catch {
  }
  if (sources.length < 4) {
    try {
      sources = sources.concat(await duckDuckGoSearch(input, 4));
    } catch {
    }
  }
  const seen = {};
  const deduped = [];
  for (const s of sources) {
    if (s.url && !seen[s.url]) {
      seen[s.url] = 1;
      deduped.push(s);
    }
  }
  sources = deduped.slice(0, 8);
  const results = sources.map((s) => {
    const ytId = youtubeId(s.url);
    return {
      title: s.title,
      description: s.description,
      url: s.url,
      source_name: s.site,
      source_logo: faviconFor(s.url),
      image: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : "",
      type: ytId ? "video" : intent,
      price: "",
      rating: "",
      metadata: "",
      published_at: "",
      is_free: null,
      limitations: ""
    };
  });
  const context = sources.map((s, i) => `[${i + 1}] ${s.title} (${s.site}): ${s.description}
URL: ${s.url}`).join("\n");
  let summary = "";
  let enhancedResults = results;
  try {
    const system = `You are Homa, a smart search assistant. The user searched for: "${input}". Intent: ${intent}.
Analyze the search results and provide a helpful summary in Persian (or the user's language).
Also extract any structured data available from the descriptions (prices, ratings, free/paid status, limitations).
Return ONLY a JSON object:
{"summary": "your summary text", "results": [{"url": "...", "price": "...", "rating": "...", "is_free": true/false/null, "limitations": "...", "metadata": "..."}]}
Only include fields you can confidently extract from the data. Do NOT fabricate information. If you can't find a field, omit it.
${langInstruction(language)}`;
    const analysisText = await groqCompleteSimple(system, `Search results:
${context}`, 2048, env);
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.summary)
        summary = parsed.summary;
      if (parsed.results && Array.isArray(parsed.results)) {
        const analysisMap = {};
        for (const r of parsed.results) {
          if (r.url)
            analysisMap[r.url] = r;
        }
        enhancedResults = results.map((r) => {
          const extra = analysisMap[r.url];
          if (extra)
            return { ...r, price: extra.price || r.price, rating: extra.rating || r.rating, is_free: extra.is_free !== void 0 ? extra.is_free : r.is_free, limitations: extra.limitations || r.limitations, metadata: extra.metadata || r.metadata };
          return r;
        });
      }
    }
  } catch {
  }
  if (!summary) {
    try {
      summary = await groqCompleteSimple("You are Homa. Summarize the search results for the user in Persian. Be concise and helpful. " + langInstruction(language), `Query: ${input}

Results:
${context}`, 1024, env);
    } catch {
      summary = "\u0646\u062A\u0627\u06CC\u062C \u062C\u0633\u062A\u062C\u0648 \u06CC\u0627\u0641\u062A \u0634\u062F. \u0628\u0631\u0627\u06CC \u062C\u0632\u0626\u06CC\u0627\u062A \u0631\u0648\u06CC \u0647\u0631 \u06A9\u0627\u0631\u062A \u06A9\u0644\u06CC\u06A9 \u06A9\u0646\u06CC\u062F.";
    }
  }
  return jsonBody({ content: summary, sources: sources.map((s) => ({ title: s.title, url: s.url, description: s.description, site: s.site })), results: enhancedResults, intent });
}
__name(handleWebSearch, "handleWebSearch");
async function handleDeepResearch(body, env) {
  const input = (body.input || "").trim();
  if (!input)
    return jsonBody({ error: "input required" });
  const language = body.language || "fa";
  const subQueries = [input, `${input} overview`, `${input} analysis comparison`];
  let all = [];
  for (const sq of subQueries) {
    try {
      all = all.concat(await duckDuckGoSearch(sq, 4));
    } catch {
    }
  }
  const seen = {};
  const sources = [];
  for (const s of all) {
    if (s.url && !seen[s.url]) {
      seen[s.url] = 1;
      sources.push(s);
    }
    if (sources.length >= 10)
      break;
  }
  const context = sources.length ? sources.map((s, i) => `[${i + 1}] ${s.title} (${s.site}): ${s.description}`).join("\n") : "(no sources)";
  const system = "You are Homa, a deep research analyst. Produce a structured report with Markdown sections: \u062E\u0644\u0627\u0635\u0647 (Summary), \u06CC\u0627\u0641\u062A\u0647\u200C\u0647\u0627\u06CC \u0627\u0635\u0644\u06CC (Key Findings), \u062A\u062D\u0644\u06CC\u0644 (Analysis), \u0645\u0642\u0627\u06CC\u0633\u0647 (Comparison), \u0646\u062A\u06CC\u062C\u0647 (Conclusion). Use the sources and cite inline as [n]. " + langInstruction(language);
  let content;
  try {
    content = await groqCompleteSimple(system, `Research question: ${input}

Sources:
${context}`, 2048, env);
  } catch {
    content = "\u062A\u062D\u0642\u06CC\u0642 \u0639\u0645\u06CC\u0642 \u0645\u0648\u0642\u062A\u0627\u064B \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F.";
  }
  return jsonBody({ content, sources: sources.map((s) => ({ title: s.title, url: s.url, description: s.description, site: s.site })) });
}
__name(handleDeepResearch, "handleDeepResearch");
function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
__name(bytesToBase64, "bytesToBase64");
async function handleTTS(body, env) {
  const text = (body.text || "").toString();
  const voice = body.voice || "female";
  const speed = parseFloat(body.speed) || 1;
  const language = body.language || "fa";
  if (!text.trim())
    return jsonBody({ success: false, error: "empty_text" });
  if (text.length > 5e3)
    return jsonBody({ success: false, error: "text_too_long" });
  const piperUrl = env.PIPER_TTS_URL;
  const piperKey = env.PIPER_TTS_API_KEY;
  if (!piperUrl)
    return jsonBody({ success: false, error: "piper_not_configured" });
  const voiceMap = { female: "fa_IR-amir-medium", male: "fa_IR-amir-medium", en: "en_US-lessac-medium", ku: "fa_IR-amir-medium" };
  const piperVoice = voiceMap[language] || voiceMap.fa;
  const chunkSize = 250;
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize)
    chunks.push(text.slice(i, i + chunkSize));
  const audioUrls = [];
  for (const chunk of chunks) {
    try {
      const params = new URLSearchParams({ text: chunk, voice: piperVoice, speed: String(speed), format: "mp3" });
      const headers = { "Content-Type": "application/json" };
      if (piperKey)
        headers["Authorization"] = "Bearer " + piperKey;
      const r = await fetch(piperUrl + "/tts?" + params.toString(), { method: "GET", headers });
      if (!r.ok)
        continue;
      const audioBytes = new Uint8Array(await r.arrayBuffer());
      const dataUrl = `data:audio/mpeg;base64,${bytesToBase64(audioBytes)}`;
      audioUrls.push(dataUrl);
    } catch {
    }
  }
  if (audioUrls.length === 0)
    return jsonBody({ success: false, error: "piper_failed" });
  return jsonBody({ success: true, audio_urls: audioUrls, voice, format: "mp3" });
}
__name(handleTTS, "handleTTS");
var ANALYZE_PROMPTS = {
  website: 'You are Homa, a web analyst. Analyze the website using the web sources below. Cover content, structure, SEO, possible technologies (mark uncertain ones as "possible"), design, and performance indicators. Use well-formatted Markdown. Cite sources inline as [1], [2]. Be honest about what is uncertain.',
  instagram: "You are Homa, a social media analyst. Using ONLY publicly available information from the web sources, analyze the Instagram profile. Cover: Profile Summary, Content Categories, Posting Frequency, Engagement Notes (if available), Strengths, Weaknesses, Content Suggestions, Reel Ideas, Caption Ideas, Bio Suggestions, Content Calendar. Do NOT invent private data. Use Markdown. Cite sources inline as [n].",
  tiktok: "You are Homa, a social media analyst. Using ONLY publicly available information from the web sources, analyze the TikTok profile. Cover: Profile Summary, Content Categories, Posting Frequency, Engagement Notes (if available), Strengths, Weaknesses, Content Suggestions, Video Ideas, Caption & Hashtag Ideas, Bio Suggestions, Content Calendar, Trending Sounds. Do NOT invent private data. Use Markdown. Cite sources inline as [n].",
  facebook: "You are Homa, a social media analyst. Using ONLY publicly available information from the web sources, analyze the Facebook page/profile. Cover: Page Summary, Content Categories, Posting Frequency, Engagement Notes (if available), Strengths, Weaknesses, Content Suggestions, Post Ideas, Caption Ideas, About Section Suggestions, Content Calendar, Ad Strategy Tips. Do NOT invent private data. Use Markdown. Cite sources inline as [n]."
};
async function handleAnalyze(body, env) {
  const input = (body.input || "").trim();
  if (!input)
    return jsonBody({ error: "input required" });
  const language = body.language || "fa";
  const analyzeType = body.analyze_type || "website";
  const suffix = analyzeType === "instagram" ? " instagram" : analyzeType === "tiktok" ? " tiktok" : analyzeType === "facebook" ? " facebook page" : "";
  let sources = [];
  try {
    sources = await duckDuckGoSearch(input + suffix, 8);
  } catch {
  }
  const context = sources.length ? sources.map((s) => `- ${s.title} (${s.site}): ${s.description}`).join("\n") : "(no direct sources found)";
  const system = (ANALYZE_PROMPTS[analyzeType] || ANALYZE_PROMPTS.website) + " " + langInstruction(language);
  let content;
  try {
    content = await groqCompleteSimple(system, `Target: ${input}

Sources:
${context}`, 2048, env);
  } catch {
    content = "\u062A\u062D\u0644\u06CC\u0644 \u062F\u0631 \u062D\u0627\u0644 \u062D\u0627\u0636\u0631 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F.";
  }
  return jsonBody({ content, sources: sources.map((s) => ({ title: s.title, url: s.url, description: s.description, site: s.site })) });
}
__name(handleAnalyze, "handleAnalyze");
async function handleGeneratePrompt(body, env) {
  const description = (body.description || "").trim();
  const type = body.type || "image";
  const language = body.language || "fa";
  if (!description)
    return jsonBody({ error: "missing description" });
  const langName = language === "en" ? "English" : language === "ku" ? "Kurdish" : "Persian";
  const system = `You are a professional AI prompt engineer. The user wants to create a ${type} prompt. They described: "${description}".

Generate a professional, detailed prompt with these sections. Each section should be rich, specific, and professional. All values in ${langName}:
- subject: The main subject/scene (detailed description)
- environment: The setting/surroundings
- lighting: Lighting setup and mood
- camera: Camera angle, lens, shot type
- motion: For video: camera movement and subject motion. For image: leave empty
- style: Art style, quality modifiers, aesthetic
- negative: What to avoid (blurry, low quality, etc.)

Return ONLY a JSON object with these 7 string fields. No markdown, no explanation.`;
  try {
    const raw = await groqCompleteSimple(system, description, 2048, env);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const sections = JSON.parse(jsonMatch[0]);
      return jsonBody({ sections });
    }
    return jsonBody({ error: "parse_failed" });
  } catch {
    return jsonBody({ error: "provider_failed" });
  }
}
__name(handleGeneratePrompt, "handleGeneratePrompt");
async function handleUploadFile(body, env) {
  const base64 = body.base64 || "";
  const filename = body.filename || "file";
  const mimeType = body.mimeType || "application/octet-stream";
  if (!base64)
    return jsonBody({ error: "missing base64" }, 400);
  const cleanBase64 = base64.includes(",") ? base64.split(",").pop() : base64;
  const bytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const formData = new FormData();
  formData.append("file", blob, filename);
  try {
    const r = await fetch("https://0x0.st", { method: "POST", body: formData });
    if (r.ok) {
      const url = (await r.text()).trim();
      if (url.startsWith("http"))
        return jsonBody({ file_url: url });
    }
  } catch {
  }
  try {
    const formData2 = new FormData();
    formData2.append("file", blob, filename);
    const r2 = await fetch("https://tmpfiles.org/api/v1/upload", { method: "POST", body: formData2 });
    if (r2.ok) {
      const d = await r2.json();
      const url = d?.data?.url;
      if (url && url.startsWith("http"))
        return jsonBody({ file_url: url.replace("tmpfiles.org/", "tmpfiles.org/dl/") });
    }
  } catch {
  }
  return jsonBody({ error: "upload_failed" }, 502);
}
__name(handleUploadFile, "handleUploadFile");
async function handleFileAnalyze(body, env) {
  const text = body.text || "";
  const question = body.question || "";
  const language = body.language || "fa";
  if (!text.trim())
    return jsonBody({ error: "empty text" }, 400);
  const system = "You are Homa, a file analyst. Analyze the file content and answer the question about it. Use well-formatted Markdown. Be concise and accurate. " + langInstruction(language);
  try {
    const content = await groqCompleteSimple(system, `File content:
${text.slice(0, 8e3)}

Question: ${question || "\u062E\u0644\u0627\u0635\u0647 \u0648 \u062A\u062D\u0644\u06CC\u0644 \u0627\u06CC\u0646 \u0641\u0627\u06CC\u0644 \u0631\u0627 \u0627\u0631\u0627\u0626\u0647 \u0628\u062F\u0647."}`, 2048, env);
    return jsonBody({ content });
  } catch {
    return jsonBody({ error: "provider_failed" });
  }
}
__name(handleFileAnalyze, "handleFileAnalyze");
async function handleImageGenerate(body, env) {
  const prompt = (body.prompt || "").trim();
  if (!prompt)
    return jsonBody({ error: "prompt required" }, 400);
  const width = body.width || 1024;
  const height = body.height || 1024;
  const seed = body.seed || Math.floor(Math.random() * 1e6);
  const model = body.model || "flux";
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0, 500))}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;
  return jsonBody({ url, provider: "pollinations", model });
}
__name(handleImageGenerate, "handleImageGenerate");
async function handleImageEdit(body, env) {
  return jsonBody({ error: "no_provider", message: "Image editing provider not configured. Set REPLICATE_API_TOKEN to enable." });
}
__name(handleImageEdit, "handleImageEdit");
async function handleVideoGenerate(body, env) {
  return jsonBody({ error: "no_provider", message: "Video generation provider not configured." });
}
__name(handleVideoGenerate, "handleVideoGenerate");
async function handleSTT(body, env) {
  const audioUrl = (body.audio_url || "").trim();
  if (!audioUrl)
    return jsonBody({ error: "audio_url required" }, 400);
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey)
    return jsonBody({ error: "no_api_key" });
  try {
    const audioResp = await fetch(audioUrl);
    if (!audioResp.ok)
      return jsonBody({ error: "fetch_failed" });
    const audioBlob = await audioResp.blob();
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-large-v3");
    formData.append("language", body.language === "en" ? "en" : body.language === "ku" ? "ku" : "fa");
    const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey },
      body: formData
    });
    if (!r.ok)
      return jsonBody({ error: "stt_failed" });
    const data = await r.json();
    return jsonBody({ text: data.text || "", provider: "groq", model: "whisper-large-v3" });
  } catch {
    return jsonBody({ error: "stt_failed" });
  }
}
__name(handleSTT, "handleSTT");
async function globalSearchCompute(query, language, requestId, env, send) {
  const emit = send || (() => {
  });
  try {
    emit({ request_id: requestId, status: "starting", progress: 3, message: query });
    emit({ request_id: requestId, status: "searching_web", progress: 12, message: query });
    let webSources = [];
    try {
      webSources = await duckDuckGoSearch(query, 8);
    } catch {
    }
    emit({ request_id: requestId, status: "checking_stores", progress: 28, message: query });
    let storeSources = [];
    try {
      storeSources = await duckDuckGoSearch(query + " price buy \u0642\u06CC\u0645\u062A \u062E\u0631\u06CC\u062F \u0641\u0631\u0648\u0634\u06AF\u0627\u0647", 8);
    } catch {
    }
    emit({ request_id: requestId, status: "checking_social", progress: 42, message: query });
    emit({ request_id: requestId, status: "verifying_sources", progress: 52, message: query });
    const seenUrl = {};
    const dedupedAll = [...storeSources, ...webSources].filter((s) => {
      if (seenUrl[s.url])
        return false;
      seenUrl[s.url] = 1;
      return true;
    });
    const context = dedupedAll.map((s, i) => `[${i + 1}] ${s.title} (${s.site}): ${s.description}
URL: ${s.url}`).join("\n");
    emit({ request_id: requestId, status: "comparing_prices", progress: 62, message: query });
    let products = [];
    let webResults = [];
    let summary = "";
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
      const analysisText = await groqCompleteSimple(system, `Search results:
${context}`, 4096, env);
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        products = parsed.products || [];
        webResults = parsed.web_results || [];
        summary = parsed.summary || "";
      }
    } catch {
    }
    const validUrls = new Set(dedupedAll.map((s) => s.url));
    products = products.filter((p) => !p.url || validUrls.has(p.url));
    emit({ request_id: requestId, status: "fetching_images", progress: 72, message: query });
    try {
      products = await enrichProductImages(products, 5);
    } catch {
    }
    emit({ request_id: requestId, status: "analyzing", progress: 78, message: query });
    const priced = products.map((p) => {
      const num = typeof p.price === "number" ? p.price : parseFloat(String(p.price || "").replace(/[^0-9.]/g, ""));
      return { ...p, _sortPrice: isNaN(num) ? Infinity : num };
    });
    priced.sort((a, b) => a._sortPrice - b._sortPrice);
    const ranked = priced.map((p, i) => {
      const { _sortPrice, ...rest } = p;
      return { ...rest, rank: i + 1 };
    });
    emit({ request_id: requestId, status: "preparing_sources", progress: 90, message: query });
    const sourceObjs = dedupedAll.map((s) => ({ title: s.title, url: s.url, site: s.site, favicon: faviconFor(s.url) }));
    if (!summary) {
      if (dedupedAll.length === 0) {
        summary = `\u0628\u0631\u0627\u06CC \xAB${query}\xBB \u0646\u062A\u06CC\u062C\u0647\u200C\u0627\u06CC \u062F\u0631 \u0645\u0646\u0627\u0628\u0639 \u0642\u0627\u0628\u0644 \u062F\u0633\u062A\u0631\u0633 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F. \u0644\u0637\u0641\u0627\u064B \u0639\u0628\u0627\u0631\u062A \u0631\u0627 \u062F\u0642\u06CC\u0642\u200C\u062A\u0631 \u06A9\u0646\u06CC\u062F \u06CC\u0627 \u062F\u0648\u0628\u0627\u0631\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F.`;
      } else {
        summary = `${ranked.length} \u0645\u062D\u0635\u0648\u0644 \u0648 ${webResults.length} \u0646\u062A\u06CC\u062C\u0647 \u0648\u0628 \u0628\u0631\u0627\u06CC \xAB${query}\xBB \u06CC\u0627\u0641\u062A \u0634\u062F.`;
      }
    }
    const result = {
      request_id: requestId,
      status: "completed",
      progress: 100,
      results: ranked,
      web_results: webResults,
      sources: sourceObjs,
      summary,
      limited: false
    };
    emit(result);
    return result;
  } catch (e) {
    const err = { request_id: requestId, status: "error", error: "search_failed", message: e?.message || "unknown_error" };
    emit(err);
    return err;
  }
}
__name(globalSearchCompute, "globalSearchCompute");
async function handleGlobalSearch(body, env, request) {
  const query = (body.query || "").trim();
  if (!query)
    return jsonBody({ error: "query required" }, 400);
  const language = body.language || "fa";
  const requestId = body.request_id || "gs_" + Date.now();
  const acceptHeader = request?.headers?.get("Accept") || "";
  const wantsSSE = acceptHeader.includes("text/event-stream");
  if (!wantsSSE) {
    const result = await globalSearchCompute(query, language, requestId, env, null);
    return jsonBody(result);
  }
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = /* @__PURE__ */ __name((data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}

`));
        } catch {
        }
      }, "send");
      await globalSearchCompute(query, language, requestId, env, send);
      controller.close();
    }
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive", ...corsHeaders2() }
  });
}
__name(handleGlobalSearch, "handleGlobalSearch");
async function fetchOgImage(url, timeoutMs) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs || 5e3);
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; HomaAI/1.0)" },
      signal: controller.signal,
      redirect: "follow"
    });
    clearTimeout(timeout);
    if (!res.ok)
      return "";
    const html = await res.text();
    const ogMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i) || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
    if (ogMatch && ogMatch[1])
      return resolveUrl(ogMatch[1], url);
    const twMatch = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i) || html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']twitter:image["']/i);
    if (twMatch && twMatch[1])
      return resolveUrl(twMatch[1], url);
    return "";
  } catch {
    return "";
  }
}
__name(fetchOgImage, "fetchOgImage");
function resolveUrl(imgUrl, baseUrl) {
  if (!imgUrl)
    return "";
  if (/^https?:\/\//i.test(imgUrl))
    return imgUrl;
  if (imgUrl.startsWith("//"))
    return "https:" + imgUrl;
  try {
    return new URL(imgUrl, baseUrl).href;
  } catch {
    return "";
  }
}
__name(resolveUrl, "resolveUrl");
async function enrichProductImages(products, maxFetch) {
  const limit = maxFetch || 5;
  const toEnrich = products.filter((p) => p.url && !p.image).slice(0, limit);
  const results = await Promise.all(
    toEnrich.map(async (p) => {
      const img = await fetchOgImage(p.url, 4e3);
      return { url: p.url, image: img };
    })
  );
  const imgMap = {};
  for (const r of results) {
    if (r.image)
      imgMap[r.url] = r.image;
  }
  return products.map((p) => imgMap[p.url] ? { ...p, image: imgMap[p.url] } : p);
}
__name(enrichProductImages, "enrichProductImages");
async function getEncryptionKey(env) {
  if (!env.HOMA_ENCRYPTION_KEY)
    throw new Error("no_encryption_key");
  const rawKey = new TextEncoder().encode(env.HOMA_ENCRYPTION_KEY);
  const hash = await crypto.subtle.digest("SHA-256", rawKey);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
__name(getEncryptionKey, "getEncryptionKey");
async function encryptKey(plaintext, env) {
  const key = await getEncryptionKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}
__name(encryptKey, "encryptKey");
async function decryptKey(encryptedB64, env) {
  const key = await getEncryptionKey(env);
  const combined = Uint8Array.from(atob(encryptedB64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(decrypted);
}
__name(decryptKey, "decryptKey");
async function deriveUserKey2(userToken, env) {
  if (!userToken)
    throw new Error("no_user_token");
  const enc = new TextEncoder();
  const salt = enc.encode(env.HOMA_WORKER_KEY || "");
  const data = new Uint8Array(salt.length + userToken.length);
  data.set(salt);
  data.set(enc.encode(userToken), salt.length);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(deriveUserKey2, "deriveUserKey");
function connKvKey(userKey, providerId) {
  return `conn:${userKey}:${providerId}`;
}
__name(connKvKey, "connKvKey");
async function storeConnection(userKey, providerId, encryptedKey, keyHint, env) {
  if (!env.USER_CONNECTIONS)
    throw new Error("kv_not_configured");
  const record = JSON.stringify({
    encrypted_key: encryptedKey,
    key_hint: keyHint,
    provider_id: providerId,
    status: "CONNECTED",
    stored_at: (/* @__PURE__ */ new Date()).toISOString(),
    last_verified: (/* @__PURE__ */ new Date()).toISOString()
  });
  await env.USER_CONNECTIONS.put(connKvKey(userKey, providerId), record);
}
__name(storeConnection, "storeConnection");
async function getConnection(userKey, providerId, env) {
  if (!env.USER_CONNECTIONS)
    return null;
  const raw = await env.USER_CONNECTIONS.get(connKvKey(userKey, providerId));
  return raw ? JSON.parse(raw) : null;
}
__name(getConnection, "getConnection");
async function deleteConnection(userKey, providerId, env) {
  if (!env.USER_CONNECTIONS)
    return;
  await env.USER_CONNECTIONS.delete(connKvKey(userKey, providerId));
}
__name(deleteConnection, "deleteConnection");
function jobKvKey(userKey, jobId) {
  return `job:${userKey}:${jobId}`;
}
__name(jobKvKey, "jobKvKey");
async function storeJob(userKey, jobId, record, env) {
  if (!env.USER_CONNECTIONS)
    throw new Error("kv_not_configured");
  await env.USER_CONNECTIONS.put(jobKvKey(userKey, jobId), JSON.stringify({ ...record, updated_at: (/* @__PURE__ */ new Date()).toISOString() }));
}
__name(storeJob, "storeJob");
async function getJobRecord(userKey, jobId, env) {
  if (!env.USER_CONNECTIONS)
    return null;
  const raw = await env.USER_CONNECTIONS.get(jobKvKey(userKey, jobId));
  return raw ? JSON.parse(raw) : null;
}
__name(getJobRecord, "getJobRecord");
function genJobId() {
  return "job_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}
__name(genJobId, "genJobId");
async function handleCreateJob(body, env, userKey) {
  const toolId = (body.tool_id || "").trim();
  const capability = (body.capability || "").trim();
  const input = body.input || {};
  if (!toolId || !capability)
    return jsonBody({ error: "tool_id and capability required" }, 400);
  if (!env.USER_CONNECTIONS)
    return jsonBody({ error: "storage_not_configured", code: "not_configured" }, 500);
  const adapter = getAdapter(toolId);
  if (!adapter)
    return jsonBody({ error: "unknown_provider", code: "unknown_provider" }, 400);
  if (!adapter.getCapabilities().includes(capability)) {
    return jsonBody({ error: "capability_not_supported", code: "not_supported", status: "NOT_SUPPORTED" }, 400);
  }
  const conn = await getConnection(userKey, toolId, env);
  if (!conn)
    return jsonBody({ error: "not_connected", code: "not_connected" }, 401);
  let apiKey;
  try {
    apiKey = await decryptKey(conn.encrypted_key, env);
  } catch {
    return jsonBody({ error: "decryption_failed", code: "not_configured" }, 500);
  }
  const jobId = genJobId();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const baseRecord = {
    job_id: jobId,
    provider_id: toolId,
    capability,
    status: "SUBMITTING",
    provider_job_id: "",
    input: JSON.stringify(input).slice(0, 4e3),
    result_url: "",
    result_text: "",
    error: "",
    code: "",
    context: null,
    created_at: now,
    updated_at: now,
    completed_at: "",
    credits_charged: body.credits_charged || 0
  };
  await storeJob(userKey, jobId, baseRecord, env);
  let result;
  try {
    result = await adapter.execute({ apiKey, capability, input, env });
  } catch (e) {
    await storeJob(userKey, jobId, { ...baseRecord, status: "FAILED", error: e.message || "execution_failed", code: "provider_error" }, env);
    return jsonBody({ job_id: jobId, status: "FAILED", error: e.message || "execution_failed", code: "provider_error" });
  }
  if (result.status === "NOT_SUPPORTED") {
    await storeJob(userKey, jobId, { ...baseRecord, status: "FAILED", error: result.error, code: "not_supported" }, env);
    return jsonBody({ job_id: jobId, status: "NOT_SUPPORTED", error: result.error, code: "not_supported" });
  }
  if (result.status === "FAILED") {
    await storeJob(userKey, jobId, { ...baseRecord, status: "FAILED", error: result.error, code: result.code }, env);
    return jsonBody({ job_id: jobId, status: "FAILED", error: result.error, code: result.code });
  }
  if (result.status === "COMPLETED") {
    const done = { ...baseRecord, status: "COMPLETED", result_url: result.result_url, result_text: result.result_text, context: result.metadata, completed_at: (/* @__PURE__ */ new Date()).toISOString() };
    await storeJob(userKey, jobId, done, env);
    return jsonBody({ job_id: jobId, status: "COMPLETED", result_url: result.result_url, result_text: result.result_text, metadata: result.metadata });
  }
  const proc = { ...baseRecord, status: "PROCESSING", provider_job_id: result.provider_job_id, context: result.context };
  await storeJob(userKey, jobId, proc, env);
  return jsonBody({ job_id: jobId, status: "PROCESSING", provider_job_id: result.provider_job_id });
}
__name(handleCreateJob, "handleCreateJob");
async function handleGetJob(jobId, env, userKey) {
  if (!jobId)
    return jsonBody({ error: "job_id required" }, 400);
  const job = await getJobRecord(userKey, jobId, env);
  if (!job)
    return jsonBody({ error: "job_not_found", code: "not_found" }, 404);
  if (job.provider_job_id === void 0 && job.status === void 0)
    return jsonBody({ error: "job_not_found" }, 404);
  if (job.status === "PROCESSING" && job.provider_id) {
    const adapter = getAdapter(job.provider_id);
    if (adapter && adapter.isAsync && adapter.isAsync() && job.provider_job_id) {
      const conn = await getConnection(userKey, job.provider_id, env);
      if (conn) {
        let apiKey;
        try {
          apiKey = await decryptKey(conn.encrypted_key, env);
        } catch {
          apiKey = null;
        }
        if (apiKey) {
          try {
            const polled = await adapter.getJobStatus({ provider_job_id: job.provider_job_id, apiKey, env, context: job.context });
            if (polled.status === "COMPLETED") {
              const done = { ...job, status: "COMPLETED", result_url: polled.result_url, result_text: polled.result_text, context: polled.metadata, completed_at: (/* @__PURE__ */ new Date()).toISOString() };
              await storeJob(userKey, jobId, done, env);
              return jsonBody(sanitizeJob(done));
            }
            if (polled.status === "FAILED") {
              const fail = { ...job, status: "FAILED", error: polled.error, code: polled.code };
              await storeJob(userKey, jobId, fail, env);
              return jsonBody(sanitizeJob(fail));
            }
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
__name(handleGetJob, "handleGetJob");
async function handleCancelJob(jobId, env, userKey) {
  if (!jobId)
    return jsonBody({ error: "job_id required" }, 400);
  const job = await getJobRecord(userKey, jobId, env);
  if (!job)
    return jsonBody({ error: "job_not_found" }, 404);
  if (job.status === "COMPLETED" || job.status === "FAILED" || job.status === "CANCELLED") {
    return jsonBody({ job_id: jobId, status: job.status });
  }
  const cancelled = { ...job, status: "CANCELLED", completed_at: (/* @__PURE__ */ new Date()).toISOString() };
  await storeJob(userKey, jobId, cancelled, env);
  return jsonBody({ job_id: jobId, status: "CANCELLED" });
}
__name(handleCancelJob, "handleCancelJob");
function sanitizeJob(job) {
  const { ...rest } = job;
  return rest;
}
__name(sanitizeJob, "sanitizeJob");
async function handleToolRoute(body, env) {
  const message = (body.message || "").trim();
  if (!message)
    return jsonBody({ error: "message required" }, 400);
  const language = body.language || "fa";
  const system = `You are Homa's Tool Router. Analyze the user's message and determine what capability is needed.
Return ONLY a JSON object:
{"capability":"CAPABILITY_ID or null","confidence":0.0-1.0,"needs_attachment":true/false,"summary":"brief description"}
Capability IDs: TEXT_GENERATION, REASONING, CODE_GENERATION, CODE_DEBUGGING, WEB_SEARCH, DEEP_RESEARCH, WEBSITE_ANALYSIS, IMAGE_GENERATION, IMAGE_ANALYSIS, IMAGE_EDITING, IMAGE_UPSCALING, BACKGROUND_REMOVAL, VIDEO_GENERATION, IMAGE_TO_VIDEO, VIDEO_ANALYSIS, VIDEO_EDITING, TEXT_TO_SPEECH, SPEECH_TO_TEXT, VOICE_CLONING, MUSIC_GENERATION, FILE_ANALYSIS, GLOBAL_SEARCH, INSTAGRAM_ANALYSIS, TIKTOK_ANALYSIS, FACEBOOK_ANALYSIS
If the message is general conversation that doesn't need a specific tool, return capability: null.
${langInstruction(language)}`;
  try {
    const raw = await groqCompleteSimple(system, message, 256, env);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch)
      return jsonBody(JSON.parse(jsonMatch[0]));
    return jsonBody({ capability: null, confidence: 0, summary: "" });
  } catch {
    return jsonBody({ capability: null, confidence: 0, summary: "" });
  }
}
__name(handleToolRoute, "handleToolRoute");
async function handleConnectionStatusGet(request, env, url) {
  const userToken = request.headers.get("X-User-Token") || "";
  if (!userToken)
    return jsonBody({ error: "user_identity_required", code: "no_user_token" }, 401);
  let userKey;
  try {
    userKey = await deriveUserKey2(userToken, env);
  } catch {
    return jsonBody({ error: "user_identity_required", code: "no_user_token" }, 401);
  }
  return await handleConnectionStatus({ tool_id: url.searchParams.get("tool_id") || "" }, env, userKey);
}
__name(handleConnectionStatusGet, "handleConnectionStatusGet");
async function handleConnectTool(body, env, userKey) {
  const toolId = (body.tool_id || "").trim();
  const apiKey = (body.api_key || "").trim();
  if (!toolId || !apiKey)
    return jsonBody({ error: "tool_id and api_key required" }, 400);
  if (!env.HOMA_ENCRYPTION_KEY)
    return jsonBody({ error: "encryption_not_configured", code: "not_configured" }, 500);
  if (!env.USER_CONNECTIONS)
    return jsonBody({ error: "storage_not_configured", code: "not_configured" }, 500);
  const adapter = getAdapter(toolId);
  if (!adapter)
    return jsonBody({ error: "unknown_provider", code: "unknown_provider" }, 400);
  let probe2;
  try {
    probe2 = await adapter.validate(apiKey);
  } catch {
    return jsonBody({ error: "validation_failed", code: "api_unavailable", status: "API_UNAVAILABLE" }, 502);
  }
  if (!probe2.valid) {
    return jsonBody({
      error: "credential_invalid",
      code: probe2.status === "EXPIRED" ? "invalid_credentials" : probe2.status === "API_UNAVAILABLE" ? "api_unavailable" : "validation_failed",
      status: probe2.status
    }, 401);
  }
  try {
    const encryptedKey = await encryptKey(apiKey, env);
    const keyHint = apiKey.length > 8 ? apiKey.slice(0, 4) + "\u2022\u2022\u2022\u2022" + apiKey.slice(-4) : "\u2022\u2022\u2022\u2022";
    await storeConnection(userKey, toolId, encryptedKey, keyHint, env);
    return jsonBody({ status: "CONNECTED", key_hint: keyHint, provider_id: toolId, verified: true });
  } catch (e) {
    return jsonBody({ error: "storage_failed", code: "storage_failed" }, 500);
  }
}
__name(handleConnectTool, "handleConnectTool");
async function handleDisconnectTool(body, env, userKey) {
  const toolId = (body.tool_id || "").trim();
  if (!toolId)
    return jsonBody({ error: "tool_id required" }, 400);
  try {
    await deleteConnection(userKey, toolId, env);
    return jsonBody({ status: "DISCONNECTED", provider_id: toolId });
  } catch (e) {
    return jsonBody({ error: "disconnect_failed", code: "storage_failed" }, 500);
  }
}
__name(handleDisconnectTool, "handleDisconnectTool");
async function handleConnectionStatus(body, env, userKey) {
  const toolId = (body.tool_id || "").trim();
  if (!toolId)
    return jsonBody({ error: "tool_id required" }, 400);
  if (!env.USER_CONNECTIONS)
    return jsonBody({ status: "NOT_CONFIGURED", provider_id: toolId });
  if (!env.HOMA_ENCRYPTION_KEY)
    return jsonBody({ status: "NOT_CONFIGURED", provider_id: toolId });
  const record = await getConnection(userKey, toolId, env);
  if (!record)
    return jsonBody({ status: "NOT_CONNECTED", provider_id: toolId });
  const adapter = getAdapter(toolId);
  if (!adapter)
    return jsonBody({ status: "ERROR", provider_id: toolId, key_hint: record.key_hint, code: "unknown_provider" });
  try {
    const apiKey = await decryptKey(record.encrypted_key, env);
    const probe2 = await adapter.validate(apiKey);
    const status = probe2.valid ? "CONNECTED" : probe2.status;
    record.last_verified = (/* @__PURE__ */ new Date()).toISOString();
    record.status = status;
    await env.USER_CONNECTIONS.put(connKvKey(userKey, toolId), JSON.stringify(record));
    return jsonBody({ status, provider_id: toolId, key_hint: record.key_hint, verified: true });
  } catch (e) {
    return jsonBody({ status: "ERROR", provider_id: toolId, key_hint: record.key_hint, code: "validation_failed" });
  }
}
__name(handleConnectionStatus, "handleConnectionStatus");
var GOOGLE_SCOPES = "https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/calendar.events";
async function getUserCollection(env, userKey, kind) {
  if (!env.USER_DATA)
    return [];
  const raw = await env.USER_DATA.get(`${kind}:${userKey}`);
  if (!raw)
    return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
__name(getUserCollection, "getUserCollection");
async function putUserCollection(env, userKey, kind, list) {
  if (!env.USER_DATA)
    return;
  await env.USER_DATA.put(`${kind}:${userKey}`, JSON.stringify(list));
}
__name(putUserCollection, "putUserCollection");
function applyAlarmUpdate(record, data) {
  return { ...record, ...data, id: record.id, updated_date: (/* @__PURE__ */ new Date()).toISOString() };
}
__name(applyAlarmUpdate, "applyAlarmUpdate");
async function handleAlarmCRUD(request, env, url, userKey, kvKind, pathPrefix) {
  const escaped = pathPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const idMatch = url.pathname.match(new RegExp(`^${escaped}/([^/]+)$`));
  const isList = url.pathname === pathPrefix;
  if (request.method === "GET" && isList) {
    const list = await getUserCollection(env, userKey, kvKind);
    return jsonBody({ items: list });
  }
  if (request.method === "GET" && idMatch) {
    const list = await getUserCollection(env, userKey, kvKind);
    const rec = list.find((r) => r.id === decodeURIComponent(idMatch[1]));
    return rec ? jsonBody(rec) : jsonBody({ error: "not_found" }, 404);
  }
  if (request.method === "POST" && isList) {
    const body = await request.json();
    const list = await getUserCollection(env, userKey, kvKind);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const record = { ...body, id: body.id || "al_" + crypto.randomUUID(), created_date: body.created_date || now, updated_date: now };
    list.push(record);
    await putUserCollection(env, userKey, kvKind, list);
    return jsonBody(record);
  }
  if (request.method === "PATCH" && idMatch) {
    const body = await request.json();
    const list = await getUserCollection(env, userKey, kvKind);
    const idx = list.findIndex((r) => r.id === decodeURIComponent(idMatch[1]));
    if (idx < 0) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const record = { ...body, id: decodeURIComponent(idMatch[1]), created_date: body.created_date || now, updated_date: now };
      list.push(record);
      await putUserCollection(env, userKey, kvKind, list);
      return jsonBody(record);
    }
    list[idx] = applyAlarmUpdate(list[idx], body);
    await putUserCollection(env, userKey, kvKind, list);
    return jsonBody(list[idx]);
  }
  if (request.method === "DELETE" && idMatch) {
    const list = await getUserCollection(env, userKey, kvKind);
    const filtered = list.filter((r) => r.id !== decodeURIComponent(idMatch[1]));
    await putUserCollection(env, userKey, kvKind, filtered);
    return jsonBody({ success: true });
  }
  return jsonBody({ error: "method_not_allowed" }, 405);
}
__name(handleAlarmCRUD, "handleAlarmCRUD");
async function handleGoogleAuth(request, env) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");
  const redirect = url.searchParams.get("redirect") || "";
  const loginMode = url.searchParams.get("login") === "1";
  if (!userId && !loginMode)
    return new Response("user_id or login=1 required", { status: 400 });
  if (!env.GOOGLE_CLIENT_ID)
    return new Response("Google OAuth not configured on Worker", { status: 500 });
  const callbackUrl = `${url.origin}/google/callback`;
  const state = loginMode ? `login|${redirect}` : `${userId}|${redirect}`;
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", callbackUrl);
  authUrl.searchParams.set("response_type", "code");
  const scopes = loginMode ? GOOGLE_SCOPES + " https://www.googleapis.com/auth/userinfo.email" : GOOGLE_SCOPES;
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);
  return Response.redirect(authUrl.toString(), 302);
}
__name(handleGoogleAuth, "handleGoogleAuth");
async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const error = url.searchParams.get("error");
  const [userIdOrMode, redirect] = state.split("|");
  if (error)
    return Response.redirect(redirect || "/?google_error=1", 302);
  if (!code)
    return new Response("Missing code", { status: 400 });
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET)
    return new Response("Google OAuth not configured", { status: 500 });
  if (!env.GOOGLE_TOKENS)
    return new Response("KV namespace not configured", { status: 500 });
  const callbackUrl = `${url.origin}/google/callback`;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code"
      })
    });
    if (!tokenRes.ok) {
      const t = await tokenRes.text();
      return new Response(`Token exchange failed: ${t}`, { status: 502 });
    }
    const tokens = await tokenRes.json();
    const tokenData = JSON.stringify({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry: Date.now() + (tokens.expires_in || 3600) * 1e3,
      scope: tokens.scope || GOOGLE_SCOPES
    });
    if (userIdOrMode === "login") {
      if (!env.DB)
        return new Response("Database not configured", { status: 500 });
      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (!profileRes.ok)
        return new Response("Failed to get Google profile", { status: 502 });
      const profile = await profileRes.json();
      const email2 = (profile.email || "").trim().toLowerCase();
      if (!email2)
        return new Response("No email in Google profile", { status: 400 });
      let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email2).first();
      if (!user) {
        const newUserId = "usr_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
        await env.DB.prepare("INSERT INTO users (id, email, role, password_hash) VALUES (?, ?, ?, ?)").bind(newUserId, email2, "user", "").run();
        user = { id: newUserId, email: email2 };
      }
      const homaToken = await issueHomaToken(user.id, env);
      const encrypted2 = await encryptKey(tokenData, env);
      await env.GOOGLE_TOKENS.put(`user:${user.id}`, encrypted2);
      const sep2 = (redirect || "").includes("?") ? "&" : "?";
      return Response.redirect(`${redirect || "/"}${sep2}homa_token=${homaToken}`, 302);
    }
    const userId = userIdOrMode;
    if (!userId)
      return new Response("Missing user_id", { status: 400 });
    const encrypted = await encryptKey(tokenData, env);
    await env.GOOGLE_TOKENS.put(`user:${userId}`, encrypted);
    const sep = (redirect || "").includes("?") ? "&" : "?";
    return Response.redirect(`${redirect || "/"}${sep}google_connected=1`, 302);
  } catch (e) {
    return new Response(`OAuth error: ${e.message}`, { status: 500 });
  }
}
__name(handleGoogleCallback, "handleGoogleCallback");
async function getGoogleTokens(userId, env) {
  if (!env.GOOGLE_TOKENS)
    throw new Error("kv_not_configured");
  const encrypted = await env.GOOGLE_TOKENS.get(`user:${userId}`);
  if (!encrypted)
    return null;
  return JSON.parse(await decryptKey(encrypted, env));
}
__name(getGoogleTokens, "getGoogleTokens");
async function refreshGoogleTokens(tokens, env) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: tokens.refresh_token,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token"
    })
  });
  if (!res.ok)
    throw new Error("refresh_failed");
  const data = await res.json();
  return { access_token: data.access_token, refresh_token: tokens.refresh_token, expiry: Date.now() + (data.expires_in || 3600) * 1e3, scope: tokens.scope };
}
__name(refreshGoogleTokens, "refreshGoogleTokens");
async function getValidAccessToken(userId, env) {
  let tokens = await getGoogleTokens(userId, env);
  if (!tokens)
    throw new Error("not_connected");
  if (Date.now() >= tokens.expiry - 6e4) {
    tokens = await refreshGoogleTokens(tokens, env);
    const encrypted = await encryptKey(JSON.stringify(tokens), env);
    await env.GOOGLE_TOKENS.put(`user:${userId}`, encrypted);
  }
  return tokens.access_token;
}
__name(getValidAccessToken, "getValidAccessToken");
async function handleGoogleStatus(body, env, userKey) {
  const userId = userKey;
  if (!userId)
    return jsonBody({ error: "user_id required" }, 400);
  try {
    const tokens = await getGoogleTokens(userId, env);
    return jsonBody({ connected: !!tokens });
  } catch {
    return jsonBody({ connected: false });
  }
}
__name(handleGoogleStatus, "handleGoogleStatus");
async function handleGoogleTaskCreate(body, env, userKey) {
  const userId = userKey;
  const title = (body.title || "").trim();
  const notes = body.notes || "";
  if (!userId)
    return jsonBody({ error: "user_id required" }, 400);
  if (!title)
    return jsonBody({ error: "title required" }, 400);
  try {
    const accessToken = await getValidAccessToken(userId, env);
    const listsRes = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!listsRes.ok)
      return jsonBody({ error: "lists_failed" }, 502);
    const listsData = await listsRes.json();
    const taskListId = listsData.items?.[0]?.id;
    if (!taskListId)
      return jsonBody({ error: "no_task_list" }, 404);
    const taskRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ title, notes })
    });
    if (!taskRes.ok)
      return jsonBody({ error: "create_failed" }, 502);
    const task = await taskRes.json();
    return jsonBody({ success: true, task_id: task.id });
  } catch (e) {
    return jsonBody({ error: e.message }, 500);
  }
}
__name(handleGoogleTaskCreate, "handleGoogleTaskCreate");
async function handleGoogleCalendarCreate(body, env, userKey) {
  const userId = userKey;
  const title = (body.title || "").trim();
  const date = body.date || "";
  const time = body.time || "09:00";
  const description = body.description || "";
  if (!userId)
    return jsonBody({ error: "user_id required" }, 400);
  if (!title)
    return jsonBody({ error: "title required" }, 400);
  try {
    const accessToken = await getValidAccessToken(userId, env);
    const [h, m] = time.split(":").map(Number);
    const [y, mo, d] = date.split("-").map(Number);
    const start = new Date(y, mo - 1, d, h || 9, m || 0);
    const end = new Date(start.getTime() + 60 * 60 * 1e3);
    const event = { summary: title, description, start: { dateTime: start.toISOString() }, end: { dateTime: end.toISOString() } };
    const eventRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(event)
    });
    if (!eventRes.ok)
      return jsonBody({ error: "create_failed" }, 502);
    const created = await eventRes.json();
    return jsonBody({ success: true, event_id: created.id, html_link: created.htmlLink });
  } catch (e) {
    return jsonBody({ error: e.message }, 500);
  }
}
__name(handleGoogleCalendarCreate, "handleGoogleCalendarCreate");
async function handleGoogleDisconnect(body, env, userKey) {
  const userId = userKey;
  if (!userId)
    return jsonBody({ error: "user_id required" }, 400);
  try {
    await env.GOOGLE_TOKENS.delete(`user:${userId}`);
    return jsonBody({ success: true });
  } catch (e) {
    return jsonBody({ error: e.message }, 500);
  }
}
__name(handleGoogleDisconnect, "handleGoogleDisconnect");
async function fetchProductPrice(query, env) {
  if (!query)
    return { price: null, currency: "", url: "", in_stock: null, raw: "" };
  let sources = [];
  try {
    sources = await duckDuckGoSearch(query + " \u0642\u06CC\u0645\u062A \u062E\u0631\u06CC\u062F price buy", 6);
  } catch {
  }
  if (sources.length < 2) {
    try {
      sources = sources.concat(await duckDuckGoSearch(query, 4));
    } catch {
    }
  }
  const seen = {};
  const deduped = [];
  for (const s of sources) {
    if (s.url && !seen[s.url]) {
      seen[s.url] = 1;
      deduped.push(s);
    }
  }
  sources = deduped.slice(0, 6);
  if (sources.length === 0)
    return { price: null, currency: "", url: "", in_stock: null, raw: "" };
  const context = sources.map((s, i) => `[${i + 1}] ${s.title} (${s.site}): ${s.description}
URL: ${s.url}`).join("\n");
  try {
    const system = `You are Homa, a price tracker. Extract the best available price for "${query}" from the search results.
Return ONLY a JSON object: {"price": number_or_null, "currency": "IRR|USD|EUR|...", "url": "best source URL", "in_stock": true/false/null, "raw": "price as found in text"}
If no price is found, return {"price": null, "currency": "", "url": "", "in_stock": null, "raw": ""}.
Do NOT fabricate prices. Only extract prices that appear in the search results.`;
    const text = await groqCompleteSimple(system, `Search results:
${context}`, 1024, env);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        price: parsed.price != null ? Number(parsed.price) : null,
        currency: parsed.currency || "",
        url: parsed.url || (sources[0]?.url || ""),
        in_stock: parsed.in_stock != null ? parsed.in_stock : null,
        raw: parsed.raw || ""
      };
    }
  } catch {
  }
  return { price: null, currency: "", url: sources[0]?.url || "", in_stock: null, raw: "" };
}
__name(fetchProductPrice, "fetchProductPrice");
function evaluateCondition(reminder, priceData) {
  if (!priceData || priceData.price == null)
    return { met: false, reason: "no_price_data" };
  const price = priceData.price;
  const target = Number(reminder.target_price || 0);
  const cond = reminder.condition_type || "";
  switch (cond) {
    case "PRICE_BELOW":
      return { met: target > 0 && price < target, reason: `\u0642\u06CC\u0645\u062A ${price} < \u0647\u062F\u0641 ${target}` };
    case "PRICE_ABOVE":
      return { met: target > 0 && price > target, reason: `\u0642\u06CC\u0645\u062A ${price} > \u0647\u062F\u0641 ${target}` };
    case "PRICE_DROP_PERCENT": {
      const threshold = Number(reminder.condition_value || 0);
      try {
        const baseline = JSON.parse(reminder.condition_data || "{}").baseline_price;
        if (baseline && threshold > 0) {
          const drop = (baseline - price) / baseline * 100;
          return { met: drop >= threshold, reason: `\u0627\u0641\u062A ${drop.toFixed(1)}% \u2265 \u0622\u0633\u062A\u0627\u0646\u0647 ${threshold}%` };
        }
      } catch {
      }
      return { met: false, reason: "no_baseline" };
    }
    case "IN_STOCK":
      return { met: priceData.in_stock === true, reason: "\u0645\u0648\u062C\u0648\u062F \u0634\u062F" };
    case "BACK_IN_STOCK":
      return { met: priceData.in_stock === true, reason: "\u0645\u062C\u062F\u062F \u0645\u0648\u062C\u0648\u062F \u0634\u062F" };
    case "OUT_OF_STOCK":
      return { met: priceData.in_stock === false, reason: "\u0646\u0627\u0645\u0648\u062C\u0648\u062F \u0634\u062F" };
    default:
      return { met: true, reason: `\u0642\u06CC\u0645\u062A \u06CC\u0627\u0641\u062A \u0634\u062F: ${price}` };
  }
}
__name(evaluateCondition, "evaluateCondition");
async function runSmartWatchChecks(env) {
  if (!env.USER_DATA)
    return;
  let cursor;
  try {
    do {
      const list = await env.USER_DATA.list({ prefix: "reminders:", cursor });
      for (const key of list.keys) {
        const raw = await env.USER_DATA.get(key.name);
        if (!raw)
          continue;
        let arr;
        try {
          arr = JSON.parse(raw);
        } catch {
          continue;
        }
        let changed = false;
        for (let i = 0; i < arr.length; i++) {
          const r = arr[i];
          if (r.reminder_type !== "smart" && r.reminder_type !== "price_alert")
            continue;
          if (r.status !== "pending")
            continue;
          const interval = (r.check_interval || 30) * 60 * 1e3;
          if (r.last_checked_at && Date.now() - new Date(r.last_checked_at).getTime() < interval)
            continue;
          r.last_checked_at = (/* @__PURE__ */ new Date()).toISOString();
          const productQuery = r.product_name || r.product_url || r.title;
          if (!productQuery)
            continue;
          const priceData = await fetchProductPrice(productQuery, env);
          const result = evaluateCondition(r, priceData);
          if (!result.met)
            continue;
          r.last_triggered = (/* @__PURE__ */ new Date()).toISOString();
          if (r.notify_once)
            r.status = "done";
          changed = true;
          try {
            const histRaw = await env.USER_DATA.get(`history:${key.name.slice("reminders:".length)}`);
            let hist = [];
            try {
              hist = JSON.parse(histRaw || "[]");
            } catch {
            }
            hist.unshift({
              id: "ah_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8),
              entry_type: r.reminder_type === "price_alert" ? "price_alert" : "smart",
              alarm_id: "",
              reminder_id: r.id,
              title: r.title || r.product_name || "Smart Reminder",
              action: "triggered",
              triggered_at: (/* @__PURE__ */ new Date()).toISOString(),
              details: `${result.reason} | \u0642\u06CC\u0645\u062A: ${priceData.price || "\u0646\u0627\u0645\u0634\u062E\u0635"} ${priceData.currency || ""}`
            });
            if (hist.length > 200)
              hist = hist.slice(0, 200);
            await env.USER_DATA.put(`history:${key.name.slice("reminders:".length)}`, JSON.stringify(hist));
          } catch {
          }
        }
        if (changed)
          await env.USER_DATA.put(key.name, JSON.stringify(arr));
      }
      cursor = list.list_complete ? null : list.cursor;
    } while (cursor);
  } catch {
  }
}
__name(runSmartWatchChecks, "runSmartWatchChecks");
var SORTABLE_COLUMNS = /* @__PURE__ */ new Set([
  "created_at",
  "updated_at",
  "title",
  "status",
  "priority",
  "amount",
  "credits",
  "balance"
]);
function safeSort(field) {
  const f = (field || "created_at").replace(/[^a-zA-Z_]/g, "");
  return SORTABLE_COLUMNS.has(f) ? f : "created_at";
}
__name(safeSort, "safeSort");
function genRecId() {
  return "rec_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
}
__name(genRecId, "genRecId");
async function handleD1CRUD(request, env, url, userKey, entityName) {
  if (!env.DB)
    return jsonBody({ error: "d1_not_configured", code: "not_configured" }, 500);
  const cfg = ENTITY_MAP[entityName];
  if (!cfg)
    return jsonBody({ error: "unknown_entity" }, 400);
  const table = cfg.table;
  const base = `/data/${entityName}`;
  const idMatch = url.pathname.match(new RegExp(`^${base}/([^/]+)$`));
  const isList = url.pathname === base;
  const isBulk = url.pathname === `${base}/bulk`;
  const isSchema = url.pathname === `${base}/schema`;
  const ownerCol = cfg.userScoped ? "user_id" : cfg.ownerKey || "user_id";
  const scopeByUser = !cfg.publicRead;
  const isReadOnly = !!cfg.readOnly;
  const isAdminOnly = !!cfg.adminOnly;
  if (["POST", "PATCH", "DELETE"].includes(request.method)) {
    if (isReadOnly)
      return jsonBody({ error: "read_only_entity" }, 403);
    if (isAdminOnly) {
      const adminAuth = await requireAdmin(request, env);
      if (!adminAuth.isAdmin)
        return jsonBody({ error: "forbidden" }, 403);
    }
  }
  if (request.method === "GET" && isSchema) {
    return jsonBody({ entity: entityName, table, user_scoped: cfg.userScoped, owner_col: ownerCol });
  }
  if (request.method === "GET" && isList) {
    const sort = safeSort(url.searchParams.get("sort"));
    const dir = (url.searchParams.get("dir") || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";
    const limit = Math.min(parseInt(url.searchParams.get("limit")) || 100, 500);
    const queryRaw = url.searchParams.get("query");
    let sql = `SELECT * FROM ${table}`;
    const binds = [];
    const conditions = [];
    if (scopeByUser) {
      conditions.push(` ${ownerCol} = ?`);
      binds.push(userKey);
    }
    if (queryRaw) {
      try {
        const query = JSON.parse(queryRaw);
        for (const [key, value] of Object.entries(query)) {
          if (key.startsWith("$"))
            continue;
          const safeKey = key.replace(/[^a-zA-Z_]/g, "");
          if (value && typeof value === "object") {
            if (value.$gte !== void 0) {
              conditions.push(`${safeKey} >= ?`);
              binds.push(value.$gte);
            } else if (value.$lte !== void 0) {
              conditions.push(`${safeKey} <= ?`);
              binds.push(value.$lte);
            } else if (value.$ne !== void 0) {
              conditions.push(`${safeKey} != ?`);
              binds.push(value.$ne);
            }
          } else {
            conditions.push(`${safeKey} = ?`);
            binds.push(value);
          }
        }
      } catch {
      }
    }
    sql += " WHERE " + conditions.join(" AND ");
    sql += ` ORDER BY ${sort} ${dir} LIMIT ?`;
    binds.push(limit);
    try {
      const { results } = await env.DB.prepare(sql).bind(...binds).all();
      return jsonBody({ items: results || [] });
    } catch (e) {
      return jsonBody({ error: "query_failed", message: e.message }, 500);
    }
  }
  if (request.method === "GET" && idMatch) {
    const id = decodeURIComponent(idMatch[1]);
    const sql = scopeByUser ? `SELECT * FROM ${table} WHERE id = ? AND ${ownerCol} = ?` : `SELECT * FROM ${table} WHERE id = ?`;
    try {
      const rec = scopeByUser ? await env.DB.prepare(sql).bind(id, userKey).first() : await env.DB.prepare(sql).bind(id).first();
      return rec ? jsonBody(rec) : jsonBody({ error: "not_found" }, 404);
    } catch (e) {
      return jsonBody({ error: "query_failed", message: e.message }, 500);
    }
  }
  if (request.method === "POST" && isList) {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonBody({ error: "invalid_json" }, 400);
    }
    const id = body.id || genRecId();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const record = { ...body, id, created_at: body.created_at || now, updated_at: now };
    if (!record[ownerCol])
      record[ownerCol] = userKey;
    const rawCols = Object.keys(record);
    const cols = rawCols.map((c) => String(c).replace(/[^a-zA-Z_]/g, "")).filter((c) => c);
    const vals = cols.map((c) => record[c]);
    const placeholders = cols.map(() => "?").join(", ");
    try {
      await env.DB.prepare(
        `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`
      ).bind(...vals).run();
      return jsonBody(record);
    } catch (e) {
      return jsonBody({ error: "create_failed", message: e.message }, 500);
    }
  }
  if (request.method === "POST" && isBulk) {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonBody({ error: "invalid_json" }, 400);
    }
    const records = Array.isArray(body.records) ? body.records : [];
    if (records.length === 0)
      return jsonBody({ items: [], count: 0 });
    if (records.length > 500)
      return jsonBody({ error: "too_many_records", max: 500 }, 400);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const enriched = records.map((r) => ({
      ...r,
      id: r.id || genRecId(),
      created_at: r.created_at || now,
      updated_at: now,
      ...r[ownerCol] ? {} : { [ownerCol]: userKey }
    }));
    try {
      const stmts = enriched.map((rec) => {
        const rawCols = Object.keys(rec);
        const cols = rawCols.map((c) => String(c).replace(/[^a-zA-Z_]/g, "")).filter((c) => c);
        const vals = cols.map((c) => rec[c]);
        const placeholders = cols.map(() => "?").join(", ");
        return env.DB.prepare(
          `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders})`
        ).bind(...vals);
      });
      await env.DB.batch(stmts);
      return jsonBody({ items: enriched, count: enriched.length });
    } catch (e) {
      return jsonBody({ error: "bulk_create_failed", message: e.message }, 500);
    }
  }
  if (request.method === "PATCH" && idMatch) {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonBody({ error: "invalid_json" }, 400);
    }
    const id = decodeURIComponent(idMatch[1]);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const updateData = { ...body, updated_at: now };
    delete updateData.id;
    delete updateData[ownerCol];
    const cols = Object.keys(updateData);
    if (cols.length === 0)
      return jsonBody({ error: "no_fields" }, 400);
    const sets = cols.map((c) => `${c.replace(/[^a-zA-Z_]/g, "")} = ?`).join(", ");
    const vals = cols.map((c) => updateData[c]);
    try {
      const result = await env.DB.prepare(
        `UPDATE ${table} SET ${sets} WHERE id = ? AND ${ownerCol} = ?`
      ).bind(...vals, id, userKey).run();
      if (result.meta.changes === 0)
        return jsonBody({ error: "not_found" }, 404);
      const rec = await env.DB.prepare(
        `SELECT * FROM ${table} WHERE id = ? AND ${ownerCol} = ?`
      ).bind(id, userKey).first();
      return jsonBody(rec);
    } catch (e) {
      return jsonBody({ error: "update_failed", message: e.message }, 500);
    }
  }
  if (request.method === "PATCH" && isBulk) {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonBody({ error: "invalid_json" }, 400);
    }
    if (Array.isArray(body.records)) {
      if (body.records.length > 500)
        return jsonBody({ error: "too_many_records", max: 500 }, 400);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      try {
        const stmts = body.records.map((rec) => {
          const id = rec.id;
          const updateData = { ...rec, updated_at: now };
          delete updateData.id;
          delete updateData[ownerCol];
          const cols = Object.keys(updateData);
          if (cols.length === 0)
            return null;
          const sets = cols.map((c) => `${c.replace(/[^a-zA-Z_]/g, "")} = ?`).join(", ");
          const vals = cols.map((c) => updateData[c]);
          return env.DB.prepare(
            `UPDATE ${table} SET ${sets} WHERE id = ? AND ${ownerCol} = ?`
          ).bind(...vals, id, userKey);
        }).filter(Boolean);
        if (stmts.length === 0)
          return jsonBody({ count: 0 });
        await env.DB.batch(stmts);
        return jsonBody({ count: stmts.length });
      } catch (e) {
        return jsonBody({ error: "bulk_update_failed", message: e.message }, 500);
      }
    }
    if (body.query && body.update) {
      const setOps = body.update.$set || body.update;
      const cols = Object.keys(setOps);
      if (cols.length === 0)
        return jsonBody({ error: "no_fields" }, 400);
      setOps.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      const setCols = Object.keys(setOps);
      const sets = setCols.map((c) => `${c.replace(/[^a-zA-Z_]/g, "")} = ?`).join(", ");
      const setVals = setCols.map((c) => setOps[c]);
      const conditions = [`${ownerCol} = ?`];
      const binds = [userKey, ...setVals];
      for (const [key, value] of Object.entries(body.query)) {
        const safeKey = key.replace(/[^a-zA-Z_]/g, "");
        conditions.push(`${safeKey} = ?`);
        binds.push(value);
      }
      try {
        const result = await env.DB.prepare(
          `UPDATE ${table} SET ${sets} WHERE ` + conditions.join(" AND ")
        ).bind(...binds).run();
        return jsonBody({ count: result.meta.changes || 0 });
      } catch (e) {
        return jsonBody({ error: "update_many_failed", message: e.message }, 500);
      }
    }
    return jsonBody({ error: "invalid_bulk_patch" }, 400);
  }
  if (request.method === "DELETE" && idMatch) {
    const id = decodeURIComponent(idMatch[1]);
    try {
      const result = await env.DB.prepare(
        `DELETE FROM ${table} WHERE id = ? AND ${ownerCol} = ?`
      ).bind(id, userKey).run();
      if (result.meta.changes === 0)
        return jsonBody({ error: "not_found" }, 404);
      return jsonBody({ success: true, id });
    } catch (e) {
      return jsonBody({ error: "delete_failed", message: e.message }, 500);
    }
  }
  if (request.method === "DELETE" && isBulk) {
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const conditions = [`${ownerCol} = ?`];
    const binds = [userKey];
    if (body.query && typeof body.query === "object") {
      for (const [key, value] of Object.entries(body.query)) {
        const safeKey = key.replace(/[^a-zA-Z_]/g, "");
        conditions.push(`${safeKey} = ?`);
        binds.push(value);
      }
    }
    try {
      const result = await env.DB.prepare(
        `DELETE FROM ${table} WHERE ` + conditions.join(" AND ")
      ).bind(...binds).run();
      return jsonBody({ count: result.meta.changes || 0 });
    } catch (e) {
      return jsonBody({ error: "delete_many_failed", message: e.message }, 500);
    }
  }
  return jsonBody({ error: "method_not_allowed" }, 405);
}
__name(handleD1CRUD, "handleD1CRUD");
var homa_ai_worker_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders2() });
    }
    const url = new URL(request.url);
    if (url.pathname === "/payments/zarinpal/callback") {
      return await handlePaymentRoutes(request, env, url, { id: "" });
    }
    if (url.pathname.startsWith("/auth/")) {
      return await handleAuthRoutes(request, env, url);
    }
    if (url.pathname.startsWith("/api/")) {
      const auth = await requireAuth(request, env);
      if (auth.error)
        return auth.error;
      return await handleApiRoutes(request, env, url, auth.user);
    }
    if (url.pathname.startsWith("/admin/")) {
      return await handleAdminRoutes(request, env, url);
    }
    if (url.pathname.startsWith("/support/")) {
      const auth = await requireUserAuth(request, env);
      if (auth.error)
        return auth.error;
      return await handleSupportRoutes(request, env, url, auth.user);
    }
    if (url.pathname.startsWith("/referrals/")) {
      const auth = await requireUserAuth(request, env);
      if (auth.error)
        return auth.error;
      return await handleReferralRoutes(request, env, url, auth.user);
    }
    if (url.pathname.startsWith("/payments/")) {
      const auth = await requireUserAuth(request, env);
      if (auth.error)
        return auth.error;
      return await handlePaymentRoutes(request, env, url, auth.user);
    }
    if (request.method === "GET") {
      if (url.pathname === "/google/auth")
        return await handleGoogleAuth(request, env);
      if (url.pathname === "/google/callback")
        return await handleGoogleCallback(request, env);
      if (url.pathname === "/connection/status")
        return await handleConnectionStatusGet(request, env, url);
      const dataMatch = url.pathname.match(/^\/data\/([a-z_]+)(\/[^/]+)?$/);
      if (dataMatch && isValidEntity(dataMatch[1])) {
        const userToken2 = request.headers.get("X-User-Token") || "";
        if (!userToken2)
          return jsonBody({ error: "user_identity_required", code: "no_user_token" }, 401);
        let userKey2;
        try {
          userKey2 = await deriveUserKey2(userToken2, env);
        } catch {
          return jsonBody({ error: "user_identity_required", code: "no_user_token" }, 401);
        }
        return await handleD1CRUD(request, env, url, userKey2, dataMatch[1]);
      }
      const jobGetMatch = url.pathname.match(/^\/jobs\/([^/]+)$/);
      if (jobGetMatch) {
        const userToken2 = request.headers.get("X-User-Token") || "";
        if (!userToken2)
          return jsonBody({ error: "user_identity_required", code: "no_user_token" }, 401);
        let userKey2;
        try {
          userKey2 = await deriveUserKey2(userToken2, env);
        } catch {
          return jsonBody({ error: "user_identity_required", code: "no_user_token" }, 401);
        }
        return await handleGetJob(decodeURIComponent(jobGetMatch[1]), env, userKey2);
      }
      if (/^\/(alarms|reminders)(\/[^/]+){0,2}$/.test(url.pathname)) {
        const userToken2 = request.headers.get("X-User-Token") || "";
        if (!userToken2)
          return jsonBody({ error: "user_identity_required", code: "no_user_token" }, 401);
        let userKey2;
        try {
          userKey2 = await deriveUserKey2(userToken2, env);
        } catch {
          return jsonBody({ error: "user_identity_required", code: "no_user_token" }, 401);
        }
        if (url.pathname.startsWith("/alarms/history"))
          return await handleAlarmCRUD(request, env, url, userKey2, "history", "/alarms/history");
        const kvKind = url.pathname.startsWith("/reminders") ? "reminders" : "alarms";
        return await handleAlarmCRUD(request, env, url, userKey2, kvKind, "/" + kvKind);
      }
      return new Response("Not found", { status: 404 });
    }
    if (request.method !== "POST" && request.method !== "PATCH" && request.method !== "DELETE") {
      return new Response("Method not allowed", { status: 405 });
    }
    const userToken = request.headers.get("X-User-Token") || "";
    if (!userToken)
      return jsonBody({ error: "user_identity_required", code: "no_user_token" }, 401);
    let userKey = "";
    try {
      userKey = await deriveUserKey2(userToken, env);
    } catch {
      return jsonBody({ error: "user_identity_required", code: "no_user_token" }, 401);
    }
    try {
      if (isDataRoute) {
        const entityMatch = url.pathname.match(/^\/data\/([a-z_]+)/);
        if (entityMatch && isValidEntity(entityMatch[1])) {
          return await handleD1CRUD(request, env, url, userKey, entityMatch[1]);
        }
      }
      if (isAlarmRoute) {
        if (url.pathname.startsWith("/alarms/history"))
          return await handleAlarmCRUD(request, env, url, userKey, "history", "/alarms/history");
        const kvKind = url.pathname.startsWith("/reminders") ? "reminders" : "alarms";
        return await handleAlarmCRUD(request, env, url, userKey, kvKind, "/" + kvKind);
      }
      if (url.pathname === "/connect") {
        const body2 = await request.json();
        return await handleConnectTool(body2, env, userKey);
      }
      if (url.pathname === "/disconnect") {
        const body2 = await request.json();
        return await handleDisconnectTool(body2, env, userKey);
      }
      if (url.pathname === "/connection/status") {
        const body2 = await request.json();
        return await handleConnectionStatus(body2, env, userKey);
      }
      if (url.pathname === "/jobs" && request.method === "POST") {
        const body2 = await request.json();
        return await handleCreateJob(body2, env, userKey);
      }
      const jobMatch = url.pathname.match(/^\/jobs\/([^/]+)(\/cancel)?$/);
      if (jobMatch) {
        const jobId = decodeURIComponent(jobMatch[1]);
        if (jobMatch[2] === "/cancel")
          return await handleCancelJob(jobId, env, userKey);
        return await handleGetJob(jobId, env, userKey);
      }
      const body = await request.json();
      const type = body.type || "chat";
      if (type === "google_status")
        return await handleGoogleStatus(body, env, userKey);
      if (type === "google_tasks_create")
        return await handleGoogleTaskCreate(body, env, userKey);
      if (type === "google_calendar_create")
        return await handleGoogleCalendarCreate(body, env, userKey);
      if (type === "google_disconnect")
        return await handleGoogleDisconnect(body, env, userKey);
      if (type === "web_search")
        return await handleWebSearch(body, env);
      if (type === "deep_research")
        return await handleDeepResearch(body, env);
      if (type === "tts")
        return await handleTTS(body, env);
      if (type === "analyze")
        return await handleAnalyze(body, env);
      if (type === "generate_prompt")
        return await handleGeneratePrompt(body, env);
      if (type === "upload_file")
        return await handleUploadFile(body, env);
      if (type === "file_analyze")
        return await handleFileAnalyze(body, env);
      if (type === "image_generate")
        return await handleImageGenerate(body, env);
      if (type === "image_edit")
        return await handleImageEdit(body, env);
      if (type === "video_generate")
        return await handleVideoGenerate(body, env);
      if (type === "stt")
        return await handleSTT(body, env);
      if (type === "global_search")
        return await handleGlobalSearch(body, env, request);
      if (type === "tool_route")
        return await handleToolRoute(body, env);
      const messages = body.messages;
      if (!Array.isArray(messages) || messages.length === 0)
        return jsonBody({ error: "messages required" });
      const language = body.language || "fa";
      const requestedModel = body.model || "auto";
      const codeMode = !!body.codeMode;
      const codeAction = body.codeAction || "";
      const systemExtra = body.system_extra || "";
      const imageData = Array.isArray(body.image_data) ? body.image_data.filter((b) => typeof b === "string" && b.startsWith("data:image")) : [];
      if (!MODEL_ALLOWLIST[requestedModel])
        return jsonBody({ error: "invalid_model" });
      const system = buildSystemPrompt(language, codeMode, codeAction, systemExtra);
      if (imageData.length > 0) {
        const visionMessages = [{ role: "system", content: system + "\n\n\u0634\u0645\u0627 \u062A\u0635\u0627\u0648\u06CC\u0631 \u0648\u0627\u0642\u0639\u06CC \u062F\u0631\u06CC\u0627\u0641\u062A \u06A9\u0631\u062F\u0647\u200C\u0627\u06CC\u062F. \u0645\u062D\u062A\u0648\u0627\u06CC \u0628\u0635\u0631\u06CC \u0647\u0631 \u062A\u0635\u0648\u06CC\u0631 \u0631\u0627 \u0645\u0633\u062A\u0642\u06CC\u0645\u0627\u064B \u062A\u062D\u0644\u06CC\u0644 \u06A9\u0646 \u2014 \u0627\u0634\u06CC\u0627\u060C \u0631\u0646\u06AF\u200C\u0647\u0627\u060C \u0645\u062A\u0646 \u062F\u0627\u062E\u0644 \u062A\u0635\u0648\u06CC\u0631 \u0648 \u062C\u0632\u0626\u06CC\u0627\u062A \u0628\u0635\u0631\u06CC \u0631\u0627 \u062A\u0648\u0635\u06CC\u0641 \u06A9\u0646. \u0647\u0631\u06AF\u0632 \u0628\u0647 \u0646\u0627\u0645 \u0641\u0627\u06CC\u0644 \u062A\u06A9\u06CC\u0647 \u0646\u06A9\u0646." }];
        for (const m of messages) {
          if (m.role === "user" && m === messages[messages.length - 1]) {
            const content = [{ type: "text", text: m.content || "" }];
            for (const img of imageData.slice(0, 10))
              content.push({ type: "image_url", image_url: { url: img } });
            visionMessages.push({ role: "user", content });
          } else {
            visionMessages.push({ role: m.role, content: m.content || "" });
          }
        }
        let result2 = await callGroqVision(visionMessages, env);
        if (result2.error)
          result2 = await callOpenRouterVision(visionMessages, env);
        return jsonBody(result2);
      }
      const apiMessages = [{ role: "system", content: system }, ...messages];
      let result;
      if (requestedModel === "auto") {
        result = await callGroq(apiMessages, env);
        if (result.error) {
          const autoModel = pickAutoModel(messages);
          result = await callOpenRouter(autoModel, apiMessages, env);
        }
      } else {
        result = await callOpenRouter(requestedModel, apiMessages, env);
        if (result.error && requestedModel !== "lightning") {
          const retry = await callOpenRouter("lightning", apiMessages, env);
          if (!retry.error)
            result = retry;
        }
      }
      return jsonBody(result);
    } catch (error) {
      return jsonBody({ error: error.message || "internal_error" });
    }
  },
  // Cron-triggered background smart-watch checker.
  // INACTIVE until deployed with [triggers] cron in wrangler.toml AND the
  // fetchProductPrice helper is extracted (see runSmartWatchChecks above).
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runSmartWatchChecks(env));
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-VbBtD4/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = homa_ai_worker_default;

// node_modules/wrangler/templates/middleware/common.ts
init_checked_fetch();
init_strip_cf_connecting_ip_header();
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-VbBtD4/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=homa-ai-worker.js.map
