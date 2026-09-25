// Мобильная кнопка: большая (>=48px), с иконкой, состоянием загрузки и вариантами.

function AppButton({
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  loading = false,
  icon = null,
  children = null,
  className = "",
  onClick = null,
  ariaLabel = null
}) {
  const classes = ["app-button", `app-button--${variant}`, `app-button--${size}`];
  if (disabled) classes.push("is-disabled");
  if (loading) classes.push("is-loading");
  if (className) classes.push(className);

  return (
    <button
      type={type}
      className={classes.join(" ")}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {loading ? (
        <span className="app-button__spinner" aria-hidden="true" />
      ) : icon ? (
        <span className="app-button__icon" aria-hidden="true">{icon}</span>
      ) : null}
      <span className="app-button__label">{children}</span>
    </button>
  );
}

export default AppButton;