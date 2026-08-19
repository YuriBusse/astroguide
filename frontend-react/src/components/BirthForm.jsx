import { useEffect, useMemo, useState } from "react";
import ResultCard from "./ResultCard";
import { getCityCoordinates, getPopularCities } from "../utils/cityCoordinates";

function BirthForm() {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [city, setCity] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const cities = useMemo(() => getPopularCities(), []);

  useEffect(() => {
    const handleOpenSavedChart = (event) => {
      const chart = event.detail;
      if (!chart?.date || !chart?.time || !chart?.city) return;

      setDate(chart.date);
      setTime(String(chart.time).slice(0, 5));
      setCity(chart.city);
      setResult({
        date: chart.date,
        time: String(chart.time).slice(0, 5),
        city: chart.city,
        latitude: Number(chart.latitude),
        longitude: Number(chart.longitude),
        timezone: chart.timezone
      });
      setError("");
      window.setTimeout(() => {
        document.getElementById("calculator")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    };

    window.addEventListener("astroguide:open-chart", handleOpenSavedChart);
    return () => window.removeEventListener("astroguide:open-chart", handleOpenSavedChart);
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!date || !time || !city) {
      setError("Заполните дату, время и город рождения.");
      return;
    }

    const coordinates = getCityCoordinates(city);

    if (!coordinates) {
      setError("Выберите город из списка.");
      return;
    }

    setResult({
      date,
      time,
      city,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      timezone: coordinates.timezone
    });
  };

  return (
    <section className="birth-section" id="calculator">
      <div className="birth-card">
        <div className="birth-card__intro">
          <span className="eyebrow">ВАШИ ДАННЫЕ</span>
          <h2>Создайте натальную карту</h2>
          <p>Укажите данные максимально точно — особенно время рождения. Оно влияет на Асцендент и дома.</p>
        </div>

        <form className="birth-form" onSubmit={handleSubmit}>
          <label>
            <span>Дата рождения</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <label>
            <span>Время рождения</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </label>

          <label className="birth-form__city">
            <span>Город рождения</span>
            <select value={city} onChange={(e) => setCity(e.target.value)} required>
              <option value="">Выберите город</option>
              {cities.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="birth-form__submit" type="submit">
            Рассчитать натальную карту <span>→</span>
          </button>
        </form>
      </div>

      {result && <ResultCard result={result} />}
    </section>
  );
}

export default BirthForm;
