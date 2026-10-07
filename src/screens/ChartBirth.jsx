import { useState } from "react";
import { getCityCoordinates, getPopularCities } from "../utils/cityCoordinates";
import AppButton from "../components/AppButton";

const STEPS = [
  { id: 1, title: "Дата рождения" },
  { id: 2, title: "Время рождения" },
  { id: 3, title: "Город рождения" }
];

const MAX_CITY_MATCHES = 12;

// Пошаговая мобильная форма: дата → время → город.
function ChartBirth({ onComplete, onBack }) {
  const cities = getPopularCities();

  const [step, setStep] = useState(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timeApproximate, setTimeApproximate] = useState(false);
  const [city, setCity] = useState("");
  const [cityQuery, setCityQuery] = useState("");
  const [error, setError] = useState("");

  const stepValid = step === 1 ? Boolean(date) : step === 2 ? Boolean(time) : Boolean(city);

  const normalizedQuery = cityQuery.trim().toLocaleLowerCase("ru");
  const cityMatches = normalizedQuery
    ? cities.filter((item) => item.name.toLocaleLowerCase("ru").includes(normalizedQuery)).slice(0, MAX_CITY_MATCHES)
    : cities.slice(0, MAX_CITY_MATCHES);

  const goNext = () => {
    if (!stepValid) {
      setError("Заполните поле, чтобы продолжить.");
      return;
    }
    setError("");
    setStep(Math.min(3, step + 1));
  };

  const goBack = () => {
    setError("");
    if (step > 1) {
      setStep(step - 1);
      return;
    }
    onBack();
  };

  const submit = () => {
    const coordinates = getCityCoordinates(city);
    if (!coordinates) {
      setError("Выберите город из списка.");
      return;
    }
    onComplete({
      date,
      time,
      timeApproximate,
      city,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      timezone: coordinates.timezone
    });
  };

  const selectCity = (name) => {
    setCity(name);
    setCityQuery(name);
    setError("");
  };

    const handleFieldKeyDown = (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();

    if (step < 3) {
      goNext();
      return;
    }

    if (city) {
      submit();
    } else {
      setError("Выберите город из списка.");
    }
  };

  return (
    <section className="screen screen--birth">
      <div className="screen-top">
        <button type="button" className="icon-button" onClick={goBack} aria-label="Назад">←</button>
        <div className="screen-top__title">
          <span className="eyebrow">ASTROGUIDE</span>
          <h1>Натальная карта</h1>
        </div>
      </div>

      <div className="birth-progress" role="tablist" aria-label="Шаги">
        {STEPS.map((item) => (
          <div
            key={item.id}
            className={`birth-progress__step${item.id === step ? " is-current" : ""}${item.id < step ? " is-done" : ""}`}
          >
            <span>{item.id}</span>
            <small>{item.title}</small>
          </div>
        ))}
      </div>

      <div className="birth-intro">
        <div className="birth-intro__mark" aria-hidden="true">🔮</div>
        <div>
          <strong>Что мы сейчас сделаем</strong>
          <p>Укажем данные рождения и соберём карту. Затем разберём главные символы простыми словами — без необходимости знать астрологию.</p>
        </div>
      </div>

      <div className="birth-card">
        {step === 1 && (
          <div className="birth-field">
            <label className="birth-field__label" htmlFor="ag-birth-date">Дата рождения</label>
            <input
              id="ag-birth-date"
              className="birth-field__input"
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setError("");
              }}
                onKeyDown={handleFieldKeyDown}
              placeholder="ДД.ММ.ГГГГ"
            />
            <small className="birth-field__hint">Укажите дату максимально точно — от неё зависит знак Солнца.</small>
          </div>
        )}

        {step === 2 && (
          <div className="birth-field">
            <label className="birth-field__label" htmlFor="ag-birth-time">Время рождения</label>
            <input
              id="ag-birth-time"
              className="birth-field__input"
              type="time"
              value={time}
              onChange={(event) => {
                setTime(event.target.value);
                setTimeApproximate(false);
                setError("");
              }}
                onKeyDown={handleFieldKeyDown}
            />
            <small className="birth-field__hint">
              Время влияет на Асцендент (первое впечатление) и дома (жизненные области).
            </small>
            <label className="birth-time-unknown">
              <input
                type="checkbox"
                checked={timeApproximate}
                onChange={(event) => {
                  const enabled = event.target.checked;
                  setTimeApproximate(enabled);
                  if (enabled) setTime("12:00");
                  setError("");
                }}
              />
              <span>
                <strong>Точное время неизвестно</strong>
                <small>Возьмём 12:00 как ориентир. Асцендент и дома будут приблизительными.</small>
              </span>
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="birth-field">
            <label className="birth-field__label" htmlFor="ag-birth-city">Город рождения</label>
            <input
              id="ag-birth-city"
              className="birth-field__input birth-field__input--city"
              type="text"
              value={cityQuery}
              onChange={(event) => {
                setCityQuery(event.target.value);
                if (city && event.target.value !== city) setCity("");
                setError("");
              }}
              onKeyDown={handleFieldKeyDown}
              placeholder="Начните вводить город…"
              autoComplete="off"
            />
            <div className="city-list" role="listbox" aria-label="Список городов">
              {cityMatches.map((item) => {
                const selected = item.name === city;
                return (
                  <button
                    key={item.name}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`city-option${selected ? " is-selected" : ""}`}
                    onClick={() => selectCity(item.name)}
                  >
                    <span className="city-option__name">{item.name}</span>
                    <span className="city-option__timezone">{item.timezone}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && <div className="form-error" role="alert">{error}</div>}

        <div className="birth-actions">
          <AppButton variant="ghost" onClick={goBack}>Назад</AppButton>
          {step < 3 ? (
            <AppButton variant="primary" onClick={goNext}>Продолжить</AppButton>
          ) : (
            <AppButton variant="primary" icon="🔮" onClick={submit} disabled={!stepValid}>
              Рассчитать карту
            </AppButton>
          )}
        </div>
      </div>
    </section>
  );
}

export default ChartBirth;
