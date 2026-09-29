import ReportSection from "./ReportSection";

function ReportViewer({ report, chartData = null, onBack }) {
  return (
    <section className="report-viewer" aria-labelledby="report-viewer-title">
      <button type="button" className="report-viewer__back" onClick={onBack}>← Все отчёты</button>
      <div className="report-viewer__cover">
        <span className="report-viewer__icon" aria-hidden="true">{report.icon}</span>
        <span className="eyebrow">ASTROGUIDE PREMIUM</span>
        <h2 id="report-viewer-title">{report.title}</h2>
        <p>{report.description}</p>
        <span className="report-viewer__demo">Демонстрационный просмотр</span>
      </div>

      <div className="report-viewer__notice">
        Это учебный demo-пример: текст объясняет подход и структуру, но не является персональной интерпретацией вашей карты. Астрологические формулировки ниже — интерпретационная традиция, а не научный диагноз или точное предсказание.
      </div>

      <nav className="report-viewer__toc" aria-label="Оглавление отчёта">
        <span className="eyebrow">ОГЛАВЛЕНИЕ</span>
        <div>{report.sections.map((section, index) => <a key={section.id} href={`#report-${section.id}`}>{String(index + 1).padStart(2, "0")} · {section.title}</a>)}</div>
      </nav>

      <div className="report-viewer__sections">
        {report.sections.map((section, index) => <ReportSection key={section.id} section={section} index={index} />)}
      </div>

      <button type="button" className="report-viewer__top" onClick={() => document.querySelector(".premium-reports-modal")?.scrollTo({ top: 0, behavior: "smooth" })}>↑ В начало</button>

      <div className="report-viewer__contract">
        <span className="eyebrow">КОНТРАКТ ДАННЫХ</span>
        <p>Viewer принимает chartData с планетами, домами, аспектами, ASC, MC и данными рождения. Сейчас источник передан как {chartData ? "доступный расчёт" : "подготовленный интерфейс"}.</p>
      </div>
    </section>
  );
}

export default ReportViewer;
