import { listActiveOfferCountries } from "@agentic-cv/db";
import { Star, StarOff } from "lucide-react";
import { redirect } from "next/navigation";

import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { prepareApplication } from "@/features/applications/actions";
import { toggleFavoriteJob } from "@/features/offers/actions";
import { getCurrentUser } from "@/features/auth/current-user";
import {
  getMatchCounts,
  getMatchReport,
  parseReportFilters,
  parseReportPage,
  parseReportTab,
  type ReportFilters,
  type ReportMatch,
  type ReportTab
} from "@/features/offers/match-report";
import { formatDuration, formatLocation } from "@/features/offers/offer-view";
import { ReportFilters as ReportFiltersBar } from "@/features/offers/report-filters";

export const dynamic = "force-dynamic";

type RapportPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Construit une URL de rapport en conservant onglet, page et filtres. */
function reportHref(state: { tab: ReportTab; page?: number; filters: ReportFilters }): string {
  const params = new URLSearchParams();
  params.set("tab", state.tab);
  if (state.page && state.page > 1) {
    params.set("page", String(state.page));
  }
  if (state.filters.countryCode) {
    params.set("country", state.filters.countryCode);
  }
  if (state.filters.minSalary) {
    params.set("minSalary", String(state.filters.minSalary));
  }
  return `/rapport?${params.toString()}`;
}

export default async function RapportPage({ searchParams }: RapportPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion?next=/rapport");
  }

  const params = await searchParams;
  const tab = parseReportTab(params.tab);
  const requestedPage = parseReportPage(params.page);
  const filters = parseReportFilters(params);

  const [countries, counts, report] = await Promise.all([
    listActiveOfferCountries(),
    getMatchCounts(user.id, filters),
    getMatchReport(user.id, tab, requestedPage, filters)
  ]);

  // Page hors bornes (ex. lien obsolète) → on recale sur la dernière page.
  if (report.total > 0 && requestedPage > report.totalPages) {
    redirect(reportHref({ tab, page: report.totalPages, filters }));
  }

  const returnTo = reportHref({ tab, page: requestedPage, filters });

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-8">
      <SiteHeader active="rapport" />

      <header className="grid gap-2 pb-5 pt-2">
        <Eyebrow>Mon rapport</Eyebrow>
        <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">
          Offres qui te correspondent
        </h1>
        <span className="font-mono text-sm tracking-[0.02em] text-muted-foreground">
          Le quart le plus pertinent de tes offres, classé par correspondance avec ton profil — les
          meilleures d&apos;abord.
        </span>
      </header>

      <TabBar tab={tab} filters={filters} recentCount={counts.recent} allCount={counts.all} />

      <ReportFiltersBar
        countries={countries}
        countryCode={filters.countryCode}
        minSalary={filters.minSalary}
      />

      {report.items.length === 0 ? (
        <EmptyState tab={tab} filters={filters} />
      ) : (
        <>
          <section className="mt-4 grid gap-3">
            {report.items.map((match) => (
              <MatchCard key={match.jobOfferId} match={match} returnTo={returnTo} />
            ))}
          </section>

          <Pagination
            tab={tab}
            page={report.page}
            totalPages={report.totalPages}
            filters={filters}
          />
        </>
      )}
    </main>
  );
}

function TabBar({
  tab,
  filters,
  recentCount,
  allCount
}: {
  tab: ReportTab;
  filters: ReportFilters;
  recentCount: number;
  allCount: number;
}) {
  return (
    <nav
      className="inline-flex h-11 items-center justify-center gap-1 rounded-sm border border-border bg-secondary p-1 text-muted-foreground"
      aria-label="Filtrer le rapport"
    >
      <TabLink
        href={reportHref({ tab: "recent", filters })}
        active={tab === "recent"}
        label="Dernières 24 h"
        count={recentCount}
      />
      <TabLink
        href={reportHref({ tab: "all", filters })}
        active={tab === "all"}
        label="Toutes mes offres"
        count={allCount}
      />
    </nav>
  );
}

function TabLink({
  href,
  active,
  label,
  count
}: {
  href: string;
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
    <a href={href} aria-current={active ? "page" : undefined} className={`${base} ${state}`}>
      {label}
      <span className="ml-2 text-[var(--faint)]">{count}</span>
    </a>
  );
}

function EmptyState({ tab, filters }: { tab: ReportTab; filters: ReportFilters }) {
  const hasFilters = filters.countryCode !== null || filters.minSalary !== null;

  if (hasFilters) {
    return (
      <div className="mt-4 rounded-md border border-dashed border-[var(--border-strong)] bg-card p-6 leading-normal text-muted-foreground">
        Aucune offre ne correspond à ces filtres.{" "}
        <a
          className="text-[var(--accent)] hover:underline"
          href={reportHref({ tab, filters: { countryCode: null, minSalary: null } })}
        >
          Réinitialiser les filtres
        </a>
        .
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-md border border-dashed border-[var(--border-strong)] bg-card p-6 leading-normal text-muted-foreground">
      {tab === "recent" ? (
        <>
          Aucune nouvelle offre pertinente dans les dernières 24 h. Reviens demain, ou consulte{" "}
          <a
            className="text-[var(--accent)] hover:underline"
            href={reportHref({ tab: "all", filters })}
          >
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

function MatchCard({ match, returnTo }: { match: ReportMatch; returnTo: string }) {
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
          {match.salary ? <Badge>{match.salary}</Badge> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <FavoriteToggle
            jobOfferId={match.jobOfferId}
            isSaved={match.isSaved}
            returnTo={returnTo}
          />
          <form action={prepareApplication}>
            <input type="hidden" name="jobOfferId" value={match.jobOfferId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <Button variant="outline" size="sm" type="submit" className="bg-card">
              Préparer ma candidature
            </Button>
          </form>
        </div>
      </div>
    </Card>
  );
}

function FavoriteToggle({
  jobOfferId,
  isSaved,
  returnTo
}: {
  jobOfferId: string;
  isSaved: boolean;
  returnTo: string;
}) {
  return (
    <form action={toggleFavoriteJob}>
      <input type="hidden" name="jobOfferId" value={jobOfferId} />
      <input type="hidden" name="intent" value={isSaved ? "remove" : "save"} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <Button
        variant="ghost"
        size="sm"
        type="submit"
        title={isSaved ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        {isSaved ? <StarOff aria-hidden /> : <Star aria-hidden />}
        {isSaved ? "Retirer" : "Favori"}
      </Button>
    </form>
  );
}

function Pagination({
  tab,
  page,
  totalPages,
  filters
}: {
  tab: ReportTab;
  page: number;
  totalPages: number;
  filters: ReportFilters;
}) {
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
        {hasPrev ? (
          <a href={reportHref({ tab, page: page - 1, filters })}>← Précédent</a>
        ) : (
          <span>← Précédent</span>
        )}
      </Button>
      <span className="font-mono text-sm tracking-[0.02em] text-muted-foreground">
        Page {page} / {totalPages}
      </span>
      <Button asChild={hasNext} variant="outline" size="sm" disabled={!hasNext}>
        {hasNext ? (
          <a href={reportHref({ tab, page: page + 1, filters })}>Suivant →</a>
        ) : (
          <span>Suivant →</span>
        )}
      </Button>
    </nav>
  );
}
