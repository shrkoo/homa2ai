import { probe, classify, normalizeError, postJson, getJson, jobCompleted, jobProcessing, jobFailed, jobNotSupported } from './helpers.js';

// Twelve Labs API — https://docs.twelvelabs.io
// Async multi-step: POST /v1.1/indexes (ingest video) → poll index status →
// POST /v1.1/summarize (generate analysis) → return text.

export default {
  id: 'twelvelabs',
  isAsync: () => true,
  getCapabilities: () => ['VIDEO_ANALYSIS'],
  estimateCost: () => 3,
  async validate(apiKey) {
    const r = await probe('https://api.twelvelabs.io/v1.1/users/me', { 'x-api-key': apiKey });
    return classify(r.status, r.ok, r.netError);
  },
  async execute({ apiKey, capability, input }) {
    if (capability !== 'VIDEO_ANALYSIS') return jobNotSupported(capability);
    const videoUrl = input.video_url || input.image_url;
    if (!videoUrl) return jobFailed('invalid_input', 'video_url required');
    const headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json' };

    // Step 1: Create an index and upload the video for analysis
    let indexId;
    try {
      const indexRes = await postJson('https://api.twelvelabs.io/v1.1/indexes', headers, {
        video_url: videoUrl,
        index_name: 'homa-analysis-' + Date.now(),
      });
      if (!indexRes.ok) { const e = normalizeError(indexRes.status, indexRes.data); return jobFailed(e.code, e.message); }
      indexId = indexRes.data?._id;
      if (!indexId) return jobFailed('provider_error', 'No index id returned');
    } catch (e) { return jobFailed('provider_error', e.message || 'index creation failed'); }

    return jobProcessing(indexId, { stage: 'indexing', video_url: videoUrl });
  },
  async getJobStatus({ provider_job_id, apiKey, context }) {
    const headers = { 'x-api-key': apiKey, 'Content-Type': 'application/json' };
    const indexId = provider_job_id;
    const stage = context?.stage || 'indexing';

    // Check index/video readiness
    const indexRes = await getJson(`https://api.twelvelabs.io/v1.1/indexes/${indexId}/videos`, headers);
    if (!indexRes.ok && !indexRes.netError) { const e = normalizeError(indexRes.status, indexRes.data); return jobFailed(e.code, e.message); }
    if (indexRes.netError) return jobFailed('provider_unavailable', 'Could not reach Twelve Labs');

    const videos = indexRes.data?.data || [];
    const video = videos[0];
    if (!video) return jobProcessing(indexId, { stage: 'indexing', video_url: context?.video_url });
    if (video.status !== 'ready' && video.status !== 'available') {
      return jobProcessing(indexId, { stage: 'indexing', video_url: context?.video_url });
    }

    // Video is indexed — generate summary/analysis
    if (stage === 'indexing' || stage === 'summarizing') {
      try {
        const sumRes = await postJson('https://api.twelvelabs.io/v1.1/summarize', headers, {
          index_id: indexId,
          video_id: video._id,
          type: 'summary',
        });
        if (sumRes.ok && sumRes.data?.summary) {
          return jobCompleted('', sumRes.data.summary, { index_id: indexId, video_id: video._id });
        }
      } catch {}
      // Fallback: try gist endpoint
      try {
        const gistRes = await postJson('https://api.twelvelabs.io/v1.1/gist', headers, {
          index_id: indexId, video_id: video._id, gist_type: 'title,topic,hashtag',
        });
        if (gistRes.ok && gistRes.data?.gist) {
          return jobCompleted('', gistRes.data.gist, { index_id: indexId, video_id: video._id });
        }
      } catch {}
      return jobFailed('provider_error', 'Video indexed but analysis generation failed');
    }

    return jobProcessing(indexId, { stage, video_url: context?.video_url });
  },
  normalizeError: (status, body) => normalizeError(status, body),
};