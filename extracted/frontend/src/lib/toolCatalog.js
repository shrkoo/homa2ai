/**
 * Homa Tool Catalog — Central registry of capabilities, internal providers, and external tools.
 * This is the foundation for the Homa Tool Router system.
 * Adding a new capability or provider only requires editing this file.
 */

export const CATEGORIES = {
  TEXT: { id: 'TEXT', icon: 'MessageSquare', label: { fa: 'متن و استدلال', en: 'Text & AI', ku: 'دەق و AI' } },
  CODING: { id: 'CODING', icon: 'Code', label: { fa: 'کدنویسی', en: 'Coding', ku: 'کۆد' } },
  WEB: { id: 'WEB', icon: 'Globe', label: { fa: 'وب و جستجو', en: 'Search', ku: 'گەڕان' } },
  IMAGE: { id: 'IMAGE', icon: 'Image', label: { fa: 'تصویر', en: 'Image', ku: 'وێنە' } },
  VIDEO: { id: 'VIDEO', icon: 'Video', label: { fa: 'ویدیو', en: 'Video', ku: 'ڤیدیۆ' } },
  VOICE: { id: 'VOICE', icon: 'Mic', label: { fa: 'صدا', en: 'Voice', ku: 'دەنگ' } },
  AUDIO: { id: 'AUDIO', icon: 'Audio', label: { fa: 'صوت‌شناسی', en: 'Audio', ku: 'ئۆدیۆ' } },
  MUSIC: { id: 'MUSIC', icon: 'Music', label: { fa: 'موسیقی', en: 'Music', ku: 'مۆسیقا' } },
  FILES: { id: 'FILES', icon: 'File', label: { fa: 'فایل', en: 'Files', ku: 'فایل' } },
  PRODUCT: { id: 'PRODUCT', icon: 'ShoppingBag', label: { fa: 'خرید', en: 'Shopping', ku: 'کڕین' } },
  SOCIAL: { id: 'SOCIAL', icon: 'Share2', label: { fa: 'سوشال', en: 'Social', ku: 'سۆشیاڵ' } },
};

