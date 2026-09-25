function ProfileHeader({ date, time, city, zodiac, moon, ascendant }) {
  return (
    <header className="profile-header">
      <div className="profile-header__topline">
        <span className="eyebrow">ВАША КАРТА</span>
        <span className="profile-header__method">Placidus · Swiss Ephemeris</span>
      </div>
      <h1>Натальная карта</h1>
      <div className="profile-info">
        <span>{date}</span>
        <span>{time}</span>
        <span>{city}</span>
      </div>
      <div className="big-three">
        <div className="big-item">
          <span>☉ Солнце</span>
          <strong>{zodiac}</strong>
          <small>Личность и воля</small>
        </div>
        <div className="big-item">
          <span>☽ Луна</span>
          <strong>{moon}</strong>
          <small>Эмоции и внутренний мир</small>
        </div>
        <div className="big-item big-item--accent">
          <span>ASC Асцендент</span>
          <strong>{ascendant}</strong>
          <small>Проявление во внешнем мире</small>
        </div>
      </div>
    </header>
  );
}

export default ProfileHeader;
