import { probe, classify, normalizeError, postJson, getJson, jobCompleted, jobProcessing, jobFailed, jobNotSupported } from './helpers.js';

// HeyGen API — https://docs.heygen.com
// Async: POST /v2/video/generate → poll GET /v1/video_status?video_id={id}

const DEFAULT_AVATAR_ID = 'Wayne_20240727';
const DEFAULT_VOICE_ID = '077ab11b14f04ce0b49b5f6e5f8c6a5f'; // en-US, natural

export default {
  id: 'heygen',
  isAsync: () => true,
  getCapabilities: () => ['AVATAR_VIDEO', 'LIP_SYNC', 'VIDEO_GENERATION'],
  estimateCost: (capability) => (capability === 'AVATAR_VIDEO' ? 6 : capability === 'LIP_SYNC' ? 5 : 5),
  async validate(apiKey) {
    const r = await probe('https://api.heygen.com/v1/user/remaining_quota', { 'X-Api-Key': apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    const prompt = (input.prompt || input.text || '').trim();
    if (!prompt) return jobFailed('invalid_input', 'prompt/text required');
    const headers = { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' };

    const characterType = capability === 'LIP_SYNC' ? 'photo' : 'avatar';
    const character = characterType === 'avatar'
      ? { type: 'avatar', avatar_id: input.avatar_id || DEFAULT_AVATAR_ID, avatar_style: input.avatar_style || 'normal' }
      : { type: 'photo', photo_id: input.photo_id || '' };

    if (characterType === 'photo' && !character.photo_id) return jobFailed('invalid_input', 'photo_id required for lip sync');

    const body = {
      video_inputs: [{
        character,
        voice: { type: 'text', voice_id: input.voice_id || DEFAULT_VOICE_ID, input_text: prompt },
        background: { type: 'color', value: '#ffffff' },
      }],
      test: false,
      aspect_ratio: input.aspect_ratio || '16:9',
    };

    const r = await postJson('https://api.heygen.com/v2/video/generate', headers, body);
    if (!r.ok) { const e = normalizeError(r.status, r.data); return jobFailed(e.code, e.message); }
    const videoId = r.data?.data?.video_id || r.data?.video_id;
    if (!videoId) return jobFailed('provider_error', 'No video_id returned');
    return jobProcessing(videoId, { capability, avatar_id: character.avatar_id });
  },
  async getJobStatus({ provider_job_id, apiKey }) {
    const r = await getJson(`https://api.heygen.com/v1/video_status?video_id=${provider_job_id}`, { 'X-Api-Key': apiKey });
    if (!r.ok && r.netError) return jobFailed('provider_unavailable', 'Could not reach HeyGen');
    if (!r.ok) { const e = normalizeError(r.status, r.data); return jobFailed(e.code, e.message); }
    const status = r.data?.data?.status;
    if (status === 'completed') {
      const url = r.data?.data?.video_url;
      if (url) return jobCompleted(url, '', { duration: r.data?.data?.duration });
      return jobFailed('provider_error', 'Completed but no video URL');
    }
    if (status === 'failed' || status === 'error') return jobFailed('provider_error', r.data?.data?.error || 'Generation failed');
    return jobProcessing(provider_job_id, { status });
  },
  normalizeError: (status, body) => normalizeError(status, body),
};