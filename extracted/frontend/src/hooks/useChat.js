import { useEffect, useRef, useState } from 'react';
import { reminders as alarmReminders } from '@/lib/alarmStore';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/lib/AuthContext';
import { usePref } from '@/hooks/usePref';
import { useTTS } from '@/hooks/useTTS';
import { useAttachments } from '@/hooks/useAttachments';
import { playBeep, playNotification, playErrorSound } from '@/utils/sound';
import { toast } from '@/components/ui/use-toast';
import { invokeFunctionDirect } from '@/lib/directInvoke';
import { chatAdapter, dataAdapter, referralAdapter } from '@/lib/adapters';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { detectCapability, isInternalCapability, getExternalToolsForCapability, getCapabilityById } from '@/lib/toolCatalog';
import { selectBestProvider, getProvidersByCapability, estimateCost, needsConfirmation, getProviderById } from '@/lib/providerRegistry';
import { pollJob } from '@/lib/jobPoller';
import { parseSlashCommand } from '@/lib/slashCommands';
import { syncJobToGCal } from '@/utils/gcalSync';
import { reminderCardBlock, reminderListBlock, detectReminderCommand, detectReminderTag, detectSmartWatchIntent, parseProductInput, smartWatchCardBlock, smartWatchTriggerBlock } from '@/lib/reminderChat';
import { checkSmartWatch } from '@/lib/smartWatchChecker';

