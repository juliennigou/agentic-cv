import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { prepareApplication } from "@/features/applications/actions";

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
    <Card className="flex flex-col gap-4 p-5 transition-colors hover:border-[var(--border-strong)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold leading-snug tracking-[-0.01em]">
            <a className="text-foreground hover:text-[var(--accent)]" href={`/offres/${offer.id}`}>
              {offer.title}
            </a>
          </h2>
          {offer.companyName ? (
            <p className="mt-1 font-mono text-sm tracking-[0.02em] text-muted-foreground">
              {offer.companyName}
            </p>
          ) : null}
        </div>
        <form action={toggleFavoriteJob}>
          <input type="hidden" name="jobOfferId" value={offer.id} />
          <input type="hidden" name="intent" value={favorite ? "remove" : "save"} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button
            variant="outline"
            size="icon"
            type="submit"
            aria-pressed={favorite}
            aria-label={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            title={favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            className="size-10 bg-card text-muted-foreground hover:border-[var(--border-strong)] hover:bg-secondary hover:text-foreground aria-pressed:border-[var(--accent)] aria-pressed:bg-[var(--accent-soft)] aria-pressed:text-[var(--accent)]"
          >
            <Star className={favorite ? "fill-[var(--accent)] text-[var(--accent)]" : ""} />
          </Button>
        </form>
      </div>

      {offer.description ? (
        <p className="text-sm leading-snug text-muted-foreground">{excerpt(offer.description)}</p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Badge variant={status ? "accent" : "default"}>{formatOfferStatus(status)}</Badge>
        <form action={prepareApplication}>
          <input type="hidden" name="jobOfferId" value={offer.id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <Button variant="ghost" size="sm" type="submit">
            Préparer ma candidature
          </Button>
        </form>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {offer.contractType ? <Badge variant="accent">{offer.contractType}</Badge> : null}
          {location ? <Badge>{location}</Badge> : null}
          {duration ? <Badge>{duration}</Badge> : null}
        </div>
        {date ? (
          <span className="shrink-0 font-mono text-xs tracking-[0.02em] text-[var(--faint)]">
            {date}
          </span>
        ) : null}
      </div>
    </Card>
  );
}
