import {
  excerpt,
  formatDate,
  formatDuration,
  formatLocation,
  type OfferListItem
} from "./offer-view";

export function OfferCard({ offer }: { offer: OfferListItem }) {
  const location = formatLocation(offer.city, offer.country);
  const duration = formatDuration(offer.durationMonths);
  const date = formatDate(offer.publishedAt);

  return (
    <a className="offer-card" href={`/offres/${offer.id}`}>
      <div className="offer-head">
        <div>
          <h2 className="offer-title">{offer.title}</h2>
          {offer.companyName ? <p className="offer-company">{offer.companyName}</p> : null}
        </div>
        <span className="offer-arrow" aria-hidden="true">
          →
        </span>
      </div>

      {offer.description ? <p className="offer-excerpt">{excerpt(offer.description)}</p> : null}

      <div className="offer-foot">
        <div className="tag-row">
          {offer.contractType ? <span className="tag tag-accent">{offer.contractType}</span> : null}
          {location ? <span className="tag">{location}</span> : null}
          {duration ? <span className="tag">{duration}</span> : null}
        </div>
        {date ? <span className="offer-date">{date}</span> : null}
      </div>
    </a>
  );
}
