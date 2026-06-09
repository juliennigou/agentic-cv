import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prepareApplication } from "@/features/applications/actions";
import { getCurrentUser } from "@/features/auth/current-user";
import {
  getMatchCounts,
  getMatchReport,
  parseReportPage,
  parseReportTab,
  type ReportMatch,
  type ReportTab
} from "@/features/offers/match-report";
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

  const params = await searchParams;
  const tab = parseReportTab(params.tab);
  const requestedPage = parseReportPage(params.page);

  const [counts, report] = await Promise.all([
    getMatchCounts(user.id),
    getMatchReport(user.id, tab, requestedPage)
  ]);

  // Page hors bornes (ex. lien obsolète) → on recale sur la dernière page.
  if (report.total > 0 && requestedPage > report.totalPages) {
    redirect(`/rapport?tab=${tab}&page=${report.totalPages}`);
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
          Tes offres classées par pertinence avec ton profil — les meilleures correspondances
          d&apos;abord.
        </span>
      </header>

      <TabBar tab={tab} recentCount={counts.recent} allCount={counts.all} />

      {report.items.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <>
          <section className="mt-4 grid gap-3">
            {report.items.map((match) => (
              <MatchCard key={match.jobOfferId} match={match} />
            ))}
          </section>

          <Pagination tab={tab} page={report.page} totalPages={report.totalPages} />
        </>
      )}
    </main>
  );
}

function TabBar({
  tab,
  recentCount,
  allCount
}: {
  tab: ReportTab;
  recentCount: number;
  allCount: number;
}) {
  return (
    <nav
      className="inline-flex h-11 items-center justify-center gap-1 rounded-sm border border-border bg-secondary p-1 text-muted-foreground"
      aria-label="Filtrer le rapport"
    >
      <TabLink tab="recent" active={tab === "recent"} label="Dernières 24 h" count={recentCount} />
      <TabLink tab="all" active={tab === "all"} label="Toutes mes offres" count={allCount} />
    </nav>
  );
}

function TabLink({
  tab,
  active,
  label,
  count
}: {
  tab: ReportTab;
  active: boolean;
  label: string;
  count: number;
}) {
  const base =
    "inline-flex h-full items-center justify-center whitespace-nowrap rounded-sm px-4 font-mono text-sm font-medium tracking-[0.02em] transition-colors";
  const state = active
    ? "bg-card text-foreground shadow-sm"
    : "text-muted-foreground hover:text-foreground";

  return (
    <a
      href={`/rapport?tab=${tab}`}
      aria-current={active ? "page" : undefined}
      className={`${base} ${state}`}
    >
      {label}
      <span className="ml-2 text-[var(--faint)]">{count}</span>
    </a>
  );
}

function EmptyState({ tab }: { tab: ReportTab }) {
  return (
    <div className="mt-4 rounded-md border border-dashed border-[var(--border-strong)] bg-card p-6 leading-normal text-muted-foreground">
      {tab === "recent" ? (
        <>
          Aucune nouvelle offre dans les dernières 24 h. Reviens demain, ou consulte{" "}
          <a className="text-[var(--accent)] hover:underline" href="/rapport?tab=all">
            toutes tes offres
          </a>
          .
        </>
      ) : (
        <>
          Aucune offre à classer pour l&apos;instant. Complète ton{" "}
          <a className="text-[var(--accent)] hover:underline" href="/compte">
            profil et ton CV
          </a>{" "}
          pour affiner le matching, ou parcours{" "}
          <a className="text-[var(--accent)] hover:underline" href="/offres">
            toutes les offres
          </a>
          .
        </>
      )}
    </div>
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

function Pagination({
  tab,
  page,
  totalPages
}: {
  tab: ReportTab;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const href = (target: number) => `/rapport?tab=${tab}&page=${target}`;

  return (
    <nav
      className="mt-6 flex items-center justify-between gap-3"
      aria-label="Pagination du rapport"
    >
      <Button asChild={hasPrev} variant="outline" size="sm" disabled={!hasPrev}>
        {hasPrev ? <a href={href(page - 1)}>← Précédent</a> : <span>← Précédent</span>}
      </Button>
      <span className="font-mono text-sm tracking-[0.02em] text-muted-foreground">
        Page {page} / {totalPages}
      </span>
      <Button asChild={hasNext} variant="outline" size="sm" disabled={!hasNext}>
        {hasNext ? <a href={href(page + 1)}>Suivant →</a> : <span>Suivant →</span>}
      </Button>
    </nav>
  );
}
