/**
 * directInvoke.js — Direct Worker invocation (no Base44).
 *
 * All function calls go directly to the Cloudflare Worker.
 * User identity is proven by the Homa token (X-User-Token header).
 * No Base44 SDK dependency at runtime.
 */

const getToken = () => {
  try {
    return localStorage.getItem('base44_access_token') || '';
  } catch {
    return '';
  }
};

const getWorkerUrl = () => {
  try {
    return (localStorage.getItem('homa_worker_url') || 'https://homa-ai-core.shahramalidazeh620.workers.dev').trim().replace(/\/$/, '');
  } catch {
    return '';
  }
};

const WORKER_ROUTES = {
  chat: 'chat',
  smartSearch: 'web_search',
  webSearch: 'web_search',
  deepResearch: 'deep_research',
  generateTTS: 'tts',
  analyzeWebsite: 'analyze',
  analyzeInstagram: 'analyze',
  analyzeTikTok: 'analyze',
  analyzeFacebook: 'analyze',
  generatePrompt: 'generate_prompt',
  uploadFile: 'upload_file',
  fileAnalyze: 'file_analyze',
  imageGenerate: 'image_generate',
  imageEdit: 'image_edit',
  videoGenerate: 'video_generate',
  speechToText: 'stt',
  videoAnalyze: 'video_analyze',
  globalSearch: 'global_search',
  toolRoute: 'tool_route',
  googleStatus: 'google_status',
  googleTasksCreate: 'google_tasks_create',
  googleCalendarCreate: 'google_calendar_create',
  googleDisconnect: 'google_disconnect',
  createTicket: 'create_ticket',
  replyTicket: 'reply_ticket',
  adminListTickets: 'admin_list_tickets',
  adminUpdateTicket: 'admin_update_ticket',
  adminDashboard: 'admin_dashboard',
  adminManageUser: 'admin_manage_user',
  referralStatus: 'referral_status',
  processReferral: 'process_referral',
};

// RESTful connector routes (path-based, require user identity token).
const CONNECTOR_PATH_ROUTES = {
  connectTool: { path: '/connect', method: 'POST' },
  disconnectTool: { path: '/disconnect', method: 'POST' },
  connectionStatus: { path: '/connection/status', method: 'GET' },
  createJob: { path: '/jobs', method: 'POST' },
  getJob: { path: '/jobs', method: 'GET' },
  cancelJob: { path: '/jobs/cancel', method: 'POST' },
};

const ANALYZE_TYPES = {
  analyzeWebsite: 'website',
  analyzeInstagram: 'instagram',
  analyzeTikTok: 'tiktok',
  analyzeFacebook: 'facebook',
};

