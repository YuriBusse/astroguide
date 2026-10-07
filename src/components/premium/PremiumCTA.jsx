import PremiumBadge from "./PremiumBadge";
import { PREMIUM_ACCESS_STATES } from "./premiumAccess";

export default function PremiumCTA({ onAction, unlocked = false, accessState, accessType = "purchase", price = "299 ₽", productName = "Premium" }) {
  const isSubscription = accessType === "subscription";
  const isReward = accessType === "reward";
  const isLocked = accessState === PREMIUM_ACCESS_STATES.LOCKED;
  const isUnlocked = unlocked || accessState === PREMIUM_ACCESS_STATES.UNLOCKED;
  return <button type="button" className={`unified-premium-cta${isUnlocked ? " is-unlocked" : ""}`} onClick={onAction} disabled={isUnlocked && !onAction} aria-label={isUnlocked ? `Открыть ${productName}` : `Получить ${productName}`}>
    <PremiumBadge />
    <span>{isUnlocked ? "Открыть расширенный разбор" : isLocked ? "Подробнее" : isReward ? "Открыть бесплатно" : isSubscription ? "Premium — подписка" : `Открыть за ${price}`}</span>
    <strong aria-hidden="true">→</strong>
  </button>;
}
