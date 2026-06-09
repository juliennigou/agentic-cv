import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prepareApplication } from "@/features/applications/actions";
import { getCurrentUser } from "@/features/auth/current-user";
import { getDailyReport, type DailyReportMatch } from "@/features/offers/daily-report";
import { formatDate, formatDuration, formatLocation } from "@/features/offers/offer-view";

export const dynamic = "force-dynamic";

const RETURN_TO = "/rapport";

export default async function RapportPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion?next=/rapport");
  }

  const matches = await getDailyReport(user.id);

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-8">
      <SiteHeader active="rapport" />

      <header className="grid gap-2 pb-5 pt-2">
        <Eyebrow>Rapport quotidien</Eyebrow>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">
          Nouvelles offres pertinentes
        </h1>
        <span className="font-mono text-sm tracking-[0.02em] text-muted-foreground">
          <strong className="text-foreground">{matches.length}</strong> offre
          {matches.length > 1 ? "s" : ""} repérée{matches.length > 1 ? "s" : ""} sur les dernières
          24 h, classée{matches.length > 1 ? "s" : ""} par pertinence avec ton profil.
        </span>
      </header>

      {matches.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--border-strong)] bg-card p-6 leading-normal text-muted-foreground">
          Aucune nouvelle offre pertinente pour l'instant. Complète ton{" "}
          <a className="text-[var(--accent)] hover:underline" href="/compte">
            profil et ton CV
          </a>{" "}
          pour affiner le matching, ou parcours{" "}
          <a className="text-[var(--accent)] hover:underline" href="/offres">
            toutes les offres
          </a>
          . Le rapport se met à jour chaque jour.
        </div>
      ) : (
        <section className="grid gap-3">
          {matches.map((match) => (
            <MatchCard key={match.jobOfferId} match={match} />
          ))}
        </section>
      )}
    </main>
  );
}

function MatchCard({ match }: { match: DailyReportMatch }) {
  const location = formatLocation(match.city, match.country);
  const duration = formatDuration(match.durationMonths);
  const date = formatDate(match.createdAt);

  return (
    <Card className="flex flex-col gap-4 p-5 transition-colors hover:border-[var(--border-strong)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold leading-snug tracking-[-0.01em]">
            <a
              className="text-foreground hover:text-[var(--accent)]"
              href={`/offres/${match.jobOfferId}`}
            >
              {match.title}
            </a>
          </h2>
          {match.companyName ? (
            <p className="mt-1 font-mono text-sm tracking-[0.02em] text-muted-foreground">
              {match.companyName}
            </p>
          ) : null}
        </div>
        <Badge variant="accent" title="Pertinence avec ton profil">
          {match.scorePercent}% pertinent
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {match.contractType ? <Badge variant="accent">{match.contractType}</Badge> : null}
          {location ? <Badge>{location}</Badge> : null}
          {duration ? <Badge>{duration}</Badge> : null}
        </div>
        {date ? (
          <span className="shrink-0 font-mono text-xs tracking-[0.02em] text-[var(--faint)]">
            {date}
          </span>
        ) : null}
      </div>

      <div className="flex justify-end">
        <form action={prepareApplication}>
          <input type="hidden" name="jobOfferId" value={match.jobOfferId} />
          <input type="hidden" name="returnTo" value={RETURN_TO} />
          <Button variant="outline" size="sm" type="submit" className="bg-card">
            Préparer ma candidature
          </Button>
        </form>
      </div>
    </Card>
  );
}
