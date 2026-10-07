export const PREMIUM_ACCESS_STATES = Object.freeze({
  FREE: "free",
  LOCKED: "premium_locked",
  PURCHASE: "premium_purchase",
  SUBSCRIPTION: "premium_subscription",
  REWARD: "premium_reward",
  UNLOCKED: "premium_unlocked"
});

export const PREMIUM_ACCESS_TYPES = Object.freeze({
  FREE: "free",
  PURCHASE: "purchase",
  SUBSCRIPTION: "subscription",
  REWARD: "reward"
});

export const PREMIUM_PRODUCTS = Object.freeze({
  natal_full_report: { id: "natal_full_report", title: "Полный разбор натальной карты", description: "Цельный разбор вашей карты простым языком.", benefits: ["характер и личность", "отношения и карьера", "жизненные периоды"], accessType: "purchase", price: "299 ₽" },
  tarot_extended: { id: "tarot_extended", title: "Расширенный расклад Таро", description: "Более глубокое чтение уже полученного расклада.", benefits: ["связь карт между собой", "дополнительные выводы", "расширенный совет"], accessType: "purchase", price: "299 ₽" },
  compatibility_extended: { id: "compatibility_extended", title: "Расширенная совместимость", description: "Глубокий разбор динамики пары на основе рассчитанных аспектов.", benefits: ["дополнительные аспекты", "точки напряжения и сильные стороны", "расширенные рекомендации"], accessType: "purchase", price: "299 ₽" },
  forecast_extended: { id: "forecast_extended", title: "Расширенный прогноз", description: "Более подробное чтение транзитов и периодов.", benefits: ["дополнительные транзиты", "дома, ASC и MC", "расширенный прогноз на 7 дней"], accessType: "purchase", price: "299 ₽" },
  premium_subscription: { id: "premium_subscription", title: "AstroGuide Premium", description: "Доступ ко всем расширенным функциям на период действия подписки.", benefits: ["все Premium-отчёты", "расширенные Tarot, Compatibility и Forecast", "единый Premium-доступ"], accessType: "subscription", price: "Цена будет определена позже" }
});

function isActiveEntitlement(entitlement, now = new Date()) {
  if (!entitlement || entitlement.status !== "active") return false;
  if (!entitlement.expires_at) return true;
  const expiresAt = new Date(entitlement.expires_at);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt > now;
}

export function hasAccess(entitlements = [], productId, now = new Date()) {
  return entitlements.some((entitlement) => {
    if (!isActiveEntitlement(entitlement, now)) return false;
    if (entitlement.access_type === "subscription") return true;
    return entitlement.product_id === productId;
  });
}

export function resolvePremiumAccess({ loading = false, serverPremium = false, productUnlocked = false, entitlements = [], productId, accessType = "purchase" } = {}) {
  if (loading) return PREMIUM_ACCESS_STATES.LOCKED;
  if (serverPremium || productUnlocked || hasAccess(entitlements, productId)) return PREMIUM_ACCESS_STATES.UNLOCKED;
  if (accessType === "reward") return PREMIUM_ACCESS_STATES.REWARD;
  return accessType === "subscription" ? PREMIUM_ACCESS_STATES.SUBSCRIPTION : PREMIUM_ACCESS_STATES.PURCHASE;
}
