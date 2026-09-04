// Helpers for rendering reminders as interactive cards inside Homa Chat.
// Reminders are created/managed via natural language in chat and rendered
// as fenced blocks (```reminder-card / ```reminder-list) that MessageItem
// turns into ReminderCard components.

export function reminderCardBlock(rem) {
  return '\n\n```reminder-card\n' + JSON.stringify(rem) + '\n```';
}

export function reminderListBlock(rems) {
  return '\n\n```reminder-list\n' + JSON.stringify(rems || []) + '\n```';
}

// Detect natural-language reminder MANAGEMENT commands (list / delete / toggle).
// Returns { type, title?, today?, activate? } or null.
// Creation intents ("یادم بنداز", "فردا ساعت ۸ یادآور ...") are handled separately
// in useChat and are NOT matched here.
export function detectReminderCommand(text) {
  const t = (text || '').trim();

  // List
  if (/یادآورهای?\s*من|یادآورهای?\s+امروز|یادآورهای?\s+هفته|لیست\s+یادآور|نمایش\s+یادآور|یادآورهامو?\s*نشون|یادآورهام\s+چیه|نشون\s*بده\s*یادآور|یادآورهام\s+رو\s+نشون/i.test(t)) {
    return { type: 'list', today: /امروز/.test(t) };
  }

  // Delete
  let m = t.match(/یادآور\s+(.+?)\s+رو\s+(?:حذف|پاک)\s+کن/i)
    || t.match(/(?:حذف|پاک)\s+کن\s+یادآور\s+(.+)/i)
    || t.match(/این\s+یادآور\s+رو\s+(?:حذف|پاک)\s+کن/i);
  if (m) return { type: 'delete', title: (m[1] || '').trim() };

  // Toggle off
  m = t.match(/یادآور\s+(.+?)\s+رو\s+غیرفعال\s+کن/i)
    || t.match(/غیرفعال\s+کن\s+یادآور\s+(.+)/i)
    || t.match(/این\s+یادآور\s+رو\s+غیرفعال\s+کن/i);
  if (m) return { type: 'toggle', title: (m[1] || '').trim(), activate: false };

  // Toggle on
  m = t.match(/یادآور\s+(.+?)\s+رو\s+(?:فعال|دوباره\s+فعال)\s+کن/i)
    || t.match(/(?:فعال|دوباره\s+فعال)\s+کن\s+یادآور\s+(.+)/i)
    || t.match(/این\s+یادآور\s+رو\s+(?:فعال|دوباره\s+فعال)\s+کن/i);
  if (m) return { type: 'toggle', title: (m[1] || '').trim(), activate: true };

  return null;
}

// Auto-tag a reminder by topic from its text. Returns one of: کاری / خرید / شخصی / عمومی
export function detectReminderTag(text) {
  const t = text || '';
  if (/(خرید|بخر|بخرم|مغازه|فروشگاه|بازار|قیمت|سفارش|لباس|کفش|گوشی|لپتاپ|کتاب|بلیط|تیکت|buy|shop|order)/i.test(t)) return 'خرید';
  if (/(کار|پروژه|جلسه|گزارش|ایمیل|تحویل|ددلاین|deadline|meeting|ارائه|مشتری|رئیس|همکار|کدنویسی|برنامه‌ریزی|تموم\s*کن|finish|submit|send)/i.test(t)) return 'کاری';
  if (/(تماس|خانواده|دوست|تولد|قرائت|ورزش|دکتر|نوشتن|خواندن|استراحت|خواب|غذا|شام|ناهار|صبحانه|تمیز|خانه|تمرین|call|family|friend|birthday|read|workout|doctor|gym)/i.test(t)) return 'شخصی';
  return 'عمومی';
}

// Build a weekly reminder summary as a chat message (Persian).
export function buildWeeklySummary(reminders, range) {
  const done = reminders.filter((r) => r.status === 'done');
  const pending = reminders.filter((r) => r.status === 'pending');
  const paused = reminders.filter((r) => r.status === 'paused' || r.status === 'snoozed');
  const cancelled = reminders.filter((r) => r.status === 'cancelled');
  const fmt = (d) => new Date(d).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });
  const startStr = range ? fmt(range.start) : '';
  const endStr = range ? fmt(range.end) : '';

  const lines = [];
  lines.push(`📊 **خلاصه یادآورهای هفته**`);
  lines.push(`(${startStr} تا ${endStr})\n`);
  lines.push(`✅ انجام‌شده: ${done.length}`);
  lines.push(`⏳ باقی‌مانده: ${pending.length}`);
  if (paused.length) lines.push(`⏸ متوقف‌شده: ${paused.length}`);
  if (cancelled.length) lines.push(`🗑 لغو شده: ${cancelled.length}`);

  if (pending.length) {
    lines.push('\n**یادآورهای باقی‌مانده:**');
    const sorted = [...pending].sort((a, b) => new Date(a.remind_at) - new Date(b.remind_at));
    for (const r of sorted.slice(0, 15)) {
      const time = new Date(r.remind_at).toLocaleString('fa-IR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
      const tag = r.label || 'عمومی';
      lines.push(`• ${r.title} — ${time} [${tag}]`);
    }
    if (pending.length > 15) lines.push(`… و ${pending.length - 15} مورد دیگر`);
  }
  if (done.length) {
    lines.push('\n**انجام‌شده‌ها:**');
    for (const r of done.slice(0, 10)) lines.push(`✓ ${r.title}`);
    if (done.length > 10) lines.push(`… و ${done.length - 10} مورد دیگر`);
  }
  if (!reminders.length) lines.push('\nاین هفته هیچ یادآوری ثبت نکردی. می‌خوای برای هفته بعد برنامه‌ریزی کنیم؟');
  return lines.join('\n');
}

