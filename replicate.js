import { probe, classify, normalizeError, postJson, getJson, jobCompleted, jobProcessing, jobFailed, jobNotSupported } from './helpers.js';

// Replicate API — https://replicate.com/docs/reference/api
// All operations are async: POST /v1/models/{owner}/{model}/predictions → poll GET /v1/predictions/{id}

const MODELS = {
  IMAGE_GENERATION: { model: 'black-forest-labs/flux-schnell', buildInput: (i) => ({ prompt: i.prompt, go_fast: true, num_outputs: 1, aspect_ratio: i.aspect_ratio || '1:1', output_format: 'webp' }) },
  IMAGE_EDITING: { model: 'timbrooks/instruct-pix2pix', buildInput: (i) => ({ image: i.image_url, prompt: i.prompt, num_outputs: 1 }) },
  IMAGE_UPSCALING: { model: 'nightmareai/real-esrgan', buildInput: (i) => ({ image: i.image_url, scale: i.scale || 4, face_enhance: true }) },
  BACKGROUND_REMOVAL: { model: 'lucataco/remove-bg', buildInput: (i) => ({ image: i.image_url }) },
  VIDEO_GENERATION: { model: 'genmo/mochi-1', buildInput: (i) => ({ prompt: i.prompt, num_frames: i.num_frames || 19 }) },
  IMAGE_TO_VIDEO: { model: 'stability-ai/stable-video-diffusion', buildInput: (i) => ({ cond_image: i.image_url, motion_bucket_id: i.motion_bucket_id || 127, frames_per_second: 8 }) },
  VIDEO_TO_VIDEO: { model: 'stability-ai/stable-video-diffusion', buildInput: (i) => ({ cond_image: i.image_url, motion_bucket_id: 127 }) },
};

export default {
  id: 'replicate',
  isAsync: () => true,
  getCapabilities: () => Object.keys(MODELS),
  estimateCost: (capability) => (capability.includes('VIDEO') ? 5 : capability.includes('IMAGE') ? 1 : 1),
  async validate(apiKey) {
    const r = await probe('https://api.replicate.com/v1/account', { Authorization: 'Bearer ' + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    const spec = MODELS[capability];
    if (!spec) return jobNotSupported(capability);
    const headers = { Authorization: 'Bearer ' + apiKey, Prefer: 'wait=0' };
    const r = await postJson(`https://api.replicate.com/v1/models/${spec.model}/predictions`, headers, { input: spec.buildInput(input) });
    if (!r.ok) {
      const e = normalizeError(r.status, r.data);
      return jobFailed(e.code, e.message);
    }
    const predictionId = r.data?.id;
    if (!predictionId) return jobFailed('provider_error', 'No prediction id returned');
    // Check if already completed (Prefer: wait=0 may return immediately)
    if (r.data?.status === 'succeeded') {
      const url = Array.isArray(r.data.output) ? r.data.output[0] : r.data.output;
      if (url) return jobCompleted(url, '', { model: spec.model });
    }
    return jobProcessing(predictionId, { model: spec.model });
  },
  async getJobStatus({ provider_job_id, apiKey }) {
    const r = await getJson(`https://api.replicate.com/v1/predictions/${provider_job_id}`, { Authorization: 'Bearer ' + apiKey });
    if (!r.ok && r.netError) return jobFailed('provider_unavailable', 'Could not reach Replicate');
    if (!r.ok) { const e = normalizeError(r.status, r.data); return jobFailed(e.code, e.message); }
    const status = r.data?.status;
    if (status === 'succeeded') {
      const url = Array.isArray(r.data?.output) ? r.data.output[0] : r.data?.output;
      if (url) return jobCompleted(url, '', { model: r.data?.version });
      return jobFailed('provider_error', 'No output URL');
    }
    if (status === 'failed' || status === 'canceled') return jobFailed('provider_error', r.data?.error || 'Generation failed');
    return jobProcessing(provider_job_id, { status });
  },
  normalizeError: (status, body) => normalizeError(status, body),
};