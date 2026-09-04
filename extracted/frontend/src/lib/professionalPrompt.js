// Client-side professional prompt generator.
// Constructs structured, professional LLM prompts WITHOUT requiring any API call.
// Detects intent from the user's description and assembles Role, Context, Goal,
// Task, Constraints, Tone, Audience, Output Format, and Negative instructions.

const INTENTS = [
  {
    id: 'marketing',
    keywords: ['تبلیغ', 'بازاریابی', 'اینستاگرام', 'کپشن', 'ad', 'marketing', 'instagram', 'برند', 'brand', 'کمپین', 'campaign', 'فروش', 'sell', 'promo', 'لندینگ', 'landing', 'بیو', 'bio'],
    role: { fa: 'متخصص حرفه‌ای بازاریابی و Copywriting', en: 'Professional marketing and copywriting expert', ku: 'پیشەیی بازاگانی و Copywriting' },
    goal: { fa: 'ایجاد محتوای تبلیغاتی جذاب که آگاهی از برند را افزایش دهد و کاربران را به اقدام ترغیب کند', en: 'Create compelling promotional content that increases brand awareness and drives user action', ku: 'دروستکردنی ناوەڕۆکی ڕیکلامی سەرنجڕاکێش کە زانیاری براند زیاد دەکات' },
    tone: { fa: 'جذاب، متقاعدکننده و طبیعی', en: 'Engaging, persuasive, and natural', ku: 'سەرنجڕاکێش، بڕوایپێهێنەر و سروشتی' },
    audience: { fa: 'کاربران فارسی‌زبان در شبکه‌های اجتماعی', en: 'Persian-speaking social media users', ku: 'بەکارهێنەرانی کورد لە تۆڕە کۆمەڵایەتیەکان' },
    format: { fa: 'شامل Hook (قلاب)، متن اصلی و CTA (دعوت به اقدام)', en: 'Include Hook, main copy, and CTA', ku: 'پێکهاتە لە Hook، دەقی سەرەکی و CTA' },
    constraints: { fa: 'کوتاه، طبیعی، بدون کلیشه', en: 'Short, natural, no clichés', ku: 'کورت، سروشتی، بێ کلیشه' },
    negatives: { fa: 'از کلیشه، ادعاهای غیرواقعی و زبان خشک و رسمی خودداری کن', en: 'Avoid clichés, unrealistic claims, and dry formal language', ku: 'خۆبەدەر بگرە لە کلیشه و داواکاری نادروست' },
  },
  {
    id: 'content',
    keywords: ['مقاله', 'وبلاگ', 'متن', 'writing', 'blog', 'article', 'محتوا', 'content', 'پست', 'post', 'خبر', 'news'],
    role: { fa: 'نویسنده حرفه‌ای محتوا و مقاله‌نویس', en: 'Professional content writer and copywriter', ku: 'نووسەری پیشەیی ناوەڕۆک' },
    goal: { fa: 'تولید محتوای ارزشمند، خوانا و ساختاریافته که مخاطب را درگیر کند', en: 'Produce valuable, readable, well-structured content that engages the reader', ku: 'بەرهەمهێنانی ناوەڕۆکی بەنرخ و خوێندنەوەی ئاسان' },
    tone: { fa: 'روان، اطلاعاتی و جذاب', en: 'Clear, informative, and engaging', ku: 'ڕوون، زانیاری و سەرنجڕاکێش' },
    audience: { fa: 'خوانندگان عمومی علاقه‌مند به موضوع', en: 'General readers interested in the topic', ku: 'خوێنەرانی گشتی ئارەزوومەند' },
    format: { fa: 'شامل عنوان، مقدمه، بدنه اصلی با زیرتیتر، و نتیجه‌گیری', en: 'Include title, introduction, body with subheadings, and conclusion', ku: 'پێکهاتە لە ناونیشان، پێشەکی، دەقی سەرەکی و کۆتایی' },
    constraints: { fa: 'ساختاریافته، با منبع معتبر در صورت نیاز', en: 'Well-structured, with credible sources if needed', ku: 'بێشێواز، بە سەرچاوەی متمانەدار' },
    negatives: { fa: 'از پر کردن حرف و تکرار خودداری کن', en: 'Avoid filler and repetition', ku: 'خۆبەدەر بگرە لە پڕکردنەوەی قسە' },
  },
  {
    id: 'code',
    keywords: ['کد', 'برنامه', 'برنامه‌نویسی', 'code', 'program', 'app', 'تابع', 'function', 'اسکریپت', 'script', 'api', 'دیتابیس', 'database', 'ری‌اکت', 'react', 'پایتون', 'python'],
    role: { fa: 'برنامه‌نویس ارشد با تخصص در معماری نرم‌افزار', en: 'Senior software engineer with architecture expertise', ku: 'پڕۆگرامەری باپرسیار' },
    goal: { fa: 'تولید کد تمیز، کارآمد و قابل نگهداری', en: 'Produce clean, efficient, maintainable code', ku: 'بەرهەمهێنانی کۆدی پاک و کارا' },
    tone: { fa: 'فنی و دقیق', en: 'Technical and precise', ku: 'تەکنیکی و ورد' },
    audience: { fa: 'توسعه‌دهندگان نرم‌افزار', en: 'Software developers', ku: 'گەشەپێدەرانی نەرمەکاڵا' },
    format: { fa: 'کد با کامنت فارسی، توضیح روشن و مثال استفاده', en: 'Code with comments, clear explanation, and usage example', ku: 'کۆد بە ڕوونکردنەوە و نموونە' },
    constraints: { fa: 'بهترین شیوه‌ها، امنیت و کارایی', en: 'Best practices, security, and performance', ku: 'باشترین پراکتیس و پاراستن' },
    negatives: { fa: 'از کد آشفته، وابستگی‌های غیرضروری و راه‌حل‌های ناامن خودداری کن', en: 'Avoid messy code, unnecessary dependencies, and insecure solutions', ku: 'خۆبەدەر بگرە لە کۆدی ئاڵۆز' },
  },
  {
    id: 'analysis',
    keywords: ['تحلیل', 'بررسی', 'research', 'analysis', 'مقایسه', 'compare', 'ارزیابی', 'evaluate', 'گزارش', 'report'],
    role: { fa: 'تحلیل‌گر داده و متخصص تحقیق', en: 'Data analyst and research specialist', ku: 'شیکارکاری داتا' },
    goal: { fa: 'ارائه تحلیل دقیق و قابل فهم بر اساس داده‌ها', en: 'Provide precise, understandable analysis based on data', ku: 'پێشکەشکردنی شیکاری ورد' },
    tone: { fa: 'علمی، بی‌طرف و دقیق', en: 'Scientific, objective, and precise', ku: 'زانستی و ڕاستەوخۆ' },
    audience: { fa: 'تصمیم‌گیرندگان و علاقه‌مندان', en: 'Decision-makers and interested parties', ku: 'بڕیاردەرەکان' },
    format: { fa: 'خلاصه، یافته‌های کلیدی، جزئیات و توصیه', en: 'Summary, key findings, details, and recommendations', ku: 'پوختە، دۆزینەکان و ڕاسپاردە' },
    constraints: { fa: 'مبتنی بر داده و شفاف', en: 'Data-driven and transparent', ku: 'بەپێی داتا' },
    negatives: { fa: 'از حدس و گمان خودداری کن', en: 'Avoid speculation', ku: 'خۆبەدەر بگرە لە گومان' },
  },
  {
    id: 'email',
    keywords: ['ایمیل', 'پیام', 'email', 'message', 'نامه', 'letter', 'reply', 'پاسخ', 'درخواست', 'request'],
    role: { fa: 'متخصص ارتباطات حرفه‌ای', en: 'Professional communications specialist', ku: 'پیشەیی پەیوەندی' },
    goal: { fa: 'نگارش پیام واضح، مؤدبانه و مؤثر', en: 'Write a clear, polite, effective message', ku: 'نووسینی پەیامی ڕوون و کارا' },
    tone: { fa: 'مؤدبانه، حرفه‌ای و دوستانه', en: 'Polite, professional, and friendly', ku: 'بەڕێزەوانە و پیشەیی' },
    audience: { fa: 'گیرنده پیام', en: 'Message recipient', ku: 'وەرگری پەیام' },
    format: { fa: 'موضوع، سلام، بدنه، پایان و امضا', en: 'Subject, greeting, body, closing, and signature', ku: 'بابەت، سلام، دەق و کۆتایی' },
    constraints: { fa: 'کوتاه و واضح', en: 'Concise and clear', ku: 'کورت و ڕوون' },
    negatives: { fa: 'از لحن تهاجمی یا بیش از حد رسمی خودداری کن', en: 'Avoid aggressive or overly formal tone', ku: 'خۆبەدەر بگرە لە تۆنی هێرشکەر' },
  },
  {
    id: 'social',
    keywords: ['سوشال', 'پست', 'کپشن', 'social', 'post', 'caption', 'استوری', 'story', 'ریل', 'reel', 'تیک‌تاک', 'tiktok'],
    role: { fa: 'متخصص تولید محتوای شبکه‌های اجتماعی', en: 'Social media content specialist', ku: 'پیشەیی تۆڕە کۆمەڵایەتیەکان' },
    goal: { fa: 'تولید پست جذاب و قابل به اشتراک‌گذاری', en: 'Create engaging, shareable post content', ku: 'دروستکردنی پۆستی سەرنجڕاکێش' },
    tone: { fa: 'صمیمی، جذاب و امروزی', en: 'Friendly, engaging, and modern', ku: 'نزیک و سەرنجڕاکێش' },
    audience: { fa: 'کاربران شبکه اجتماعی', en: 'Social media users', ku: 'بەکارهێنەرانی تۆڕە کۆمەڵایەتی' },
    format: { fa: 'قلاب + متن + هشتگ‌های مرتبط', en: 'Hook + body + relevant hashtags', ku: 'Hook + دەق + هاشتاگ' },
    constraints: { fa: 'کوتاه، با ایموجی مناسب', en: 'Short, with appropriate emojis', ku: 'کورت بە ئیمۆجی' },
    negatives: { fa: 'از هشتگ‌های نامرتبط و اسپم خودداری کن', en: 'Avoid irrelevant hashtags and spam', ku: 'خۆبەدەر بگرە لە هاشتاگی نامرتبط' },
  },
  {
    id: 'product',
    keywords: ['محصول', 'توضیح', 'product', 'description', 'فروشگاه', 'shop', 'کاتالوگ', 'catalog', 'ویژگی', 'feature'],
    role: { fa: 'متخصص توضیحات محصول و e-commerce', en: 'Product description and e-commerce specialist', ku: 'پیشەیی وەسفی بەرهەم' },
    goal: { fa: 'نگارش توضیحات محصول که فروش را افزایش دهد', en: 'Write product descriptions that drive sales', ku: 'نووسینی وەسفی بەرهەم بۆ فرۆشتن' },
    tone: { fa: 'متقاعدکننده و اطلاعاتی', en: 'Persuasive and informative', ku: 'بڕوایپێهێنەر و زانیاری' },
    audience: { fa: 'خریداران بالقوه', en: 'Potential buyers', ku: 'کڕیارە ئەگەریەکان' },
    format: { fa: 'عنوان، ویژگی‌های کلیدی، مزایا و CTA', en: 'Title, key features, benefits, and CTA', ku: 'ناونیشان، تایبەتمەندی و CTA' },
    constraints: { fa: 'صادقانه و جذاب', en: 'Honest and appealing', ku: 'ڕاستگۆیانە و سەرنجڕاکێش' },
    negatives: { fa: 'از اغراق و اطلاعات غیرواقعی خودداری کن', en: 'Avoid exaggeration and false claims', ku: 'خۆبەدەر بگرە لە گەورەکردنەوە' },
  },
  {
    id: 'seo',
    keywords: ['سئو', 'seo', 'کلمه کلیدی', 'keyword', 'گوگل', 'google', 'رتبه', 'rank', 'سرچ', 'search'],
    role: { fa: 'متخصص SEO و محتوای بهینه‌شده برای موتور جستجو', en: 'SEO specialist and search-optimized content writer', ku: 'پیشەیی SEO' },
    goal: { fa: 'تولید محتوای بهینه‌شده برای موتورهای جستجو', en: 'Produce search-engine-optimized content', ku: 'بەرهەمهێنانی ناوەڕۆکی باشترینکراو' },
    tone: { fa: 'اطلاعاتی و خوانا', en: 'Informative and readable', ku: 'زانیاری و خوێندنەوە ئاسان' },
    audience: { fa: 'کاربران موتور جستجو و خوانندگان', en: 'Search engine users and readers', ku: 'بەکارهێنەرانی گەڕان' },
    format: { fa: 'عنوان SEO، متا دیسکریپشن، H1/H2، محتوای ساختاریافته', en: 'SEO title, meta description, H1/H2, structured content', ku: 'ناونیشانی SEO و مێتا' },
    constraints: { fa: 'کلمات کلیدی طبیعی، قابل خواندن', en: 'Natural keyword usage, readable', ku: 'بەکارهێنانی سروشتی کلیلواژە' },
    negatives: { fa: 'از keyword stuffing و محتوای بی‌کیفیت خودداری کن', en: 'Avoid keyword stuffing and low-quality content', ku: 'خۆبەدەر بگرە لە پڕکردنی کلیلواژە' },
  },
  {
    id: 'translation',
    keywords: ['ترجمه', 'translate', 'translation', 'مترجم', 'زبان', 'language'],
    role: { fa: 'مترجم حرفه‌ای و دقیق', en: 'Professional and precise translator', ku: 'وەرگێڕی پیشەیی' },
    goal: { fa: 'ترجمه دقیق و روان حفظ معنی و لحن اصلی', en: 'Accurate, fluent translation preserving meaning and tone', ku: 'وەرگێڕانی وورد و ڕوون' },
    tone: { fa: 'طبیعی و روان در زبان مقصد', en: 'Natural and fluent in target language', ku: 'سروشتی لە زمانی مەبەست' },
    audience: { fa: 'خوانندگان زبان مقصد', en: 'Target language readers', ku: 'خوێنەرانی زمانی مەبەست' },
    format: { fa: 'فقط ترجمه، بدون توضیح اضافه', en: 'Translation only, no extra commentary', ku: 'تەنها وەرگێڕان' },
    constraints: { fa: 'حفظ اصطلاحات و لحن', en: 'Preserve idioms and tone', ku: 'پاراستنی زمان' },
    negatives: { fa: 'از ترجمه تحت‌اللفظی و ساختار نامطمئن خودداری کن', en: 'Avoid literal translation and awkward structure', ku: 'خۆبەدەر بگرە لە وەرگێڕانی ڕاستەوخۆ' },
  },
  {
    id: 'summary',
    keywords: ['خلاصه', 'summary', 'چکیده', 'abstract', 'بخش', 'summarize'],
    role: { fa: 'متخصص خلاصه‌سازی و سنتز اطلاعات', en: 'Summarization and information synthesis specialist', ku: 'پیشەیی پوختەکردن' },
    goal: { fa: 'ارائه خلاصه دقیق و جامع از محتوا', en: 'Provide accurate, comprehensive summary of content', ku: 'پێشکەشکردنی پوختەی وورد' },
    tone: { fa: 'مختصر و مفید', en: 'Concise and useful', ku: 'کورت و بەسوود' },
    audience: { fa: 'خوانندگان سریع', en: 'Quick readers', ku: 'خوێنەری خێرا' },
    format: { fa: 'نقاط کلیدی یا پاراگراف کوتاه', en: 'Bullet points or short paragraph', ku: 'خاڵە سەرەکیەکان' },
    constraints: { fa: 'حفظ نکات مهم، حذف جزئیات اضافی', en: 'Keep key points, drop extras', ku: 'پاراستنی خاڵە گرنگەکان' },
    negatives: { fa: 'از حذف نکات کلیدی و اضافه کردن نظر شخصی خودداری کن', en: "Don't drop key points or add personal opinion", ku: 'خۆبەدەر بگرە لە لابردنی خاڵە گرنگەکان' },
  },
  {
    id: 'creative',
    keywords: ['داستان', 'شعر', 'creative', 'story', 'poem', 'خلاقانه', 'تخیلی', 'fiction', 'نمایشنامه', 'script'],
    role: { fa: 'نویسنده خلاق و داستان‌نویس', en: 'Creative writer and storyteller', ku: 'نووسەری خێزان' },
    goal: { fa: 'خلق اثر خلاقانه و جذاب', en: 'Create a compelling creative piece', ku: 'دروستکردنی بەرهەمی خێزان' },
    tone: { fa: 'خلاقانه، زنده و احساسی', en: 'Creative, vivid, and emotional', ku: 'خێزان و هەستیار' },
    audience: { fa: 'خوانندگان علاقه‌مند', en: 'Interested readers', ku: 'خوێنەری ئارەزوومەند' },
    format: { fa: 'فرمت مناسب نوع اثر', en: 'Format appropriate to the piece', ku: 'فۆرماتی گونجاو' },
    constraints: { fa: 'اصیل و جذاب', en: 'Original and engaging', ku: 'ڕەسەن و سەرنجڕاکێش' },
    negatives: { fa: 'از کلیشه و کپی از آثار دیگر خودداری کن', en: 'Avoid clichés and copying others', ku: 'خۆبەدەر بگرە لە کلیشه' },
  },
];

