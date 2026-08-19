function PlanetCard({ icon, title, sign, description }) {

  return (
    <div className="planet-card">

      <h3>
        {icon} {title}
      </h3>

      <h2>
        {sign}
      </h2>

      <p>
        {description}
      </p>

    </div>
  );
}

export default PlanetCard;