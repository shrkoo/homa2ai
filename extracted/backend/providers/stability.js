import { probe, classify, normalizeError, uploadBytesToHost, jobCompleted, jobFailed, jobNotSupported } from './helpers.js';

// Stability AI API — https://platform.stability.ai/docs
// Image generation and upscaling are synchronous (return image bytes).

export default {
  id: 'stability',
  isAsync: () => false,
  getCapabilities: () => ['IMAGE_GENERATION', 'IMAGE_UPSCALING'],
  estimateCost: (capability) => (capability === 'IMAGE_GENERATION' ? 1 : 2),
  async validate(apiKey) {
    const r = await probe('https://api.stability.ai/v1/user/balance', { Authorization: 'Bearer ' + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    const headers = { Authorization: 'Bearer ' + apiKey, Accept: 'image/*' };

    if (capability === 'IMAGE_GENERATION') {
      const prompt = (input.prompt || '').trim();
      if (!prompt) return jobFailed('invalid_input', 'prompt required');
      try {
        const fd = new FormData();
        fd.append('prompt', prompt);
        fd.append('output_format', 'png');
        if (input.negative_prompt) fd.append('negative_prompt', input.negative_prompt);
        if (input.aspect_ratio) fd.append('aspect_ratio', input.aspect_ratio);
        if (input.seed) fd.append('seed', String(input.seed));
        const res = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', { method: 'POST', headers, body: fd });
        if (!res.ok) { const e = normalizeError(res.status, {}); return jobFailed(e.code, e.message); }
        const imgBytes = new Uint8Array(await res.arrayBuffer());
        const url = await uploadBytesToHost(imgBytes, 'generated.png', 'image/png');
        if (!url) return jobFailed('upload_failed', 'Generated image but could not persist it');
        return jobCompleted(url, '', { model: 'stable-diffusion-3' });
      } catch (e) { return jobFailed('provider_error', e.message || 'generation failed'); }
    }

    if (capability === 'IMAGE_UPSCALING') {
      const imageUrl = input.image_url;
      if (!imageUrl) return jobFailed('invalid_input', 'image_url required');
      try {
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) return jobFailed('fetch_failed', 'Could not fetch source image');
        const imgBlob = await imgRes.blob();
        const fd = new FormData();
        fd.append('image', imgBlob, 'source.png');
        fd.append('output_format', 'png');
        if (input.prompt) fd.append('positive_prompt', input.prompt);
        const res = await fetch('https://api.stability.ai/v2beta/stable-image/upscale/creative', { method: 'POST', headers, body: fd });
        if (!res.ok) { const e = normalizeError(res.status, {}); return jobFailed(e.code, e.message); }
        const imgBytes = new Uint8Array(await res.arrayBuffer());
        const url = await uploadBytesToHost(imgBytes, 'upscaled.png', 'image/png');
        if (!url) return jobFailed('upload_failed', 'Upscaled image but could not persist it');
        return jobCompleted(url, '', { model: 'upscale-creative' });
      } catch (e) { return jobFailed('provider_error', e.message || 'upscaling failed'); }
    }

    return jobNotSupported(capability);
  },
  normalizeError: (status, body) => normalizeError(status, body),
};