const GENERAL = {
  role: { fa: 'دستیار هوشمند و حرفه‌ای', en: 'Intelligent professional assistant', ku: 'یاریدەدەری زیرەک و پیشەیی' },
  goal: { fa: 'ارائه بهترین پاسخ ممکن به درخواست کاربر', en: 'Provide the best possible response to the user request', ku: 'پێشکەشکردنی باشترین وەڵام' },
  tone: { fa: 'روان، دقیق و مفید', en: 'Clear, precise, and helpful', ku: 'ڕوون و وورد و بەسوود' },
  audience: { fa: 'کاربر درخواست‌کننده', en: 'The requesting user', ku: 'بەکارهێنەری داواکار' },
  format: { fa: 'پاسخ ساختاریافته و خوانا', en: 'Structured and readable response', ku: 'وەڵامی بێشێواز' },
  constraints: { fa: 'دقیق و کامل', en: 'Accurate and complete', ku: 'وورد و تەواو' },
  negatives: { fa: 'از اطلاعات نادرست و حدس خودداری کن', en: 'Avoid misinformation and guessing', ku: 'خۆبەدەر بگرە لە زانیاری هەڵە' },
};

function detectIntent(text) {
  const lower = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    let score = 0;
    for (const kw of intent.keywords) {
      if (lower.includes(kw.toLowerCase())) score += 1;
    }
    if (score > bestScore) { bestScore = score; best = intent; }
  }
  return best;
}

function pick(intent, field, lang) {
  const src = intent || GENERAL;
  return (src[field]?.[lang] || src[field]?.fa || GENERAL[field]?.fa || '');
}

export function generateProfessionalPrompt(description, language = 'fa') {
  const lang = ['fa', 'en', 'ku'].includes(language) ? language : 'fa';
  const intent = detectIntent(description);
  const src = intent || GENERAL;

  const role = pick(src, 'role', lang);
  const goal = pick(src, 'goal', lang);
  const tone = pick(src, 'tone', lang);
  const audience = pick(src, 'audience', lang);
  const format = pick(src, 'format', lang);
  const constraints = pick(src, 'constraints', lang);
  const negatives = pick(src, 'negatives', lang);

  const parts = [];
  parts.push(role + '.');
  parts.push(description.trim());
  parts.push(`هدف: ${goal}.`);
  parts.push(`لحن: ${tone}.`);
  parts.push(`مخاطب: ${audience}.`);
  parts.push(`محدودیت‌ها: ${constraints}.`);
  parts.push(`فرمت خروجی: ${format}.`);
  if (negatives) parts.push(negatives + '.');

  return parts.join(' ');
}

export function detectPromptIntent(description) {
  return detectIntent(description);
}