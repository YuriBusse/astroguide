const ITEMS = [
  { id: "home", label: "Главная", icon: "🏠", path: "/" },
  { id: "birth-chart", label: "Карта", icon: "✦", path: "/chart-birth" },
  { id: "tarot", label: "Таро", icon: "🃏", path: "/tarot" },
  { id: "compatibility", label: "Совместимость", icon: "❤️", path: "/compatibility" },
  { id: "profile", label: "Профиль", icon: "👤", path: "/profile" }
];

function isActive(item, route) {
  if (item.id === "home") return route === "/";
  return route === item.path;
}

function BottomNav({ route, onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {ITEMS.map((item) => {
        const active = isActive(item, route);

        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav__item${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={() => onNavigate(item.path)}
          >
            <span className="bottom-nav__icon" aria-hidden="true">
              {item.icon}
            </span>

            <span className="bottom-nav__label">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default BottomNav;