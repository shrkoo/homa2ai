import { probe, classify, normalizeError, uploadBytesToHost, jobCompleted, jobFailed, jobNotSupported } from './helpers.js';

// ElevenLabs API — https://elevenlabs.io/docs/api-reference
// TTS and voice cloning are synchronous; STT is synchronous (Scribe).

const DEFAULT_VOICE_ID = '21m00Tc4SV5Df4OqCp8v'; // "Rachel"
const TTS_MODEL = 'eleven_multilingual_v2';
const STT_MODEL = 'scribe_v1';

export default {
  id: 'elevenlabs',
  isAsync: () => false,
  getCapabilities: () => ['TEXT_TO_SPEECH', 'VOICE_CLONING', 'SPEECH_TO_TEXT'],
  estimateCost: (capability) => (capability === 'TEXT_TO_SPEECH' ? 1 : capability === 'VOICE_CLONING' ? 3 : 1),
  async validate(apiKey) {
    const r = await probe('https://api.elevenlabs.io/v1/user', { 'xi-api-key': apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    const headers = { 'xi-api-key': apiKey };

    if (capability === 'TEXT_TO_SPEECH') {
      const text = (input.text || input.prompt || '').trim();
      if (!text) return jobFailed('invalid_input', 'text required');
      if (text.length > 5000) return jobFailed('invalid_input', 'text too long (max 5000 chars)');
      const voiceId = input.voice_id || DEFAULT_VOICE_ID;
      const params = new URLSearchParams({ output_format: 'mp3_44100_128' });
      try {
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?${params}`, {
          method: 'POST',
          headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
          body: JSON.stringify({ text, model_id: TTS_MODEL, voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true } }),
        });
        if (!res.ok) { const e = normalizeError(res.status, {}); return jobFailed(e.code, e.message); }
        const audioBytes = new Uint8Array(await res.arrayBuffer());
        const url = await uploadBytesToHost(audioBytes, 'tts.mp3', 'audio/mpeg');
        if (!url) return jobFailed('upload_failed', 'Generated audio but could not persist it');
        return jobCompleted(url, '', { voice_id: voiceId, model: TTS_MODEL, chars: text.length });
      } catch (e) { return jobFailed('provider_error', e.message || 'TTS failed'); }
    }

    if (capability === 'VOICE_CLONING') {
      const name = input.name || 'Cloned Voice';
      const audioUrl = input.audio_url || input.file_url;
      if (!audioUrl) return jobFailed('invalid_input', 'audio_url required for cloning');
      try {
        const audioRes = await fetch(audioUrl);
        if (!audioRes.ok) return jobFailed('fetch_failed', 'Could not fetch audio sample');
        const audioBlob = await audioRes.blob();
        const fd = new FormData();
        fd.append('name', name);
        fd.append('description', input.description || 'Cloned via Homa');
        fd.append('files', audioBlob, 'sample.mp3');
        const res = await fetch('https://api.elevenlabs.io/v1/voices/add', { method: 'POST', headers: { 'xi-api-key': apiKey }, body: fd });
        if (!res.ok) { const e = normalizeError(res.status, {}); return jobFailed(e.code, e.message); }
        const data = await res.json();
        if (data?.voice_id) return jobCompleted('', `Voice cloned: ${data.voice_id}`, { voice_id: data.voice_id });
        return jobFailed('provider_error', 'No voice_id returned');
      } catch (e) { return jobFailed('provider_error', e.message || 'cloning failed'); }
    }

    if (capability === 'SPEECH_TO_TEXT') {
      const audioUrl = input.audio_url || input.file_url;
      if (!audioUrl) return jobFailed('invalid_input', 'audio_url required');
      try {
        const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
          method: 'POST',
          headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio_url: audioUrl, model_id: STT_MODEL }),
        });
        if (!res.ok) { const e = normalizeError(res.status, {}); return jobFailed(e.code, e.message); }
        const data = await res.json();
        const text = data?.text || '';
        if (!text) return jobFailed('provider_error', 'No transcription returned');
        return jobCompleted('', text, { model: STT_MODEL });
      } catch (e) { return jobFailed('provider_error', e.message || 'STT failed'); }
    }

    return jobNotSupported(capability);
  },
  normalizeError: (status, body) => normalizeError(status, body),
};