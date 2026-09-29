import AppButton from "../components/AppButton";
import AppCard from "../components/AppCard";

const FEATURES = [
  {
    icon: "🔮",
    title: "Натальная карта",
    subtitle: "Планеты, дома и аспекты по времени рождения",
    status: "Доступно",
    tone: "active",
    path: "chart-birth"
  },
  {
    icon: "❤️",
    title: "Совместимость",
    subtitle: "Как ваши карты сочетаются с картой партнёра",
    status: "Скоро",
    tone: "soon",
    path: null
  },
  {
    icon: "🃏",
    title: "Таро",
    subtitle: "Расклады, которые отвечают на вопросы дня",
    status: "Доступно",
    tone: "active",
    path: "tarot"
  },
  {
    icon: "✨",
    title: "Прогнозы",
    subtitle: "Персональные астрологические тенденции",
    status: "Скоро",
    tone: "soon",
    path: null
  }
];

function Home({ onNavigate }) {
  return (
    <section className="screen screen--home">
      <header className="home-hero">
        <div className="home-hero__mark" aria-hidden="true">✦</div>
        <span className="eyebrow">ASTROGUIDE</span>
        <h1 className="home-hero__title">Твоя карта. Твои звёзды. Твоя история.</h1>
        <p className="home-hero__text">Точный расчёт по Swiss Ephemeris — прямо в Telegram.</p>
      </header>

      <div className="home-cta">
        <AppButton size="lg" variant="primary" icon="🔮" onClick={() => onNavigate("chart-birth")}>
          Создать натальную карту
        </AppButton>
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

      <p className="home-footnote">Расчёт в приложении · Swiss Ephemeris · Placidus</p>
    </section>
  );
}

export default Home;
