/**
 * adapters/index.js — Central export for all Homa adapters (B16).
 *
 * Components import from here, never from base44 or dataStore directly.
 *
 * Usage:
 *   import { chatAdapter, authAdapter } from '@/lib/adapters';
 */

export { default as chatAdapter } from './chatAdapter';
export { default as authAdapter } from './authAdapter';
export { default as dataAdapter } from './dataAdapter';
export { default as fileAdapter } from './fileAdapter';
export { default as mediaAdapter } from './mediaAdapter';
export { default as billingAdapter } from './billingAdapter';
export { default as supportAdapter } from './supportAdapter';
export { default as projectAdapter } from './projectAdapter';
export { default as taskAdapter } from './taskAdapter';
export { default as libraryAdapter } from './libraryAdapter';
export { default as apiAdapter } from './apiAdapter';
export { default as adminAdapter } from './adminAdapter';
export { default as referralAdapter } from './referralAdapter';
export { default as connectorAdapter } from './connectorAdapter';
export { default as searchAdapter } from './searchAdapter';
export { default as alarmAdapter } from './alarmAdapter';