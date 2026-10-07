function Requisites() {
  return (
    <section className="screen requisites-page">
      <div className="requisites-page__hero">
        <span className="eyebrow">ASTROGUIDE</span>
        <h1>Реквизиты</h1>
        <p>Информация об исполнителе сервиса AstroGuide.</p>
      </div>

      <div className="requisites-card">
        <div className="requisites-row">
          <span>Исполнитель</span>
          <strong>Буссе Юрий Сергеевич</strong>
        </div>
        <div className="requisites-row">
          <span>ИНН</span>
          <strong>781603803673</strong>
        </div>
        <div className="requisites-row">
          <span>ОГРНИП</span>
          <strong>324784700117053</strong>
        </div>
        <div className="requisites-row">
          <span>Контактная информация</span>
          <strong><a href="mailto:yurybusse@yandex.ru">yurybusse@yandex.ru</a></strong>
        </div>
      </div>

    </section>
  );
}

export default Requisites;