export function useChat(id, navigate) {
  const { t, language } = useI18n();
  const { user } = useAuth();
  const { attachments, setAttachments, uploading, attach, removeAttachment } = useAttachments(t);
  const tts = useTTS();
  const { runGlobalSearch } = useGlobalSearch();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [temporary, setTemporary] = useState(false);
  const [model, setModel] = useState('auto');
  const [deepThink, setDeepThink] = useState(false);
  const [codeMode, setCodeMode] = useState(false);
  const [codeAction, setCodeAction] = useState('build');
  const [input, setInput] = useState('');
  const [mode, setMode] = useState(null);
  const [usage, setUsage] = useState(null);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [showJump, setShowJump] = useState(false);
  const [folders, setFolders] = useState([]);
  const [notifSend] = usePref('homa_notif_send', true);
  const [notifReceive] = usePref('homa_notif_receive', false);
  const [notifJobDone] = usePref('homa_notif_job_done', true);
  const [ttsEnabled] = usePref('homa_tts_enabled', true);
  const [ttsAutoplay] = usePref('homa_tts_autoplay', false);
  const [toolPreference, setToolPreference] = usePref('homa_tool_preference', 'balanced');
  const [manualProvider, setManualProvider] = useState(null);
  const [pendingSmartWatch, setPendingSmartWatch] = useState(null);

  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const stickRef = useRef(true);
  const instantRef = useRef(true);
  const loadedIdRef = useRef(null);
  const sendingRef = useRef(false);
  const idRef = useRef(id);
  const stopRef = useRef(false);
  const rerunSearchRef = useRef(null);

  useEffect(() => { sendingRef.current = sending; }, [sending]);
  useEffect(() => { idRef.current = id; }, [id]);

  useEffect(() => {
    const key = `homa_draft_${idRef.current || 'new'}`;
    if (input) localStorage.setItem(key, input);
    else localStorage.removeItem(key);
  }, [input]);

  useEffect(() => {
    const key = `homa_draft_${id || 'new'}`;
    setInput(localStorage.getItem(key) || '');
  }, [id]);

  useEffect(() => {
    chatAdapter.listFolders().then(setFolders).catch(() => {});
  }, []);

  useEffect(() => {
    dataAdapter.filter('Usage', {}, '-created_date', 1).then((res) => { if (res[0]) setUsage(res[0]); }).catch(() => {});
    try {
      const ref = localStorage.getItem('homa_ref');
      if (ref) referralAdapter.processReferralByRef(ref).then(() => localStorage.removeItem('homa_ref')).catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    if (!id || id === 'new') {
      setConversation(null); setMessages([]); setError(null); setTemporary(false); setAttachments([]); setMode(null); loadedIdRef.current = null; return;
    }
    if (loadedIdRef.current === id) return;
    (async () => {
      try {
        const conv = await chatAdapter.getConversation(id);
        setConversation(conv);
        const msgs = await chatAdapter.listMessages(id);
        setMessages(msgs);
        loadedIdRef.current = id;
        stickRef.current = true; instantRef.current = true;
      } catch { navigate('/chat/new', { replace: true }); }
    })();
  }, [id, navigate]);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickRef.current = distFromBottom < 120;
    setShowJump(distFromBottom >= 120 && el.scrollTop > 200);
  };

  useEffect(() => {
    if (!stickRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: instantRef.current ? 'auto' : 'smooth' });
    instantRef.current = false;
  }, [messages, sending]);

  const callAI = async (msgs, convId, extraContext, images = [], fileCount = 0, imageData = []) => {
    // Pre-check user credits before making any AI request.
    if (usage && typeof usage.credits === 'number' && usage.credits <= 0) {
      setQuotaInfo({ credits: 0, plan: usage.plan || 'free' });
      setError(null);
      return null;
    }
    setSending(true); setError(null); stopRef.current = false;
    const streamId = 'stream_' + Date.now();
    try {
      const apiMsgs = msgs.map((m) => ({ role: m.role, content: m.content }));
      if (extraContext && apiMsgs.length && apiMsgs[apiMsgs.length - 1].role === 'user') {
        apiMsgs[apiMsgs.length - 1].content += '\n\n' + extraContext;
      }
      setMessages((prev) => [...prev, { id: streamId, role: 'assistant', content: '' }]);
      const res = await invokeFunctionDirect('chat', {
        messages: apiMsgs, language, model, codeMode, codeAction,
        system_extra: '', image_data: imageData
      });
      const data = res?.data || res;
      if (stopRef.current) {
        setMessages((prev) => prev.filter((m) => m.id !== streamId));
        setSending(false); return null;
      }
      if (data.error) {
        setMessages((prev) => prev.filter((m) => m.id !== streamId));
        const errMap = { no_api_key: 'کلید API روی سرور تنظیم نشده.', rate_limit: t('error_occurred'), provider_failed: t('error_occurred'), file_quota: 'سقف تحلیل فایل‌ها پر شده.' };
        setError(errMap[data.error] || t('error_occurred'));
        setSending(false); return null;
      }
      const finalContent = data.content || '';
      const usedModel = data.model || model;
      if (notifReceive) playBeep(880, 0.1);
      let newMsgId = null;
      if (temporary || !convId) {
        newMsgId = 'tmp_a_' + Date.now();
        setMessages((prev) => prev.map((m) => (m.id === streamId ? { id: newMsgId, role: 'assistant', content: finalContent } : m)));
      } else {
        const aMsg = await chatAdapter.createMessage({ conversation_id: convId, role: 'assistant', content: finalContent, model: usedModel });
        newMsgId = aMsg.id;
        setMessages((prev) => prev.map((m) => (m.id === streamId ? aMsg : m)));
        await chatAdapter.updateLastMessage(convId, finalContent.slice(0, 120));
      }
      setSending(false);
      if (ttsEnabled && ttsAutoplay && newMsgId) {
        setTimeout(() => tts.speak(newMsgId, finalContent, language).catch(() => {}), 300);
      }
      return finalContent;
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== streamId));
      if (stopRef.current) { setSending(false); return null; }
      const msg = String(e?.message || '');
      console.error('[Homa callAI] Worker error:', { status: e?.status, message: msg, responseBody: e?.responseBody?.slice(0, 500) });
      if (msg.includes('401')) {
        setError('کلید Worker تنظیم نشده. به Settings → «اتصال مستقیم به Homa Worker» بروید و HOMA_WORKER_KEY را وارد کنید.');
      } else if (msg.includes('402') || msg.includes('403')) {
        setError('سرویس هوش مصنوعی موقتاً در دسترس نیست. اعتبار پلتفرم تا ۱ اکتبر ۲۰۲۶ بازنشانی می‌شود.');
      } else if (msg.includes('500') || msg.includes('503')) {
        setError('خطای داخلی سرور. لطفاً دوباره تلاش کنید.');
      } else if (msg.includes('Failed to fetch') || msg.includes('Network') || msg.includes('network')) {
        setError('ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی و دوباره تلاش کنید.');
      } else if (msg.includes('timeout') || msg.includes('Timeout')) {
        setError('پاسخ سرور بیش از حد طول کشید. دوباره تلاش کنید.');
      } else if (e?.responseBody) {
        // Worker returned an error with a response body — show the actual error
        let detail = '';
        try { detail = JSON.parse(e.responseBody)?.error || e.responseBody.slice(0, 150); } catch { detail = e.responseBody.slice(0, 150); }
        setError(`خطای Worker (${e.status || '?'}): ${detail}`);
      } else {
        setError('ارتباط با سرویس هوش مصنوعی برقرار نشد. لطفاً دوباره تلاش کنید.');
      }
      setSending(false); return null;
    }
  };

  const stopGeneration = () => {
    stopRef.current = true;
    setSending(false);
    setError(null);
  };

  const ensureConv = async (title) => {
    if (temporary) return null;
    if (id && id !== 'new') return id;
    try {
      const conv = await chatAdapter.createConversation({ title: title.slice(0, 40), language, model });
      setConversation(conv); loadedIdRef.current = conv.id; navigate('/chat/' + conv.id, { replace: true });
      return conv.id;
    } catch (e) {
      const msg = String(e?.message || '');
      if (msg.includes('Failed to fetch') || msg.includes('Network') || msg.includes('worker_')) {
        setError('ارتباط با سرور برقرار نشد. اگر Homa Worker را در Settings تنظیم کرده‌اید، مطمئن شوید که فعال است یا آن را پاک کنید.');
      } else {
        setError(t('error_occurred'));
      }
      setSending(false);
      return null;
    }
  };

  const addMsg = async (convId, role, content) => {
    if (!convId) { setMessages((p) => [...p, { id: 'tmp_' + role + '_' + Date.now(), role, content }]); return; }
    const m = await chatAdapter.createMessage({ conversation_id: convId, role, content, model: role === 'assistant' ? model : '' });
    setMessages((p) => [...p, m]);
    if (role === 'assistant') { try { await chatAdapter.updateLastMessage(convId, content.slice(0, 120)); } catch {} }
  };

  // Auto-check a smart watch immediately after creation and post the result in chat.
  // Graceful: never shows an error — on failure, keeps a positive "monitoring" state.
  const autoCheckWatch = async (convId, watch) => {
    try {
      const res = await checkSmartWatch(watch);
      if (res.status === 'triggered') {
        const updates = { last_triggered: new Date().toISOString(), condition_data: String(res.currentPrice || '') };
        if (watch.notify_once) updates.status = 'done';
        try { await alarmReminders.update(watch.id, updates); } catch {}
        const content = `🔔 شرط برقرار شد! ${res.reason}` + smartWatchTriggerBlock({ watch: { ...watch, ...updates }, result: res });
        await addMsg(convId, 'assistant', content);
        if (notifReceive) playNotification();
      } else if (res.status === 'not_met' && res.currentPrice > 0) {
        try { await alarmReminders.update(watch.id, { condition_data: String(res.currentPrice) }); } catch {}
        const content = `💰 قیمت فعلی «${watch.product_name || watch.title}»: ${res.currentPrice.toLocaleString('fa-IR')} تومان. زیر نظر دارم — به‌محض رسیدن به شرط، همینجا خبرت می‌کنم. 👌`;
        await addMsg(convId, 'assistant', content);
      } else {
        const content = `👁️ «${watch.product_name || watch.title}» زیر نظر گرفته شد. به‌محض تغییر قیمت، همینجا خبرت می‌کنم. 👌`;
        await addMsg(convId, 'assistant', content);
      }
    } catch {
      const content = `👁️ «${watch.product_name || watch.title}» زیر نظر گرفته شد. به‌محض تغییر قیمت، همینجا خبرت می‌کنم. 👌`;
      await addMsg(convId, 'assistant', content);
    }
  };

  const runTool = async (opts) => {
    const { fnName, payload, query, displayContent, buildResult, onResult, direct } = opts;
    setSending(true); setError(null);
    const convId = await ensureConv(query);
    await addMsg(convId, 'user', displayContent);
    try {
      const res = await invokeFunctionDirect(fnName, payload);
      const data = res?.data || res;
      if (data.error) {
        const errMap = { quota: t('err_quota'), daily_limit: t('err_daily_limit'), no_provider: t('err_no_provider'), plan_required: t('err_plan_required'), provider_failed: t('err_provider_failed') };
        const msg = errMap[data.error] || t('error_occurred');
        toast({ title: msg });
        if (data.credits !== undefined) setUsage((p) => ({ ...p, credits: data.credits }));
        if (data.error === 'provider_failed' || data.error === 'no_provider') setError(msg);
      } else {
        const content = buildResult(data);
        await addMsg(convId, 'assistant', content);
        try { await dataAdapter.create('LibraryItem', { title: (query || '').slice(0, 50), content, kind: 'document', provider: fnName, prompt: query || '' }); } catch {}
        if (onResult) onResult(data);
      }
    } catch (e) {
      const msg = String(e?.message || '');
      if (msg.includes('402') || msg.includes('403')) toast({ title: 'سرویس موقتاً محدود است.' });
      else if (msg.includes('Failed to fetch') || msg.includes('Network')) toast({ title: 'ارتباط با سرور برقرار نشد.' });
      else toast({ title: t('error_occurred') });
      console.warn('[Homa runTool] error', msg);
    }
    setSending(false);
  };

  const sourcesMd = (d) => (d.content || '') + (d.sources?.length ? `\n\n---\n\n**${t('sources')}:**\n` + d.sources.map((s) => `- [${s.title}](${s.url})${s.description ? ' — ' + s.description : ''}`).join('\n') : '');

  const buildSearchResult = (d) => {
    let text = d.content || '';
    if (d.results && d.results.length) {
      text += '\n\n```search-results\n' + JSON.stringify({ intent: d.intent, results: d.results }) + '\n```';
    }
    if (d.sources?.length) {
      text += '\n\n---\n\n**' + t('sources') + ':**\n' + d.sources.map((s) => `- [${s.title}](${s.url})${s.description ? ' — ' + s.description : ''}`).join('\n');
    }
    return text;
  };

  const buildGlobalSearchResult = (data, query) => {
    let text = data.summary || '';
    text += '\n\n```global-search\n' + JSON.stringify({
      query: query || '',
      results: data.results || [],
      web_results: data.web_results || [],
      sources: data.sources || [],
      limited: data.limited,
    }) + '\n```';
    return text;
  };

  const mapSmartSearchToGlobal = (data, query) => {
    const allResults = data.results || [];
    const products = allResults.filter(r => r.price).map(r => ({
      name: r.title || r.source_name || '—',
      price: r.price,
      currency: '',
      seller: r.source_name || r.site || '',
      url: r.url || '',
      image: r.image || r.source_logo || '',
      in_stock: null,
      specs: r.description?.slice(0, 80) || '',
    }));
    const webResults = allResults.filter(r => !r.price).map(r => ({
      title: r.title || '',
      url: r.url || '',
      description: r.description || '',
      site: r.source_name || r.site || '',
    }));
    const sources = (data.sources || []).map(s => ({
      title: s.title || '',
      url: s.url || '',
      site: s.site || '',
      favicon: '',
    }));
    return { query, results: products, web_results: webResults, sources, summary: data.content || '', limited: false };
  };

  const runGlobalSearchTool = async (query, displayContent) => {
    setSending(true); setError(null);
    let workerUrl = '';
    try { workerUrl = (localStorage.getItem('homa_worker_url') || '').trim(); } catch {}

    const convId = await ensureConv(query);
    await addMsg(convId, 'user', displayContent);

    // No Worker configured — fall back to smartSearch via invokeFunctionDirect
    if (!workerUrl) {
      const fbPendingId = 'gs_pending_' + Date.now();
      setMessages((prev) => [...prev, { id: fbPendingId, role: 'assistant', content: '```global-search-pending\n' + JSON.stringify({ status: 'searching_web', progress: 25, message: query }) + '\n```' }]);
      try {
        const res = await invokeFunctionDirect('smartSearch', { input: query + ' قیمت خرید فروشگاه', language });
        const data = res?.data || res;
        if (data.error) throw data;
        const mapped = mapSmartSearchToGlobal(data, query);
        const finalContent = buildGlobalSearchResult(mapped, query);
        if (convId) {
          const aMsg = await chatAdapter.createMessage({ conversation_id: convId, role: 'assistant', content: finalContent, model: 'global_search' });
          setMessages((prev) => prev.map((m) => (m.id === fbPendingId ? aMsg : m)));
        } else {
          setMessages((prev) => prev.map((m) => (m.id === fbPendingId ? { ...m, id: 'tmp_a_' + Date.now(), content: finalContent } : m)));
        }
        try { await dataAdapter.create('SearchHistory', { query, language, result_count: (mapped.results || []).length }); } catch {}
      } catch (e) {
        const friendlyContent = 'الان نتونستم قیمت‌ها رو آنلاین بررسی کنم. اگر محصول خاصی مدنظرته، اسمش رو بگو تا کمکت کنم. 👌';
        setMessages((prev) => prev.map((m) => (m.id === fbPendingId ? { ...m, id: 'tmp_a_' + Date.now(), content: friendlyContent } : m)));
        if (convId) { try { await chatAdapter.createMessage({ conversation_id: convId, role: 'assistant', content: friendlyContent, model: 'global_search' }); } catch {} }
      }
      setSending(false);
      return;
    }

    console.log('[Homa GlobalSearch] starting', { query: query.slice(0, 50) });

    const pendingId = 'gs_pending_' + Date.now();
    setMessages((prev) => [...prev, { id: pendingId, role: 'assistant', content: '```global-search-pending\n' + JSON.stringify({ status: 'starting', progress: 0, message: query }) + '\n```' }]);

    const updatePending = (statusData) => {
      setMessages((prev) => prev.map((m) => m.id === pendingId ? { ...m, content: '```global-search-pending\n' + JSON.stringify(statusData) + '\n```' } : m));
    };

    try {
      const result = await new Promise((resolve, reject) => {
        runGlobalSearch(query, {
          onStatus: (data) => updatePending(data),
          onComplete: (data) => resolve(data),
          onError: (data) => reject(data),
        });
      });

      if (result.status === 'error') throw result;

      const finalContent = buildGlobalSearchResult(result, query);
      if (convId) {
        const aMsg = await chatAdapter.createMessage({ conversation_id: convId, role: 'assistant', content: finalContent, model: 'global_search' });
        setMessages((prev) => prev.map((m) => (m.id === pendingId ? aMsg : m)));
        try { await chatAdapter.updateLastMessage(convId, (result.summary || query).slice(0, 120)); } catch {}
      } else {
        setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, id: 'tmp_a_' + Date.now(), content: finalContent } : m)));
      }

      try {
        await dataAdapter.create('LibraryItem', { title: query.slice(0, 50), content: finalContent, kind: 'document', provider: 'global_search', prompt: query });
      } catch {}

      // Save search history
      try {
        await dataAdapter.create('SearchHistory', { query, language, result_count: (result.results || []).length });
      } catch {}

      // Check tracked products for price changes
      try {
        const reminders = await dataAdapter.filter('PriceReminder', { status: 'pending' });
        const searchResults = result.results || [];
        if (reminders.length > 0 && searchResults.length > 0) {
          const changes = [];
          for (const reminder of reminders) {
            if (!reminder.url) continue;
            const matched = searchResults.find(p => p.url && p.url === reminder.url);
            if (!matched) continue;
            const oldPrice = parseFloat(String(reminder.price || '').replace(/[^0-9.]/g, '')) || 0;
            const newPrice = typeof matched.price === 'number' ? matched.price : parseFloat(String(matched.price || '').replace(/[^0-9.]/g, '')) || 0;
            if (oldPrice > 0 && newPrice > 0 && oldPrice !== newPrice) {
              changes.push({
                product_name: reminder.product_name,
                old_price: reminder.price,
                new_price: String(matched.price),
                currency: reminder.currency || matched.currency || '',
                direction: newPrice < oldPrice ? 'down' : 'up',
              });
              try { await dataAdapter.update('PriceReminder', reminder.id, { price: String(matched.price) }); } catch {}
            }
          }
          if (changes.length > 0 && convId) {
            const notifContent = `🔔 **${t('gs_price_change_notif')}**\n\n` + changes.map(c =>
              `**${c.product_name}**\n${c.old_price} → ${c.new_price} ${c.currency}\n${c.direction === 'down' ? '⬇️ ' + t('gs_price_went_down') : '⬆️ ' + t('gs_price_went_up')}`
            ).join('\n\n');
            const nMsg = await chatAdapter.createMessage({ conversation_id: convId, role: 'assistant', content: notifContent, model: 'price_tracker' });
            setMessages((prev) => [...prev, nMsg]);
          }
        }
      } catch {}
    } catch (e) {
      const friendlyContent = 'الان نتونستم قیمت‌ها رو آنلاین بررسی کنم. اگر محصول خاصی مدنظرته، اسمش رو بگو تا کمکت کنم. 👌';
      setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, id: 'tmp_a_' + Date.now(), content: friendlyContent } : m)));
      if (convId) { try { await chatAdapter.createMessage({ conversation_id: convId, role: 'assistant', content: friendlyContent, model: 'global_search' }); } catch {} }
    }
    setSending(false);
  };

  // Keep ref to latest runGlobalSearchTool for event-based re-run
  rerunSearchRef.current = runGlobalSearchTool;

  // Listen for re-run search events (from SearchHistoryBar / StoreFilterMenu)
  useEffect(() => {
    const handler = (e) => {
      const q = e.detail?.query;
      if (q && rerunSearchRef.current && !sendingRef.current) {
        rerunSearchRef.current(q, q);
      }
    };
    window.addEventListener('homa-rerun-search', handler);
    return () => window.removeEventListener('homa-rerun-search', handler);
  }, []);

  // Listen for "use tool" events from connected ToolCards
  useEffect(() => {
    const handler = (e) => {
      const { tool_id, capability } = e.detail || {};
      if (!tool_id || !capability) return;
      // Find the last user message to re-execute with the selected tool
      const lastUser = [...messages].reverse().find(m => m.role === 'user');
      if (lastUser && !sendingRef.current) {
        // Re-run the tool suggestion with the connected provider
        const provider = getProviderById(tool_id);
        if (provider) {
          setManualProvider(provider);
          // Trigger the capability handler again
          handleSend(lastUser.content.replace(/!\[\]\([^)]+\)/g, '').replace(/📎.*$/gm, '').trim());
        }
      }
    };
    window.addEventListener('homa-use-tool', handler);
    return () => window.removeEventListener('homa-use-tool', handler);
  }, [messages]);

  const runCreateShoppingList = async (query, displayContent) => {
    setSending(true); setError(null);
    const convId = await ensureConv(query);
    await addMsg(convId, 'user', displayContent);
    const match = query.match(/لیست\s+(.+?)\s+(بساز|درست\s*کن)/) || query.match(/ساخت\s*لیست\s+(.+)/);
    const listName = match ? match[1].trim() : 'لیست خرید';
    try {
      await dataAdapter.create('ShoppingList', { name: listName, items: [] });
      const content = `📋 **${t('gs_list_created')}: ${listName}**\n\n${t('gs_list_created_chat')}`;
      await addMsg(convId, 'assistant', content);
    } catch { toast({ title: t('error_occurred') }); }
    setSending(false);
  };

  // Extract the last image URL from recent messages or current attachments for image-based tools
  const extractLastImage = () => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === 'user') {
        const match = (m.content || '').match(/!\[\]\(([^)]+)\)/);
        if (match) return match[1];
      }
    }
    return '';
  };

  // Build the display content for a completed job result
  const buildJobResultContent = (data, provider) => {
    const resultUrl = data.result_url || '';
    const resultText = data.result_text || '';
    const provName = provider?.name || data.provider_id || '';
    const cap = getCapabilityById(data.capability || '');
    const capLabel = cap?.label?.[language] || data.capability || '';
    let media = '';
    if (resultUrl) {
      if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(resultUrl) || data.capability?.includes('VIDEO')) {
        media = `\n\n🎬 [${t('download_video') || 'دانلود ویدیو'}](${resultUrl})\n<video src="${resultUrl}" controls class="w-full rounded-xl"></video>`;
      } else if (/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(resultUrl) || data.capability === 'TEXT_TO_SPEECH') {
        media = `\n\n🔊 [${t('download_audio') || 'دانلود صوت'}](${resultUrl})\n<audio src="${resultUrl}" controls class="w-full"></audio>`;
      } else if (/\.(png|jpg|jpeg|webp|gif)(\?|$)/i.test(resultUrl) || data.capability?.includes('IMAGE')) {
        media = `\n\n![](${resultUrl})`;
      } else {
        media = `\n\n📎 [${resultUrl}](${resultUrl})`;
      }
    }
    const textPart = resultText ? `\n\n${resultText}` : '';
    return `✅ **${t('job_ready') || 'آماده شد'}** — ${capLabel} (${provName})${textPart}${media}`;
  };

  // Execute a capability via the Job System when a connected provider exists
  const runCapabilityExecution = async (query, displayContent, capability, provider) => {
    setSending(true); setError(null);
    const convId = await ensureConv(query);
    await addMsg(convId, 'user', displayContent);

    const cost = estimateCost(capability, provider.id);
    const userCredits = usage?.credits ?? 0;
    if (cost > 0 && userCredits < cost) {
      const content = `❌ **${t('err_quota') || 'اعتبار کافی نیست'}**\n\n${t('job_needs_credits') || 'این عملیات نیاز به'} ${cost} ${t('credits') || 'اعتبار'} ${t('has') || 'دارد'} — ${t('job_your_balance') || 'موجودی شما'}: ${userCredits}`;
      await addMsg(convId, 'assistant', content);
      setSending(false);
      return;
    }
    if (needsConfirmation(capability, provider.id)) {
      const capLabel = getCapabilityById(capability)?.label?.[language] || capability;
      const confirmed = window.confirm(`${t('job_confirm') || 'این عملیات حدود'} ${cost} ${t('credits') || 'اعتبار'} ${t('consumes') || 'مصرف می‌کند'}.\n${provider.name} → ${capLabel}\n\n${t('job_proceed') || 'ادامه می‌دهید؟'}`);
      if (!confirmed) { setSending(false); return; }
    }

    // Build input — attach last image for image-based capabilities
    const input = { prompt: query };
    const needsImage = ['IMAGE_TO_VIDEO', 'IMAGE_EDITING', 'IMAGE_VARIATION', 'IMAGE_UPSCALING', 'BACKGROUND_REMOVAL', 'VIDEO_TO_VIDEO', 'LIP_SYNC'].includes(capability);
    if (needsImage) {
      const lastImg = extractLastImage();
      if (lastImg) input.image_url = lastImg;
    }

    const pendingId = 'job_pending_' + Date.now();
    const jobStartTime = Date.now();
    const capLabel = getCapabilityById(capability)?.label?.[language] || capability;
    const buildJobStatus = (stage, extra = {}) =>
      '```job-status\n' + JSON.stringify({ stage, startTime: jobStartTime, capability, capability_label: capLabel, provider: provider.name, ...extra }) + '\n```';
    const notifyJobDone = (success) => {
      if (success) { toast({ title: `✅ ${capLabel} — ${t('job_ready') || 'آماده شد'}` }); if (notifJobDone) playNotification(); }
      else { toast({ title: `❌ ${capLabel} — ${t('job_failed') || 'ناموفق بود'}` }); if (notifJobDone) playErrorSound(); }
    };
    setMessages((prev) => [...prev, { id: pendingId, role: 'assistant', content: buildJobStatus('submitting') }]);

    try {
      const res = await invokeFunctionDirect('createJob', { tool_id: provider.id, capability, input, credits_charged: cost });
      const data = res?.data || res;
      if (data?.error) {
        const errContent = `❌ **${t('job_failed') || 'خطا'}**: ${data.error}`;
        setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, id: 'tmp_a_' + Date.now(), content: errContent } : m)));
        if (convId) { try { await chatAdapter.createMessage({ conversation_id: convId, role: 'assistant', content: errContent, model: provider.id }); } catch {} }
        notifyJobDone(false);
        setSending(false);
        return;
        }

      // Create ApiJob entity record
      let apiJob = null;
      if (user?.id) {
        try {
          apiJob = await dataAdapter.create('ApiJob', {
            owner_id: user.id, capability, status: data.status === 'COMPLETED' ? 'completed' : 'processing',
            provider: provider.id, prompt: JSON.stringify(input).slice(0, 2000),
            external_id: data.job_id || '', result_url: data.result_url || '', result: data.result_text || '',
            credits_charged: cost,
          });
        } catch {}
      }

      if (data.status === 'COMPLETED') {
        const content = buildJobResultContent({ ...data, capability }, provider);
        if (convId) {
          const aMsg = await chatAdapter.createMessage({ conversation_id: convId, role: 'assistant', content, model: provider.id });
          setMessages((prev) => prev.map((m) => (m.id === pendingId ? aMsg : m)));
        } else {
          setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, id: 'tmp_a_' + Date.now(), content } : m)));
        }
        if (apiJob) { try { await dataAdapter.update('ApiJob', apiJob.id, { status: 'completed', result_url: data.result_url, result: data.result_text }); } catch {} }
        try { await dataAdapter.create('LibraryItem', { title: query.slice(0, 50), content, kind: data.result_url && data.result_url.match(/\.(mp4|webm|mov)/i) ? 'video' : data.result_url && data.result_url.match(/\.(mp3|wav|ogg)/i) ? 'audio' : 'image', file_url: data.result_url, provider: provider.id, prompt: query }); } catch {}
        syncJobToGCal({ capability, provider: provider.id, created_date: apiJob?.created_date }).catch(() => {});
        if (usage) setUsage((p) => ({ ...p, credits: Math.max(0, (p?.credits || 0) - cost) }));
        notifyJobDone(true);
      } else {
        // Async — poll for completion
        setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, content: buildJobStatus('processing') } : m)));
        const finalData = await pollJob(data.job_id, (update) => {
          const stage = update.status === 'COMPLETED' ? 'completed' : update.status === 'FAILED' ? 'error' : 'processing';
          setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, content: buildJobStatus(stage, { progress: update.progress }) } : m)));
        });
        if (finalData.status === 'COMPLETED') {
          const content = buildJobResultContent({ ...finalData, capability }, provider);
          if (convId) {
            const aMsg = await chatAdapter.createMessage({ conversation_id: convId, role: 'assistant', content, model: provider.id });
            setMessages((prev) => prev.map((m) => (m.id === pendingId ? aMsg : m)));
          } else {
            setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, id: 'tmp_a_' + Date.now(), content } : m)));
          }
          if (apiJob) { try { await dataAdapter.update('ApiJob', apiJob.id, { status: 'completed', result_url: finalData.result_url, result: finalData.result_text }); } catch {} }
          try { await dataAdapter.create('LibraryItem', { title: query.slice(0, 50), content, kind: finalData.result_url && finalData.result_url.match(/\.(mp4|webm|mov)/i) ? 'video' : finalData.result_url && finalData.result_url.match(/\.(mp3|wav|ogg)/i) ? 'audio' : 'image', file_url: finalData.result_url, provider: provider.id, prompt: query }); } catch {}
          syncJobToGCal({ capability, provider: provider.id, created_date: apiJob?.created_date }).catch(() => {});
          if (usage) setUsage((p) => ({ ...p, credits: Math.max(0, (p?.credits || 0) - cost) }));
          notifyJobDone(true);
        } else {
          const errContent = `❌ **${t('job_failed') || 'خطا'}**: ${finalData.error || finalData.status}`;
          if (convId) {
            const aMsg = await chatAdapter.createMessage({ conversation_id: convId, role: 'assistant', content: errContent, model: provider.id });
            setMessages((prev) => prev.map((m) => (m.id === pendingId ? aMsg : m)));
          } else {
            setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, id: 'tmp_a_' + Date.now(), content: errContent } : m)));
          }
          if (apiJob) { try { await dataAdapter.update('ApiJob', apiJob.id, { status: 'failed', error: finalData.error || finalData.status }); } catch {} }
          notifyJobDone(false);
        }
      }
    } catch (e) {
      const errContent = `❌ **${t('job_failed') || 'خطا'}**: ${e?.message || t('error_occurred')}`;
      setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, id: 'tmp_a_' + Date.now(), content: errContent } : m)));
      if (convId) { try { await chatAdapter.createMessage({ conversation_id: convId, role: 'assistant', content: errContent, model: provider.id }); } catch {} }
      notifyJobDone(false);
    }
    setSending(false);
  };

  // Internal image generation via Pollinations (free, no API key needed)
  const runInternalImageGeneration = async (query, displayContent) => {
    setSending(true); setError(null);
    const convId = await ensureConv(query);
    await addMsg(convId, 'user', displayContent);

    const prompt = query.replace(/^(ساخت\s*تصویر[:\s]*|تولید\s*تصویر[:\s]*|ساخت\s*عکس[:\s]*)/i, '').trim() || query;
    const encoded = encodeURIComponent(prompt.slice(0, 400));
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;

    const capLabel = getCapabilityById('IMAGE_GENERATION')?.label?.[language] || 'تولید تصویر';
    const pendingId = 'job_pending_' + Date.now();
    const startTime = Date.now();
    const buildStatus = (stage, extra = {}) =>
      '```job-status\n' + JSON.stringify({ stage, startTime, capability: 'IMAGE_GENERATION', capability_label: capLabel, provider: 'Pollinations', message: prompt.slice(0, 60), ...extra }) + '\n```';

    setMessages((prev) => [...prev, { id: pendingId, role: 'assistant', content: buildStatus('submitting') }]);
    setTimeout(() => { setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, content: buildStatus('generating') } : m))); }, 800);

    try {
      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('generation_failed'));
        img.src = imageUrl;
        setTimeout(() => reject(new Error('timeout')), 60000);
      });

      setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, content: buildStatus('downloading') } : m)));
      const finalContent = `✅ **${capLabel}** — Pollinations\n\n![](${imageUrl})`;

      if (convId) {
        const aMsg = await chatAdapter.createMessage({ conversation_id: convId, role: 'assistant', content: finalContent, model: 'pollinations' });
        setMessages((prev) => prev.map((m) => (m.id === pendingId ? aMsg : m)));
        try { await chatAdapter.updateLastMessage(convId, prompt.slice(0, 120)); } catch {}
      } else {
        setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, id: 'tmp_a_' + Date.now(), content: finalContent } : m)));
      }
      try { await dataAdapter.create('LibraryItem', { title: prompt.slice(0, 50), content: imageUrl, kind: 'image', file_url: imageUrl, provider: 'pollinations', prompt }); } catch {}
      if (user?.id) { try { await dataAdapter.create('ApiJob', { owner_id: user.id, capability: 'IMAGE_GENERATION', status: 'completed', provider: 'pollinations', prompt: prompt.slice(0, 2000), result_url: imageUrl, credits_charged: 0 }); } catch {} }
    } catch (e) {
      const errContent = '```job-status\n' + JSON.stringify({ stage: 'error', startTime, capability: 'IMAGE_GENERATION', capability_label: capLabel, provider: 'Pollinations', message: e?.message === 'timeout' ? 'زمان تولید بیش از حد طول کشید' : 'خطا در تولید تصویر' }) + '\n```';
      setMessages((prev) => prev.map((m) => (m.id === pendingId ? { ...m, id: 'tmp_a_' + Date.now(), content: errContent } : m)));
      if (convId) { try { await chatAdapter.createMessage({ conversation_id: convId, role: 'assistant', content: errContent, model: 'pollinations' }); } catch {} }
    }
    setSending(false);
  };

  // Route an external capability: execute if a connected provider exists, else show discovery card
  const runToolSuggestion = async (query, displayContent, capability) => {
    setSending(true); setError(null);
    const convId = await ensureConv(query);
    await addMsg(convId, 'user', displayContent);

    const cap = getCapabilityById(capability);
    const allProviders = getProvidersByCapability(capability);
    const externalProviders = allProviders.filter(p => p.type === 'external');

    let connections = [];
    try { connections = await dataAdapter.filter('UserConnection', { status: 'active' }); } catch {}
    const connectedIds = new Set(connections.filter((c) => c.metadata !== 'disabled').map((c) => c.tool_id));

    // Manual provider override takes priority
    let provider = manualProvider && connectedIds.has(manualProvider.id) ? manualProvider : null;
    if (!provider) provider = selectBestProvider(capability, toolPreference, connectedIds);
    setManualProvider(null); // consume manual override

    // If a connected external provider exists → execute via Job System
    if (provider && connectedIds.has(provider.id)) {
      setSending(false);
      return runCapabilityExecution(query, displayContent, capability, provider);
    }

    // No connected provider → show discovery card
    const bestProvider = selectBestProvider(capability, toolPreference, connectedIds);
    const estimatedCost = bestProvider ? estimateCost(capability, bestProvider.id) : 0;
    const toolSuggestionData = {
      capability,
      capability_label: cap?.label?.[language] || capability,
      query,
      has_internal: allProviders.filter(p => p.type === 'internal').length > 0,
      best_provider: bestProvider ? { id: bestProvider.id, name: bestProvider.name, type: bestProvider.type } : null,
      estimated_cost: estimatedCost,
      needs_confirmation: needsConfirmation(capability, bestProvider?.id),
      tools: externalProviders.map(t => ({ ...t, connected: connectedIds.has(t.id) })),
    };
    const content = '```tool-suggestion\n' + JSON.stringify(toolSuggestionData) + '\n```';
    if (convId) {
      const aMsg = await chatAdapter.createMessage({ conversation_id: convId, role: 'assistant', content, model: 'tool_router' });
      setMessages((prev) => [...prev, aMsg]);
      try { await chatAdapter.updateLastMessage(convId, query.slice(0, 120)); } catch {}
    } else {
      setMessages((prev) => [...prev, { id: 'tmp_a_' + Date.now(), role: 'assistant', content }]);
    }
    setSending(false);
  };

  const handleSend = async (overrideText) => {
    let text = (typeof overrideText === 'string' ? overrideText : input).trim();
    if (!text || sending) return;

    // Slash command routing — /image, /video, /translate, /search, etc.
    const slash = parseSlashCommand(text);
    if (slash) {
      const { command, prompt } = slash;
      stickRef.current = true; setInput(''); if (notifSend) playBeep(660, 0.07);
      if (command.cmd === '/search')
        return runTool({ fnName: 'smartSearch', payload: { input: prompt, language }, query: prompt, displayContent: prompt, buildResult: buildSearchResult, direct: true });
      if (command.cmd === '/research')
        return runTool({ fnName: 'deepResearch', payload: { input: prompt, language }, query: prompt, displayContent: prompt, buildResult: sourcesMd, direct: true });
      if (command.cmd === '/shopping')
        return runGlobalSearchTool(prompt, prompt);
      if (command.cmd === '/translate') {
        const targetLang = language === 'fa' ? 'فارسی' : language === 'ku' ? 'کوردی' : 'English';
        const convId = await ensureConv(prompt);
        await addMsg(convId, 'user', prompt);
        await callAI([{ role: 'user', content: prompt }], convId, `Translate the following text to ${targetLang}. Output ONLY the translation, nothing else.`);
        return;
      }
      if (command.cmd === '/image') text = 'ساخت تصویر: ' + prompt;
      else if (command.cmd === '/video') text = 'ساخت ویدیو: ' + prompt;
      else if (command.cmd === '/music') text = 'ساخت آهنگ: ' + prompt;
      else if (command.cmd === '/remind') {
        const convId = await ensureConv(prompt);
        await addMsg(convId, 'user', prompt);
        const when = new Date(Date.now() + 60 * 60 * 1000);
        try {
          const rem = await alarmReminders.create({ title: prompt.slice(0, 100), remind_at: when.toISOString(), status: 'pending', conversation_id: convId || '', source: 'chat', reminder_type: 'time', recurring_type: 'once', label: detectReminderTag(prompt) });
          const timeStr = when.toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit' });
          const content = `حتماً 👌 ${timeStr} یادت می‌اندازم ${prompt}.` + reminderCardBlock(rem);
          await addMsg(convId, 'assistant', content);
        } catch { toast({ title: t('error_occurred') }); }
        setSending(false);
        return;
      }
      if (command.cmd === '/code') text = 'کدنویسی: ' + prompt;
    }

    stickRef.current = true;
    setInput('');
    if (notifSend) playBeep(660, 0.07);

    const images = attachments.filter((a) => a.kind === 'image' && a.file_url).map((a) => a.file_url);
    const imageData = attachments.filter((a) => a.kind === 'image' && typeof a.base64 === 'string' && a.base64.startsWith('data:image')).map((a) => a.base64);
    const fileCount = attachments.length;
    const fileContext = attachments.map((a) => {
      if (a.textContent) return `[محتوای فایل ${a.name}]:\n${a.textContent}`;
      return null;
    }).filter(Boolean).join('\n\n');
    const displayExtra = attachments.map((a) => {
      if (a.kind === 'image') {
        if (a.file_url) return `\n\n![](${a.file_url})`;
        if (a.base64) return `\n\n![](${a.base64})`;
        return `\n\n📎 ${a.name}`;
      }
      if (a.kind === 'video' && a.file_url) return `\n\n🎬 [${a.name}](${a.file_url})`;
      if (a.file_url) return `\n\n📎 [${a.name}](${a.file_url})`;
      return `\n\n📎 ${a.name}`;
    }).join('');
    const displayContent = text + displayExtra;
    const dbContent = displayContent.replace(/!\[\]\(data:image\/[^;]+;base64,[^)]+\)/g, '').trim();
    setAttachments([]);

    const currentMode = mode;
    setMode(null);

    if (currentMode === 'global') return runGlobalSearchTool(text, displayContent);

    if (/لیست\s+.+?\s+(بساز|درست\s*کن)|ساخت\s*لیست/i.test(text)) {
      return runCreateShoppingList(text, displayContent);
    }

    // Smart Watch — pending product info from previous turn
    if (pendingSmartWatch) {
      const product = parseProductInput(text);
      if (product.name || product.url) {
        const convId = await ensureConv(text);
        await addMsg(convId, 'user', displayContent);
        try {
          const watch = await alarmReminders.create({
            title: (product.name || 'محصول زیر نظر').slice(0, 100),
            remind_at: new Date(Date.now() + 30 * 86400000).toISOString(),
            status: 'pending', source: 'smart', reminder_type: 'smart',
            condition_type: pendingSmartWatch.condition,
            condition_value: pendingSmartWatch.targetPrice ? String(pendingSmartWatch.targetPrice) : '',
            product_url: product.url || '', product_name: product.name || '',
            target_price: pendingSmartWatch.targetPrice || 0,
            label: detectReminderTag(product.name || text), notify_once: true,
            conversation_id: convId || '',
          });
          setPendingSmartWatch(null);
          const content = `👁️ هشدار هوشمند ثبت شد! زیر نظر می‌گیرمش.` + smartWatchCardBlock(watch);
          await addMsg(convId, 'assistant', content);
          await autoCheckWatch(convId, watch);
        } catch { toast({ title: t('error_occurred') }); }
        setSending(false);
        return;
      }
      setPendingSmartWatch(null);
    }

    // Smart Watch intent — "وقتی ارزون شد" / "موجود شد" / "زیر X میلیون"
    const swIntent = detectSmartWatchIntent(text);
    if (swIntent) {
      const convId = await ensureConv(text);
      await addMsg(convId, 'user', displayContent);
      if (!swIntent.product.name && !swIntent.product.url) {
        setPendingSmartWatch({ condition: swIntent.condition, targetPrice: swIntent.targetPrice });
        await addMsg(convId, 'assistant', 'حتماً 👌 لینک یا نام دقیق محصول رو بفرست تا زیر نظر بگیرمش.');
        setSending(false);
        return;
      }
      try {
        const watch = await alarmReminders.create({
          title: (swIntent.product.name || 'محصول زیر نظر').slice(0, 100),
          remind_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          status: 'pending', source: 'smart', reminder_type: 'smart',
          condition_type: swIntent.condition,
          condition_value: swIntent.targetPrice ? String(swIntent.targetPrice) : '',
          product_url: swIntent.product.url || '', product_name: swIntent.product.name || '',
          target_price: swIntent.targetPrice || 0,
          label: detectReminderTag(swIntent.product.name || text), notify_once: true,
          conversation_id: convId || '',
        });
        const content = `👁️ هشدار هوشمند ثبت شد! زیر نظر می‌گیرمش.` + smartWatchCardBlock(watch);
        await addMsg(convId, 'assistant', content);
        await autoCheckWatch(convId, watch);
      } catch { toast({ title: t('error_occurred') }); }
      setSending(false);
      return;
    }

    // Reminder management via natural language — list / delete / toggle (chat-centric)
    const remCmd = detectReminderCommand(text);
    if (remCmd) {
      const convId = await ensureConv(text);
      await addMsg(convId, 'user', displayContent);
      try {
        if (remCmd.type === 'list') {
          let all = await alarmReminders.filter({ status: 'pending' }, '-created_date', 50);
          if (remCmd.today) {
            const s = new Date(); s.setHours(0, 0, 0, 0);
            const e = new Date(); e.setHours(23, 59, 59, 999);
            all = all.filter((r) => { const d = new Date(r.remind_at); return d >= s && d <= e; });
          }
          const content = all.length ? `این‌ها یادآورهای فعالت:${reminderListBlock(all)}` : `فعلاً هیچ یادآور فعالی نداری. می‌خوای یکی بسازم؟`;
          await addMsg(convId, 'assistant', content);
        } else if (remCmd.type === 'delete') {
          const all = await alarmReminders.filter({ status: 'pending' }, '-created_date', 50);
          const found = remCmd.title ? all.find((r) => r.title.includes(remCmd.title) || remCmd.title.includes(r.title)) : all[0];
          if (found) { await alarmReminders.delete(found.id); await addMsg(convId, 'assistant', `باشه، یادآور «${found.title}» رو حذف کردم. 🗑️`); }
          else await addMsg(convId, 'assistant', `یادآوری با این نام پیدا نکردم. بگو «یادآورهای منو نشون بده» تا لیست ببینیم.`);
        } else if (remCmd.type === 'toggle') {
          const all = await alarmReminders.filter({}, '-created_date', 50);
          const found = remCmd.title ? all.find((r) => r.title.includes(remCmd.title) || remCmd.title.includes(r.title)) : all[0];
          if (found) {
            const ns = remCmd.activate ? 'pending' : 'paused';
            await alarmReminders.update(found.id, { status: ns });
            await addMsg(convId, 'assistant', `${remCmd.activate ? 'فعالش کردم ✓' : 'غیرفعالش کردم ○'} — «${found.title}».`);
          } else await addMsg(convId, 'assistant', `یادآوری با این نام پیدا نکردم.`);
        }
      } catch { toast({ title: t('error_occurred') }); }
      setSending(false);
      return;
    }

    // Alarm intent — "فردا ساعت ۷ بیدارم کن" / "آلارم بنداز ساعت ۶" / "set alarm for 7"
    const alarmIntentMatch = text.match(/(?:بیدارم?\s*کن|آلارم|alarm|ئاگادارکردنەوە|بیدار\s*بکە).*(?:ساعت\s*(\d{1,2})(?::(\d{2}))?|at\s*(\d{1,2})(?::(\d{2}))?)/i) || text.match(/(?:ساعت\s*(\d{1,2})(?::(\d{2}))?).*(?:بیدارم?\s*کن|آلارم|alarm)/i);
    if (alarmIntentMatch) {
      const hour = parseInt(alarmIntentMatch[1] || alarmIntentMatch[3] || '7');
      const minute = parseInt(alarmIntentMatch[2] || alarmIntentMatch[4] || '0');
      const title = text.replace(/بیدارم?\s*کن|آلارم|alarm|ئاگادارکردنەوە|بیدار\s*بکە|ساعت\s*\d{1,2}(?::\d{2})?|at\s*\d{1,2}(?::\d{2})?|فردا|امروز|tonight|tomorrow|today|و\s*بعدش|بعدش/g, '').trim() || 'بیدار شو';
      const convId = await ensureConv(title);
      await addMsg(convId, 'user', displayContent);
      try {
        const now = new Date();
        const target = new Date(now);
        target.setHours(hour, minute, 0, 0);
        if (target <= now) target.setDate(target.getDate() + 1);
        await dataAdapter.create('Alarm', {
          title: title.slice(0, 100), hour, minute, recurring_type: 'once',
          sound: 'classic', volume: 70, vibrate: true, voice_enabled: false,
          snooze_enabled: true, snooze_duration: 10, snooze_max_count: 3,
          alarm_intensity: 'normal', active: true, next_trigger: target.toISOString(),
        });
        const content = `⏰ **${t('alarm_saved') || 'آلارم ذخیره شد'}**\n\n🔔 ${title}\n⏰ ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        await addMsg(convId, 'assistant', content);
      } catch { toast({ title: t('error_occurred') }); }
      setSending(false);
      return;
    }

    // Quick remind — "10 ثانیه/دقیقه/ساعت دیگه یادم بنداز [task]"
    const quickRemind = text.match(/(\d+)\s*(ثانیه|دقیقه|ساعت|hour|minute|second|day|روز)\s*دیگه.*?(?:یادم?\s*بنداز|یادآوری\s*کن|یادم\s*بیار|remind)/i);
    if (quickRemind) {
      const num = parseInt(quickRemind[1]);
      const unit = quickRemind[2];
      const mult = /ثانیه|second/i.test(unit) ? 1000 : /دقیقه|minute/i.test(unit) ? 60000 : /ساعت|hour/i.test(unit) ? 3600000 : 86400000;
      const when = new Date(Date.now() + num * mult);
      const task = text.replace(/(\d+)\s*(ثانیه|دقیقه|ساعت|hour|minute|second|day|روز)\s*دیگه.*?(?:یادم?\s*بنداز|یادآوری\s*کن|یادم\s*بیار|remind)/i, '').replace(/که|برای|to|on|رو|را/g, '').trim() || 'یادآوری';
      const convId = await ensureConv(task);
      await addMsg(convId, 'user', displayContent);
      try {
        const rem = await alarmReminders.create({ title: task.slice(0, 100), remind_at: when.toISOString(), status: 'pending', conversation_id: convId || '', source: 'chat', reminder_type: 'time', recurring_type: 'once', label: detectReminderTag(task) });
        const content = `حتماً 👌 ${num} ${unit} دیگه یادت می‌اندازم ${task}.` + reminderCardBlock(rem);
        await addMsg(convId, 'assistant', content);
      } catch { toast({ title: t('error_occurred') }); }
      setSending(false);
      return;
    }

    // Reminder intent — "یادآور من برای X ساعت/روز" or "remind me to X"
    const remindMatch = text.match(/^(?:یادآور\s+(?:من\s+)?(?:برای\s+)?|remind\s+me\s+to\s+|بیرخستنەوە\s+)(.+?)(?:\s+(?:در|ساعت|برای|at|in)\s+(.+))?$/i);
    if (remindMatch) {
      const task = remindMatch[1].trim();
      const timeStr = remindMatch[2];
      let when = new Date(Date.now() + 60 * 60 * 1000); // default +1h
      if (timeStr) {
        const hm = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (hm) { when = new Date(); when.setHours(parseInt(hm[1]), parseInt(hm[2]), 0, 0); if (when < new Date()) when.setDate(when.getDate() + 1); }
        else {
          const s = timeStr.match(/(\d+)\s*(?:ثانیه|second)/i);
          const h = timeStr.match(/(\d+)\s*(?:ساعت|hour|hr|کاتژمێر)/i);
          const d = timeStr.match(/(\d+)\s*(?:روز|day|ڕۆژ)/i);
          const m = timeStr.match(/(\d+)\s*(?:دقیقه|minute|min)/i);
          if (s) when = new Date(Date.now() + parseInt(s[1]) * 1000);
          else if (h) when = new Date(Date.now() + parseInt(h[1]) * 3600000);
          else if (m) when = new Date(Date.now() + parseInt(m[1]) * 60000);
          else if (d) when = new Date(Date.now() + parseInt(d[1]) * 86400000);
        }
      }
      const convId = await ensureConv(task);
      await addMsg(convId, 'user', displayContent);
      try {
        const rem = await alarmReminders.create({ title: task.slice(0, 100), remind_at: when.toISOString(), status: 'pending', conversation_id: convId || '', source: 'chat', reminder_type: 'time', recurring_type: 'once', label: detectReminderTag(task) });
        const timeStr = when.toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        const content = `حتماً 👌 ${timeStr} یادت می‌اندازم ${task}.` + reminderCardBlock(rem);
        await addMsg(convId, 'assistant', content);
      } catch { toast({ title: t('error_occurred') }); }
      setSending(false);
      return;
    }

    if (!currentMode) {
      const capability = detectCapability(text);
      console.log('[Homa Router]', { text: text.slice(0, 50), capability });
      if (capability) {
        if (capability === 'GLOBAL_SEARCH') return runGlobalSearchTool(text, displayContent);
        if (capability === 'WEB_SEARCH') return runTool({ fnName: 'smartSearch', payload: { input: text, language }, query: text, displayContent, buildResult: buildSearchResult, direct: true });
        if (capability === 'DEEP_RESEARCH') return runTool({ fnName: 'deepResearch', payload: { input: text, language }, query: text, displayContent, buildResult: sourcesMd, direct: true });
        if (capability === 'IMAGE_GENERATION') return runInternalImageGeneration(text, displayContent);
        if (!isInternalCapability(capability)) {
          return runToolSuggestion(text, displayContent, capability);
        }
      }
    }
    if (currentMode === 'web') return runTool({ fnName: 'smartSearch', payload: { input: text, language }, query: text, displayContent, buildResult: buildSearchResult, direct: true });
    if (currentMode === 'research') return runTool({ fnName: 'deepResearch', payload: { input: text, language }, query: text, displayContent, buildResult: sourcesMd, direct: true });

    if (temporary) {
      const userMsg = { id: 'tmp_u_' + Date.now(), role: 'user', content: displayContent };
      const newMsgs = [...messages, userMsg];
      setMessages(newMsgs);
      await callAI(newMsgs, null, fileContext, images, fileCount, imageData);
      return;
    }

    try {
      let convId = id;
      if (!convId || convId === 'new') {
        const conv = await chatAdapter.createConversation({ title: text.slice(0, 40), language, model });
        convId = conv.id; setConversation(conv); loadedIdRef.current = convId; navigate('/chat/' + convId, { replace: true });
      }
      const userMsg = await chatAdapter.createMessage({ conversation_id: convId, role: 'user', content: dbContent });
      const localMsg = { ...userMsg, content: displayContent };
      const newMsgs = [...messages, localMsg];
      setMessages(newMsgs);
      await chatAdapter.updateLastMessage(convId, text.slice(0, 120));
      await callAI(newMsgs, convId, fileContext, images, fileCount, imageData);
    } catch (e) {
      const msg = String(e?.message || '');
      if (msg.includes('Failed to fetch') || msg.includes('Network') || msg.includes('worker_')) {
        setError('ارتباط با سرور برقرار نشد. اگر Homa Worker را در Settings تنظیم کرده‌اید، مطمئن شوید که فعال است یا آن را پاک کنید.');
      } else {
        setError(t('error_occurred'));
      }
      setSending(false);
      setInput(text);
    }
  };

  const handleRegenerate = async () => {
    if (sending) return;
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx < 0) return;
    const realIdx = messages.length - 1 - lastUserIdx;
    const afterUser = messages.slice(realIdx + 1);
    const trimmed = messages.slice(0, realIdx + 1);
    setMessages(trimmed);
    if (!temporary && id && id !== 'new') {
      if (afterUser.length) { try { await chatAdapter.deleteMessages(afterUser.map((m) => m.id)); } catch {} }
      await callAI(trimmed, id);
    } else { await callAI(trimmed, null); }
  };

  const handleFeedback = async (msg, kind) => {
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, feedback: kind } : m)));
    if (msg.id && !String(msg.id).startsWith('tmp_')) { try { await chatAdapter.updateMessage(msg.id, { feedback: kind }); } catch {} }
  };

  const saveAsTemplate = async () => {
    const text = input.trim();
    if (!text) { toast({ title: t('error_occurred') }); return; }
    try { await dataAdapter.create('PromptTemplate', { title: text.slice(0, 40), body: text }); toast({ title: t('template_saved') }); } catch { toast({ title: t('error_occurred') }); }
  };

  const handleSave = async (msg) => {
    try { await dataAdapter.create('LibraryItem', { title: msg.content.slice(0, 50), content: msg.content, kind: 'text' }); toast({ title: t('saved_to_saved') }); } catch { toast({ title: t('error_occurred') }); }
  };

  const moveToFolder = async (folderId) => {
    if (!id || id === 'new') return;
    try {
      await chatAdapter.moveToFolder(id, folderId);
      setConversation((p) => ({ ...p, folder_id: folderId }));
      toast({ title: t('save') });
    } catch { toast({ title: t('error_occurred') }); }
  };

  const handleReport = async (msg, reason, details) => {
    try {
      await dataAdapter.create('SupportTicket', { subject: t('report_response') + ' — ' + (reason ? t(reason) : ''), message: (details ? details + '\n\n' : '') + msg.content.slice(0, 500), user_email: user?.email, user_name: user?.full_name });
      toast({ title: t('report_sent') });
    } catch { toast({ title: t('error_occurred') }); }
  };

  const handleEdit = async (msg) => {
    setInput(msg.content);
    const idx = messages.findIndex((m) => m.id === msg.id);
    const removed = messages.slice(idx);
    setMessages(messages.slice(0, idx));
    if (!temporary && id && id !== 'new') { try { await chatAdapter.deleteMessages(removed.map((m) => m.id)); } catch {} }
  };

  const toggleTemp = () => {
    setTemporary((v) => {
      const nv = !v;
      if (nv) { setMessages([]); setConversation(null); navigate('/chat/new', { replace: true }); loadedIdRef.current = null; }
      return nv;
    });
  };

  const clearChat = async () => {
    if (!id || id === 'new') { setMessages([]); return; }
    try {
      await chatAdapter.deleteMessagesByConversation(id);
      await chatAdapter.deleteConversation(id);
    } catch {}
    setMessages([]); setConversation(null); loadedIdRef.current = null; navigate('/chat/new', { replace: true });
  };

  return {
    t, language,
    conversation, messages, sending, uploading, error, temporary, model, setModel,
    deepThink, setDeepThink, codeMode, setCodeMode, codeAction, setCodeAction,
    input, setInput, attachments, attach, removeAttachment, mode, setMode,
    usage, quotaInfo, setQuotaInfo, folders, showJump, setShowJump, scrollRef, handleScroll,
    tts, callAI, stopGeneration, handleSend, handleRegenerate, handleFeedback,
    saveAsTemplate, handleSave, moveToFolder, handleReport, handleEdit, toggleTemp, clearChat,
    toolPreference, setToolPreference, manualProvider, setManualProvider,
  };
}