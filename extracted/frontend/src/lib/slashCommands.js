/**
 * Slash Commands — quick-access shortcuts for connected tools.
 * User types /command prompt in the composer, no menu needed.
 */

export const SLASH_COMMANDS = [
  { cmd: '/image', icon: 'Image', capability: 'IMAGE_GENERATION',
    label: { fa: 'تولید تصویر', en: 'Generate Image', ku: 'بەرهەمهێنانی وێنە' } },
  { cmd: '/video', icon: 'Video', capability: 'VIDEO_GENERATION',
    label: { fa: 'تولید ویدیو', en: 'Generate Video', ku: 'بەرهەمهێنانی ڤیدیۆ' } },
  { cmd: '/music', icon: 'Music', capability: 'MUSIC_GENERATION',
    label: { fa: 'تولید موسیقی', en: 'Generate Music', ku: 'بەرهەمهێنانی مۆسیقا' } },
  { cmd: '/translate', icon: 'Languages', capability: 'TRANSLATE',
    label: { fa: 'ترجمه متن', en: 'Translate', ku: 'وەرگێڕان' } },
  { cmd: '/search', icon: 'Globe', capability: 'WEB_SEARCH',
    label: { fa: 'جستجوی وب', en: 'Web Search', ku: 'گەڕانی وێب' } },
  { cmd: '/research', icon: 'Brain', capability: 'DEEP_RESEARCH',
    label: { fa: 'پژوهش عمیق', en: 'Deep Research', ku: 'لێکۆڵینەوەی قووڵ' } },
  { cmd: '/shopping', icon: 'ShoppingBag', capability: 'GLOBAL_SEARCH',
    label: { fa: 'جستجوی محصول', en: 'Shopping Search', ku: 'گەڕانی کاڵا' } },
  { cmd: '/code', icon: 'Code', capability: 'CODE_GENERATION',
    label: { fa: 'کدنویسی', en: 'Code Generation', ku: 'کۆدنووسین' } },
  { cmd: '/remind', icon: 'Bell', capability: 'REMINDER',
    label: { fa: 'یادآور', en: 'Reminder', ku: 'بیرخستنەوە' } },
  { cmd: '/alarm', icon: 'AlarmClock', capability: 'ALARM',
    label: { fa: 'آلارم', en: 'Alarm', ku: 'ئاگادارکردنەوە' } },
];

/**
 * Parse a slash command from input text.
 * Returns { command, prompt } or null.
 */
export function parseSlashCommand(text) {
  const trimmed = text.trim();
  const match = trimmed.match(/^(\/\w+)\s+([\s\S]+)$/);
  if (!match) return null;
  const cmd = SLASH_COMMANDS.find((c) => c.cmd === match[1].toLowerCase());
  if (!cmd) return null;
  return { command: cmd, prompt: match[2].trim() };
}

/**
 * Check if input is a partial slash command (for autocomplete menu).
 * Returns the partial command string (e.g. "/im") or null.
 */
export function getPartialSlash(input) {
  if (!input.startsWith('/')) return null;
  if (input.includes(' ')) return null;
  return input;
}

/**
 * Filter commands by partial query.
 */
export function filterSlashCommands(query) {
  if (!query) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter((c) => c.cmd.startsWith(query));
}