// Routes that the current Cloudflare Worker exposes with Homa-user-token auth.
// These routes deliberately do not send the shared HOMA_WORKER_KEY to browsers.
async function invokeUserRoute(url, userToken, path, method = 'GET', payload) {
  if (!userToken) {
    const err = new Error('User authentication required');
    err.status = 401;
    err.code = 'no_user_token';
    throw err;
  }
  const response = await fetch(url + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Token': userToken,
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  let data;
  try { data = await response.json(); } catch { throw new Error('Worker returned an invalid response'); }
  if (!response.ok || data?.success === false) {
    const message = data?.error?.message || data?.error || `worker_${response.status}`;
    const err = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    err.status = response.status;
    err.code = data?.error?.code;
    throw err;
  }
  return data;
}

async function invokePrivilegedRoute(url, userToken, path, method = 'GET', payload) {
  let workerKey = '';
  try { workerKey = (localStorage.getItem('homa_worker_key') || '').trim(); } catch {}
  if (!workerKey) {
    const err = new Error('برای این بخش، کلید مدیریتی Worker در تنظیمات این دستگاه ثبت نشده است.');
    err.code = 'worker_key_missing';
    throw err;
  }
  if (!userToken) throw new Error('User authentication required');
  const response = await fetch(url + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${workerKey}`,
      'X-User-Token': userToken,
    },
    body: payload === undefined ? undefined : JSON.stringify(payload),
  });
  let data;
  try { data = await response.json(); } catch { throw new Error('Worker returned an invalid response'); }
  if (!response.ok || data?.success === false) {
    const message = data?.error?.message || data?.error || `worker_${response.status}`;
    const err = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    err.status = response.status;
    err.code = data?.error?.code;
    throw err;
  }
  return data;
}

async function invokeMappedUserRoute(functionName, url, userToken, payload = {}) {
  switch (functionName) {
    case 'createTicket':
      return invokeUserRoute(url, userToken, '/support/tickets', 'POST', payload);
    case 'replyTicket': {
      if (!payload.ticket_id) throw new Error('ticket_id_required');
      return invokeUserRoute(url, userToken, `/support/tickets/${encodeURIComponent(payload.ticket_id)}/reply`, 'POST', { content: payload.content, author_name: payload.author_name });
    }
    case 'referralStatus':
      return invokeUserRoute(url, userToken, '/referrals/status');
    case 'processReferral':
      return invokeUserRoute(url, userToken, '/referrals/process', 'POST', {
        referred_user_id: payload.referred_user_id || payload.referee_id || payload.user_id,
        referred_email: payload.referred_email || '',
        referrer_code: payload.referrer_code || payload.referral_code || '',
      });
    case 'createZarinpalPayment':
      return invokeUserRoute(url, userToken, '/payments/create', 'POST', payload);
    case 'getPaymentStatus':
      if (!payload.order_id) throw new Error('order_id_required');
      return invokeUserRoute(url, userToken, `/payments/status/${encodeURIComponent(payload.order_id)}`);
    default:
      return null;
  }
}

export async function invokeFunctionDirect(functionName, payload) {
  const url = getWorkerUrl();
  const userToken = getToken();

  // Routes implemented by the current Worker API and authenticated with the user's Homa token.
  const userRouteResult = await invokeMappedUserRoute(functionName, url, userToken, payload);
  if (userRouteResult !== null) return userRouteResult;

  // Admin and developer-platform routes require the Worker key plus the user's Homa token.
  // The key is read only from this device's Settings storage; it is never hard-coded.
  const privilegedRoutes = {
    adminDashboard: { path: '/admin/dashboard', method: 'GET' },
    adminReferrals: { path: '/admin/referrals', method: 'GET' },
    adminOrders: { path: '/admin/orders', method: 'GET' },
    adminUsers: { path: '/admin/users', method: 'GET' },
    adminCreditTransactions: { path: '/admin/credits/transactions', method: 'GET' },
    apiUsage: { path: '/api/usage?limit=200', method: 'GET' },
    adminListTickets: { path: '/admin/tickets', method: 'GET' },
    adminReplyTicket: { path: `/support/tickets/${encodeURIComponent(payload.ticket_id || '')}/admin-reply`, method: 'POST', body: { content: payload.content, author_name: payload.author_name, status: payload.status } },
    adminUpdateTicket: { path: `/admin/tickets/${encodeURIComponent(payload.ticket_id || '')}`, method: 'PATCH', body: { status: payload.status, priority: payload.priority } },
    adminManageUser: payload.action === 'add_credits' || payload.action === 'remove_credits'
      ? { path: `/admin/users/${encodeURIComponent(payload.userId || payload.user_id || '')}/credits`, method: 'POST', body: { amount: Math.abs(Number(payload.value || 0)), action: payload.action === 'remove_credits' ? 'remove' : 'add' } }
      : payload.action === 'set_plan'
        ? { path: `/admin/users/${encodeURIComponent(payload.userId || payload.user_id || '')}/plan`, method: 'POST', body: { plan: payload.value } }
        : { path: `/admin/users/${encodeURIComponent(payload.userId || payload.user_id || '')}`, method: 'PATCH', body: payload.updates || {} },
    homaApiHealth: { path: '/admin/provider-health', method: 'GET' },
    exportToDocs: null,
    exportToSheets: null,
  };
  if (Object.prototype.hasOwnProperty.call(privilegedRoutes, functionName)) {
    const route = privilegedRoutes[functionName];
    if (!route) throw new Error('این عملیات هنوز در Worker فعلی پیاده‌سازی نشده است.');
    if (functionName === 'adminManageUser' && !payload.userId && !payload.user_id) {
      throw new Error('شناسه کاربر ارسال نشده است.');
    }
    if (functionName === 'adminManageUser' && route.method === 'PATCH' && !Object.keys(route.body).length) {
      throw new Error('فیلدهای تغییر کاربر معتبر نیستند.');
    }
    const result = await invokePrivilegedRoute(url, userToken, route.path, route.method, route.body);
    if (functionName === 'adminListTickets' && payload.status && payload.status !== 'all') {
      const data = result?.data || result;
      if (Array.isArray(data?.tickets)) data.tickets = data.tickets.filter((ticket) => ticket.status === payload.status);
    }
    return result;
  }

  // Connector routes — path-based, require user identity
  const connectorRoute = CONNECTOR_PATH_ROUTES[functionName];
  if (connectorRoute) {
    if (!url) {
      const err = new Error('Worker not configured');
      err.code = 'not_configured';
      throw err;
    }
    if (!userToken) {
      const err = new Error('User authentication required');
      err.status = 401;
      err.code = 'no_user_token';
      throw err;
    }
    // Job routes need the job_id in the path: /jobs/{id} or /jobs/{id}/cancel
    let path = connectorRoute.path;
    if (functionName === 'getJob' && payload?.job_id) path = `/jobs/${encodeURIComponent(payload.job_id)}`;
    if (functionName === 'cancelJob' && payload?.job_id) path = `/jobs/${encodeURIComponent(payload.job_id)}/cancel`;
    const target = url + path;
    const headers = {
      'Content-Type': 'application/json',
      'X-User-Token': userToken,
    };
    if (connectorRoute.method === 'GET') {
      const res = await fetch(target, { method: 'GET', headers });
      return res.json();
    }
    const res = await fetch(target, { method: 'POST', headers, body: JSON.stringify(payload || {}) });
    return res.json();
  }

  // Type-based Worker routes
  const routeType = WORKER_ROUTES[functionName];
  if (url && routeType) {
    const extra = {};
    if (ANALYZE_TYPES[functionName]) extra.analyze_type = ANALYZE_TYPES[functionName];
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Token': userToken,
      },
      body: JSON.stringify({ ...payload, ...extra, type: routeType }),
    });
    if (!res.ok) {
      let bodyText = '';
      try { bodyText = await res.text(); } catch {}
      const err = new Error(`worker_${res.status}: ${bodyText.slice(0, 300)}`);
      err.status = res.status;
      err.responseBody = bodyText;
      throw err;
    }
    return res.json();
  }

  throw new Error(`Unknown function: ${functionName}`);
}