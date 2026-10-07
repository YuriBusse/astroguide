import { useEffect, useState } from "react";
import { getValidSession } from "../utils/cloud";

const SERVER_URL = import.meta.env.DEV ? "" : import.meta.env.VITE_ASTROGUIDE_SERVER_URL || "";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("ru-RU");
}

async function adminRequest(path) {
  const session = await getValidSession();
  const response = await fetch(`${SERVER_URL}${path}`, { headers: { Authorization: `Bearer ${session?.access_token || ""}` } });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || "Не удалось загрузить данные.");
  return data;
}

function normalizeUserDetail(user) {
  const value = user || {};
  return {
    ...value,
    charts: Array.isArray(value.charts) ? value.charts : [],
    orders: Array.isArray(value.orders) ? value.orders : [],
    referrals: Array.isArray(value.referrals) ? value.referrals : [],
    results: Array.isArray(value.results) ? value.results : [],
    freeAnalysis: {
      granted: Number(value.freeAnalysis?.granted) || 0,
      used: Number(value.freeAnalysis?.used) || 0,
      balance: Number(value.freeAnalysis?.balance) || 0,
      ledger: Array.isArray(value.freeAnalysis?.ledger) ? value.freeAnalysis.ledger : []
    }
  };
}

function Metric({ label, value }) {
  return <div className="admin-metric"><span>{label}</span><strong>{value ?? "—"}</strong></div>;
}

function formatBirthDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}.${month}.${year}`;
}

function formatCoordinate(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(4) : "—";
}

function ChartCard({ chart }) {
  const [open, setOpen] = useState(false);
  return <article className={`admin-chart-card${open ? " is-open" : ""}`}>
    <button className="admin-chart-summary" onClick={() => setOpen(value => !value)} aria-expanded={open}>
      <span><strong>{formatBirthDate(chart.birth_date)} · {chart.birth_time || "время неизвестно"}</strong><small>{chart.city || "Город не указан"} · {chart.premium ? "⭐ Premium" : "Free"}</small><small>Создана: {formatDate(chart.created_at)}</small></span><span>{open ? "▲" : "▼"}</span>
    </button>
    {open && <div className="admin-chart-details"><div><b>Chart ID</b><code>{chart.id || "—"}</code></div><div><b>Дата рождения</b><span>{formatBirthDate(chart.birth_date)}</span></div><div><b>Время рождения</b><span>{chart.birth_time || "Не указано"}</span></div><div><b>Город</b><span>{chart.city || "—"}</span></div><div><b>Timezone</b><span>{chart.timezone || "—"}</span></div><div><b>Координаты</b><span>{formatCoordinate(chart.latitude)}, {formatCoordinate(chart.longitude)}</span></div><div><b>Дата создания</b><span>{formatDate(chart.created_at)}</span></div><div><b>Доступ</b><span>{chart.premium ? "Premium" : "Free"}</span></div></div>}
  </article>;
}

function AdminUserDetail({ detail, onNavigate }) {
  const paidOrders = detail.orders.filter(order => order.status === "paid");
  const revenue = paidOrders.reduce((sum, order) => sum + Number(order.amount_rub || 0), 0);
  return <>
    <button className="button button-secondary admin-back" onClick={() => onNavigate("/admin")}>← Назад к пользователям</button>
    <div className="admin-panel admin-user-header"><div><span className="eyebrow">👤 ПОЛЬЗОВАТЕЛЬ</span><h1>{detail.profile?.name || detail.auth?.user_metadata?.telegram_username || detail.auth?.email || "Без имени"}</h1><p>{detail.auth?.user_metadata?.telegram_username ? `@${detail.auth.user_metadata.telegram_username}` : ""}</p></div><div className="admin-user-facts"><div>Email: {detail.auth?.email || "—"}</div><div>Telegram ID: {detail.profile?.telegram_user_id || detail.auth?.user_metadata?.telegram_user_id || "—"}</div><div>User ID: <code>{detail.auth?.id || detail.profile?.id || "—"}</code></div><div>Регистрация: {formatDate(detail.auth?.created_at || detail.profile?.created_at)}</div></div></div>
    <div className="admin-metrics"><Metric label="Натальные карты" value={detail.charts.length} /><Metric label="Premium карт" value={detail.charts.filter(item => item.premium).length} /><Metric label="Покупки" value={paidOrders.length} /><Metric label="Выручка, ₽" value={revenue} /><Metric label="Free balance" value={detail.freeAnalysis.balance} /><Metric label="Рефералы" value={detail.referrals.length} /></div>
    <div className="admin-panel"><h2>🔮 Натальные карты</h2>{detail.charts.length ? detail.charts.map(chart => <ChartCard key={chart.id} chart={chart} />) : <p>У пользователя пока нет сохранённых карт.</p>}{detail.results.length > 0 && <><h3>Результаты</h3>{detail.results.map(result => <div className="admin-result-row" key={result.id}><strong>{result.title}</strong><span>{result.result_type} · {formatDate(result.created_at)} · {result.access_type}</span></div>)}</>}</div>
    <div className="admin-panel"><h2>💳 Платежи</h2>{detail.orders.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Дата</th><th>Сумма</th><th>Provider</th><th>Статус</th><th>Order ID</th><th>Chart ID</th></tr></thead><tbody>{detail.orders.map(order => <tr key={order.id}><td>{formatDate(order.created_at)}</td><td>{Number.isFinite(Number(order.amount_rub)) ? `${Number(order.amount_rub).toFixed(2)} ₽` : "—"}</td><td>{order.provider || "—"}</td><td><span className="admin-status">{order.status || "—"}</span></td><td><code>{order.id || "—"}</code></td><td><code>{order.chart_id || "—"}</code></td></tr>)}</tbody></table></div> : <p className="admin-empty">Платежей пока нет.</p>}</div>
    <div className="admin-panel"><h2>🔗 Рефералы</h2><p>Код: <code>{detail.referralCode || "—"}</code></p>{detail.referralLink && <p className="admin-wrap">Ссылка: {detail.referralLink}</p>}<p>Пригласил: <code>{detail.invitedBy?.referrer_user_id || "—"}</code></p>{detail.referrals.length ? detail.referrals.map(item => <div className="admin-result-row" key={item.id}><strong>{item.status}</strong><span>Приглашённый: {item.referred_user_id} · {formatDate(item.qualified_at || item.rewarded_at || item.created_at)}</span></div>) : <p>Рефералов нет.</p>}</div>
    <div className="admin-panel"><h2>🎁 Бесплатные разборы</h2><div className="admin-detail-grid"><Metric label="Начислено" value={detail.freeAnalysis.granted} /><Metric label="Использовано" value={detail.freeAnalysis.used} /><Metric label="Баланс" value={detail.freeAnalysis.balance} /></div>{detail.freeAnalysis.ledger.length ? detail.freeAnalysis.ledger.map(item => <div className="admin-result-row" key={item.id}><strong>{item.source}: {item.amount > 0 ? "+" : ""}{item.amount}</strong><span>{formatDate(item.created_at)} · {item.reference_id || "без reference"}</span></div>) : <p>Ledger пока пуст.</p>}</div>
  </>;
}

export default function AdminPage({ onNavigate, userId = "" }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ registeredFrom: "", registeredTo: "", chartFrom: "", chartTo: "", birthDate: "", premium: "", hasPurchases: "", hasReferral: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const filterKey = JSON.stringify(appliedFilters);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), pageSize: "25" });
    if (search) params.set("search", search);
    Object.entries(appliedFilters).forEach(([key, value]) => value && params.set(key, value));
    const usersPath = `/api/admin/users?${params.toString()}`;
    Promise.all([adminRequest("/api/admin/stats"), adminRequest(usersPath), userId ? adminRequest(`/api/admin/users/${encodeURIComponent(userId)}`) : Promise.resolve(null)])
      .then(([statsResponse, usersResponse, detailResponse]) => {
        if (!active) return;
        setStats(statsResponse.stats);
        setUsers(usersResponse.users || []);
        setTotal(usersResponse.total || 0);
        setDetail(detailResponse?.user ? normalizeUserDetail(detailResponse.user) : null);
      })
      .catch((requestError) => active && setError(requestError.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [search, userId, filterKey, appliedFilters, page]);

  const setQuickDate = (target, days) => {
    const to = new Date();
    const from = new Date();
    if (days > 0) from.setDate(from.getDate() - days + 1);
    const next = { ...filters, [`${target}From`]: days ? from.toISOString().slice(0, 10) : "", [`${target}To`]: days ? to.toISOString().slice(0, 10) : "" };
    setFilters(next);
  };

  const resetFilters = () => {
    const empty = { registeredFrom: "", registeredTo: "", chartFrom: "", chartTo: "", birthDate: "", premium: "", hasPurchases: "", hasReferral: "" };
    setFilters(empty);
    setAppliedFilters(empty);
    setPage(1);
    setSearch("");
  };

  if (detail) {
    return <section className="screen admin-screen"><AdminUserDetail detail={detail} onNavigate={onNavigate} /></section>;
  }

  return (
    <section className="screen admin-screen">
      <div className="admin-header">
        <div><span className="eyebrow">ASTROGUIDE ADMIN</span><h1>Панель управления</h1><p>Только просмотр данных. Изменение платежей и доступов недоступно.</p></div>
        <button className="button button-secondary" onClick={() => onNavigate("/")}>← В приложение</button>
      </div>
      {loading && <div className="empty-state">Загружаем данные…</div>}
      {error && <div className="empty-state"><strong>{error}</strong><button className="button button-secondary" onClick={() => onNavigate("/profile")}>Вернуться</button></div>}
      {!loading && !error && stats && <>
        {detail && <div className="admin-panel"><div className="admin-panel-heading"><div><h2>Пользователь</h2><p><code>{detail.auth?.id || detail.profile?.id}</code></p></div><button className="button button-secondary" onClick={() => onNavigate("/admin")}>← К списку</button></div><div className="admin-detail-grid"><Metric label="Имя" value={detail.profile?.name || detail.auth?.email || "—"} /><Metric label="Telegram ID" value={detail.profile?.telegram_user_id || detail.auth?.user_metadata?.telegram_user_id || "—"} /><Metric label="Карт" value={detail.charts.length} /><Metric label="Premium карт" value={detail.charts.filter(item => item.premium).length} /><Metric label="Free balance" value={detail.freeAnalysis.balance} /><Metric label="Платных заказов" value={detail.orders.filter(item => item.status === "paid").length} /></div><h3>Натальные карты</h3><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Дата рождения</th><th>Время</th><th>Город</th><th>Создана</th><th>Доступ</th></tr></thead><tbody>{detail.charts.map(chart => <tr key={chart.id}><td>{chart.birth_date}</td><td>{chart.birth_time}</td><td>{chart.city}</td><td>{formatDate(chart.created_at)}</td><td>{chart.premium ? "Premium" : "Free"}</td></tr>)}</tbody></table></div><h3>Free-analysis ledger</h3><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Дата</th><th>Сумма</th><th>Источник</th><th>Reference</th></tr></thead><tbody>{detail.freeAnalysis.ledger.map(item => <tr key={item.id}><td>{formatDate(item.created_at)}</td><td>{item.amount}</td><td>{item.source}</td><td>{item.reference_id || "—"}</td></tr>)}</tbody></table></div></div>}
        <div className="admin-metrics">
          <Metric label="Пользователи" value={stats.users} /><Metric label="Новые за месяц" value={stats.usersThisMonth} />
          <Metric label="Натальные карты" value={stats.charts} /><Metric label="Premium" value={stats.premiumCharts} />
          <Metric label="Оплаченные заказы" value={stats.paidOrders} /><Metric label="Выручка, ₽" value={stats.revenue} />
          <Metric label="Рефералы" value={stats.referrals} /><Metric label="Free balance" value={stats.freeAnalysisOutstanding} />
        </div>
        <div className="admin-panel">
          <div className="admin-panel-heading"><div><h2>Пользователи</h2><p>Фильтры и поиск выполняются на сервере.</p></div><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Поиск пользователя" /></div>
          <div className="admin-filters">
            <div><label>Дата рождения<input type="date" value={filters.birthDate} onChange={event => setFilters({ ...filters, birthDate: event.target.value })} /></label></div>
            <div><label>Регистрация</label><div className="admin-quick"><button onClick={() => setQuickDate("registered", 1)}>Сегодня</button><button onClick={() => setQuickDate("registered", 7)}>7 дней</button><button onClick={() => setQuickDate("registered", 30)}>30 дней</button><button onClick={() => setQuickDate("registered", 0)}>Всё</button></div><div className="admin-dates"><input type="date" value={filters.registeredFrom} onChange={event => setFilters({ ...filters, registeredFrom: event.target.value })} /><input type="date" value={filters.registeredTo} onChange={event => setFilters({ ...filters, registeredTo: event.target.value })} /></div></div>
            <label>Premium<select value={filters.premium} onChange={event => setFilters({ ...filters, premium: event.target.value })}><option value="">Все</option><option value="true">Premium</option><option value="false">Free</option></select></label>
            <label>Покупки<select value={filters.hasPurchases} onChange={event => setFilters({ ...filters, hasPurchases: event.target.value })}><option value="">Все</option><option value="true">Есть покупки</option><option value="false">Нет покупок</option></select></label>
            <label>Реферал<select value={filters.hasReferral} onChange={event => setFilters({ ...filters, hasReferral: event.target.value })}><option value="">Все</option><option value="true">Пришёл по рефералу</option><option value="false">Не пришёл</option></select></label>
            <div className="admin-filter-actions"><button className="button" onClick={() => { setPage(1); setAppliedFilters(filters); }}>Применить</button><button className="button button-secondary" onClick={resetFilters}>Сбросить</button></div>
          </div>
          <div className="admin-active-filters">{Object.entries(appliedFilters).filter(([, value]) => value).map(([key, value]) => <span key={key}>{key}: {value}</span>)}</div>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>ID</th><th>Пользователь</th><th>Регистрация</th><th>Карты</th><th>Premium</th><th>Free</th><th>Покупки</th></tr></thead><tbody>
            {users.map(user => <tr key={user.id} onClick={() => onNavigate(`/admin/users/${encodeURIComponent(user.id)}`)}><td><code>{user.id.slice(0, 8)}…</code></td><td>{user.name || user.email || user.telegram_user_id || "Без имени"}</td><td>{formatDate(user.created_at)}</td><td>{user.charts}</td><td>{user.premium ? "Premium" : "Free"}</td><td>{user.free_analysis}</td><td>{user.purchases}</td></tr>)}
          </tbody></table></div>
          <div className="admin-pagination"><span>Показано {total ? (page - 1) * 25 + 1 : 0}–{Math.min(page * 25, total)} из {total}</span><div><button className="button button-secondary" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>←</button><button className="button button-secondary" disabled={page * 25 >= total} onClick={() => setPage(current => current + 1)}>→</button></div></div>
        </div>
      </>}
    </section>
  );
}
