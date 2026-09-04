import { probe, classify, normalizeError, jobNotSupported } from './helpers.js';

// Pika API — https://pika.art
// Pika's public generation API is in beta and the official documentation for the
// generation endpoint schema is not sufficient to implement reliably.
// Validation works (probes the API root), but execute() returns NOT_SUPPORTED
// until the official generation endpoint is documented and stable.

export default {
  id: 'pika',
  isAsync: () => true,
  getCapabilities: () => ['VIDEO_GENERATION', 'IMAGE_TO_VIDEO'],
  estimateCost: () => 5,
  async validate(apiKey) {
    const r = await probe('https://api.pika.art/v1/', { Authorization: 'Bearer ' + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ capability }) {
    return jobNotSupported(capability);
  },
  normalizeError: (status, body) => normalizeError(status, body),
};