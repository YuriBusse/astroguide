function ReportSection({ section, index }) {
  return (
    <article className="report-viewer__section" id={`report-${section.id}`}>
      <span className="eyebrow">{section.eyebrow || `РАЗДЕЛ ${index + 1}`}</span>
      <h3>{section.title}</h3>
      {(section.paragraphs || [section.body]).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
      {section.example && <div className="report-viewer__example"><strong>Пример из жизни</strong><p>{section.example}</p></div>}
      {section.practice && <div className="report-viewer__practice"><strong>Как применить</strong><p>{section.practice}</p></div>}
      {section.questions?.length > 0 && (
        <div className="report-viewer__questions">
          <strong>Вопросы для себя</strong>
          <ul>{section.questions.map((question) => <li key={question}>{question}</li>)}</ul>
        </div>
      )}
    </article>
  );
}

export default ReportSection;
