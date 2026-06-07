import { getJobOfferById, getUserOfferState } from "@agentic-cv/db";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { toggleFavoriteJob, updateJobApplicationStatus } from "@/features/offers/actions";
import { formatDate, formatDuration, formatLocation } from "@/features/offers/offer-view";
import {
  formatOfferStatus,
  OFFER_STATUS_LABELS,
  TRACKED_OFFER_STATUSES
} from "@/features/offers/status";

export const dynamic = "force-dynamic";

type OfferDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const { id } = await params;
  const [offer, user] = await Promise.all([getJobOfferById(id), getCurrentUser()]);

  if (!offer) {
    notFound();
  }

  const userState = user ? await getUserOfferState(user.id, offer.id) : null;
  const favorite = userState?.favorite ?? false;
  const applicationStatus = userState?.applicationStatus ?? null;

  const location = formatLocation(offer.city, offer.country);
  const duration = formatDuration(offer.durationMonths);
  const published = formatDate(offer.publishedAt);

  return (
    <main className="page-shell">
      <SiteHeader active="offres" />

      <a className="back-link" href="/offres">
        ← Toutes les offres
      </a>

      <header className="detail-header">
        <span className="eyebrow">{offer.contractType ?? "V.I.E"}</span>
        <h1>{offer.title}</h1>
        <div className="tag-row">
          {offer.companyName ? <span className="tag tag-accent">{offer.companyName}</span> : null}
          {location ? <span className="tag">{location}</span> : null}
          {duration ? <span className="tag">{duration}</span> : null}
        </div>
      </header>

      <div className="detail-grid">
        <article className="prose">
          <section>
            <h2>Description</h2>
            <p>{offer.description}</p>
          </section>
          {offer.requirements ? (
            <section>
              <h2>Profil recherché</h2>
              <p>{offer.requirements}</p>
            </section>
          ) : null}
          {offer.companyDescription ? (
            <section>
              <div className="section-heading-row">
                <h2>À propos de l'entreprise</h2>
                {offer.companyDescriptionGenerated ? (
                  <span className="tag tag-accent">Résumé IA</span>
                ) : null}
              </div>
              <p>{offer.companyDescription}</p>
              {offer.companyDescriptionGenerated ? (
                <p className="note-ai">
                  Présentation générée automatiquement à partir du nom de l'entreprise, à titre
                  indicatif.
                </p>
              ) : null}
            </section>
          ) : null}
        </article>

        <aside className="detail-aside">
          <div className="offer-state-panel">
            <div>
              <span className="eyebrow">Suivi</span>
              <p className="offer-state-title">{formatOfferStatus(applicationStatus)}</p>
            </div>

            <form action={toggleFavoriteJob}>
              <input type="hidden" name="jobOfferId" value={offer.id} />
              <input type="hidden" name="intent" value={favorite ? "remove" : "save"} />
              <input type="hidden" name="returnTo" value={`/offres/${offer.id}`} />
              <button className="btn btn-ghost btn-full" type="submit" aria-pressed={favorite}>
                <span aria-hidden="true">{favorite ? "★" : "☆"}</span>
                {favorite ? "Dans mes favoris" : "Ajouter aux favoris"}
              </button>
            </form>

            <form className="status-form" action={updateJobApplicationStatus}>
              <input type="hidden" name="jobOfferId" value={offer.id} />
              <input type="hidden" name="returnTo" value={`/offres/${offer.id}`} />
              <label className="form-field">
                <span>Statut</span>
                <select
                  className="field"
                  name="status"
                  defaultValue={applicationStatus ?? "unread"}
                >
                  {TRACKED_OFFER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {OFFER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-ghost btn-full" type="submit">
                Mettre à jour
              </button>
            </form>
          </div>

          <dl className="facts">
            {offer.companyName ? (
              <div>
                <dt>Entreprise</dt>
                <dd>{offer.companyName}</dd>
              </div>
            ) : null}
            {location ? (
              <div>
                <dt>Localisation</dt>
                <dd>{location}</dd>
              </div>
            ) : null}
            {offer.contractType ? (
              <div>
                <dt>Contrat</dt>
                <dd>{offer.contractType}</dd>
              </div>
            ) : null}
            {duration ? (
              <div>
                <dt>Durée</dt>
                <dd>{duration}</dd>
              </div>
            ) : null}
            {offer.salary ? (
              <div>
                <dt>Rémunération</dt>
                <dd>{offer.salary}</dd>
              </div>
            ) : null}
            {published ? (
              <div>
                <dt>Publiée le</dt>
                <dd>{published}</dd>
              </div>
            ) : null}
            <div>
              <dt>Source</dt>
              <dd>{offer.source}</dd>
            </div>
          </dl>

          <a className="btn btn-primary" href={offer.sourceUrl} target="_blank" rel="noreferrer">
            Voir l'offre originale ↗
          </a>
          <button className="btn btn-ghost" type="button" disabled>
            Préparer ma candidature
          </button>
        </aside>
      </div>
    </main>
  );
}
