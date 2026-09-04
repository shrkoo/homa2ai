import React from 'react';
import { Lock, Sparkles, Plus } from 'lucide-react';

export default function QuotaMessage({ info, onUpgrade, onNewChat }) {
  return (
    <div className="rounded-2xl border border-border bg-accent p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Lock size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-6">
            شما به سقف مجاز تحلیل فایل‌ها رسیدید.
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-5">
            فردا می‌توانید ادامه دهید. برای استفاده نامحدود، حساب خود را ارتقا دهید.
          </p>
          {info?.used !== undefined && info?.limit !== undefined && (
            <p className="text-[11px] text-muted-foreground/70 mt-1.5">
              {info.used} از {info.limit} فایل امروز
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onUpgrade} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-medium active:scale-95 transition-transform">
          <Sparkles size={14} /> ارتقاء حساب
        </button>
        <button onClick={onNewChat} className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-background border border-border text-xs font-medium active:scale-95 transition-transform">
          <Plus size={14} /> چت جدید
        </button>
      </div>
    </div>
  );
}