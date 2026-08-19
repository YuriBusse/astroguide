import { useState } from "react";
import BirthForm from "./components/BirthForm";
import AccountPanel from "./components/AccountPanel";

function App() {
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <main className="app">
      <section className="hero">
        <button className="account-open-button" type="button" onClick={() => setAccountOpen(true)}>
          <span>◉</span> Мои карты
        </button>
        <div className="hero__glow hero__glow--one" />
        <div className="hero__glow hero__glow--two" />
        <div className="hero__content">
          <div className="brand-mark">✦</div>
          <span className="eyebrow">ASTROGUIDE</span>
          <h1>Узнай свою<br /><em>натальную карту</em></h1>
          <p>Рассчитайте планеты, дома и основные аспекты по вашим данным рождения.</p>
        </div>
      </section>
      <BirthForm />
      <AccountPanel open={accountOpen} onClose={() => setAccountOpen(false)} />
    </main>
  );
}

export default App;
