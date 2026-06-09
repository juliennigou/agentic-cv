import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prepareApplication } from "@/features/applications/actions";
import { getCurrentUser } from "@/features/auth/current-user";
import { getMatchReport, parseReportPage, type ReportMatch } from "@/features/offers/match-report";
import { formatDuration, formatLocation } from "@/features/offers/offer-view";

export const dynamic = "force-dynamic";

const RETURN_TO = "/rapport";

type RapportPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function RapportPage({ searchParams }: RapportPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion?next=/rapport");
  }

  const requestedPage = parseReportPage((await searchParams).page);
  const report = await getMatchReport(user.id, requestedPage);

  // Page hors bornes (ex. lien obsolète) → on recale sur la dernière page.
  if (report.total > 0 && requestedPage > report.totalPages) {
    redirect(`/rapport?page=${report.totalPages}`);
  }

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-8">
      <SiteHeader active="rapport" />

      <header className="grid gap-2 pb-5 pt-2">
        <Eyebrow>Mon rapport</Eyebrow>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">
          Offres qui te correspondent
        </h1>
        <span className="font-mono text-sm tracking-[0.02em] text-muted-foreground">
          <strong className="text-foreground">{report.total}</strong> offre
          {report.total > 1 ? "s" : ""} active{report.total > 1 ? "s" : ""} classée
          {report.total > 1 ? "s" : ""} par pertinence avec ton profil — les meilleures
          correspondances d'abord. Les nouveautés des dernières 24 h sont signalées.
        </span>
      </header>

      {report.items.length === 0 ? (
        <div className="rounded-md border border-dashed border-[var(--border-strong)] bg-card p-6 leading-normal text-muted-foreground">
          Aucune offre pertinente pour l'instant. Complète ton{" "}
          <a className="text-[var(--accent)] hover:underline" href="/compte">
            profil et ton CV
          </a>{" "}
          pour affiner le matching, ou parcours{" "}
          <a className="text-[var(--accent)] hover:underline" href="/offres">
            toutes les offres
          </a>
          .
        </div>
      ) : (
        <>
          <section className="grid gap-3">
            {report.items.map((match) => (
              <MatchCard key={match.jobOfferId} match={match} />
            ))}
          </section>

          <Pagination page={report.page} totalPages={report.totalPages} />
        </>
      )}
    </main>
  );
}

function MatchCard({ match }: { match: ReportMatch }) {
  const location = formatLocation(match.city, match.country);
  const duration = formatDuration(match.durationMonths);

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
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge variant="accent" title="Pertinence avec ton profil">
            {match.scorePercent}% pertinent
          </Badge>
          {match.isNew ? (
            <span className="font-mono text-xs uppercase tracking-[0.06em] text-[var(--accent)]">
              Nouveau
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {match.contractType ? <Badge variant="accent">{match.contractType}</Badge> : null}
          {location ? <Badge>{location}</Badge> : null}
          {duration ? <Badge>{duration}</Badge> : null}
        </div>
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

function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      className="mt-6 flex items-center justify-between gap-3"
      aria-label="Pagination du rapport"
    >
      <Button asChild={hasPrev} variant="outline" size="sm" disabled={!hasPrev}>
        {hasPrev ? <a href={`/rapport?page=${page - 1}`}>← Précédent</a> : <span>← Précédent</span>}
      </Button>
      <span className="font-mono text-sm tracking-[0.02em] text-muted-foreground">
        Page {page} / {totalPages}
      </span>
      <Button asChild={hasNext} variant="outline" size="sm" disabled={!hasNext}>
        {hasNext ? <a href={`/rapport?page=${page + 1}`}>Suivant →</a> : <span>Suivant →</span>}
      </Button>
    </nav>
  );
}
