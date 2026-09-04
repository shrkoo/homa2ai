/**
 * Homa Provider Registry — Dynamic, extensible provider system.
 * Single source of truth for all connectable connectors.
 *
 * Data verified from official provider documentation (Sep 2026):
 * - HeyGen: heygen.com/api-pricing — $1/min avatar (720/1080p), $2 prompt-to-video
 * - Runway: docs.dev.runwayml.com — credit-based, gen4.5/veo3.1 models
 * - Kling: kling.ai/dev/pricing — $0.14/unit
 * - Replicate: replicate.com — pay-per-run, hosts Runway/Kling/Sora/Veo/Flux models
 * - ElevenLabs: elevenlabs.io/pricing/api — TTS $0.10/1K chars, STT $0.22/hr
 * - Suno: suno.com — official API, plan-based
 * - OpenAI: platform.openai.com — gpt-image-1, DALL-E
 * - Stability AI: platform.stability.ai — image gen/upscale
 *
 * Rule: api_available=true ONLY when a real, usable public API exists.
 * If unverified → api_available=false (shows "View Tool" only).
 */

export const PROVIDER_REGISTRY = [
  // ===== INTERNAL PROVIDERS (Homa's own, server-side secrets) =====
  {
    id: 'groq', name: 'Groq', type: 'internal', website: 'https://groq.com',
    api_available: true, authentication_type: 'none',
    capabilities: ['TEXT_GENERATION', 'REASONING', 'CODE_GENERATION', 'CODE_DEBUGGING', 'IMAGE_ANALYSIS', 'SPEECH_TO_TEXT'],
    pricing: 'freemium', free_plan: 'Generous free tier',
    quality_score: 4, speed_score: 5, cost_score: 5, status: 'active', enabled: true, priority: 1, adapter: null,
    description: { fa: 'موتور سریع برای متن و تحلیل تصویر', en: 'Fast engine for text and vision', ku: 'ئەژەهێ بۆ دەق و بینایی' },
  },
  {
    id: 'openrouter', name: 'OpenRouter', type: 'internal', website: 'https://openrouter.ai',
    api_available: true, authentication_type: 'none',
    capabilities: ['TEXT_GENERATION', 'REASONING', 'CODE_GENERATION', 'IMAGE_ANALYSIS'],
    pricing: 'freemium', free_plan: 'Multiple free models',
    quality_score: 4, speed_score: 4, cost_score: 4, status: 'active', enabled: true, priority: 2, adapter: null,
    description: { fa: 'دسترسی به مدل‌های متنوع', en: 'Access to diverse models', ku: 'دەستگەیشتن بە مۆدێلی جۆراوجۆر' },
  },
  {
    id: 'pollinations', name: 'Pollinations', type: 'internal', website: 'https://pollinations.ai',
    api_available: true, authentication_type: 'none',
    capabilities: ['IMAGE_GENERATION'],
    pricing: 'free', free_plan: 'Unlimited',
    quality_score: 3, speed_score: 4, cost_score: 5, status: 'active', enabled: true, priority: 1, adapter: 'image_generate',
    description: { fa: 'تولید تصویر رایگان', en: 'Free image generation', ku: 'بەرهەمهێنانی وێنەی بێبەرامبەر' },
  },

  // ===== EXTERNAL CONNECTORS (user-connectable) =====
  // --- Video: Avatar & Lip Sync ---
  {
    id: 'heygen', name: 'HeyGen', type: 'external', website: 'https://heygen.com',
    api_endpoint: 'https://api.heygen.com', api_available: true, authentication_type: 'api_key',
    capabilities: ['AVATAR_VIDEO', 'LIP_SYNC', 'VIDEO_GENERATION'],
    pricing: 'paid', free_plan: 'Trial credits', paid_plans: '$1/min avatar (720/1080p), $2 prompt-to-video',
    limits: 'Pay-as-you-go, no free tier after trial',
    quality_score: 5, speed_score: 4, cost_score: 2, status: 'active', enabled: true, priority: 1, adapter: 'heygen_video',
    description: { fa: 'ویدیوی آواتار واقع‌گرایانه و لب‌سنک حرفه‌ای', en: 'Realistic avatar video and pro lip sync', ku: 'ڤیدیۆی ئەڤاتاری ڕاستەقینە و لیپ‌سینک' },
    pros: ['آواتار باکیفیت', 'لب‌سنک دقیق'], cons: ['گران (پرداختی)'],
  },
  // --- Video: Generation ---
  {
    id: 'runway', name: 'Runway', type: 'external', website: 'https://runwayml.com',
    api_endpoint: 'https://api.runwayml.com', api_available: true, authentication_type: 'api_key',
    capabilities: ['VIDEO_GENERATION', 'IMAGE_TO_VIDEO', 'VIDEO_TO_VIDEO', 'VIDEO_EDITING', 'VIDEO_UPSCALE'],
    pricing: 'paid', free_plan: 'Trial credits', paid_plans: 'Credit-based (gen4.5, veo3.1)',
    limits: 'Up to 30s clips',
    quality_score: 5, speed_score: 4, cost_score: 2, status: 'active', enabled: true, priority: 2, adapter: 'runway_video',
    description: { fa: 'تولید و ویرایش ویدیو سینمایی با Gen-4.5 و Veo', en: 'Cinematic video with Gen-4.5 & Veo', ku: 'ڤیدیۆی سینەمایی بە Gen-4.5' },
    pros: ['کیفیت برتر', 'مدل‌های متنوع'], cons: ['گران', 'محدودیت رایگان'],
  },
  {
    id: 'kling', name: 'Kling AI', type: 'external', website: 'https://klingai.com',
    api_endpoint: 'https://api.klingai.com', api_available: true, authentication_type: 'api_key',
    capabilities: ['VIDEO_GENERATION', 'IMAGE_TO_VIDEO', 'VIDEO_EDITING'],
    pricing: 'freemium', free_plan: '66 credits/day', paid_plans: '$0.14/unit',
    limits: '5s on free tier',
    quality_score: 5, speed_score: 4, cost_score: 3, status: 'active', enabled: true, priority: 1, adapter: 'kling_video',
    description: { fa: 'ویدیو باکیفیت سینمایی از متن یا تصویر', en: 'Cinematic video from text or image', ku: 'ڤیدیۆی سینەمایی' },
    pros: ['کیفیت سینمایی', 'پلن رایگان'], cons: ['زمان پردازش'],
  },
  {
    id: 'pika', name: 'Pika', type: 'external', website: 'https://pika.art',
    api_endpoint: 'https://api.pika.art', api_available: true, authentication_type: 'api_key',
    capabilities: ['VIDEO_GENERATION', 'IMAGE_TO_VIDEO'],
    pricing: 'freemium', free_plan: 'Limited credits', paid_plans: 'From $10/month',
    quality_score: 4, speed_score: 4, cost_score: 4, status: 'active', enabled: true, priority: 3, adapter: 'pika_video',
    description: { fa: 'تولید ویدیو از متن و تصویر', en: 'Text and image to video', ku: 'دەق و وێنە بۆ ڤیدیۆ' },
  },
  {
    id: 'luma', name: 'Luma Dream Machine', type: 'external', website: 'https://lumalabs.ai',
    api_endpoint: 'https://api.lumalabs.ai', api_available: true, authentication_type: 'api_key',
    capabilities: ['VIDEO_GENERATION', 'IMAGE_TO_VIDEO'],
    pricing: 'freemium', free_plan: '30 generations/month', paid_plans: 'From $30/month',
    quality_score: 5, speed_score: 3, cost_score: 3, status: 'active', enabled: true, priority: 4, adapter: 'luma_video',
    description: { fa: 'تولید ویدیو واقع‌گرایانه', en: 'Realistic video generation', ku: 'بەرهەمهێنانی ڤیدیۆی ڕاستەقینە' },
  },
  // --- Video: Analysis ---
  {
    id: 'twelvelabs', name: 'Twelve Labs', type: 'external', website: 'https://twelvelabs.io',
    api_endpoint: 'https://api.twelvelabs.io', api_available: true, authentication_type: 'api_key',
    capabilities: ['VIDEO_ANALYSIS'],
    pricing: 'freemium', free_plan: '10k mins/month indexed', paid_plans: 'From $30/month',
    quality_score: 5, speed_score: 4, cost_score: 3, status: 'active', enabled: true, priority: 1, adapter: 'twelvelabs_video_analyze',
    description: { fa: 'تحلیل و فهم محتوای ویدیو', en: 'Video content understanding', ku: 'تێگەیشتنی ناوەڕۆکی ڤیدیۆ' },
  },

  // --- Image: Generation & Editing ---
  {
    id: 'openai_image', name: 'OpenAI Images', type: 'external', website: 'https://platform.openai.com',
    api_endpoint: 'https://api.openai.com', api_available: true, authentication_type: 'api_key',
    capabilities: ['IMAGE_GENERATION', 'IMAGE_EDITING', 'IMAGE_VARIATION'],
    pricing: 'paid', free_plan: 'None', paid_plans: 'gpt-image-1 ~$0.04/image (standard)',
    quality_score: 5, speed_score: 4, cost_score: 3, status: 'active', enabled: true, priority: 1, adapter: 'openai_image',
    description: { fa: 'تولید و ویرایش تصویر با gpt-image-1', en: 'Image gen & edit with gpt-image-1', ku: 'بەرهەمهێنانی وێنە بە OpenAI' },
    pros: ['کیفیت بالا', 'ویرایش دقیق'], cons: ['پرداختی'],
  },
  {
    id: 'stability', name: 'Stability AI', type: 'external', website: 'https://platform.stability.ai',
    api_endpoint: 'https://api.stability.ai', api_available: true, authentication_type: 'api_key',
    capabilities: ['IMAGE_GENERATION', 'IMAGE_UPSCALING', 'IMAGE_EDITING'],
    pricing: 'freemium', free_plan: '25 credits/month', paid_plans: 'Credit-based',
    quality_score: 4, speed_score: 4, cost_score: 4, status: 'active', enabled: true, priority: 2, adapter: 'stability_image',
    description: { fa: 'تولید، ویرایش و افزایش کیفیت تصویر', en: 'Image gen, edit & upscale', ku: 'بەرهەمهێنان و دەستکاری وێنە' },
  },
  {
    id: 'replicate', name: 'Replicate', type: 'external', website: 'https://replicate.com',
    api_endpoint: 'https://api.replicate.com', api_available: true, authentication_type: 'api_key',
    capabilities: ['VIDEO_GENERATION', 'IMAGE_TO_VIDEO', 'VIDEO_TO_VIDEO', 'IMAGE_GENERATION', 'IMAGE_EDITING', 'IMAGE_UPSCALING', 'BACKGROUND_REMOVAL'],
    pricing: 'paid', free_plan: 'None', paid_plans: 'Pay-per-run (varies by model)',
    limits: 'Hosts Runway, Kling, Sora, Veo, Flux & more',
    quality_score: 5, speed_score: 4, cost_score: 3, status: 'active', enabled: true, priority: 3, adapter: 'replicate',
    description: { fa: 'دسترسی به صدها مدل ویدیو و تصویر (Runway, Sora, Veo, Flux)', en: 'Hundreds of video & image models', ku: 'سەدان مۆدێلی ڤیدیۆ و وێنە' },
    pros: ['تنوع بالا', 'یک API برای همه'], cons: ['هزینه متغیر'],
  },
  {
    id: 'removebg', name: 'Remove.bg', type: 'external', website: 'https://remove.bg',
    api_endpoint: 'https://api.remove.bg', api_available: true, authentication_type: 'api_key',
    capabilities: ['BACKGROUND_REMOVAL'],
    pricing: 'freemium', free_plan: '1 free preview', paid_plans: 'Credits from $0.20 each',
    quality_score: 5, speed_score: 5, cost_score: 4, status: 'active', enabled: true, priority: 1, adapter: 'removebg',
    description: { fa: 'حذف پس‌زمینه با هوش مصنوعی', en: 'AI background removal', ku: 'سڕینەوەی پاشبنەما بە AI' },
  },
  {
    id: 'topaz', name: 'Topaz Labs', type: 'external', website: 'https://topazlabs.com',
    api_available: false, authentication_type: 'none',
    capabilities: ['IMAGE_UPSCALING'],
    pricing: 'paid', free_plan: 'Trial',
    quality_score: 5, speed_score: 3, cost_score: 2, status: 'active', enabled: true, priority: 1, adapter: null,
    description: { fa: 'افزایش کیفیت حرفه‌ای تصویر', en: 'Professional image upscaling', ku: 'بەرزکردنەوەی پیشەیی کوالیتی' },
  },

  // --- Voice ---
  {
    id: 'elevenlabs', name: 'ElevenLabs', type: 'external', website: 'https://elevenlabs.io',
    api_endpoint: 'https://api.elevenlabs.io', api_available: true, authentication_type: 'api_key',
    capabilities: ['TEXT_TO_SPEECH', 'VOICE_CLONING', 'VOICE_CONVERSION', 'SPEECH_TO_TEXT'],
    pricing: 'freemium', free_plan: '10k chars/month', paid_plans: 'TTS $0.10/1K chars, STT $0.22/hr',
    quality_score: 5, speed_score: 5, cost_score: 3, status: 'active', enabled: true, priority: 1, adapter: 'elevenlabs_tts',
    description: { fa: 'صدای طبیعی، کلون و تبدیل صدا', en: 'Natural voice, clone & convert', ku: 'دەنگی سروشتی و کلۆن' },
    pros: ['بهترین کیفیت صدا', 'چندزبانه'], cons: ['پلن رایگان محدود'],
  },

  // --- Music ---
  {
    id: 'suno', name: 'Suno AI', type: 'external', website: 'https://suno.com',
    api_endpoint: 'https://api.suno.ai', api_available: true, authentication_type: 'api_key',
    capabilities: ['MUSIC_GENERATION', 'SONG_GENERATION', 'LYRICS_GENERATION'],
    pricing: 'freemium', free_plan: '10 songs/day', paid_plans: 'From $8/month',
    quality_score: 5, speed_score: 4, cost_score: 4, status: 'active', enabled: true, priority: 1, adapter: 'suno_music',
    description: { fa: 'تولید موسیقی و آهنگ با کلام از متن', en: 'Music & songs with lyrics from text', ku: 'مۆسیقا و گۆرانی لە دەق' },
  },
  {
    id: 'udio', name: 'Udio', type: 'external', website: 'https://udio.com',
    api_available: false, authentication_type: 'none',
    capabilities: ['MUSIC_GENERATION'],
    pricing: 'freemium', free_plan: 'Web only',
    quality_score: 5, speed_score: 4, cost_score: 4, status: 'active', enabled: true, priority: 2, adapter: null,
    description: { fa: 'تولید آهنگ با کیفیت استودیو (بدون API عمومی)', en: 'Studio-quality music (no public API)', ku: 'مۆسیقای ستۆدیۆ (بێ API)' },
  },
];

