import { useEffect, useMemo, useState } from "react";
import { cloudConfigured, getValidSession } from "../utils/cloud";
import { buildPremiumReport, PremiumReport } from "./PremiumReport";

const freeItems = [
  "Натальная карта",
  "Все основные планеты и точки",
  "ASC и MC",
  "12 домов",
  "Краткий портрет",
  "Базовые положения Солнца, Луны, ASC и личных планет"
];

const premiumItems = [
  "Глубокий синтез всей карты",
  "Личность и внутренние противоречия",
  "Отношения и сценарии близости",
  "Карьера и деньги",
  "Развитие и повторяющиеся жизненные темы",
  "Подробный анализ аспектов",
  "Уран, Нептун, Плутон и их связи",
  "Полный структурированный отчёт"
];

const SERVER_URL = import.meta.env.VITE_ASTROGUIDE_SERVER_URL || "";

function PremiumSection({
  zodiac,
  moon,
  ascendant,
  venus,
  mars,
  aspects = [],
  chart,
  planetLongitudes = {},
  planetHouses = {},
  ascendantLongitude,
  mcLongitude
}) {
  const [demoOpen, setDemoOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [premiumUnlocked, setPremiumUnlocked] = useState(false);
  const [premiumChecking, setPremiumChecking] = useState(true);
  const [paymentState, setPaymentState] = useState("idle");
  const [paymentError, setPaymentError] = useState("");

  const premiumReport = useMemo(() => buildPremiumReport({
    planetLongitudes,
    planetHouses,
    ascendantLongitude,
    mcLongitude,
    aspects
  }), [planetLongitudes, planetHouses, ascendantLongitude, mcLongitude, aspects]);

  const syncPremium = async () => {
    const session = await getValidSession();
    if (!cloudConfigured || !session?.access_token || !chart?.date || !chart?.time || !chart?.city) {
      setPremiumUnlocked(false);
      setPremiumChecking(false);
      return;
    }

    setPremiumChecking(true);
    try {
      const query = new URLSearchParams({
        date: chart.date,
        time: chart.time,
        city: chart.city
      });
      const response = await fetch(`${SERVER_URL}/api/premium-status?${query.toString()}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      setPremiumUnlocked(Boolean(response.ok && data.premium));
      if (response.ok && data.premium) {
        localStorage.setItem("astroguide_premium", "true");
      }
    } catch (error) {
      console.error("Не удалось проверить Premium:", error);
      setPremiumUnlocked(false);
    } finally {
      setPremiumChecking(false);
    }
  };

  useEffect(() => {
    void syncPremium();
    window.addEventListener("astroguide:premium", syncPremium);
    window.addEventListener("storage", syncPremium);
    return () => {
      window.removeEventListener("astroguide:premium", syncPremium);
      window.removeEventListener("storage", syncPremium);
    };
  }, [chart?.date, chart?.time, chart?.city]);

  const teasers = useMemo(() => [
    {
      icon: "🧠",
      title: "Личность",
      text: `Солнце в ${zodiac}, Луна в ${moon} и ASC в ${ascendant} создают сочетание, которое нельзя точно описать одной фразой...`,
      unlock: "Синтез характера, потребностей и внешнего образа"
    },
    {
      icon: "❤️",
      title: "Отношения",
      text: `Венера в ${venus} — только начало. Полный вывод зависит от связи Венеры с Марсом, домами и аспектами...`,
      unlock: "Потребности в близости, сильные стороны и точки роста"
    },
    {
      icon: "💼",
      title: "Карьера",
      text: "Карта содержит несколько показателей профессиональной реализации. В бесплатной версии мы не сводим их в единый вывод...",
      unlock: "Рабочий стиль, мотивация, реализация и сильные стороны"
    },
    {
      icon: "💰",
      title: "Деньги",
      text: "Финансовая тема рассматривается через несколько домов и их управителей. Отдельное положение планеты не даёт полного ответа...",
      unlock: "Отношение к ресурсам, стабильности, риску и заработку"
    },
    {
      icon: "🧭",
      title: "Развитие",
      text: "Северный узел, Сатурн и напряжённые аспекты могут образовывать повторяющиеся темы. Их связь между собой скрыта в бесплатной версии...",
      unlock: "Направления роста и темы, которые стоит осознанно развивать"
    },
    {
      icon: "✨",
      title: "Аспекты",
      text: aspects[0]
        ? `${aspects[0].aName} ${aspects[0].symbol} ${aspects[0].bName} — лишь один фрагмент общей картины...`
        : "Связи между планетами помогают увидеть динамику карты, а не отдельные качества...",
      unlock: "Синтез самых сильных и точных аспектов"
    }
  ], [zodiac, moon, ascendant, venus, aspects]);

  useEffect(() => {
    const onCheckout = () => {
      setPaymentError("");
      setCheckoutOpen(true);
    };
    window.addEventListener("astroguide:checkout-requested", onCheckout);
    return () => window.removeEventListener("astroguide:checkout-requested", onCheckout);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("astroguide_order");
    if (!orderId) return;

    let cancelled = false;
    const poll = async () => {
      const session = await getValidSession();
      const token = session?.access_token;
      if (!token) return;
      setPaymentState("checking");
      for (let i = 0; i < 12 && !cancelled; i += 1) {
        try {
          const response = await fetch(`${SERVER_URL}/api/payment-status?orderId=${encodeURIComponent(orderId)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.status === "paid") {
            localStorage.setItem("astroguide_premium", "true");
            window.dispatchEvent(new Event("astroguide:premium"));
            await syncPremium();
            setPaymentState("paid");
            setReportOpen(true);
            window.history.replaceState({}, "", window.location.pathname + window.location.hash);
            return;
          }
          if (data.status === "cancelled" || data.status === "refunded") {
            setPaymentState("failed");
            setPaymentError("Платёж не был завершён.");
            window.history.replaceState({}, "", window.location.pathname + window.location.hash);
            return;
          }
        } catch (error) {
          console.error(error);
        }
        await new Promise((resolve) => setTimeout(resolve, 2500));
      }
    };
    poll();
    return () => { cancelled = true; };
  }, []);

  const startPayment = async () => {
    setPaymentError("");
    const session = await getValidSession();

    if (!cloudConfigured || !session?.access_token) {
      setPaymentError("Для покупки Premium сначала войдите или зарегистрируйтесь через «Мои карты».");
      return;
    }

    if (!chart?.date || !chart?.time || !chart?.city) {
      setPaymentError("Не удалось определить данные текущей карты. Пересчитайте карту и попробуйте ещё раз.");
      return;
    }

    setPaymentState("creating");
    try {
      const response = await fetch(`${SERVER_URL}/api/create-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}${window.location.pathname}?astroguide_order=ORDER_ID`,
          chart: {
            date: chart.date,
            time: chart.time,
            city: chart.city,
            timezone: chart.timezone,
            latitude: chart.latitude,
            longitude: chart.longitude
          }
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Не удалось создать платёж.");

      setPaymentState("redirecting");
      const returnUrl = `${window.location.origin}${window.location.pathname}?astroguide_order=${encodeURIComponent(data.orderId)}`;
      if (data.confirmationUrl && data.confirmationUrl.includes("return_url=") === false) {
        // confirmationUrl is generated by YooKassa with the server return URL.
      }
      window.location.href = data.confirmationUrl;
      void returnUrl;
    } catch (error) {
      console.error(error);
      setPaymentState("error");
      setPaymentError(error.message || "Не удалось начать оплату.");
    }
  };

  return (
    <section className="premium-section premium-section--conversion" id="premium">
      <div className="premium-section__top">
        <div>
          <span className="eyebrow">ASTROGUIDE PREMIUM</span>
          <h2>Бесплатно — познакомиться с картой. Premium — понять себя глубже.</h2>
          <p>Мы специально оставили бесплатную часть короткой: вы получаете реальные данные и первый взгляд, а Premium собирает их в цельную историю именно вашей карты.</p>
        </div>
        <div className="premium-price">
          <span>ПОЛНЫЙ РАЗБОР</span>
          <strong>499 ₽</strong>
          <small>разовая покупка · без подписки</small>
        </div>
      </div>

      <div className="premium-comparison premium-comparison--balanced">
        <article className="comparison-card comparison-card--free">
          <div className="comparison-card__head">
            <div><span className="comparison-badge">БЕСПЛАТНО</span><h3>Первый взгляд</h3></div>
            <span className="comparison-icon">✓</span>
          </div>
          <p>Карта и короткая интерпретация, чтобы понять основные показатели и решить, хотите ли вы узнать больше.</p>
          <ul>{freeItems.map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul>
        </article>

        <article className="comparison-card comparison-card--premium">
          <div className="comparison-card__shine" />
          <div className="comparison-card__head">
            <div><span className="comparison-badge comparison-badge--premium">PREMIUM</span><h3>Полный персональный разбор</h3></div>
            <span className="comparison-icon">✦</span>
          </div>
          <p>Не справочник по знакам, а связная интерпретация: что повторяется в вашей карте и как отдельные показатели работают вместе.</p>
          <ul>{premiumItems.map((item) => <li key={item}><span>✦</span>{item}</li>)}</ul>
          <div className="comparison-card__price"><strong>499 ₽</strong><span>один раз · без подписки</span></div>
        </article>
      </div>

      <div className="premium-teaser-heading">
        <span className="eyebrow">ЧТО ВНУТРИ</span>
        <h3>Небольшой фрагмент каждого раздела</h3>
        <p>Показываем идею анализа, но не отдаём весь результат бесплатно.</p>
      </div>

      <div className="premium-grid premium-grid--teasers">
        {teasers.map((item) => (
          <article className="premium-feature premium-feature--teaser" key={item.title}>
            <div className="premium-feature__icon">{item.icon}</div>
            <div>
              <span className="premium-feature__kicker">PREMIUM</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <div className="premium-lockline"><span>🔒</span>{item.unlock}</div>
            </div>
          </article>
        ))}
      </div>

      <div className="premium-cta premium-cta--strong">
        <div>
          <span className="premium-cta__eyebrow">ПОЛНЫЙ ПЕРСОНАЛЬНЫЙ РАЗБОР</span>
          <strong>Узнайте, как вся карта складывается в одну историю.</strong>
          <p>Один платёж — доступ ко всем пяти темам, аспектам и глубокому синтезу карты.</p>
        </div>
        <div className="premium-cta__actions">
          <button className="premium-demo" type="button" onClick={() => setDemoOpen(true)}>Посмотреть пример</button>
          {premiumUnlocked ? (
            <button className="premium-buy premium-buy--unlocked" type="button" onClick={() => setReportOpen(true)}>✓ Открыть Premium</button>
          ) : (
            <button className="premium-buy" type="button" onClick={() => setCheckoutOpen(true)} disabled={premiumChecking}>
              {premiumChecking ? "Проверяем доступ…" : "Получить полный разбор — 499 ₽"} {!premiumChecking && <span>→</span>}
            </button>
          )}
        </div>
      </div>

      {paymentState === "checking" && (
        <div className="payment-status-banner">Проверяем оплату… Это может занять несколько секунд.</div>
      )}
      {paymentState === "paid" && (
        <div className="payment-status-banner payment-status-banner--success">✓ Premium активирован. Полный разбор доступен.</div>
      )}

      <div className="astro-disclaimer">
        <span>ⓘ</span>
        <p><strong>Важно:</strong> AstroGuide предназначен для саморефлексии и развлекательного изучения астрологии. Интерпретации не являются научным, медицинским, психологическим, юридическим или финансовым заключением.</p>
      </div>

      {demoOpen && (
        <div className="premium-modal" role="dialog" aria-modal="true" aria-labelledby="premium-demo-title">
          <div className="premium-modal__backdrop" onClick={() => setDemoOpen(false)} />
          <div className="premium-modal__card">
            <button className="premium-modal__close" type="button" onClick={() => setDemoOpen(false)} aria-label="Закрыть">×</button>
            <span className="eyebrow">ПРИМЕР PREMIUM</span>
            <h3 id="premium-demo-title">Чем полный разбор отличается от бесплатного</h3>
            <p>Бесплатно вы видите положение планеты. Premium связывает планету, знак, дом и аспекты и переводит их в единый вывод.</p>
            <div className="premium-demo-card"><span>❤️ ОТНОШЕНИЯ</span><strong>Бесплатно: Венера в {venus}</strong><p>Premium: как Венера сочетается с Марсом, 5-м и 7-м домами и значимыми аспектами, какие потребности повторяются и где могут возникать сложности.</p></div>
            <div className="premium-demo-card"><span>🧠 ЛИЧНОСТЬ</span><strong>Солнце + Луна + ASC</strong><p>Premium показывает не три отдельных значения, а их сочетание: что человек чувствует внутри, как хочет проявляться и какое впечатление может производить.</p></div>
            <button className="premium-buy premium-buy--wide" type="button" onClick={() => { setDemoOpen(false); setCheckoutOpen(true); }}>Получить полный разбор — 499 ₽</button>
            <small className="premium-note">Оплата защищена сервером. Premium не разблокируется до подтверждения платежа.</small>
          </div>
        </div>
      )}

      {reportOpen && (
        <div className="premium-modal" role="dialog" aria-modal="true" aria-labelledby="premium-report-title">
          <div className="premium-modal__backdrop" onClick={() => setReportOpen(false)} />
          <div className="premium-modal__card premium-report-modal premium-report-modal--full">
            <button className="premium-modal__close" type="button" onClick={() => setReportOpen(false)} aria-label="Закрыть">×</button>
            <PremiumReport report={premiumReport} chart={chart} />
            <button className="premium-buy premium-buy--wide premium-report-close" type="button" onClick={() => setReportOpen(false)}>Вернуться к карте</button>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div className="premium-modal" role="dialog" aria-modal="true" aria-labelledby="premium-checkout-title">
          <div className="premium-modal__backdrop" onClick={() => setCheckoutOpen(false)} />
          <div className="premium-modal__card premium-checkout">
            <button className="premium-modal__close" type="button" onClick={() => setCheckoutOpen(false)} aria-label="Закрыть">×</button>
            <span className="eyebrow">ASTROGUIDE PREMIUM</span>
            <h3 id="premium-checkout-title">Полный разбор вашей натальной карты</h3>
            <p>Один раз оплачиваете 499 ₽ — без подписки. После оплаты полный персональный анализ будет доступен в вашем аккаунте.</p>
            <div className="checkout-summary">
              <div><span>🧠</span><strong>Личность</strong></div><div><span>❤️</span><strong>Отношения</strong></div><div><span>💼</span><strong>Карьера</strong></div>
              <div><span>💰</span><strong>Деньги</strong></div><div><span>🧭</span><strong>Развитие</strong></div><div><span>✨</span><strong>Аспекты</strong></div>
            </div>
            <div className="checkout-total"><span>Итого</span><strong>499 ₽</strong></div>
            {paymentError && <div className="account-error">{paymentError}</div>}
            <button className="premium-buy premium-buy--wide" type="button" disabled={["creating", "redirecting"].includes(paymentState)} onClick={startPayment}>
              {paymentState === "creating" ? "Создаём платёж…" : paymentState === "redirecting" ? "Переходим к оплате…" : "Перейти к оплате"} <span>→</span>
            </button>
            <small className="premium-note">Вы будете перенаправлены на защищённую страницу оплаты. Premium активируется только после подтверждённого платежа.</small>
          </div>
        </div>
      )}
    </section>
  );
}

export default PremiumSection;
