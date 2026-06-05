import { prisma } from "@agentic-cv/db";

export const dynamic = "force-dynamic";

function formatLocation(city: string | null, country: string | null) {
  return [city, country].filter(Boolean).join(", ");
}

function formatDuration(durationMonths: number | null) {
  if (!durationMonths) {
    return null;
  }

  return `${durationMonths} mois`;
}

export default async function HomePage() {
  const offers = await prisma.jobOffer.findMany({
    where: {
      isActive: true
    },
    orderBy: [
      {
        publishedAt: "desc"
      },
      {
        scrapedAt: "desc"
      }
    ],
    take: 12,
    select: {
      id: true,
      sourceUrl: true,
      title: true,
      companyName: true,
      country: true,
      city: true,
      contractType: true,
      durationMonths: true
    }
  });

  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand">Agentic CV</div>
        <nav className="nav" aria-label="Navigation principale">
          <a href="/offres">Offres</a>
          <a href="/compte">Compte</a>
        </nav>
      </header>

      <section className="hero">
        <h1>Offres V.I.E propres, filtrables et pretes pour candidater.</h1>
        <p>
          Premier jalon: scraper Business France, normaliser les offres et construire une base
          fiable avant d'ajouter les comptes, documents et generations IA.
        </p>
      </section>

      <section aria-label="Dernieres offres actives">
        {offers.length > 0 ? (
          <div className="offer-list">
            {offers.map((offer) => {
              const location = formatLocation(offer.city, offer.country);
              const duration = formatDuration(offer.durationMonths);

              return (
                <article className="offer-card" key={offer.id}>
                  <h2>{offer.title}</h2>
                  <div className="offer-meta">
                    {offer.companyName ? <span>{offer.companyName}</span> : null}
                    {location ? <span>{location}</span> : null}
                    {offer.contractType ? <span>{offer.contractType}</span> : null}
                    {duration ? <span>{duration}</span> : null}
                  </div>
                  <a href={offer.sourceUrl}>Voir l'offre source</a>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            Aucune offre active pour le moment. Le scraping Business France est en cours.
          </div>
        )}
      </section>
    </main>
  );
}
