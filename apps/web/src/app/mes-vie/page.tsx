import { listUserFavoriteJobOffers, type TrackedJobOffer } from "@agentic-cv/db";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { toggleFavoriteJob, updateJobApplicationStatus } from "@/features/offers/actions";
import {
  formatDate,
  formatDuration,
  formatLocation,
  type OfferApplicationStatus
} from "@/features/offers/offer-view";
import {
  formatOfferStatus,
  groupForStatus,
  OFFER_STATUS_GROUPS,
  OFFER_STATUS_LABELS,
  TRACKED_OFFER_STATUSES
} from "@/features/offers/status";

export const dynamic = "force-dynamic";

type MesViePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ViewMode = "kanban" | "table";

function resolveView(raw: string | string[] | undefined): ViewMode {
  return raw === "table" ? "table" : "kanban";
}

function statusOf(tracked: TrackedJobOffer): OfferApplicationStatus {
  return (tracked.applicationStatus as OfferApplicationStatus | null) ?? "unread";
}

export default async function MesViePage({ searchParams }: MesViePageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion?next=/mes-vie");
  }

  const params = await searchParams;
  const view = resolveView(params.vue);
  const returnTo = `/mes-vie?vue=${view}`;

  const trackedOffers = await listUserFavoriteJobOffers(user.id);

  return (
    <main className="page-shell">
      <SiteHeader active="mes-vie" />

      <header className="account-head">
        <span className="eyebrow">Suivi des candidatures</span>
        <h1>Mes VIE</h1>
        <span className="count">
          <strong>{trackedOffers.length}</strong> offre{trackedOffers.length > 1 ? "s" : ""} suivie
          {trackedOffers.length > 1 ? "s" : ""}
        </span>
      </header>

      <div
        className="view-toggle"
        role="tablist"
        aria-label="Mode d'affichage"
        style={{ marginBottom: "var(--space-5)" }}
      >
        <a
          className="view-toggle-option"
          href="/mes-vie?vue=kanban"
          role="tab"
          aria-current={view === "kanban" ? "page" : undefined}
        >
          Kanban
        </a>
        <a
          className="view-toggle-option"
          href="/mes-vie?vue=table"
          role="tab"
          aria-current={view === "table" ? "page" : undefined}
        >
          Tableau
        </a>
      </div>

      {trackedOffers.length === 0 ? (
        <div className="empty-state">
          Aucune offre suivie pour l'instant. Ajoute une offre à tes favoris depuis{" "}
          <a href="/offres">la liste des offres</a> pour la retrouver ici.
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard trackedOffers={trackedOffers} returnTo={returnTo} />
      ) : (
        <OffersTable trackedOffers={trackedOffers} returnTo={returnTo} />
      )}
    </main>
  );
}

function KanbanBoard({
  trackedOffers,
  returnTo
}: {
  trackedOffers: TrackedJobOffer[];
  returnTo: string;
}) {
  const columns = OFFER_STATUS_GROUPS.map((group) => ({
    ...group,
    offers: trackedOffers.filter((tracked) => groupForStatus(statusOf(tracked)) === group.key)
  }));

  return (
    <div className="vie-board">
      {columns.map((column) => (
        <section className="vie-column" key={column.key} aria-label={column.label}>
          <header className="vie-column-head">
            <span className="vie-column-title">{column.label}</span>
            <span className="vie-column-count">{column.offers.length}</span>
          </header>

          <div className="vie-column-body">
            {column.offers.length === 0 ? (
              <p className="vie-column-empty">Aucune offre</p>
            ) : (
              column.offers.map((tracked) => (
                <KanbanCard key={tracked.offer.id} tracked={tracked} returnTo={returnTo} />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function KanbanCard({ tracked, returnTo }: { tracked: TrackedJobOffer; returnTo: string }) {
  const offer = tracked.offer;
  const status = statusOf(tracked);
  const location = formatLocation(offer.city, offer.country);
  const duration = formatDuration(offer.durationMonths);

  return (
    <article className="vie-card">
      <div className="vie-card-head">
        <h2 className="vie-card-title">
          <a href={`/offres/${offer.id}`}>{offer.title}</a>
        </h2>
        <form action={toggleFavoriteJob}>
          <input type="hidden" name="jobOfferId" value={offer.id} />
          <input type="hidden" name="intent" value="remove" />
          <input type="hidden" name="returnTo" value={returnTo} />
          <button
            className="icon-button icon-button-sm"
            type="submit"
            aria-pressed="true"
            aria-label="Retirer des favoris"
            title="Retirer des favoris"
          >
            ★
          </button>
        </form>
      </div>

      {offer.companyName ? <p className="vie-card-company">{offer.companyName}</p> : null}

      <div className="tag-row">
        <span className="tag tag-accent">{formatOfferStatus(status)}</span>
        {location ? <span className="tag">{location}</span> : null}
        {duration ? <span className="tag">{duration}</span> : null}
      </div>

      <StatusForm offerId={offer.id} status={status} returnTo={returnTo} />
    </article>
  );
}

function OffersTable({
  trackedOffers,
  returnTo
}: {
  trackedOffers: TrackedJobOffer[];
  returnTo: string;
}) {
  return (
    <div className="vie-table-wrap">
      <table className="vie-table">
        <thead>
          <tr>
            <th scope="col">Offre</th>
            <th scope="col">Localisation</th>
            <th scope="col">Statut</th>
            <th scope="col">Publiée</th>
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {trackedOffers.map((tracked) => {
            const offer = tracked.offer;
            const status = statusOf(tracked);
            const location = formatLocation(offer.city, offer.country);
            const published = formatDate(offer.publishedAt);

            return (
              <tr key={offer.id}>
                <td>
                  <a className="vie-table-title" href={`/offres/${offer.id}`}>
                    {offer.title}
                  </a>
                  {offer.companyName ? (
                    <span className="vie-table-company">{offer.companyName}</span>
                  ) : null}
                </td>
                <td>{location ?? "—"}</td>
                <td>
                  <StatusForm offerId={offer.id} status={status} returnTo={returnTo} />
                </td>
                <td className="vie-table-date">{published ?? "—"}</td>
                <td className="vie-table-actions">
                  <form action={toggleFavoriteJob}>
                    <input type="hidden" name="jobOfferId" value={offer.id} />
                    <input type="hidden" name="intent" value="remove" />
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <button
                      className="icon-button icon-button-sm"
                      type="submit"
                      aria-pressed="true"
                      aria-label="Retirer des favoris"
                      title="Retirer des favoris"
                    >
                      ★
                    </button>
                  </form>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusForm({
  offerId,
  status,
  returnTo
}: {
  offerId: string;
  status: OfferApplicationStatus;
  returnTo: string;
}) {
  return (
    <form className="status-cell-form" action={updateJobApplicationStatus}>
      <input type="hidden" name="jobOfferId" value={offerId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <select className="field field-compact" name="status" defaultValue={status}>
        {TRACKED_OFFER_STATUSES.map((option) => (
          <option key={option} value={option}>
            {OFFER_STATUS_LABELS[option]}
          </option>
        ))}
      </select>
      <button className="btn btn-ghost btn-compact" type="submit">
        OK
      </button>
    </form>
  );
}
