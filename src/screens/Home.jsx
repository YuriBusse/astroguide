import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";
import PremiumTeaser from "../components/premium/PremiumTeaser";

const FEATURES = [
  {
    icon: "🌌",
    title: "Натальная карта",
    subtitle: "Сильные стороны, отношения, карьера и характер",
    status: "Доступно",
    tone: "active",
    path: "chart-birth"
  },
  {
    icon: "❤️",
    title: "Совместимость",
    subtitle: "Точки притяжения, напряжения и общения",
    status: "Доступно",
    tone: "active",
    path: "compatibility"
  },
  {
    icon: "🃏",
    title: "Таро",
    subtitle: "Расклад на конкретный вопрос",
    status: "Доступно",
    tone: "active",
    path: "tarot"
  },
  {
    icon: "✨",
    title: "Прогноз",
    subtitle: "Тенденции на сегодня, завтра или 7 дней",
    status: "Доступно",
    tone: "active",
    path: "forecast"
  }
];

function Home({ onNavigate }) {
  return (
    <section className="screen screen--home">
      <header className="home-hero">
        <div className="home-hero__mark" aria-hidden="true">✦</div>
        <span className="eyebrow">ASTROGUIDE</span>
        <h1 className="home-hero__title">Твоя карта. Твои звёзды. Твоя история.</h1>
        <p className="home-hero__text">Натальная карта, совместимость, Таро и прогнозы — в одном месте.</p>
        <p className="home-hero__hint">Укажи дату, время и город рождения — мы покажем карту и объясним основные символы простыми словами.</p>
      </header>

      

      <div className="home-cta">
        <AppButton size="lg" variant="primary" icon="🔮" onClick={() => onNavigate("chart-birth")}>
          Создать натальную карту
        </AppButton>
      </div>

                  <div
  style={{
    marginTop: "18px",
    marginBottom: "20px",
    padding: "2px",
    border: "1px solid rgba(242, 198, 109, .28)",
    borderRadius: "15px",
    background: "linear-gradient(135deg, rgba(242, 198, 109, .08), rgba(199, 166, 255, .08))",
    boxShadow: "0 8px 28px rgba(199, 166, 255, .06)"
  }}
>
  <AppCard
    icon="👤"
    title="Профиль"
    subtitle="Мои карты, аккаунт и сохранённые расчёты"
    status="Перейти"
    tone="active"
    onClick={() => onNavigate("profile")}
  />
</div>

      <section className="home-features" aria-label="Разделы">
        {FEATURES.map((feature) => (
          <AppCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            subtitle={feature.subtitle}
            status={feature.status}
            tone={feature.tone}
            onClick={feature.path ? () => onNavigate(feature.path) : null}
          />
        ))}
      </section>

      <PremiumTeaser
        productId="premium_subscription"
        accessType="subscription"
        title="✨ AstroGuide Premium"
        description="Более глубокие разборы и дополнительные возможности после получения базового результата."
        items={["расширенный разбор натальной карты", "расширенное Таро и совместимость", "более подробный прогноз"]}
        onAction={() => window.dispatchEvent(new Event("astroguide:checkout-requested"))}
      />

      <p className="home-footnote">Расчёт в приложении · Swiss Ephemeris · Placidus</p>
    </section>
  );
}

export default Home;
