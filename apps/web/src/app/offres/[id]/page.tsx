import { getJobOfferById } from "@agentic-cv/db";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { formatDate, formatDuration, formatLocation } from "@/features/offers/offer-view";

export const dynamic = "force-dynamic";

type OfferDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const { id } = await params;
  const offer = await getJobOfferById(id);

  if (!offer) {
    notFound();
  }

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
              <h2>À propos de l'entreprise</h2>
              <p>{offer.companyDescription}</p>
            </section>
          ) : null}
        </article>

        <aside className="detail-aside">
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
        </aside>
      </div>
    </main>
  );
}
