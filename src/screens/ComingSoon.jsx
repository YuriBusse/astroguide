import AppButton from "../components/AppButton";

// Заглушка для разделов, которые ещё в разработке.
function ComingSoon({ title, icon = "🚧", description, onBack }) {
  return (
    <section className="screen screen--stub">
      <div className="stub-hero">
        <span className="stub-hero__icon" aria-hidden="true">{icon}</span>
      </div>
      <h1 className="stub-hero__title">{title}</h1>
      <p className="stub-hero__text">
        {description || "Мы готовим этот раздел. Он появится в ближайших обновлениях."}
      </p>
      <div className="stub-badge">Скоро</div>
      <div className="stub-actions">
        <AppButton variant="secondary" onClick={onBack}>На главную</AppButton>
      </div>
    </section>
  );
}

export default ComingSoon;