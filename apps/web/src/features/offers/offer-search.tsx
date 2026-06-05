import { OfferCard } from "./offer-card";
import type { OfferListItem } from "./offer-view";

type OfferSearchProps = {
  offers: OfferListItem[];
};

/**
 * Barre d'outils + liste d'offres. Les filtres sont présentationnels pour
 * l'instant; ils seront branchés sur des query params une fois l'ETL alimenté.
 */
export function OfferSearch({ offers }: OfferSearchProps) {
  const countries = Array.from(
    new Set(offers.map((offer) => offer.country).filter((c): c is string => Boolean(c)))
  ).sort();

  return (
    <section aria-label="Recherche d'offres">
      <form className="toolbar" role="search">
        <input
          className="field"
          type="search"
          name="q"
          aria-label="Rechercher une offre"
          placeholder="Rechercher une offre, une entreprise, un pays"
        />
        <select className="field" name="country" aria-label="Filtrer par pays" defaultValue="">
          <option value="">Tous les pays</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
        <select
          className="field"
          name="sort"
          aria-label="Trier les offres"
          defaultValue="published_desc"
        >
          <option value="published_desc">Plus récentes</option>
          <option value="published_asc">Plus anciennes</option>
        </select>
      </form>

      <div className="section-head">
        <p className="count">
          <strong>{offers.length}</strong> offre{offers.length > 1 ? "s" : ""} V.I.E
        </p>
      </div>

      {offers.length === 0 ? (
        <div className="empty-state">
          Aucune offre disponible pour le moment. Lance le scraper Business France
          (<code>pnpm scrape:business-france</code>) pour alimenter la base.
        </div>
      ) : (
        <div className="offer-list">
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      )}
    </section>
  );
}
