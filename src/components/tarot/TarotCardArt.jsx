const SUIT_SYMBOLS = {
  Жезлы: "✦",
  Кубки: "◌",
  Мечи: "◇",
  Пентакли: "◈"
};

function TarotCardArt({ card, size = "full" }) {
  const symbol = card.suit ? SUIT_SYMBOLS[card.suit] : "✦";
  const accent = card.suit === "Кубки" ? "#9fc8ff" : card.suit === "Мечи" ? "#d7c8ff" : card.suit === "Пентакли" ? "#b9e2bb" : "#f1c978";

  return (
    <svg className={`tarot-card-art tarot-card-art--${size}`} viewBox="0 0 160 230" role="img" aria-label={`Символическая иллюстрация карты «${card.name}»`}>
      <defs>
        <linearGradient id={`tarot-bg-${card.id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#3c2856" />
          <stop offset="1" stopColor="#121021" />
        </linearGradient>
        <radialGradient id={`tarot-glow-${card.id}`} cx="50%" cy="42%" r="55%">
          <stop offset="0" stopColor={accent} stopOpacity=".34" />
          <stop offset="1" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="4" y="4" width="152" height="222" rx="18" fill={`url(#tarot-bg-${card.id})`} stroke={accent} strokeOpacity=".62" />
      <rect x="12" y="12" width="136" height="206" rx="13" fill="none" stroke={accent} strokeOpacity=".26" />
      <circle cx="80" cy="100" r="55" fill={`url(#tarot-glow-${card.id})`} />
      <ellipse cx="80" cy="100" rx="58" ry="22" fill="none" stroke={accent} strokeOpacity=".45" transform="rotate(-28 80 100)" />
      <ellipse cx="80" cy="100" rx="42" ry="62" fill="none" stroke={accent} strokeOpacity=".2" transform="rotate(28 80 100)" />
      <path d="M80 48 88 91 130 100 88 109 80 152 72 109 30 100 72 91Z" fill="none" stroke={accent} strokeOpacity=".7" />
      <text x="80" y="108" textAnchor="middle" fill={accent} fontSize="35" fontWeight="700">{symbol}</text>
      <text x="80" y="31" textAnchor="middle" fill="#e9e1f6" fontSize="8" letterSpacing="2">ASTROGUIDE</text>
      <text x="80" y="197" textAnchor="middle" fill="#e9e1f6" fontSize="9">{card.arcana === "Старший Аркан" ? "СТАРШИЙ АРКАН" : card.suit?.toUpperCase()}</text>
    </svg>
  );
}

export default TarotCardArt;
