import { probe, classify, normalizeError, postJson, getJson, jobCompleted, jobProcessing, jobFailed, jobNotSupported } from './helpers.js';

// Kling AI API — https://klingai.com/docs
// Async: POST /v1/videos/text2video or /v1/videos/image2video → poll GET /v1/videos/{type}/{task_id}

export default {
  id: 'kling',
  isAsync: () => true,
  getCapabilities: () => ['VIDEO_GENERATION', 'IMAGE_TO_VIDEO', 'VIDEO_EDITING'],
  estimateCost: () => 5,
  async validate(apiKey) {
    const r = await probe('https://api.klingai.com/v1/user/info', { Authorization: 'Bearer ' + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    const headers = { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' };
    const prompt = (input.prompt || '').trim();

    let endpoint, pollPath, body;
    if (capability === 'IMAGE_TO_VIDEO' || capability === 'VIDEO_EDITING') {
      const imageUrl = input.image_url;
      if (!imageUrl) return jobFailed('invalid_input', 'image_url required');
      endpoint = 'https://api.klingai.com/v1/videos/image2video';
      pollPath = 'image2video';
      body = { image: imageUrl, prompt, mode: input.mode || 'std', duration: input.duration || '5' };
    } else if (capability === 'VIDEO_GENERATION') {
      if (!prompt) return jobFailed('invalid_input', 'prompt required');
      endpoint = 'https://api.klingai.com/v1/videos/text2video';
      pollPath = 'text2video';
      body = { prompt, mode: input.mode || 'std', duration: input.duration || '5' };
    } else {
      return jobNotSupported(capability);
    }

    const r = await postJson(endpoint, headers, body);
    if (!r.ok) { const e = normalizeError(r.status, r.data); return jobFailed(e.code, e.message); }
    const taskId = r.data?.data?.task_id || r.data?.task_id;
    if (!taskId) return jobFailed('provider_error', 'No task_id returned');
    return jobProcessing(taskId, { poll_path: pollPath });
  },
  async getJobStatus({ provider_job_id, apiKey, context }) {
    const pollPath = context?.poll_path || 'text2video';
    const r = await getJson(`https://api.klingai.com/v1/videos/${pollPath}/${provider_job_id}`, { Authorization: 'Bearer ' + apiKey });
    if (!r.ok && r.netError) return jobFailed('provider_unavailable', 'Could not reach Kling');
    if (!r.ok) { const e = normalizeError(r.status, r.data); return jobFailed(e.code, e.message); }
    const taskStatus = r.data?.data?.task_status;
    if (taskStatus === 'succeed') {
      const videos = r.data?.data?.task_result?.videos;
      const url = Array.isArray(videos) ? videos[0]?.url : videos?.url;
      if (url) return jobCompleted(url, '', { duration: r.data?.data?.task_result?.videos?.[0]?.duration });
      return jobFailed('provider_error', 'Succeeded but no video URL');
    }
    if (taskStatus === 'failed') return jobFailed('provider_error', r.data?.data?.task_status_msg || 'Generation failed');
    return jobProcessing(provider_job_id, { poll_path: pollPath, status: taskStatus });
  },
  normalizeError: (status, body) => normalizeError(status, body),
};