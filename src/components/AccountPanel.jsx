import { useEffect, useState } from "react";

import {

  cloudConfigured,

  deleteCloudChart,

  getCloudCharts,

  getSession,

  signIn,

  signOut,

  signUp,

  requestPasswordReset

} from "../utils/cloud";



const STORAGE_KEY = "astroguide_saved_charts";



function readCharts() {

  try {

    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

  } catch {

    return [];

  }

}



function normalizeCloudChart(chart) {

  return {

    id: chart.id,

    city: chart.city,

    date: chart.birth_date,

    time: chart.birth_time,

    timezone: chart.timezone,

    latitude: chart.latitude,

    longitude: chart.longitude,

    premium: Boolean(chart.premium)

  };

}



function AccountPanel({ open, onClose, onAuthChange = null }) {

  const [mode, setMode] = useState("login");

  const [email, setEmail] = useState("");

  const [name, setName] = useState("");

  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [charts, setCharts] = useState([]);

  const [premium, setPremium] = useState(false);

  const [session, setSession] = useState(() => getSession());

  const [loading, setLoading] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [resetMode, setResetMode] = useState(false);



  const handleFieldKeyDown = (event) => {

    if (event.key !== "Enter") return;



    const form = event.currentTarget.closest("form");

    if (!form) return;



    const fields = [

      ...form.querySelectorAll(

        'input:not([disabled]), button[type="submit"]'

      ),

    ];



    const currentIndex = fields.indexOf(event.currentTarget);



    if (currentIndex === -1) return;



    event.preventDefault();



    const nextField = fields[currentIndex + 1];



    if (nextField && nextField.type !== "submit") {

      nextField.focus();

    } else {

      form.requestSubmit();

    }

  };



  const refresh = async () => {

    setPremium(false);

    if (cloudConfigured && getSession()) {

      try {

        const cloudCharts = await getCloudCharts();

        setCharts((cloudCharts || []).map(normalizeCloudChart));

        setPremium((cloudCharts || []).some((chart) => Boolean(chart.premium)));

        return;

      } catch (err) {

        console.error(err);

        setError("Не удалось загрузить карты с сервера. Показываем локальные данные.");

      }

    }

    setCharts(readCharts());

  };



  useEffect(() => {

    if (!open) return;

    setSession(getSession());

    setMessage("");

    setError("");

    refresh();

  }, [open]);



  useEffect(() => {

    const sync = () => {

      setSession(getSession());

      refresh();

    };

    window.addEventListener("astroguide:chart-saved", sync);

    window.addEventListener("astroguide:premium", sync);

    window.addEventListener("astroguide:auth", sync);

    window.addEventListener("storage", sync);

    return () => {

      window.removeEventListener("astroguide:chart-saved", sync);

      window.removeEventListener("astroguide:premium", sync);

      window.removeEventListener("astroguide:auth", sync);

      window.removeEventListener("storage", sync);

    };

  }, []);



  if (!open) return null;



  const submit = async (event) => {
    event.preventDefault();
    document.activeElement?.blur();
    setError("");
    setMessage("");

    if (!email || !password || (mode === "register" && !name)) {
      setError("Заполните обязательные поля.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "register") {
        const result = await signUp({ email, password, name });

        if (result.localOnly) {
          setSession(getSession());
          setMessage(
            "Готово. Сейчас работает локальный режим. После настройки Supabase аккаунт будет синхронизироваться между устройствами."
          );
          await refresh();
          onAuthChange?.();
          return;
        }

        setPassword("");
        setMessage("");
        setRegistrationComplete(true);
        return;
      }

      await signIn({ email, password });
      setSession(getSession());
      setMessage("Вы вошли в аккаунт.");
      await refresh();
      onAuthChange?.();
    } catch (err) {
      setError(err.message || "Не удалось выполнить операцию.");
    } finally {
      setLoading(false);
    }
  };

  const submitPasswordReset = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email) {
      setError("Введите email.");
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email);
      setMessage("📨 Письмо отправлено. Проверьте почту и перейдите по ссылке, чтобы создать новый пароль.");
    } catch (err) {
      setError(err.message || "Не удалось отправить письмо для восстановления пароля.");
    } finally {
      setLoading(false);
    }
  };

  const removeChart = async (id) => {

    setError("");



    if (cloudConfigured && session?.access_token) {

      try {

        await deleteCloudChart(id);

        setCharts((current) => current.filter((chart) => chart.id !== id));

        return;

      } catch (err) {

        setError(err.message || "Не удалось удалить карту.");

        return;

      }

    }



    const next = charts.filter((chart) => chart.id !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    setCharts(next);

  };



  const logout = () => {

    signOut();

    setSession(null);

    setCharts([]);

    setPremium(false);

    setMessage("Вы вышли из аккаунта.");

    window.dispatchEvent(new Event("astroguide:auth"));

    onAuthChange?.();

  };



  return (

    <div

      className="account-modal"

      role="dialog"

      aria-modal="true"

      aria-labelledby="account-title"

    >

      <div className="account-modal__backdrop" onClick={onClose} />



      <div className="account-modal__card">
        <style>{`
          .account-modal__card .account-auth-stack { display:flex; flex-direction:column; gap:10px; }
          .account-modal__card .account-confirm-email { margin-top:22px; padding:20px; border:1px solid rgba(199,166,255,.12); border-radius:18px; background:rgba(255,255,255,.035); }
          .account-modal__card .account-confirm-email__icon { margin-bottom:10px; font-size:24px; }
          .account-modal__card .account-confirm-email h3 { margin:8px 0 8px; font-size:21px; letter-spacing:-.03em; }
          .account-modal__card .account-confirm-email p { margin:8px 0; color:rgba(255,255,255,.62); font-size:11px; line-height:1.65; }
          .account-modal__card .account-confirm-email__address { display:block; margin:8px 0 12px; color:#fff; font-size:12px; overflow-wrap:anywhere; }
          .account-modal__card .account-confirm-email__hint { color:rgba(255,255,255,.4); font-size:10px; }
          .account-modal__card .account-confirm-email__back,
          .account-modal__card .account-auth-secondary {
            width:100%; min-height:38px; margin-top:9px; padding:8px 12px;
            border:1px solid rgba(255,255,255,.1); border-radius:10px;
            color:rgba(255,255,255,.72); background:rgba(255,255,255,.045);
            font-size:10px; font-weight:700; cursor:pointer;
          }
          .account-modal__card .account-confirm-email__back:hover,
          .account-modal__card .account-auth-secondary:hover {
            border-color:rgba(199,166,255,.3); background:rgba(199,166,255,.07); color:#fff;
          }
          .account-modal__card .account-confirm-email__submit {
            width: 100%;
          }
          .account-modal__card .account-forgot-button {
            width:100%; min-height:36px; margin-top:-2px; padding:7px 12px;
            border:1px solid rgba(199,166,255,.14); border-radius:10px;
            color:rgba(255,255,255,.62); background:rgba(199,166,255,.055);
            font-size:10px; font-weight:700; cursor:pointer;
          }
          .account-modal__card .account-forgot-button:hover {
            color:#fff; border-color:rgba(199,166,255,.32); background:rgba(199,166,255,.09);
          }
          @media (max-width:700px) {
            .account-modal__card .account-confirm-email { padding:16px; }
          }
        `}</style>

        <button

          className="account-modal__close"

          type="button"

          onClick={onClose}

          aria-label="Закрыть"

        >

          ×

        </button>



        <div className="account-modal__top">

          <div>

            <span className="eyebrow">ASTROGUIDE ACCOUNT</span>

            <h2 id="account-title">Мои карты</h2>

            <p>

              {session

                ? "Ваши карты и статус Premium."

                : "Сохраняйте расчёты и возвращайтесь к ним позже."}

            </p>

          </div>



          <span

            className={`account-status ${

              premium ? "account-status--premium" : ""

            }`}

          >

            {premium

              ? "✦ Premium"

              : session

                ? "Бесплатный аккаунт"

                : "Гость"}

          </span>

        </div>



        {session ? (
          <>
            <div className="account-signed">
              <div>
                <span className="eyebrow">ВЫ ВОШЛИ КАК</span>
                <strong>{session.user?.email || email}</strong>
              </div>
              <button type="button" className="account-logout" onClick={logout}>Выйти</button>
            </div>
          </>
        ) : registrationComplete ? (
          <div className="account-confirm-email">
            <div className="account-confirm-email__icon">📩</div>
            <span className="eyebrow">ПОЧТИ ГОТОВО</span>
            <h3>Проверьте почту</h3>
            <p>Мы отправили письмо на:</p>
            <strong className="account-confirm-email__address">{email}</strong>
            <p>Откройте письмо и нажмите <strong>«Confirm your email address»</strong>, чтобы подтвердить аккаунт.</p>
            <p className="account-confirm-email__hint">Если письма нет — проверьте папку «Спам».</p>
            <button
  type="button"
  className="account-submit account-confirm-email__submit"
  onClick={() => {
    setRegistrationComplete(false);
    setMode("login");
    setError("");
    setMessage("");
  }}
>
  Я подтвердил почту — войти →
</button>
            <button type="button" className="account-confirm-email__back" onClick={() => { setRegistrationComplete(false); setMode("register"); setError(""); setMessage(""); }}>
              Вернуться к регистрации
            </button>
          </div>
        ) : resetMode ? (
          <div className="account-confirm-email">
            <div className="account-confirm-email__icon">🔐</div>
            <span className="eyebrow">ВОССТАНОВЛЕНИЕ ДОСТУПА</span>
            <h3>Забыли пароль?</h3>
            <p>Введите email, с которым зарегистрирован аккаунт AstroGuide.</p>
            <form className="account-form" onSubmit={submitPasswordReset}>
              <label>
                <span>Email</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleFieldKeyDown} placeholder="you@example.com" autoComplete="email" />
              </label>
              <button className="account-submit" type="submit" disabled={loading}>
                {loading ? "Отправляем…" : "Отправить письмо"} <span>→</span>
              </button>
            </form>
            <button type="button" className="account-confirm-email__back" onClick={() => { setResetMode(false); setMessage(""); setError(""); }}>
              ← Вернуться ко входу
            </button>
          </div>
        ) : (
          <>
            <div className="account-tabs">
              <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => { setMode("login"); setResetMode(false); setMessage(""); setError(""); }}>Войти</button>
              <button type="button" className={mode === "register" ? "is-active" : ""} onClick={() => { setMode("register"); setResetMode(false); setMessage(""); setError(""); }}>Регистрация</button>
            </div>
            <form className="account-form" onSubmit={submit}>
              {mode === "register" && (
                <label><span>Имя</span><input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={handleFieldKeyDown} placeholder="Как к вам обращаться" /></label>
              )}
              <label><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleFieldKeyDown} placeholder="you@example.com" /></label>
              <label><span>Пароль</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleFieldKeyDown} placeholder="••••••••" minLength={6} autoComplete="current-password" /></label>
              {mode === "login" && (
                <button
                  type="button"
                  className="account-confirm-email__back"
                  onClick={() => { setResetMode(true); setMessage(""); setError(""); }}
                  style={{ alignSelf: "flex-start", marginTop: "-4px" }}
                >
                  Забыли пароль?
                </button>
              )}
              <button className="account-submit" type="submit" disabled={loading}>{loading ? "Подождите…" : mode === "login" ? "Войти" : "Создать аккаунт"} <span>→</span></button>
            </form>
          </>
        )}

        {message && (

  <div className="account-message" style={{ whiteSpace: "pre-line" }}>

    {message}

  </div>

)}

        {error && <div className="account-error">{error}</div>}



        <div className="saved-charts">

          <div className="saved-charts__heading">

            <div>

              <span className="eyebrow">СОХРАНЁННЫЕ РАСЧЁТЫ</span>

              <h3>Мои натальные карты</h3>

            </div>

            <span>{charts.length}</span>

          </div>



          {charts.length ? (

            <div className="saved-chart-list">

              {charts.map((chart) => (

                <article className="saved-chart" key={chart.id}>

                  <div className="saved-chart__icon">✦</div>



                  <div className="saved-chart__body">

                    <strong>{chart.city}</strong>

                    <span>

                      {chart.date} · {chart.time}

                    </span>

                  </div>



                  <div className="saved-chart__actions">

                    <button

                      type="button"

                      className="saved-chart__open"

                      onClick={() => {

                        window.dispatchEvent(

                          new CustomEvent("astroguide:open-chart", {

                            detail: chart

                          })

                        );

                        onClose();

                      }}

                    >

                      Открыть

                    </button>



                    <span className="saved-chart__badge">

                      {chart.premium ? "Premium" : "Free"}

                    </span>



                    <button

                      type="button"

                      className="saved-chart__delete"

                      onClick={() => removeChart(chart.id)}

                      aria-label="Удалить карту"

                    >

                      ×

                    </button>

                  </div>

                </article>

              ))}

            </div>

          ) : (

            <div className="saved-charts__empty">

              Сохранённых карт пока нет. После расчёта нажмите «Сохранить карту».

            </div>

          )}

        </div>

      </div>

    </div>

  );

}



export default AccountPanel;