export const CAPABILITIES = {
  // Text & AI
  TEXT_GENERATION: { id: 'TEXT_GENERATION', category: 'TEXT', internal: true, label: { fa: 'تولید متن', en: 'Text Generation', ku: 'بەرهەمهێنانی دەق' } },
  REASONING: { id: 'REASONING', category: 'TEXT', internal: true, label: { fa: 'استدلال عمیق', en: 'Deep Reasoning', ku: 'استدلالی قووڵ' } },
  // Coding
  CODE_GENERATION: { id: 'CODE_GENERATION', category: 'CODING', internal: true, label: { fa: 'تولید کد', en: 'Code Generation', ku: 'بەرهەمهێنانی کۆد' } },
  CODE_DEBUGGING: { id: 'CODE_DEBUGGING', category: 'CODING', internal: true, label: { fa: 'رفع باگ', en: 'Debugging', ku: 'چاککردنی باگ' } },
  // Search / Web
  WEB_SEARCH: { id: 'WEB_SEARCH', category: 'WEB', internal: true, label: { fa: 'جستجوی وب', en: 'Web Search', ku: 'گەڕانی وێب' } },
  DEEP_RESEARCH: { id: 'DEEP_RESEARCH', category: 'WEB', internal: true, label: { fa: 'پژوهش عمیق', en: 'Deep Research', ku: 'لێکۆڵینەوەی قووڵ' } },
  WEBSITE_ANALYSIS: { id: 'WEBSITE_ANALYSIS', category: 'WEB', internal: true, label: { fa: 'تحلیل وب‌سایت', en: 'Website Analysis', ku: 'شیکاری وێبسایت' } },
  // Image
  IMAGE_GENERATION: { id: 'IMAGE_GENERATION', category: 'IMAGE', internal: true, label: { fa: 'تولید تصویر', en: 'Image Generation', ku: 'بەرهەمهێنانی وێنە' } },
  IMAGE_ANALYSIS: { id: 'IMAGE_ANALYSIS', category: 'IMAGE', internal: true, label: { fa: 'تحلیل تصویر', en: 'Image Analysis', ku: 'شیکاری وێنە' } },
  IMAGE_EDITING: { id: 'IMAGE_EDITING', category: 'IMAGE', internal: false, label: { fa: 'ویرایش تصویر', en: 'Image Editing', ku: 'دەستکاری وێنە' } },
  IMAGE_UPSCALING: { id: 'IMAGE_UPSCALING', category: 'IMAGE', internal: false, label: { fa: 'افزایش کیفیت تصویر', en: 'Image Upscaling', ku: 'بەرزکردنەوەی کوالیتی' } },
  BACKGROUND_REMOVAL: { id: 'BACKGROUND_REMOVAL', category: 'IMAGE', internal: false, label: { fa: 'حذف پس‌زمینه', en: 'Background Removal', ku: 'سڕینەوەی پاشبنەما' } },
  IMAGE_RESTYLE: { id: 'IMAGE_RESTYLE', category: 'IMAGE', internal: false, label: { fa: 'تغییر سبک تصویر', en: 'Restyle', ku: 'گۆڕینی ستایل' } },
  IMAGE_VARIATION: { id: 'IMAGE_VARIATION', category: 'IMAGE', internal: false, label: { fa: 'تولید واریاسیون', en: 'Variation', ku: 'جۆراوجۆری' } },
  // Video
  VIDEO_GENERATION: { id: 'VIDEO_GENERATION', category: 'VIDEO', internal: false, label: { fa: 'تولید ویدیو', en: 'Text to Video', ku: 'بەرهەمهێنانی ڤیدیۆ' } },
  IMAGE_TO_VIDEO: { id: 'IMAGE_TO_VIDEO', category: 'VIDEO', internal: false, label: { fa: 'تصویر به ویدیو', en: 'Image to Video', ku: 'وێنە بۆ ڤیدیۆ' } },
  VIDEO_TO_VIDEO: { id: 'VIDEO_TO_VIDEO', category: 'VIDEO', internal: false, label: { fa: 'ویدیو به ویدیو', en: 'Video to Video', ku: 'ڤیدیۆ بۆ ڤیدیۆ' } },
  VIDEO_EDITING: { id: 'VIDEO_EDITING', category: 'VIDEO', internal: false, label: { fa: 'ویرایش ویدیو', en: 'Video Editing', ku: 'دەستکاری ڤیدیۆ' } },
  VIDEO_ANALYSIS: { id: 'VIDEO_ANALYSIS', category: 'VIDEO', internal: false, label: { fa: 'تحلیل ویدیو', en: 'Video Analysis', ku: 'شیکاری ڤیدیۆ' } },
  VIDEO_UPSCALE: { id: 'VIDEO_UPSCALE', category: 'VIDEO', internal: false, label: { fa: 'افزایش کیفیت ویدیو', en: 'Video Upscale', ku: 'بەرزکردنەوەی ڤیدیۆ' } },
  AVATAR_VIDEO: { id: 'AVATAR_VIDEO', category: 'VIDEO', internal: false, label: { fa: 'ویدیوی آواتار', en: 'Avatar Video', ku: 'ڤیدیۆی ئەڤاتار' } },
  LIP_SYNC: { id: 'LIP_SYNC', category: 'VIDEO', internal: false, label: { fa: 'لب‌سنک', en: 'Lip Sync', ku: 'لیپ‌سینک' } },
  // Voice
  TEXT_TO_SPEECH: { id: 'TEXT_TO_SPEECH', category: 'VOICE', internal: true, label: { fa: 'متن به صدا', en: 'Text to Speech', ku: 'دەق بۆ دەنگ' } },
  SPEECH_TO_TEXT: { id: 'SPEECH_TO_TEXT', category: 'VOICE', internal: true, label: { fa: 'صدا به متن', en: 'Speech to Text', ku: 'دەنگ بۆ دەق' } },
  VOICE_CLONING: { id: 'VOICE_CLONING', category: 'VOICE', internal: false, label: { fa: 'کلون صدا', en: 'Voice Cloning', ku: 'کلۆنی دەنگ' } },
  VOICE_CONVERSION: { id: 'VOICE_CONVERSION', category: 'VOICE', internal: false, label: { fa: 'تبدیل صدا', en: 'Voice Conversion', ku: 'گۆڕینی دەنگ' } },
  // Audio
  AUDIO_ANALYSIS: { id: 'AUDIO_ANALYSIS', category: 'AUDIO', internal: false, label: { fa: 'تحلیل صوت', en: 'Audio Analysis', ku: 'شیکاری ئۆدیۆ' } },
  NOISE_REMOVAL: { id: 'NOISE_REMOVAL', category: 'AUDIO', internal: false, label: { fa: 'حذف نویز', en: 'Noise Removal', ku: 'سڕینەوەی نۆیز' } },
  // Music
  MUSIC_GENERATION: { id: 'MUSIC_GENERATION', category: 'MUSIC', internal: false, label: { fa: 'تولید موسیقی', en: 'Music Generation', ku: 'بەرهەمهێنانی مۆسیقا' } },
  SONG_GENERATION: { id: 'SONG_GENERATION', category: 'MUSIC', internal: false, label: { fa: 'تولید آهنگ با کلام', en: 'Song Generation', ku: 'بەرهەمهێنانی گۆرانی' } },
  LYRICS_GENERATION: { id: 'LYRICS_GENERATION', category: 'MUSIC', internal: true, label: { fa: 'تولید شعر', en: 'Lyrics', ku: 'هۆنراوە' } },
  MUSIC_EDITING: { id: 'MUSIC_EDITING', category: 'MUSIC', internal: false, label: { fa: 'ویرایش موسیقی', en: 'Music Editing', ku: 'دەستکاری مۆسیقا' } },
  // Files
  FILE_ANALYSIS: { id: 'FILE_ANALYSIS', category: 'FILES', internal: true, label: { fa: 'تحلیل فایل', en: 'File Analysis', ku: 'شیکاری فایل' } },
  // Shopping
  GLOBAL_SEARCH: { id: 'GLOBAL_SEARCH', category: 'PRODUCT', internal: true, label: { fa: 'جستجوی جهانی', en: 'Global Search', ku: 'گەڕانی جیهانی' } },
  // Social
  INSTAGRAM_ANALYSIS: { id: 'INSTAGRAM_ANALYSIS', category: 'SOCIAL', internal: true, label: { fa: 'تحلیل اینستاگرام', en: 'Instagram Analysis', ku: 'شیکاری ئینستاگرام' } },
  TIKTOK_ANALYSIS: { id: 'TIKTOK_ANALYSIS', category: 'SOCIAL', internal: true, label: { fa: 'تحلیل تیک‌تاک', en: 'TikTok Analysis', ku: 'شیکاری TikTok' } },
  FACEBOOK_ANALYSIS: { id: 'FACEBOOK_ANALYSIS', category: 'SOCIAL', internal: true, label: { fa: 'تحلیل فیسبوک', en: 'Facebook Analysis', ku: 'شیکاری Facebook' } },
};

