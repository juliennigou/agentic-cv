import { listUserFavoriteJobOffers, type TrackedJobOffer } from "@agentic-cv/db";
import { Star } from "lucide-react";
import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { prepareApplication } from "@/features/applications/actions";
import { getCurrentUser } from "@/features/auth/current-user";
import { toggleFavoriteJob } from "@/features/offers/actions";
import {
  formatDate,
  formatDuration,
  formatLocation,
  type OfferApplicationStatus
} from "@/features/offers/offer-view";
import { StatusSelect } from "@/features/offers/status-select";
import { formatOfferStatus, groupForStatus, OFFER_STATUS_GROUPS } from "@/features/offers/status";
import { VieViewTabs } from "@/features/offers/vie-view-tabs";

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
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-8">
      <SiteHeader active="mes-vie" />

      <header className="grid gap-2 pb-5 pt-2">
        <Eyebrow>Suivi des candidatures</Eyebrow>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">Mes VIE</h1>
        <span className="font-mono text-sm tracking-[0.02em] text-muted-foreground">
          <strong className="text-foreground">{trackedOffers.length}</strong> offre
          {trackedOffers.length > 1 ? "s" : ""} suivie{trackedOffers.length > 1 ? "s" : ""}
        </span>
      </header>

      {trackedOffers.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--border-strong)] bg-card p-6 leading-normal text-muted-foreground">
          Aucune offre suivie pour l'instant. Ajoute une offre à tes favoris depuis{" "}
          <a className="text-[var(--accent)] hover:underline" href="/offres">
            la liste des offres
          </a>{" "}
          pour la retrouver ici.
        </div>
      ) : (
        <VieViewTabs
          initialView={view}
          kanban={<KanbanBoard trackedOffers={trackedOffers} returnTo={returnTo} />}
          table={<OffersTable trackedOffers={trackedOffers} returnTo={returnTo} />}
        />
      )}
    </main>
  );
}

function PrepareApplicationButton({
  offerId,
  returnTo,
  validated,
  fullWidth = false
}: {
  offerId: string;
  returnTo: string;
  validated: boolean;
  fullWidth?: boolean;
}) {
  return (
    <form action={prepareApplication} className={fullWidth ? "w-full" : undefined}>
      <input type="hidden" name="jobOfferId" value={offerId} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className={fullWidth ? "w-full bg-card" : "bg-card"}
      >
        {validated ? "Revoir la candidature" : "Préparer ma candidature"}
      </Button>
    </form>
  );
}

function FavoriteRemoveButton({ offerId, returnTo }: { offerId: string; returnTo: string }) {
  return (
    <form action={toggleFavoriteJob}>
      <input type="hidden" name="jobOfferId" value={offerId} />
      <input type="hidden" name="intent" value="remove" />
      <input type="hidden" name="returnTo" value={returnTo} />
      <Button
        variant="outline"
        size="icon"
        type="submit"
        aria-pressed="true"
        aria-label="Retirer des favoris"
        title="Retirer des favoris"
        className="size-8 bg-card hover:border-[var(--border-strong)]"
      >
        <Star className="fill-[var(--accent)] text-[var(--accent)]" />
      </Button>
    </form>
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
    <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
      {columns.map((column) => (
        <section
          className="grid content-start gap-3 rounded-md border border-border bg-secondary p-3"
          key={column.key}
          aria-label={column.label}
        >
          <header className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-medium tracking-[0.02em] text-foreground">
              {column.label}
            </span>
            <span className="inline-grid h-[22px] min-w-[22px] place-items-center rounded-full bg-card px-1 font-mono text-xs text-muted-foreground">
              {column.offers.length}
            </span>
          </header>

          <div className="grid gap-2">
            {column.offers.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-[var(--faint)]">Aucune offre</p>
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
    <Card className="grid gap-3 rounded-sm p-3">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-sans text-sm font-semibold leading-snug">
          <a className="text-foreground hover:text-[var(--accent)]" href={`/offres/${offer.id}`}>
            {offer.title}
          </a>
        </h2>
        <FavoriteRemoveButton offerId={offer.id} returnTo={returnTo} />
      </div>

      {offer.companyName ? (
        <p className="font-mono text-xs tracking-[0.02em] text-muted-foreground">
          {offer.companyName}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Badge variant="accent">{formatOfferStatus(status)}</Badge>
        {tracked.applicationValidatedAt ? <Badge variant="accent">Validée</Badge> : null}
        {location ? <Badge>{location}</Badge> : null}
        {duration ? <Badge>{duration}</Badge> : null}
      </div>

      <StatusSelect offerId={offer.id} status={status} returnTo={returnTo} />
      <PrepareApplicationButton
        offerId={offer.id}
        returnTo={returnTo}
        validated={Boolean(tracked.applicationValidatedAt)}
        fullWidth
      />
    </Card>
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Offre</TableHead>
          <TableHead>Localisation</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Publiée</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trackedOffers.map((tracked) => {
          const offer = tracked.offer;
          const status = statusOf(tracked);
          const location = formatLocation(offer.city, offer.country);
          const published = formatDate(offer.publishedAt);

          return (
            <TableRow key={offer.id}>
              <TableCell>
                <a
                  className="font-sans font-semibold text-foreground hover:text-[var(--accent)]"
                  href={`/offres/${offer.id}`}
                >
                  {offer.title}
                </a>
                {offer.companyName ? (
                  <span className="block font-mono text-xs tracking-[0.02em] text-muted-foreground">
                    {offer.companyName}
                  </span>
                ) : null}
              </TableCell>
              <TableCell>{location ?? "—"}</TableCell>
              <TableCell>
                <StatusSelect offerId={offer.id} status={status} returnTo={returnTo} />
              </TableCell>
              <TableCell className="font-mono text-xs tracking-[0.02em] text-[var(--faint)]">
                {published ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <PrepareApplicationButton
                    offerId={offer.id}
                    returnTo={returnTo}
                    validated={Boolean(tracked.applicationValidatedAt)}
                  />
                  <FavoriteRemoveButton offerId={offer.id} returnTo={returnTo} />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
