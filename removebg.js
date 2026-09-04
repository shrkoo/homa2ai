import { probe, classify, normalizeError, uploadBytesToHost, jobCompleted, jobFailed, jobNotSupported } from './helpers.js';

// Remove.bg API — https://www.remove.bg/api-documentation
// Synchronous: POST returns image bytes directly.

export default {
  id: 'removebg',
  isAsync: () => false,
  getCapabilities: () => ['BACKGROUND_REMOVAL'],
  estimateCost: () => 1,
  async validate(apiKey) {
    const r = await probe('https://api.remove.bg/v1.0/', { 'X-API-Key': apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    if (capability !== 'BACKGROUND_REMOVAL') return jobNotSupported(capability);
    const imageUrl = input.image_url;
    if (!imageUrl) return jobFailed('invalid_input', 'image_url required');
    try {
      const fd = new FormData();
      fd.append('image_url', imageUrl);
      fd.append('size', input.size || 'auto');
      if (input.format) fd.append('format', input.format);
      const res = await fetch('https://api.remove.bg/v1.0/removebg', { method: 'POST', headers: { 'X-API-Key': apiKey }, body: fd });
      if (!res.ok) {
        let msg = 'Background removal failed';
        try { const d = await res.json(); msg = d?.errors?.[0]?.title || msg; } catch {}
        const e = normalizeError(res.status, {}); return jobFailed(e.code, msg);
      }
      const imgBytes = new Uint8Array(await res.arrayBuffer());
      const url = await uploadBytesToHost(imgBytes, 'no-bg.png', 'image/png');
      if (!url) return jobFailed('upload_failed', 'Processed image but could not persist it');
      return jobCompleted(url, '', { credits_charged: res.headers.get('X-Credits-Charged') || '' });
    } catch (e) { return jobFailed('provider_error', e.message || 'remove.bg failed'); }
  },
  normalizeError: (status, body) => normalizeError(status, body),
};