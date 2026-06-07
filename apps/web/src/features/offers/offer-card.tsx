import { toggleFavoriteJob } from "./actions";
import {
  excerpt,
  formatDate,
  formatDuration,
  formatLocation,
  type OfferListItem
} from "./offer-view";
import { formatOfferStatus } from "./status";

export function OfferCard({ offer, returnTo }: { offer: OfferListItem; returnTo: string }) {
  const location = formatLocation(offer.city, offer.country);
  const duration = formatDuration(offer.durationMonths);
  const date = formatDate(offer.publishedAt);
  const favorite = offer.userState?.favorite ?? false;
  const status = offer.userState?.applicationStatus ?? null;

  return (
    <article className="offer-card">
      <div className="offer-head">
        <div>
          <h2 className="offer-title">
            <a href={`/offres/${offer.id}`}>{offer.title}</a>
          </h2>
          {offer.companyName ? <p className="offer-company">{offer.companyName}</p> : null}
        </div>
        <form action={toggleFavoriteJob}>
          <input type="hidden" name="jobOfferId" value={offer.id} />
          <input type="hidden" name="intent" value={favorite ? "remove" : "save"} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button
            className="icon-button"
            type="submit"
            aria-pressed={favorite}
            aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            {favorite ? "★" : "☆"}
          </button>
        </form>
      </div>

      {offer.description ? <p className="offer-excerpt">{excerpt(offer.description)}</p> : null}

      <div className="offer-actions">
        <span className={status ? "tag tag-accent" : "tag"}>{formatOfferStatus(status)}</span>
        <a className="btn btn-ghost btn-compact" href={`/offres/${offer.id}`}>
          Préparer ma candidature
        </a>
      </div>

      <div className="offer-foot">
        <div className="tag-row">
          {offer.contractType ? <span className="tag tag-accent">{offer.contractType}</span> : null}
          {location ? <span className="tag">{location}</span> : null}
          {duration ? <span className="tag">{duration}</span> : null}
        </div>
        {date ? <span className="offer-date">{date}</span> : null}
      </div>
    </article>
  );
}