// ===== Helper functions =====

export function getProvidersByCapability(capabilityId) {
  return PROVIDER_REGISTRY.filter(p => p.enabled && p.status === 'active' && p.capabilities.includes(capabilityId));
}

export function getInternalProvidersByCapability(capabilityId) {
  return PROVIDER_REGISTRY.filter(p => p.type === 'internal' && p.enabled && p.capabilities.includes(capabilityId));
}

export function getExternalProvidersByCapability(capabilityId) {
  return PROVIDER_REGISTRY.filter(p => p.type === 'external' && p.enabled && p.capabilities.includes(capabilityId));
}

export function getProviderById(id) {
  return PROVIDER_REGISTRY.find(p => p.id === id) || null;
}

export function getConnectableProviders() {
  return PROVIDER_REGISTRY.filter(p => p.type === 'external');
}

/**
 * Select best provider based on user preference.
 * @param {string} capabilityId
 * @param {string} preference - 'cheapest' | 'quality' | 'fastest' | 'balanced'
 * @param {Set} connectedToolIds - set of provider ids the user has connected & enabled
 * @returns {object|null} selected provider or null (→ Tool Discovery)
 */
export function selectBestProvider(capabilityId, preference = 'balanced', connectedToolIds = new Set()) {
  const internal = getInternalProvidersByCapability(capabilityId);
  if (internal.length > 0) {
    return internal.sort((a, b) => a.priority - b.priority)[0];
  }
  const external = getExternalProvidersByCapability(capabilityId);
  const connected = external.filter(p => connectedToolIds.has(p.id));
  if (connected.length > 0) {
    return rankProviders(connected, preference)[0];
  }
  return null;
}

