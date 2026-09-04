/**
 * referralAdapter.js — Referral system (Worker-backed, no Base44).
 */

import { entities } from '@/lib/dataStore';
import { invokeFunctionDirect } from '@/lib/directInvoke';

export const referralAdapter = {
  async getStatus() {
    return invokeFunctionDirect('referralStatus', {});
  },

  async processReferral(refereeId, referredEmail) {
    return invokeFunctionDirect('processReferral', { referee_id: refereeId, referred_email: referredEmail });
  },

  async processReferralByRef(referrerId) {
    return invokeFunctionDirect('processReferral', { referrerId });
  },

  async listMyReferrals() {
    return entities.Referral.list('-created_date', 100);
  },
};

export default referralAdapter;