import PremiumBadge from "./PremiumBadge";
import PremiumCTA from "./PremiumCTA";

export default function PremiumTeaser({ title, description, items = [], onAction, unlocked = false, productId, accessType = "purchase", price = "299 ₽", productName = title, onUnlocked }) {
  const handleAction = () => {
    if (unlocked) {
      onUnlocked?.();
      return;
    }
    window.dispatchEvent(new CustomEvent("astroguide:premium-preview", { detail: { productId, title, description, benefits: items, price, accessType, source: productName } }));
    onAction?.();
  };
  return <section className="unified-premium-teaser">
    <div className="unified-premium-teaser__head"><PremiumBadge /><span>Расширение результата</span></div>
    <h2>{title}</h2>
    <p>{description}</p>
    {items.length > 0 && <ul>{items.map((item) => <li key={item}>✦ {item}</li>)}</ul>}
    <PremiumCTA onAction={handleAction} unlocked={unlocked} accessType={accessType} price={price} productName={productName} />
    {!unlocked && <small>{productId ? `${productId} · ` : ""}{accessType === "subscription" ? "Подписка будет подключена позже." : `${price} · разовая покупка. Реальная оплата подключается отдельно.`}</small>}
  </section>;
}