// ---- Smart Watch (conditional reminder) helpers ----

export function smartWatchCardBlock(watch) {
  return '\n\n```smart-watch-card\n' + JSON.stringify(watch) + '\n```';
}

export function smartWatchTriggerBlock(data) {
  return '```smart-watch-trigger\n' + JSON.stringify(data) + '\n```';
}

export function formatConditionLabel(watch) {
  const c = watch.condition_type;
  if (c === 'PRICE_BELOW') {
    const target = Number(watch.target_price || watch.condition_value || 0);
    return `وقتی قیمت زیر ${target.toLocaleString('fa-IR')} تومان رسید`;
  }
  if (c === 'PRICE_DECREASE') return 'وقتی قیمت کاهش پیدا کرد';
  if (c === 'BACK_IN_STOCK') return 'وقتی محصول دوباره موجود شد';
  return c || '';
}

// Parse a free-text product input (URL or name) from the user's follow-up message.
export function parseProductInput(text) {
  const t = (text || '').trim();
  const urlMatch = t.match(/(https?:\/\/[^\s]+)/i);
  if (urlMatch) return { url: urlMatch[1], name: t.replace(urlMatch[1], '').trim().slice(0, 80) };
  return { url: '', name: t.slice(0, 80) };
}

// Detect a Smart Watch intent from a chat message.
// Returns { condition, product: {name, url}, targetPrice } or null.
export function detectSmartWatchIntent(text) {
  const t = (text || '').trim();
  const hasWatchCue = /(وقتی|هر\s*وقت|هرگه|when|if|اگه|به\s*محض|به‌محض)/i.test(t)
    || /(ارزون\s*شد|ارزان\s*شد|ارزان‌تر\s*شد|کاهش\s*قیمت|کاهش\s*پیدا\s*کرد|موجود\s*شد|دوباره\s*موجود|news\s*me|alert\s*me|بهم\s*بگو|خبرم\s*کن|اعلان\s*کن)/i.test(t);
  if (!hasWatchCue) return null;

  // back_in_stock
  if (/(موجود\s*شد|دوباره\s*موجود|back\s*in\s*stock|in\s*stock|موجودیه\s*شد|انبار\s*شد)/i.test(t)) {
    return { condition: 'BACK_IN_STOCK', product: extractProduct(t), targetPrice: null };
  }
  // price_below: "زیر ۲۰ میلیون" / "زیر ۲۰۰۰۰۰۰"
  let m = t.match(/زیر\s*(\d+(?:[.,]\d+)?)\s*(میلیون|تومان|هزار|m|million|toman)?/i);
  if (m) {
    let val = parseFloat(m[1].replace(',', ''));
    const unit = (m[2] || '').toLowerCase();
    if (/میلیون|million|^m$/.test(unit)) val *= 1000000;
    else if (/هزار/.test(unit)) val *= 1000;
    return { condition: 'PRICE_BELOW', product: extractProduct(t), targetPrice: val };
  }
  // price_decrease
  if (/(ارزون\s*شد|ارزان\s*شد|ارزان‌تر\s*شد|کاهش\s*قیمت|کاهش\s*پیدا\s*کرد|price\s*drop|cheaper|نزول\s*قیمت)/i.test(t)) {
    return { condition: 'PRICE_DECREASE', product: extractProduct(t), targetPrice: null };
  }
  return null;
}

function extractProduct(text) {
  const urlMatch = text.match(/(https?:\/\/[^\s]+)/i);
  if (urlMatch) return { url: urlMatch[1], name: '' };
  const name = text
    .replace(/وقتی|هر\s*وقت|هرگه|when|if|اگه|به\s*محض|به‌محض|قیمت|قیمتش|قیمت\s+این|قیمت\s+اون|ارزون\s*شد|ارزان\s*شد|ارزان‌تر\s*شد|کاهش\s*پیدا\s*کرد|کاهش\s*قیمت|موجود\s*شد|دوباره\s*موجود|بهم\s*بگو|خبرم\s*کن|اعلان\s*کن|به\s*من\s*بگو|زیر\s*\d+(?:[.,]\d+)?\s*(?:میلیون|تومان|هزار|million)?/gi, '')
    .replace(/[؟?.,،!]/g, ' ').replace(/\s+/g, ' ').trim();
  return { url: '', name: name.slice(0, 80) };
}