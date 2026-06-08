import { listActiveJobOffers, listActiveOfferCountries } from "@agentic-cv/db";
import { listRegions } from "@agentic-cv/shared";

import { Eyebrow } from "@/components/eyebrow";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/current-user";
import { OfferSearch } from "@/features/offers/offer-search";
import { parseSearchCriteria } from "@/features/offers/search";
import { withUserOfferStates } from "@/features/offers/user-offer-state";

export const dynamic = "force-dynamic";

const steps = [
  {
    num: "01",
    title: "Renseigne ton profil",
    body: "Rôles visés, pays, compétences. Quelques champs suffisent pour cadrer ta recherche."
  },
  {
    num: "02",
    title: "Explore les offres",
    body: "Des offres V.I.E centralisées et normalisées, filtrables par pays, entreprise ou date."
  },
  {
    num: "03",
    title: "Prépare ta candidature",
    body: "Sauvegarde les offres qui comptent et garde une trace de tes candidatures."
  }
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const [rawOffers, countries] = await Promise.all([
    listActiveJobOffers(12),
    listActiveOfferCountries()
  ]);
  const offers = await withUserOfferStates(rawOffers, user?.id);

  return (
    <main className="mx-auto w-full max-w-[1120px] px-5 pb-16 pt-8">
      <SiteHeader active="offres" />

      <section className="grid gap-5 pb-8 pt-10">
        <Eyebrow>V.I.E · Business France</Eyebrow>
        <h1 className="max-w-[18ch] font-display text-3xl font-semibold leading-tight tracking-[-0.02em]">
          Les offres V.I.E, enfin claires et faciles à explorer.
        </h1>
        <p className="max-w-[64ch] text-lg leading-normal text-muted-foreground">
          Dis qui tu es et ce que tu cherches, puis parcours des offres normalisées, filtrables et
          prêtes pour candidater. Plus de listes illisibles : juste les bonnes offres, au bon
          endroit.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button asChild>
            <a href="/offres">Voir les offres</a>
          </Button>
          <Button variant="ghost" asChild>
            <a href="/compte">Compléter mon profil</a>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 border-t border-border pt-6 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.num} className="grid content-start gap-2">
              <span className="font-mono text-sm tracking-[0.02em] text-[var(--accent)]">
                {step.num}
              </span>
              <h3 className="font-sans text-base font-semibold">{step.title}</h3>
              <p className="text-sm leading-snug text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <OfferSearch
        offers={offers}
        criteria={parseSearchCriteria({})}
        regions={listRegions()}
        countries={countries}
      />
    </main>
  );
}
