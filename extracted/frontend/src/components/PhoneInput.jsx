import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const COUNTRIES = [
  { name: 'ایران', nameEn: 'Iran', flag: '🇮🇷', code: '+98' },
  { name: 'افغانستان', nameEn: 'Afghanistan', flag: '🇦🇫', code: '+93' },
  { name: 'عراق', nameEn: 'Iraq', flag: '🇮🇶', code: '+964' },
  { name: 'ترکیه', nameEn: 'Turkey', flag: '🇹🇷', code: '+90' },
  { name: 'آلمان', nameEn: 'Germany', flag: '🇩🇪', code: '+49' },
  { name: 'آمریکا', nameEn: 'USA', flag: '🇺🇸', code: '+1' },
  { name: 'انگلستان', nameEn: 'UK', flag: '🇬🇧', code: '+44' },
  { name: 'روسیه', nameEn: 'Russia', flag: '🇷🇺', code: '+7' },
  { name: 'چین', nameEn: 'China', flag: '🇨🇳', code: '+86' },
  { name: 'هند', nameEn: 'India', flag: '🇮🇳', code: '+91' },
  { name: 'پاکستان', nameEn: 'Pakistan', flag: '🇵🇰', code: '+92' },
  { name: 'عربستان', nameEn: 'Saudi Arabia', flag: '🇸🇦', code: '+966' },
  { name: 'امارات', nameEn: 'UAE', flag: '🇦🇪', code: '+971' },
  { name: 'کویت', nameEn: 'Kuwait', flag: '🇰🇼', code: '+965' },
  { name: 'قطر', nameEn: 'Qatar', flag: '🇶🇦', code: '+974' },
  { name: 'بحرین', nameEn: 'Bahrain', flag: '🇧🇭', code: '+973' },
  { name: 'اردن', nameEn: 'Jordan', flag: '🇯🇴', code: '+962' },
  { name: 'لبنان', nameEn: 'Lebanon', flag: '🇱🇧', code: '+961' },
  { name: 'سوریه', nameEn: 'Syria', flag: '🇸🇾', code: '+963' },
  { name: 'مصر', nameEn: 'Egypt', flag: '🇪🇬', code: '+20' },
  { name: 'فرانسه', nameEn: 'France', flag: '🇫🇷', code: '+33' },
  { name: 'ایتالیا', nameEn: 'Italy', flag: '🇮🇹', code: '+39' },
  { name: 'اسپانیا', nameEn: 'Spain', flag: '🇪🇸', code: '+34' },
  { name: 'هلند', nameEn: 'Netherlands', flag: '🇳🇱', code: '+31' },
  { name: 'سوئد', nameEn: 'Sweden', flag: '🇸🇪', code: '+46' },
  { name: 'نروژ', nameEn: 'Norway', flag: '🇳🇴', code: '+47' },
  { name: 'دانمارک', nameEn: 'Denmark', flag: '🇩🇰', code: '+45' },
  { name: 'فنلاند', nameEn: 'Finland', flag: '🇫🇮', code: '+358' },
  { name: 'استرالیا', nameEn: 'Australia', flag: '🇦🇺', code: '+61' },
  { name: 'کانادا', nameEn: 'Canada', flag: '🇨🇦', code: '+1' },
  { name: 'برزیل', nameEn: 'Brazil', flag: '🇧🇷', code: '+55' },
  { name: 'مکزیک', nameEn: 'Mexico', flag: '🇲🇽', code: '+52' },
  { name: 'ژاپن', nameEn: 'Japan', flag: '🇯🇵', code: '+81' },
  { name: 'کره جنوبی', nameEn: 'South Korea', flag: '🇰🇷', code: '+82' },
  { name: 'اندونزی', nameEn: 'Indonesia', flag: '🇮🇩', code: '+62' },
  { name: 'مالزی', nameEn: 'Malaysia', flag: '🇲🇾', code: '+60' },
  { name: 'تایلند', nameEn: 'Thailand', flag: '🇹🇭', code: '+66' },
  { name: 'ویتنام', nameEn: 'Vietnam', flag: '🇻🇳', code: '+84' },
  { name: 'فیلیپین', nameEn: 'Philippines', flag: '🇵🇭', code: '+63' },
  { name: 'سنگاپور', nameEn: 'Singapore', flag: '🇸🇬', code: '+65' },
  { name: 'نیجریه', nameEn: 'Nigeria', flag: '🇳🇬', code: '+234' },
  { name: 'آفریقای جنوبی', nameEn: 'South Africa', flag: '🇿🇦', code: '+27' },
  { name: 'کنیا', nameEn: 'Kenya', flag: '🇰🇪', code: '+254' },
  { name: 'لهستان', nameEn: 'Poland', flag: '🇵🇱', code: '+48' },
  { name: 'اوکراین', nameEn: 'Ukraine', flag: '🇺🇦', code: '+380' },
  { name: 'رومانی', nameEn: 'Romania', flag: '🇷🇴', code: '+40' },
  { name: 'یونان', nameEn: 'Greece', flag: '🇬🇷', code: '+30' },
  { name: 'پرتغال', nameEn: 'Portugal', flag: '🇵🇹', code: '+351' },
  { name: 'بلژیک', nameEn: 'Belgium', flag: '🇧🇪', code: '+32' },
  { name: 'سوئیس', nameEn: 'Switzerland', flag: '🇨🇭', code: '+41' },
  { name: 'اتریش', nameEn: 'Austria', flag: '🇦🇹', code: '+43' },
  { name: 'چک', nameEn: 'Czech Republic', flag: '🇨🇿', code: '+420' },
  { name: 'آذربایجان', nameEn: 'Azerbaijan', flag: '🇦🇿', code: '+994' },
  { name: 'ارمنستان', nameEn: 'Armenia', flag: '🇦🇲', code: '+374' },
  { name: 'گرجستان', nameEn: 'Georgia', flag: '🇬🇪', code: '+995' },
  { name: 'قزاقستان', nameEn: 'Kazakhstan', flag: '🇰🇿', code: '+7' },
  { name: 'تاجیکستان', nameEn: 'Tajikistan', flag: '🇹🇯', code: '+992' },
  { name: 'ازبکستان', nameEn: 'Uzbekistan', flag: '🇺🇿', code: '+998' },
  { name: 'ترکمنستان', nameEn: 'Turkmenistan', flag: '🇹🇲', code: '+993' },
  { name: 'کردستان عراق', nameEn: 'Iraq Kurdistan', flag: '🇮🇶', code: '+964' },
  { name: 'آرژانتین', nameEn: 'Argentina', flag: '🇦🇷', code: '+54' },
  { name: 'شیلی', nameEn: 'Chile', flag: '🇨🇱', code: '+56' },
  { name: 'کلمبیا', nameEn: 'Colombia', flag: '🇨🇴', code: '+57' },
  { name: 'پرو', nameEn: 'Peru', flag: '🇵🇪', code: '+51' },
];