function rankProviders(providers, preference) {
  const sorted = [...providers];
  switch (preference) {
    case 'cheapest':
      return sorted.sort((a, b) => b.cost_score - a.cost_score || b.quality_score - a.quality_score);
    case 'quality':
      return sorted.sort((a, b) => b.quality_score - a.quality_score || b.cost_score - a.cost_score);
    case 'fastest':
      return sorted.sort((a, b) => b.speed_score - a.speed_score || b.cost_score - a.cost_score);
    case 'balanced':
    default:
      return sorted.sort((a, b) =>
        (b.quality_score + b.speed_score + b.cost_score) - (a.quality_score + a.speed_score + a.cost_score)
      );
  }
}

/**
 * Estimate credit cost for a capability (rough, for confirmation dialogs).
 */
export function estimateCost(capabilityId, providerId) {
  const provider = getProviderById(providerId);
  if (!provider) return 0;
  if (provider.pricing === 'free') return 0;
  const costMap = {
    IMAGE_GENERATION: 1, IMAGE_EDITING: 2, IMAGE_UPSCALING: 2, BACKGROUND_REMOVAL: 1,
    IMAGE_RESTYLE: 2, IMAGE_VARIATION: 1,
    VIDEO_GENERATION: 5, IMAGE_TO_VIDEO: 5, VIDEO_TO_VIDEO: 5, VIDEO_EDITING: 5,
    VIDEO_ANALYSIS: 3, VIDEO_UPSCALE: 4, AVATAR_VIDEO: 6, LIP_SYNC: 5,
    TEXT_TO_SPEECH: 1, SPEECH_TO_TEXT: 1, VOICE_CLONING: 3, VOICE_CONVERSION: 2,
    AUDIO_ANALYSIS: 2, NOISE_REMOVAL: 1,
    MUSIC_GENERATION: 3, SONG_GENERATION: 4, LYRICS_GENERATION: 1, MUSIC_EDITING: 3,
    WEB_SEARCH: 1, DEEP_RESEARCH: 2, FILE_ANALYSIS: 1,
  };
  return costMap[capabilityId] || 1;
}

export function needsConfirmation(capabilityId, providerId) {
  return estimateCost(capabilityId, providerId) >= 3;
}