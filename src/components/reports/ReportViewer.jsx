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
        Текст ниже показывает структуру будущего отчёта. Персональные формулировки появятся после подключения расчётных данных карты.
      </div>

      <div className="report-viewer__sections">
        {report.sections.map((section, index) => <ReportSection key={section.id} section={section} index={index} />)}
      </div>

      <div className="report-viewer__contract">
        <span className="eyebrow">КОНТРАКТ ДАННЫХ</span>
        <p>Viewer принимает chartData с планетами, домами, аспектами, ASC, MC и данными рождения. Сейчас источник передан как {chartData ? "доступный расчёт" : "подготовленный интерфейс"}.</p>
      </div>
    </section>
  );
}

export default ReportViewer;
