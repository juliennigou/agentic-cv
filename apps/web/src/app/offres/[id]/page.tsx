import { getJobOfferById, getUserOfferState } from "@agentic-cv/db";
import { Star } from "lucide-react";
import { notFound } from "next/navigation";

import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/features/auth/current-user";
import { toggleFavoriteJob } from "@/features/offers/actions";
import { formatDate, formatDuration, formatLocation } from "@/features/offers/offer-view";
import { StatusSelect } from "@/features/offers/status-select";
import { formatOfferStatus } from "@/features/offers/status";

export const dynamic = "force-dynamic";

type OfferDetailPageProps = {
  params: Promise<{ id: string }>;
};

const factLabelClass = "font-mono text-xs uppercase tracking-[0.06em] text-[var(--faint)]";

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
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-8">
      <SiteHeader active="offres" />

      <a
        className="inline-flex items-center gap-2 font-mono text-sm tracking-[0.02em] text-muted-foreground transition-colors hover:text-foreground"
        href="/offres"
      >
        ← Toutes les offres
      </a>

      <header className="grid gap-4 border-b border-border pb-8 pt-5">
        <Eyebrow>{offer.contractType ?? "V.I.E"}</Eyebrow>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-[-0.02em]">
          {offer.title}
        </h1>
        <div className="flex flex-wrap gap-2">
          {offer.companyName ? <Badge variant="accent">{offer.companyName}</Badge> : null}
          {location ? <Badge>{location}</Badge> : null}
          {duration ? <Badge>{duration}</Badge> : null}
        </div>
      </header>

      <div className="grid items-start gap-8 pt-8 md:grid-cols-[minmax(0,1fr)_300px]">
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
              <div className="flex flex-wrap items-baseline gap-2">
                <h2>À propos de l'entreprise</h2>
                {offer.companyDescriptionGenerated ? <Badge variant="accent">Résumé IA</Badge> : null}
              </div>
              <p>{offer.companyDescription}</p>
              {offer.companyDescriptionGenerated ? (
                <p className="mt-1 text-xs italic text-muted-foreground">
                  Présentation générée automatiquement à partir du nom de l'entreprise, à titre
                  indicatif.
                </p>
              ) : null}
            </section>
          ) : null}
        </article>

        <Card className="sticky top-5 grid gap-5 p-5">
          <div className="grid gap-3 border-b border-border pb-5">
            <div>
              <Eyebrow>Suivi</Eyebrow>
              <p className="mt-1 font-display text-xl font-semibold">
                {formatOfferStatus(applicationStatus)}
              </p>
            </div>

            <form action={toggleFavoriteJob}>
              <input type="hidden" name="jobOfferId" value={offer.id} />
              <input type="hidden" name="intent" value={favorite ? "remove" : "save"} />
              <input type="hidden" name="returnTo" value={`/offres/${offer.id}`} />
              <Button
                variant="outline"
                type="submit"
                aria-pressed={favorite}
                className="w-full aria-pressed:border-[var(--accent)] aria-pressed:bg-[var(--accent-soft)] aria-pressed:text-[var(--accent)]"
              >
                <Star className={favorite ? "fill-[var(--accent)] text-[var(--accent)]" : ""} />
                {favorite ? "Dans mes favoris" : "Ajouter aux favoris"}
              </Button>
            </form>

            <div className="grid gap-2">
              <span className="font-mono text-sm tracking-[0.02em] text-muted-foreground">
                Statut
              </span>
              <StatusSelect
                offerId={offer.id}
                status={applicationStatus ?? "unread"}
                returnTo={`/offres/${offer.id}`}
              />
            </div>
          </div>

          <dl className="m-0 grid gap-4">
            {offer.companyName ? (
              <div className="grid gap-1">
                <dt className={factLabelClass}>Entreprise</dt>
                <dd className="m-0">{offer.companyName}</dd>
              </div>
            ) : null}
            {location ? (
              <div className="grid gap-1">
                <dt className={factLabelClass}>Localisation</dt>
                <dd className="m-0">{location}</dd>
              </div>
            ) : null}
            {offer.contractType ? (
              <div className="grid gap-1">
                <dt className={factLabelClass}>Contrat</dt>
                <dd className="m-0">{offer.contractType}</dd>
              </div>
            ) : null}
            {duration ? (
              <div className="grid gap-1">
                <dt className={factLabelClass}>Durée</dt>
                <dd className="m-0">{duration}</dd>
              </div>
            ) : null}
            {offer.salary ? (
              <div className="grid gap-1">
                <dt className={factLabelClass}>Rémunération</dt>
                <dd className="m-0">{offer.salary}</dd>
              </div>
            ) : null}
            {published ? (
              <div className="grid gap-1">
                <dt className={factLabelClass}>Publiée le</dt>
                <dd className="m-0">{published}</dd>
              </div>
            ) : null}
            <div className="grid gap-1">
              <dt className={factLabelClass}>Source</dt>
              <dd className="m-0">{offer.source}</dd>
            </div>
          </dl>

          <Button asChild className="w-full">
            <a href={offer.sourceUrl} target="_blank" rel="noreferrer">
              Voir l'offre originale ↗
            </a>
          </Button>
          <Button variant="ghost" type="button" disabled className="w-full">
            Préparer ma candidature
          </Button>
        </Card>
      </div>
    </main>
  );
}
