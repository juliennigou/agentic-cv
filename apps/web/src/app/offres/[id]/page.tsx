type OfferDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OfferDetailPage({ params }: OfferDetailPageProps) {
  const { id } = await params;

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/offres">
          Agentic CV
        </a>
      </header>
      <section className="empty-state">Detail de l'offre {id} a brancher sur `job_offers`.</section>
    </main>
  );
}

