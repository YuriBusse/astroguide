function ReportsList({ reports, onSelect, onOpenFullReport }) {
  return (
    <section className="reports-list" aria-labelledby="reports-list-title">
      <div className="reports-list__heading">
        <span className="eyebrow">ASTROGUIDE PREMIUM</span>
        <h2 id="reports-list-title">Доступные отчёты</h2>
        <p>Это учебные демонстрации структуры и стиля будущих персональных отчётов. Выберите тему для чтения.</p>
      </div>

      <div className="reports-list__cards">
        {reports.map((report) => (
          <article className={`report-card report-card--${report.status}`} key={report.id}>
            <span className="report-card__icon" aria-hidden="true">{report.icon}</span>
            <div className="report-card__body">
              <div className="report-card__top"><span className="report-card__status">{report.statusLabel}</span></div>
              <h3>{report.title}</h3>
              <p>{report.description}</p>
            </div>
            <button type="button" className="report-card__action" onClick={() => onSelect(report.id)}>Открыть</button>
          </article>
        ))}
      </div>

      <button type="button" className="report-full-link" onClick={onOpenFullReport}>Открыть полный персональный разбор</button>
    </section>
  );
}

export default ReportsList;
