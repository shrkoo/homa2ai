import React from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import MessageItem from '@/components/MessageItem';
import ThinkingIndicator from '@/components/chat/ThinkingIndicator';
import QuotaMessage from '@/components/QuotaMessage';

export default function ChatMessages({
  messages, sending, tts, error,
  onRegenerate, onFeedback, onSave, onEdit, onReport,
  quotaInfo, setQuotaInfo, navigate, bottomRef, onFollowUp,
}) {
  const { t } = useI18n();
  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {messages.map((msg, i) => (
          <div key={msg.id} className="space-y-1">
            <MessageItem msg={msg} onRegenerate={onRegenerate} onFeedback={onFeedback} onSave={onSave} onEdit={onEdit} onReport={onReport} sending={sending} tts={tts} onSuggestionPick={onFollowUp} />
          </div>
        ))}
        {sending && <ThinkingIndicator />}
        {quotaInfo && <QuotaMessage info={quotaInfo} onUpgrade={() => navigate('/pricing')} onNewChat={() => { setQuotaInfo(null); navigate('/chat/new'); }} />}
        {error && <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-xl"><span className="flex-1">{error}</span><button onClick={onRegenerate} className="text-xs font-medium underline">{t('retry')}</button></div>}
        <div ref={bottomRef} />
      </div>
    </>
  );
}

export function ScrollBottomButton({ onClick }) {
  return (
    <button onClick={onClick} className="fixed bottom-28 left-1/2 -translate-x-1/2 z-30 w-10 h-10 rounded-full glass text-foreground shadow-premium flex items-center justify-center active:scale-95 transition-all">
      <ArrowDown size={18} />
    </button>
  );
}