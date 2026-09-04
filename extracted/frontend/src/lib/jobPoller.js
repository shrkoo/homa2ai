/**
 * Job polling helper — polls the Homa Worker for job status until terminal.
 * Used by the chat execution engine to track async provider jobs.
 */
import { invokeFunctionDirect } from '@/lib/directInvoke';

const POLL_INTERVAL = 4000; // 4 seconds
const MAX_POLL_DURATION = 10 * 60 * 1000; // 10 minutes max
const MAX_POLLS = MAX_POLL_DURATION / POLL_INTERVAL;

/**
 * Poll a job until it reaches a terminal state (COMPLETED / FAILED / CANCELLED / NOT_SUPPORTED).
 * @param {string} jobId
 * @param {(status) => void} onUpdate — called with each status update
 * @param {AbortSignal} [signal] — optional abort signal to stop polling
 * @returns {Promise<object>} final job state
 */
export async function pollJob(jobId, onUpdate, signal) {
  let lastStatus = null;
  for (let i = 0; i < MAX_POLLS; i++) {
    if (signal?.aborted) return { status: 'CANCELLED', error: 'aborted' };
    try {
      const res = await invokeFunctionDirect('getJob', { job_id: jobId });
      const data = res?.data || res;
      if (data?.error && data?.code === 'not_found') {
        return { status: 'FAILED', error: data.error, code: 'not_found' };
      }
      const status = data?.status || 'PROCESSING';
      if (status !== lastStatus || i % 3 === 0) {
        onUpdate?.(data);
        lastStatus = status;
      }
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED' || status === 'NOT_SUPPORTED') {
        return data;
      }
    } catch (e) {
      // Network error — keep polling (transient)
      onUpdate?.({ status: 'PROCESSING', error: e?.message, transient: true });
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));
  }
  return { status: 'FAILED', error: 'poll_timeout', code: 'timeout' };
}

/**
 * Cancel a job (best-effort).
 */
export async function cancelJob(jobId) {
  try {
    return await invokeFunctionDirect('cancelJob', { job_id: jobId });
  } catch {
    return null;
  }
}