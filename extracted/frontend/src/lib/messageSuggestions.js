// Context-aware follow-up suggestions for individual assistant messages.
// Returns up to 3 short, relevant prompts based on the message content.
// Returns [] for simple greetings or short responses with no clear continuation.

export function generateMessageSuggestions(content, language) {
  const text = (content || '').toLowerCase();
  const isFa = language === 'fa';
  const isKu = language === 'ku';
  const tr = (fa, en, ku) => (isFa ? fa : isKu ? ku : en);

  // Strip code blocks / media markers for length & topic detection
  const clean = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[\]\([^)]+\)/g, ' ')
    .replace(/🎬\s*\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/📎\s*\[[^\]]*\]\([^)]+\)/g, ' ')
    .trim();

  // Simple greeting — no suggestions
  if (clean.length < 60 && /^(سلام|hello|hi|hey|سلاو|ڕۆژ|چطور|how can i|چه طوری|خوش اومدی)/.test(clean)) {
    return [];
  }

  // Very short responses — no suggestions
  if (clean.length < 80) return [];

  const suggestions = [];

  // Reminder / alarm related
  if (text.includes('یادآور') || text.includes('reminder') || text.includes('alarm') || text.includes('آلارم') || text.includes('بیدار') || text.includes('reminder-card') || text.includes('smart-watch') || text.includes('هشدار هوشمند')) {
    suggestions.push(
      tr('فردا ساعت ۸ یادم بنداز ورزش کنم', 'Remind me to exercise at 8 tomorrow', 'سبەی کاتژمێر ٨ بیرم خستەوە وەرزش'),
      tr('یادآورهای امروزمو نشون بده', 'Show my reminders for today', 'بیرخستنەوەکانی ئەمڕۆم پیشان بدە'),
      tr('این یادآور رو هر روز تکرار کن', 'Repeat this reminder daily', 'ئەم بیرخستنەوەیە ڕۆژانە بکەرەوە'),
    );
    return suggestions.slice(0, 3);
  }

  // Image related
  if (text.includes('تصویر') || text.includes('عکس') || text.includes('image') || text.includes('![](') || text.includes('pollinations') || text.includes('وێنە')) {
    suggestions.push(
      tr('یک تصویر سینمایی از این موضوع بساز', 'Create a cinematic image of this', 'وێنەیەکی سینمایی ئەمە بکە'),
      tr('این تصویر رو کارتونی کن', 'Make this image cartoon style', 'ئەم وێنەیە بکە بە کارتۆن'),
      tr('پس‌زمینه این تصویر رو عوض کن', 'Change the background of this image', 'پاشخانی ئەم وێنەیە بگۆڕە'),
    );
    return suggestions.slice(0, 3);
  }

  // Code related
  if (text.includes('کد') || text.includes('code') || text.includes('function') || text.includes('تابع') || text.includes('```') || text.includes('کۆد')) {
    suggestions.push(
      tr('خطای این کد رو پیدا کن', 'Find the bug in this code', 'هەڵەی ئەم کۆدە بدۆزەرەوە'),
      tr('کد رو بهینه کن', 'Optimize this code', 'ئەم کۆدە باشتر بکە'),
      tr('نسخه کامل اصلاح‌شده رو بده', 'Give the full corrected version', 'نسخەی تەواوی ڕاستکراوە بدە'),
    );
    return suggestions.slice(0, 3);
  }

  // Shopping / price related
  if (text.includes('قیمت') || text.includes('price') || text.includes('خرید') || text.includes('product') || text.includes('global-search') || text.includes('محصول') || text.includes('بەها')) {
    suggestions.push(
      tr('ارزون‌ترین گزینه رو نشونم بده', 'Show me the cheapest option', 'هەرزانترین هەڵبژاردە پیشانم بدە'),
      tr('مقایسه قیمت‌ها رو بکن', 'Compare the prices', 'نرخەکان بەراورد بکە'),
      tr('این محصول رو زیر نظر بگیر', 'Track this product', 'ئەم بەرهەمە چاودێری بکە'),
    );
    return suggestions.slice(0, 3);
  }

  // Long text response — general follow-ups
  if (clean.length > 150) {
    suggestions.push(
      tr('این متن رو رسمی‌تر کن', 'Make this text more formal', 'ئەم دەقە فەرمی‌تر بکە'),
      tr('خلاصه‌اش کن', 'Summarize it', 'کورتەی بکە'),
      tr('بیشتر توضیح بده', 'Explain more', 'زیاتر ڕوونی بکەرەوە'),
    );
    return suggestions.slice(0, 3);
  }

  return [];
}