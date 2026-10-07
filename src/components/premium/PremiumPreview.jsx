import AppButton from "../AppButton";
import { PREMIUM_PRODUCTS } from "./premiumAccess";

export default function PremiumPreview({ productId, title, description, benefits, price, accessType = "purchase", purchaseUnavailable = false, onClose, onPurchase }) {
  const product = PREMIUM_PRODUCTS[productId] || {};
  const resolvedTitle = title || product.title || "Premium";
  const resolvedDescription = description || product.description || "Расширенная версия результата AstroGuide.";
  const resolvedBenefits = benefits?.length ? benefits : product.benefits || [];
  const isSubscription = accessType === "subscription" || product.accessType === "subscription";
  const resolvedPrice = price || product.price;

  return (
    <div className="premium-preview" role="dialog" aria-modal="true" aria-labelledby="premium-preview-title">
      <button type="button" className="premium-preview__backdrop" onClick={onClose} aria-label="Закрыть" />
      <section className="premium-preview__card">
        <button type="button" className="premium-preview__close" onClick={onClose} aria-label="Закрыть">×</button>
        <span className="eyebrow">ASTROGUIDE PREMIUM</span>
        <h2 id="premium-preview-title">{resolvedTitle}</h2>
        <p>{resolvedDescription}</p>
        <ul>{resolvedBenefits.map((benefit) => <li key={benefit}>✦ {benefit}</li>)}</ul>
        <div className="premium-preview__price">{isSubscription ? "Premium — подписка" : resolvedPrice}</div>
        <p className="premium-preview__note">{purchaseUnavailable ? "Магазин ещё не активирован. Попробуйте позже — сейчас платежи не запускаются." : "Оплата станет доступна после активации магазина. Сейчас платежи не запускаются."}</p>
        <div className="premium-preview__actions">
          <AppButton onClick={onPurchase}>{isSubscription ? "Узнать о подписке" : "Открыть после оплаты"}</AppButton>
          <AppButton variant="secondary" onClick={onClose}>← Назад</AppButton>
        </div>
      </section>
    </div>
  );
}
