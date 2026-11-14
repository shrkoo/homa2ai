/**
 * referralAdapter.js — Referral system (Worker-backed, no Base44).
 */

import { entities } from '@/lib/dataStore';
import { invokeFunctionDirect } from '@/lib/directInvoke';

export const referralAdapter = {
  async getStatus() {
    const response = await invokeFunctionDirect('referralStatus', {});
    const data = response?.data || response;
    return {
      ...response,
      data: {
        ...data,
        link: data?.referral_code ? `/register?ref=${encodeURIComponent(data.referral_code)}` : '',
        invited: data?.total_referred || 0,
        rewarded: data?.total_rewarded || 0,
        credits: data?.total_credits_earned || 0,
      },
    };
  },

  async processReferral(referredUserId, referredEmail, referrerCode) {
    return invokeFunctionDirect('processReferral', {
      referred_user_id: referredUserId,
      referred_email: referredEmail || '',
      referrer_code: referrerCode || '',
    });
  },

  async processReferralByRef(referrerCode, referredUserId, referredEmail) {
    if (!referrerCode || !referredUserId) return null;
    return invokeFunctionDirect('processReferral', {
      referred_user_id: referredUserId,
      referred_email: referredEmail || '',
      referrer_code: referrerCode,
    });
  },

  async listMyReferrals() {
    return entities.Referral.list('-created_date', 100);
  },
};

export default referralAdapter;