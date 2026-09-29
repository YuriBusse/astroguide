function ReportSection({ section, index }) {
  return (
    <article className="report-viewer__section">
      <span className="eyebrow">{section.eyebrow || `РАЗДЕЛ ${index + 1}`}</span>
      <h3>{section.title}</h3>
      <p>{section.body}</p>
    </article>
  );
}

export default ReportSection;
