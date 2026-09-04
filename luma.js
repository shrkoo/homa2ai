import { probe, classify, normalizeError, postJson, getJson, jobCompleted, jobProcessing, jobFailed, jobNotSupported } from './helpers.js';

// Luma Dream Machine API — https://docs.lumalabs.ai/docs/api
// Async: POST /dream-machine/v1/generations → poll GET /dream-machine/v1/generations/{id}

export default {
  id: 'luma',
  isAsync: () => true,
  getCapabilities: () => ['VIDEO_GENERATION', 'IMAGE_TO_VIDEO'],
  estimateCost: () => 5,
  async validate(apiKey) {
    const r = await probe('https://api.lumalabs.ai/api/v1/generations', { Authorization: 'Bearer ' + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    const headers = { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' };
    const prompt = (input.prompt || '').trim();

    const body = { prompt };
    if (capability === 'IMAGE_TO_VIDEO') {
      const imageUrl = input.image_url;
      if (!imageUrl) return jobFailed('invalid_input', 'image_url required');
      body.keyframes = { frame0: { type: 'image', url: imageUrl } };
    } else if (capability !== 'VIDEO_GENERATION') {
      return jobNotSupported(capability);
    }
    if (input.aspect_ratio) body.aspect_ratio = input.aspect_ratio;
    if (input.loop) body.loop = input.loop;

    const r = await postJson('https://api.lumalabs.ai/dream-machine/v1/generations', headers, body);
    if (!r.ok) { const e = normalizeError(r.status, r.data); return jobFailed(e.code, e.message); }
    const genId = r.data?.generation?.id || r.data?.id;
    if (!genId) return jobFailed('provider_error', 'No generation id returned');
    return jobProcessing(genId, { capability });
  },
  async getJobStatus({ provider_job_id, apiKey }) {
    const r = await getJson(`https://api.lumalabs.ai/dream-machine/v1/generations/${provider_job_id}`, { Authorization: 'Bearer ' + apiKey });
    if (!r.ok && r.netError) return jobFailed('provider_unavailable', 'Could not reach Luma');
    if (!r.ok) { const e = normalizeError(r.status, r.data); return jobFailed(e.code, e.message); }
    const state = r.data?.generation?.state || r.data?.state;
    if (state === 'completed') {
      const url = r.data?.generation?.assets?.video || r.data?.assets?.video;
      if (url) return jobCompleted(url, '', { state });
      return jobFailed('provider_error', 'Completed but no video URL');
    }
    if (state === 'failed') return jobFailed('provider_error', r.data?.failure_reason || 'Generation failed');
    return jobProcessing(provider_job_id, { state });
  },
  normalizeError: (status, body) => normalizeError(status, body),
};