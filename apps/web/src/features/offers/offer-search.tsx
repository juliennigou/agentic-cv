import { regionCountryCodes, type RegionKey } from "@agentic-cv/shared";

import type { OfferSearchCriteria } from "./search";
import { OfferCard } from "./offer-card";
import type { OfferListItem } from "./offer-view";

type OfferSearchProps = {
  offers: OfferListItem[];
  criteria: OfferSearchCriteria;
  regions: { key: RegionKey; label: string }[];
  countries: { code: string; name: string }[];
};

/**
 * Barre de recherche + liste d'offres. Formulaire GET (100 % serveur, sans JS) :
 * la soumission place les filtres en query params et la page se re-rend.
 * Le select pays est restreint à la région sélectionnée le cas échéant.
 */
export function OfferSearch({ offers, criteria, regions, countries }: OfferSearchProps) {
  const regionCodes = criteria.region ? new Set(regionCountryCodes(criteria.region)) : null;
  const countryOptions = regionCodes ? countries.filter((c) => regionCodes.has(c.code)) : countries;

  return (
    <section aria-label="Recherche d'offres">
      <form className="toolbar" role="search" method="get" action="/offres">
        <input
          className="field"
          type="search"
          name="q"
          aria-label="Rechercher une offre"
          placeholder="Métier, compétence, mission (ex. ingénieur IA)"
          defaultValue={criteria.query}
        />
        <select
          className="field"
          name="region"
          aria-label="Filtrer par région"
          defaultValue={criteria.region ?? ""}
        >
          <option value="">Toutes les régions</option>
          {regions.map((region) => (
            <option key={region.key} value={region.key}>
              {region.label}
            </option>
          ))}
        </select>
        <select
          className="field"
          name="country"
          aria-label="Filtrer par pays"
          defaultValue={criteria.country ?? ""}
        >
          <option value="">
            {criteria.region ? "Tous les pays de la région" : "Tous les pays"}
          </option>
          {countryOptions.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit">
          Rechercher
        </button>
      </form>

      <div className="section-head">
        <p className="count">
          <strong>{offers.length}</strong> offre{offers.length > 1 ? "s" : ""} active
          {offers.length > 1 ? "s" : ""}
        </p>
      </div>

      {offers.length === 0 ? (
        <div className="empty-state">
          Aucune offre ne correspond à ta recherche. Élargis les filtres ou modifie les mots-clés.
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
