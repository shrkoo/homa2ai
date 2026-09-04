import { probe, classify, normalizeError, postJson, uploadBytesToHost, jobCompleted, jobFailed, jobNotSupported } from './helpers.js';

// OpenAI Images API — https://platform.openai.com/docs/api-reference/images
// All synchronous: returns a URL immediately.

const MODELS = {
  IMAGE_GENERATION: 'dall-e-3',
  IMAGE_EDITING: 'gpt-image-1',
  IMAGE_VARIATION: 'dall-e-2',
};

export default {
  id: 'openai_image',
  isAsync: () => false,
  getCapabilities: () => ['IMAGE_GENERATION', 'IMAGE_EDITING', 'IMAGE_VARIATION'],
  estimateCost: (capability) => (capability === 'IMAGE_GENERATION' ? 1 : capability === 'IMAGE_EDITING' ? 2 : 1),
  async validate(apiKey) {
    const r = await probe('https://api.openai.com/v1/models', { Authorization: 'Bearer ' + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    if (!MODELS[capability]) return jobNotSupported(capability);
    const prompt = (input.prompt || '').trim();
    if (!prompt && capability !== 'IMAGE_VARIATION') return jobFailed('invalid_input', 'prompt required');
    const headers = { Authorization: 'Bearer ' + apiKey };

    if (capability === 'IMAGE_GENERATION') {
      const size = input.size || '1024x1024';
      const r = await postJson('https://api.openai.com/v1/images/generations', headers, {
        model: MODELS.IMAGE_GENERATION, prompt, n: 1, size, quality: input.quality || 'standard',
      });
      if (!r.ok) return jobFailed(normalizeError(r.status, r.data).code, normalizeError(r.status, r.data).message);
      const url = r.data?.data?.[0]?.url;
      if (!url) return jobFailed('provider_error', 'No image URL in response');
      return jobCompleted(url, '', { model: MODELS.IMAGE_GENERATION, revised_prompt: r.data?.data?.[0]?.revised_prompt });
    }

    if (capability === 'IMAGE_EDITING') {
      const imageUrl = input.image_url;
      if (!imageUrl) return jobFailed('invalid_input', 'image_url required for editing');
      let imgRes;
      try { imgRes = await fetch(imageUrl); } catch { return jobFailed('fetch_failed', 'Could not fetch source image'); }
      if (!imgRes.ok) return jobFailed('fetch_failed', 'Could not fetch source image');
      const imgBlob = await imgRes.blob();
      const fd = new FormData();
      fd.append('image', imgBlob, 'source.png');
      fd.append('prompt', prompt);
      fd.append('model', MODELS.IMAGE_EDITING);
      if (input.size) fd.append('size', input.size);
      if (input.mask_url) {
        try { const m = await fetch(input.mask_url); if (m.ok) fd.append('mask', await m.blob(), 'mask.png'); } catch {}
      }
      try {
        const res = await fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: 'Bearer ' + apiKey }, body: fd });
        if (!res.ok) { const e = normalizeError(res.status, await res.json().catch({})); return jobFailed(e.code, e.message); }
        const data = await res.json();
        const url = data?.data?.[0]?.url;
        if (!url) return jobFailed('provider_error', 'No image URL in response');
        return jobCompleted(url, '', { model: MODELS.IMAGE_EDITING });
      } catch (e) { return jobFailed('provider_error', e.message || 'edit failed'); }
    }

    if (capability === 'IMAGE_VARIATION') {
      const imageUrl = input.image_url;
      if (!imageUrl) return jobFailed('invalid_input', 'image_url required for variation');
      let imgRes;
      try { imgRes = await fetch(imageUrl); } catch { return jobFailed('fetch_failed', 'Could not fetch source image'); }
      if (!imgRes.ok) return jobFailed('fetch_failed', 'Could not fetch source image');
      const imgBlob = await imgRes.blob();
      const fd = new FormData();
      fd.append('image', imgBlob, 'source.png');
      fd.append('n', '1');
      fd.append('model', MODELS.IMAGE_VARIATION);
      if (input.size) fd.append('size', input.size);
      try {
        const res = await fetch('https://api.openai.com/v1/images/variations', { method: 'POST', headers: { Authorization: 'Bearer ' + apiKey }, body: fd });
        if (!res.ok) { const e = normalizeError(res.status, await res.json().catch({})); return jobFailed(e.code, e.message); }
        const data = await res.json();
        const url = data?.data?.[0]?.url;
        if (!url) return jobFailed('provider_error', 'No image URL in response');
        return jobCompleted(url, '', { model: MODELS.IMAGE_VARIATION });
      } catch (e) { return jobFailed('provider_error', e.message || 'variation failed'); }
    }

    return jobNotSupported(capability);
  },
  normalizeError: (status, body) => normalizeError(status, body),
};