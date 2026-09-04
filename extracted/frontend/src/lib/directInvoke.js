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

export async function invokeFunctionDirect(functionName, payload) {
  const url = getWorkerUrl();
  const userToken = getToken();

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