// Универсальная мобильная карточка: иконка + заголовок + подзаголовок + статус.
// Если передан onClick — рендерится как кнопка (кликабельный тайл).

function AppCard({
  icon = null,
  title = null,
  subtitle = null,
  status = null,
  tone = null,
  onClick = null,
  children = null,
  className = ""
}) {
  const classes = ["app-card"];
  if (tone) classes.push(`app-card--${tone}`);
  if (onClick) classes.push("app-card--pressable");
  if (className) classes.push(className);

  const Tag = onClick ? "button" : "article";

  return (
    <Tag type={onClick ? "button" : undefined} className={classes.join(" ")} onClick={onClick}>
      {icon && <span className="app-card__icon" aria-hidden="true">{icon}</span>}
      {(title || subtitle) && (
        <span className="app-card__body">
          {title && <strong className="app-card__title">{title}</strong>}
          {subtitle && <span className="app-card__subtitle">{subtitle}</span>}
        </span>
      )}
      {children}
      {status && <span className="app-card__status">{status}</span>}
      {onClick && <span className="app-card__arrow" aria-hidden="true">→</span>}
    </Tag>
  );
}

export default AppCard;