export const INTERNAL_PROVIDERS = [
  { id: 'groq', name: 'Groq', capabilities: ['TEXT_GENERATION', 'SPEECH_TO_TEXT', 'IMAGE_ANALYSIS', 'CODE_GENERATION', 'CODE_DEBUGGING', 'REASONING'], status: 'active' },
  { id: 'openrouter', name: 'OpenRouter', capabilities: ['TEXT_GENERATION', 'IMAGE_ANALYSIS', 'CODE_GENERATION', 'REASONING'], status: 'active' },
  { id: 'pollinations', name: 'Pollinations', capabilities: ['IMAGE_GENERATION'], status: 'active', free: true },
  { id: 'piper', name: 'Piper TTS', capabilities: ['TEXT_TO_SPEECH'], status: 'inactive' },
];

// Client-side intent detection patterns (fast path, no API call needed)
export const TOOL_PATTERNS = [
  // Video
  { pattern: /تبدیل.*ویدیو|تصویر.*ویدیو|image\s*to\s*video|photo\s*to\s*video|وێنە.*ڤیدیۆ/i, capability: 'IMAGE_TO_VIDEO' },
  { pattern: /ویدیو.*به.*ویدیو|video\s*to\s*video|ڤیدیۆ.*بۆ.*ڤیدیۆ/i, capability: 'VIDEO_TO_VIDEO' },
  { pattern: /ساخت\s*ویدیو|تولید\s*ویدیو|generate\s+video|create\s+video|بەرهەمهێنانی\s*ڤیدیۆ|ویدیوی\s*تبلیغاتی/i, capability: 'VIDEO_GENERATION' },
  { pattern: /آواتار|avatar|سخنگو|گفتارو|ئەڤاتار/i, capability: 'AVATAR_VIDEO' },
  { pattern: /لب\s*سنک|lip\s*sync|لیپ\s*سینک/i, capability: 'LIP_SYNC' },
  { pattern: /تحلیل\s*ویدیو|analyze\s+video|video\s+analysis|شیکاری\s*ڤیدیۆ/i, capability: 'VIDEO_ANALYSIS' },
  { pattern: /ویرایش\s*ویدیو|edit\s+video|video\s+edit|دەستکاری\s*ڤیدیۆ/i, capability: 'VIDEO_EDITING' },
  { pattern: /افزایش\s*کیفیت\s*ویدیو|upscale\s+video|بەرزکردنەوەی\s*ڤیدیۆ/i, capability: 'VIDEO_UPSCALE' },
  // Image
  { pattern: /ساخت\s*عکس|ساخت\s*تصویر|تولید\s*تصویر|generate\s+image|create\s+image|بەرهەمهێنانی\s*وێنە|عکس\s*از/i, capability: 'IMAGE_GENERATION' },
  { pattern: /ویرایش\s*تصویر|edit\s+image|image\s+edit|دەستکاری\s*وێنە/i, capability: 'IMAGE_EDITING' },
  { pattern: /افزایش\s*کیفیت\s*تصویر|upscale\s+image|بالا\s*بردن\s*کیفیت|بەرزکردنەوەی\s*کوالیتی/i, capability: 'IMAGE_UPSCALING' },
  { pattern: /حذف\s*پس\s*زمینه|remove\s+background|سڕینەوەی\s*پاشبنەما/i, capability: 'BACKGROUND_REMOVAL' },
  { pattern: /تغییر\s*سبک|restyle|گۆڕینی\s*ستایل/i, capability: 'IMAGE_RESTYLE' },
  { pattern: /واریاسیون|variation|جۆراوجۆری/i, capability: 'IMAGE_VARIATION' },
  // Music
  { pattern: /موسیقی|تولید\s*آهنگ|generate\s+music|music\s+generation|مۆسیقا|بەرهەمهێنانی\s*مۆسیقا|آهنگ\s*ساز/i, capability: 'MUSIC_GENERATION' },
  { pattern: /آهنگ\s*با\s*کلام|song\s+generation|گۆرانی\s*بەرهەمهێنان/i, capability: 'SONG_GENERATION' },
  { pattern: /شعر\s*برای|lyrics|هۆنراوە/i, capability: 'LYRICS_GENERATION' },
  // Voice
  { pattern: /کلون\s*صدا|voice\s+clon|کلۆنی\s*دەنگ/i, capability: 'VOICE_CLONING' },
  { pattern: /تبدیل\s*صدا|voice\s+conversion|گۆڕینی\s*دەنگ/i, capability: 'VOICE_CONVERSION' },
  { pattern: /حذف\s*نویز|noise\s+removal|سڕینەوەی\s*نۆیز/i, capability: 'NOISE_REMOVAL' },
  // Internal capabilities — auto-route to built-in tools
  { pattern: /ارزون|ارزان|قیمت|خرید|فروش|فروشگاه|cheapest|بهترین\s*قیمت|قیمتش?\s*چنده|قیمت\s*روز|مقایسه\s*(قیمت|فروشگاه|سایت|محصول)|از\s*کجا\s*بخرم|لینک\s*خرید|محصول\s*پیدا\s*کن|در\s*اینترنت\s*پیدا|سایت‌?های\s*(ایرانی|خارجی)|همه\s*سایت‌ها|where\s+to\s+buy|find\s+product|price\s+comparison|best\s+price|lowest\s+price|تخفیف|آفر|حراج|کالا|محصولات|نرخ\s*روز|بخرم|بخرید|خریدم|دلار|تومان|هزار\s*تومان|میلیون\s*تومان|online\s+store|buy\s+online|order\s+online|shop\s+online|deals?\s+online/i, capability: 'GLOBAL_SEARCH' },
  { pattern: /سرچ\s*کن|جستجو\s*کن|جستجوی\s*وب|search\s+the\s+web|find\s+online|look\s+up|بگرد|جستجو\s*کن\s*در\s*وب/i, capability: 'WEB_SEARCH' },
  { pattern: /پژوهش\s*عمیق|تحقیق\s*(کامل|جامع|عمیق)|deep\s+research|comprehensive\s+research|تحلیل\s*کامل|گزارش\s*جامع/i, capability: 'DEEP_RESEARCH' },
];

export function detectCapability(message) {
  for (const { pattern, capability } of TOOL_PATTERNS) {
    if (pattern.test(message)) return capability;
  }
  return null;
}

export function isInternalCapability(capabilityId) {
  const cap = CAPABILITIES[capabilityId];
  return cap?.internal === true;
}

export function getCapabilityById(id) {
  return CAPABILITIES[id] || null;
}

export function getInternalProviderForCapability(capabilityId) {
  return INTERNAL_PROVIDERS.find(p => p.status === 'active' && p.capabilities.includes(capabilityId)) || null;
}

export function getExternalToolsForCapability(capabilityId) {
  // Re-export from providerRegistry to keep a single source of truth
  return [];
}

export function getCategoryById(id) {
  return CATEGORIES[id] || null;
}