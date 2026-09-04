import { probe, classify, normalizeError, postJson, getJson, jobCompleted, jobProcessing, jobFailed, jobNotSupported } from './helpers.js';

// Runway API — https://docs.dev.runwayml.com
// Async: POST /v1/image_to_video or /v1/text_to_video → poll GET /v1/tasks/{id}

export default {
  id: 'runway',
  isAsync: () => true,
  getCapabilities: () => ['VIDEO_GENERATION', 'IMAGE_TO_VIDEO', 'VIDEO_TO_VIDEO', 'VIDEO_EDITING', 'VIDEO_UPSCALE'],
  estimateCost: () => 5,
  async validate(apiKey) {
    const r = await probe('https://api.runwayml.com/v1/users', { Authorization: 'Bearer ' + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    const headers = { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'X-Runway-Version': '2024-11-06' };
    const prompt = (input.prompt || '').trim();

    let endpoint, body;
    if (capability === 'IMAGE_TO_VIDEO' || capability === 'VIDEO_TO_VIDEO') {
      const imageUrl = input.image_url;
      if (!imageUrl) return jobFailed('invalid_input', 'image_url required');
      endpoint = 'https://api.runwayml.com/v1/image_to_video';
      body = { promptImage: imageUrl, model: input.model || 'gen3a_turbo', duration: input.duration || 5, promptText: prompt };
    } else if (capability === 'VIDEO_GENERATION') {
      if (!prompt) return jobFailed('invalid_input', 'prompt required');
      endpoint = 'https://api.runwayml.com/v1/text_to_video';
      body = { prompt, model: input.model || 'gen3a_turbo', duration: input.duration || 5 };
    } else if (capability === 'VIDEO_UPSCALE') {
      const videoUrl = input.video_url || input.image_url;
      if (!videoUrl) return jobFailed('invalid_input', 'video_url required');
      endpoint = 'https://api.runwayml.com/v1/video_to_video';
      body = { promptVideo: videoUrl, model: 'gen3a_turbo', promptText: prompt || 'upscale' };
    } else {
      return jobNotSupported(capability);
    }

    const r = await postJson(endpoint, headers, body);
    if (!r.ok) { const e = normalizeError(r.status, r.data); return jobFailed(e.code, e.message); }
    const taskId = r.data?.taskId || r.data?.id;
    if (!taskId) return jobFailed('provider_error', 'No task id returned');
    return jobProcessing(taskId, { model: body.model });
  },
  async getJobStatus({ provider_job_id, apiKey }) {
    const r = await getJson(`https://api.runwayml.com/v1/tasks/${provider_job_id}`, { Authorization: 'Bearer ' + apiKey, 'X-Runway-Version': '2024-11-06' });
    if (!r.ok && r.netError) return jobFailed('provider_unavailable', 'Could not reach Runway');
    if (!r.ok) { const e = normalizeError(r.status, r.data); return jobFailed(e.code, e.message); }
    const status = r.data?.status;
    if (status === 'SUCCEEDED') {
      const output = r.data?.output;
      const url = Array.isArray(output) ? output[0] : output;
      if (url) return jobCompleted(url, '', { model: r.data?.model });
      return jobFailed('provider_error', 'Succeeded but no output URL');
    }
    if (status === 'FAILED') return jobFailed('provider_error', r.data?.failure || 'Generation failed');
    return jobProcessing(provider_job_id, { status });
  },
  normalizeError: (status, body) => normalizeError(status, body),
};