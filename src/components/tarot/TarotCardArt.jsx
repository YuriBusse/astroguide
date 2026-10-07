import { useState } from "react";
import { SUIT_SYMBOLS } from "../../data/tarot/deck";

function TarotCardArt({ card, size = "full" }) {
  const [imageFailed, setImageFailed] = useState(false);

  const symbol = card.suit ? SUIT_SYMBOLS[card.suit] : "✦";

  const accent =
    card.suit === "Кубки"
      ? "#9fc8ff"
      : card.suit === "Мечи"
        ? "#d7c8ff"
        : card.suit === "Пентакли"
          ? "#b9e2bb"
          : "#f1c978";

  return (
    <div
      className={`tarot-card-art tarot-card-art--${size}${
        card.reversed ? " tarot-card-art--reversed" : ""
      }`}
      role="img"
      aria-label={`Иллюстрация карты «${card.name}»`}
      style={{
        width: "100%",
        height: "100%",
        aspectRatio: "3 / 5",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {!imageFailed && card.image ? (
        <img
          className="tarot-card-art__image"
          src={card.image}
          alt={card.name}
          loading="eager"
          onError={() => setImageFailed(true)}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            aspectRatio: "3 / 5",
            objectFit: "fill",
            objectPosition: "center",
            borderRadius: "inherit",
          }}
        />
      ) : (
        <div className="tarot-card-art__fallback" aria-hidden="true">
          <div
            className="tarot-card-art__fallback-glow"
            style={{ "--tarot-accent": accent }}
          />
          <span>{symbol}</span>
          <small>ASTROGUIDE</small>
        </div>
      )}
    </div>
  );
}

export default TarotCardArt;