const items = [
  ["☉","Солнце","Кто я"],
  ["☽","Луна","Что я чувствую"],
  ["⬆","ASC","Как меня видят"],
  ["☿","Меркурий","Как я думаю"],
  ["♀","Венера","Как я люблю"],
  ["♂","Марс","Как я действую"]
];

function BeginnerSummary({ zodiac, moon, ascendant, mercury, venus, mars }) {
  const values = {
    "Солнце": zodiac,
    "Луна": moon,
    "ASC": ascendant,
    "Меркурий": mercury,
    "Венера": venus,
    "Марс": mars
  };

  return (
    <section className="beginner-summary beginner-summary--compact">
      <div className="section-heading">
        <span className="eyebrow">ВАШИ ОСНОВНЫЕ ПОЗИЦИИ</span>
        <h2>Шесть вещей, с которых стоит начать</h2>
        <p>Короткий ориентир по карте. Не нужно запоминать все символы — подробный разбор появится только там, где он действительно нужен.</p>
      </div>
      <div className="beginner-grid">
        {items.map(([symbol, name, question]) => (
          <div className="beginner-item" key={name}>
            <span className="beginner-item__symbol">{symbol}</span>
            <div>
              <span className="beginner-item__name">{name}</span>
              <strong>{values[name]}</strong>
              <small>{question}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default BeginnerSummary;
