import { SiteHeader } from "@/components/site-header";

export default function AccountPage() {
  return (
    <main className="page-shell">
      <SiteHeader active="compte" />

      <section className="hero" style={{ paddingBottom: "var(--space-2)" }}>
        <span className="eyebrow">Bientôt disponible</span>
        <h1 style={{ fontSize: "var(--text-2xl)" }}>Ton espace candidat</h1>
        <p>
          Profil, CV et suivi de candidatures arrivent juste après le socle scraping : authentification
          Supabase, profil candidat et documents.
        </p>
      </section>

      <div className="empty-state">
        L'espace compte n'est pas encore activé. En attendant, tu peux explorer les{" "}
        <a href="/offres">offres V.I.E</a> sans créer de compte.
      </div>
    </main>
  );
}
