const placeholderOffers = [
  {
    id: "placeholder-1",
    title: "Scraper Business France a connecter",
    companyName: "Agentic CV",
    country: "Base locale",
    city: "ETL",
    sourceUrl: "#"
  }
];

export function OfferSearch() {
  return (
    <section aria-label="Recherche d'offres">
      <form className="toolbar">
        <input className="field" type="search" placeholder="Rechercher une offre, une entreprise, un pays" />
        <select className="field" defaultValue="">
          <option value="">Tous les pays</option>
        </select>
        <select className="field" defaultValue="published_desc">
          <option value="published_desc">Plus recentes</option>
          <option value="published_asc">Plus anciennes</option>
        </select>
      </form>

      <div className="offer-list">
        {placeholderOffers.map((offer) => (
          <article className="offer-card" key={offer.id}>
            <h2>{offer.title}</h2>
            <div className="offer-meta">
              <span>{offer.companyName}</span>
              <span>{offer.country}</span>
              <span>{offer.city}</span>
            </div>
            <a href={offer.sourceUrl}>Voir l'offre source</a>
          </article>
        ))}
      </div>
    </section>
  );
}