export default function PhoneInput({ value, onChange, dialCode, onDialCodeChange, placeholder = '9xxxxxxxxx' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const selected = COUNTRIES.find(c => c.code === dialCode) || COUNTRIES[0];

  const filtered = search
    ? COUNTRIES.filter(c =>
        c.name.includes(search) ||
        c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search)
      )
    : COUNTRIES;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex h-12 rounded-xl border border-border bg-card focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all overflow-visible" ref={ref}>
      {/* country selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="h-full flex items-center gap-1 px-3 border-e border-border text-sm font-medium hover:bg-accent/50 transition-colors rounded-s-xl"
        >
          <span className="text-lg leading-none">{selected.flag}</span>
          <span className="text-xs text-muted-foreground">{selected.code}</span>
          <ChevronDown size={13} className={`text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && (
          <div className="absolute top-full start-0 mt-1 z-50 w-72 max-h-72 rounded-2xl border border-border bg-popover shadow-xl overflow-hidden flex flex-col">
            <div className="p-2 border-b border-border">
              <div className="relative">
                <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="جستجو..."
                  className="w-full ps-8 pe-3 py-1.5 text-sm bg-muted/50 rounded-lg outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.map((c, i) => (
                <button
                  key={c.nameEn + c.code + i}
                  type="button"
                  onClick={() => { onDialCodeChange(c.code); setOpen(false); setSearch(''); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-start ${dialCode === c.code && selected.name === c.name ? 'bg-primary/5 text-primary' : ''}`}
                >
                  <span className="text-base">{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.code}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">نتیجه‌ای یافت نشد</p>
              )}
            </div>
          </div>
        )}
      </div>
      {/* phone number input */}
      <input
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
        placeholder={placeholder}
        className="flex-1 px-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground/60 rounded-e-xl"
        dir="ltr"
      />
    </div>
  );
}