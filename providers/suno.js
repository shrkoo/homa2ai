import { probe, classify, normalizeError, jobNotSupported } from './helpers.js';

// Suno API — https://suno.com
// Suno has an official API (api.suno.ai) for paid plans, but the public generation
// endpoint documentation is not sufficient to implement reliably without a
// verified plan. Validation works (probes /v1/projects), but execute() returns
// NOT_SUPPORTED until the official generation schema is verified.

export default {
  id: 'suno',
  isAsync: () => true,
  getCapabilities: () => ['MUSIC_GENERATION', 'SONG_GENERATION', 'LYRICS_GENERATION'],
  estimateCost: () => 3,
  async validate(apiKey) {
    const r = await probe('https://api.suno.ai/v1/projects', { Authorization: 'Bearer ' + apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ capability }) {
    return jobNotSupported(capability);
  },
  normalizeError: (status, body) => normalizeError(status, body),
};