// Shared dynamic relative-time formatter.
// Usage: timeAgo(dateStr, t, language) — t is the i18n translate fn, language is 'fa'|'ku'|'en'.
//
// ROOT-CAUSE FIX: The Base44 backend returns created_date/updated_date as
//   "2026-08-12T20:40:58.178000"  (NO timezone marker, value is UTC)
// JavaScript's new Date() interprets a timezone-less string as LOCAL TIME,
// causing a 3.5-hour error for Tehran (UTC+3:30) — exactly the "3 ساعت قبل" bug.
// Fix: detect timezone-less ISO strings and append 'Z' so JS treats them as UTC.
// Also trim 6-digit microseconds to 3-digit milliseconds for JS compatibility.

function parseServerDate(dateStr) {
  if (!dateStr) return NaN;
  let str = String(dateStr).trim();
  if (!str) return NaN;

  // Already has timezone info (Z or +HH:MM / -HH:MM at end)?
  const hasTimezone = /(Z|[+-]\d{2}:?\d{2})$/i.test(str);
  if (!hasTimezone) {
    // Trim 6-digit microseconds to 3-digit milliseconds, then append Z (UTC)
    str = str.replace(/\.(\d{6})$/, (m, p1) => '.' + p1.slice(0, 3));
    str += 'Z';
  }

  return new Date(str).getTime();
}

export function timeAgo(dateStr, t, language) {
  const ts = parseServerDate(dateStr);
  if (isNaN(ts)) return '';
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);

  if (min < 1) return t('just_now');
  if (min < 60) return min + ' ' + t('minutes_ago');

  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + ' ' + t('hours_ago');

  const day = Math.floor(hr / 24);
  if (day === 1) return t('yesterday');
  if (day < 7) return day + ' ' + t('days_ago');

  // Older than a week: show formatted date — ALWAYS Gregorian (Miladi) calendar
  try {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', calendar: 'gregory', numberingSystem: 'latn' });
  } catch {
    return new Date(ts).toLocaleDateString('en-US');
  }
}