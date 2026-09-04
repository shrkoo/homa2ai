// Maps a Homa backend error code to a user-facing translated message.
// Used by in-app tool pages so NO_PROVIDER / quota / provider failures are
// shown with their real cause instead of a generic "error occurred".
const CODE_TO_KEY = {
  no_provider: 'err_no_provider',
  daily_limit: 'err_daily_limit',
  plan_required: 'err_plan_required',
  provider_failed: 'err_provider_failed',
  replicate_credit: 'err_replicate_credit',
  quota: 'err_quota',
  no_api_key: 'err_no_api_key',
  payment_config: 'err_payment_config',
  rate_limit: 'err_daily_limit',
  no_groq_key: 'err_no_api_key'
};

export function apiErrorMessage(error, t) {
  if (!error) return t('error_occurred');
  return t(CODE_TO_KEY[error] || 'error_occurred');
}