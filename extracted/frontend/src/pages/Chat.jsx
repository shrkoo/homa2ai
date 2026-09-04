import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import Composer from '@/components/Composer';
import ModelSelector from '@/components/ModelSelector';
import ModelSuggestion from '@/components/chat/ModelSuggestion';
import { useChat } from '@/hooks/useChat';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatEmpty from '@/components/chat/ChatEmpty';
import ChatMessages, { ScrollBottomButton } from '@/components/chat/ChatMessages';
import TodayRemindersSheet from '@/components/chat/TodayRemindersSheet';

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext();
  const c = useChat(id, navigate);
  const [modelSuggestionDismissed, setModelSuggestionDismissed] = useState(false);

  const isEmpty = c.messages.length === 0 && !c.sending && !c.error;
  const status = c.uploading ? 'uploading' : c.sending ? 'processing' : c.error ? 'error' : 'idle';

  const handleFollowUp = (prompt) => {
    c.setInput(prompt);
  };

  const handleModelSuggestionDismiss = () => {
    setModelSuggestionDismissed(true);
  };

  return (
    <div className="flex flex-col h-dvh bg-background relative">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_hsl(217_91%_60%/0.14),_transparent_50%)]" />
      <div className="pointer-events-none fixed bottom-0 inset-x-0 h-1/2 z-0 bg-[radial-gradient(ellipse_at_bottom,_hsl(217_91%_40%/0.08),_transparent_60%)]" />
      <ChatHeader
        navigate={navigate} openSidebar={openSidebar}
        temporary={c.temporary} toggleTemp={c.toggleTemp}
        deepThink={c.deepThink} setDeepThink={c.setDeepThink}
        codeMode={c.codeMode} setCodeMode={c.setCodeMode} codeAction={c.codeAction} setCodeAction={c.setCodeAction}
        folders={c.folders} conversation={c.conversation} moveToFolder={c.moveToFolder}
        clearChat={c.clearChat} saveAsTemplate={c.saveAsTemplate}
        status={status} model={c.model} error={c.error} usage={c.usage} mode={c.mode}
      />

      <div ref={c.scrollRef} onScroll={c.handleScroll} className="flex-1 overflow-y-auto overscroll-y-contain">
        {isEmpty ? (
          <ChatEmpty temporary={c.temporary} setInput={c.setInput} setMode={c.setMode} />
        ) : (
          <ChatMessages
            messages={c.messages} sending={c.sending} tts={c.tts} error={c.error}
            onRegenerate={c.handleRegenerate} onFeedback={c.handleFeedback} onSave={c.handleSave} onEdit={c.handleEdit} onReport={c.handleReport}
            quotaInfo={c.quotaInfo} setQuotaInfo={c.setQuotaInfo} navigate={navigate} bottomRef={c.bottomRef}
            onFollowUp={handleFollowUp}
          />
        )}
      </div>

      <TodayRemindersSheet />

      {c.showJump && <ScrollBottomButton onClick={() => { const el = c.scrollRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); c.setShowJump(false); }} />}

      <div className="glass border-t border-white/[0.06] px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom)+0.625rem)] shadow-premium relative z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 px-1 mb-1.5 flex-wrap">
            <ModelSelector model={c.model} onChange={(m) => { c.setModel(m); setModelSuggestionDismissed(false); }} />
            {!modelSuggestionDismissed && (
              <ModelSuggestion
                input={c.input}
                model={c.model}
                onApply={(m) => { c.setModel(m); setModelSuggestionDismissed(true); }}
                onDismiss={handleModelSuggestionDismiss}
              />
            )}
          </div>
          <Composer
            input={c.input} setInput={c.setInput} onSend={c.handleSend} sending={c.sending} onStop={c.stopGeneration}
            uploading={c.uploading} attachments={c.attachments} onAttach={c.attach} onRemoveAttachment={c.removeAttachment}
            mode={c.mode} onSetMode={c.setMode} deepThink={c.deepThink} onToggleDeepThink={() => c.setDeepThink((v) => !v)} temporary={c.temporary} conversationId={id}
          />
        </div>
      </div>
    </div>
  );
}