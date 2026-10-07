export const REFERRAL_REWARD_THRESHOLDS = Object.freeze([
  { referrals: 1, rewardType: "tarot_free", productId: "tarot_extended", expiresInDays: null },
  { referrals: 3, rewardType: "tarot_extended", productId: "tarot_extended", expiresInDays: null },
  { referrals: 5, rewardType: "premium_days", productId: "premium_subscription", expiresInDays: 7 },
  { referrals: 10, rewardType: "subscription_bonus", productId: "premium_subscription", expiresInDays: 30 }
]);

export function getReferralProgress(qualifiedCount = 0) {
  return REFERRAL_REWARD_THRESHOLDS.map((threshold) => ({
    ...threshold,
    reached: qualifiedCount >= threshold.referrals
  }));
}
