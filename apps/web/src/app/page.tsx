import { listActiveJobOffers, listActiveOfferCountries } from "@agentic-cv/db";
import { listRegions } from "@agentic-cv/shared";

import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/features/auth/current-user";
import { OfferSearch } from "@/features/offers/offer-search";
import { parseSearchCriteria } from "@/features/offers/search";
import { withUserOfferStates } from "@/features/offers/user-offer-state";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [rawOffers, countries] = await Promise.all([
    listActiveJobOffers(12),
    listActiveOfferCountries()
  ]);
  const offers = await withUserOfferStates(rawOffers, user?.id);

  return (
    <main className="page-shell">
      <SiteHeader active="offres" />

      <section className="hero">
        <span className="eyebrow">V.I.E · Business France</span>
        <h1>Les offres V.I.E, enfin claires et faciles à explorer.</h1>
        <p>
          Dis qui tu es et ce que tu cherches, puis parcours des offres normalisées, filtrables et
          prêtes pour candidater. Plus de listes illisibles : juste les bonnes offres, au bon
          endroit.
        </p>
        <div className="cta-row">
          <a className="btn btn-primary" href="/offres">
            Voir les offres
          </a>
          <a className="btn btn-ghost" href="/compte">
            Compléter mon profil
          </a>
        </div>

        <div className="steps">
          <div className="step">
            <span className="step-num">01</span>
            <h3>Renseigne ton profil</h3>
            <p>
              Rôles visés, pays, compétences. Quelques champs suffisent pour cadrer ta recherche.
            </p>
          </div>
          <div className="step">
            <span className="step-num">02</span>
            <h3>Explore les offres</h3>
            <p>
              Des offres V.I.E centralisées et normalisées, filtrables par pays, entreprise ou date.
            </p>
          </div>
          <div className="step">
            <span className="step-num">03</span>
            <h3>Prépare ta candidature</h3>
            <p>Sauvegarde les offres qui comptent et garde une trace de tes candidatures.</p>
          </div>
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
