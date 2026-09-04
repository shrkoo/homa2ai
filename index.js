/**
 * Provider Adapter Registry.
 * Each adapter implements: validate(apiKey), getCapabilities(), normalizeError(status, body), execute().
 * The Worker's Connector backend uses this to validate credentials and (later) execute requests.
 *
 * Only providers with a real public API (api_available=true) have an adapter here.
 * Providers without a public API (Topaz, Udio) are "View Tool" only and intentionally absent.
 */
import openai from './openai.js';
import replicate from './replicate.js';
import elevenlabs from './elevenlabs.js';
import stability from './stability.js';
import removebg from './removebg.js';
import heygen from './heygen.js';
import runway from './runway.js';
import kling from './kling.js';
import pika from './pika.js';
import luma from './luma.js';
import suno from './suno.js';
import twelvelabs from './twelvelabs.js';

export { probe, classify, normalizeError } from './helpers.js';

export const ADAPTERS = {
  openai_image: openai,
  replicate,
  elevenlabs,
  stability,
  removebg,
  heygen,
  runway,
  kling,
  pika,
  luma,
  suno,
  twelvelabs,
};

export function getAdapter(providerId) {
  return ADAPTERS[providerId] || null;
}

export function getAdapterCapabilities(providerId) {
  const a = getAdapter(providerId);
  return a ? a.getCapabilities() : [];
}