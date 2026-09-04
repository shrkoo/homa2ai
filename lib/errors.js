/**
 * Homa AI — Standard Error System (B14)
 *
 * All Worker API responses follow this format:
 *   { success: false, error: { code, message }, request_id }
 *   { success: true, data: ..., request_id }
 *
 * Error codes are stable identifiers; messages are Persian (user-facing).
 */

export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_ENTITY: 'INVALID_ENTITY',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  RATE_LIMITED: 'RATE_LIMITED',
  NO_PROVIDER: 'NO_PROVIDER',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  NO_STORAGE_PROVIDER: 'NO_STORAGE_PROVIDER',
  NO_PAYMENT_PROVIDER: 'NO_PAYMENT_PROVIDER',
  NO_EMAIL_PROVIDER: 'NO_EMAIL_PROVIDER',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE: 'UNSUPPORTED_FILE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

const PersianMessages = {
  AUTH_REQUIRED: 'احراز هویت لازم است. لطفاً وارد شوید.',
  FORBIDDEN: 'دسترسی غیرمجاز.',
  NOT_FOUND: 'مورد یافت نشد.',
  INVALID_INPUT: 'ورودی نامعتبر.',
  INVALID_ENTITY: 'نوع داده نامعتبر.',
  INSUFFICIENT_CREDITS: 'اعتبار کافی نیست.',
  RATE_LIMITED: 'درخواست‌های شما بیش از حد مجاز است. کمی بعد تلاش کنید.',
  NO_PROVIDER: 'هیچ ارائه‌دهنده‌ای برای این قابلیت پیکربندی نشده است.',
  PROVIDER_ERROR: 'خطا در ارتباط با ارائه‌دهنده خدمات هوش مصنوعی.',
  NO_STORAGE_PROVIDER: 'سیستم ذخیره‌سازی فایل پیکربندی نشده است.',
  NO_PAYMENT_PROVIDER: 'درگاه پرداخت پیکربندی نشده است.',
  NO_EMAIL_PROVIDER: 'سرویس ایمیل پیکربندی نشده است.',
  FILE_TOO_LARGE: 'حجم فایل بیش از حد مجاز است.',
  UNSUPPORTED_FILE: 'نوع فایل پشتیبانی نمی‌شود.',
  PAYMENT_FAILED: 'پرداخت ناموفق بود.',
  INTERNAL_ERROR: 'خطای داخلی سرور. لطفاً دوباره تلاش کنید.',
};

let requestCounter = 0;
export function genRequestId() {
  requestCounter = (requestCounter + 1) % 1000000;
  return 'req_' + Date.now().toString(36) + '_' + requestCounter.toString(36);
}

export function successResponse(data, status = 200, requestId) {
  return Response.json(
    { success: true, data, request_id: requestId || genRequestId() },
    { status, headers: corsHeaders() }
  );
}

export function errorResponse(code, status, customMessage, requestId) {
  const message = customMessage || PersianMessages[code] || PersianMessages.INTERNAL_ERROR;
  return Response.json(
    { success: false, error: { code, message }, request_id: requestId || genRequestId() },
    { status: status || statusForCode(code), headers: corsHeaders() }
  );
}

function statusForCode(code) {
  switch (code) {
    case ErrorCodes.AUTH_REQUIRED: return 401;
    case ErrorCodes.FORBIDDEN: return 403;
    case ErrorCodes.NOT_FOUND: return 404;
    case ErrorCodes.INVALID_INPUT:
    case ErrorCodes.INVALID_ENTITY:
    case ErrorCodes.FILE_TOO_LARGE:
    case ErrorCodes.UNSUPPORTED_FILE: return 400;
    case ErrorCodes.INSUFFICIENT_CREDITS: return 402;
    case ErrorCodes.RATE_LIMITED: return 429;
    case ErrorCodes.NO_PROVIDER:
    case ErrorCodes.NO_STORAGE_PROVIDER:
    case ErrorCodes.NO_PAYMENT_PROVIDER:
    case ErrorCodes.NO_EMAIL_PROVIDER: return 503;
    case ErrorCodes.PROVIDER_ERROR:
    case ErrorCodes.PAYMENT_FAILED:
    case ErrorCodes.INTERNAL_ERROR: return 500;
    default: return 500;
  }
}

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Token, X-Request-Id',
    'Access-Control-Max-Age': '86400',
  };
}