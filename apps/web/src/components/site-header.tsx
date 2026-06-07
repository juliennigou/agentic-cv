import { getCurrentUser } from "@/features/auth/current-user";

type SiteHeaderProps = {
  /** Onglet actif dans la navigation, pour l'état `aria-current`. */
  active?: "offres" | "mes-vie" | "compte" | "connexion";
};

export async function SiteHeader({ active }: SiteHeaderProps) {
  const user = await getCurrentUser();

  return (
    <header className="topbar">
      <a className="brand" href="/">
        Agentic CV
      </a>
      <nav className="nav" aria-label="Navigation principale">
        <a href="/offres" aria-current={active === "offres" ? "page" : undefined}>
          Les offres
        </a>
        {user ? (
          <a href="/mes-vie" aria-current={active === "mes-vie" ? "page" : undefined}>
            Mes VIE
          </a>
        ) : null}
        <a href="/compte" aria-current={active === "compte" ? "page" : undefined}>
          {user ? "Mon compte" : "Compte"}
        </a>
        {user ? null : (
          <a href="/connexion" aria-current={active === "connexion" ? "page" : undefined}>
            Connexion
          </a>
        )}
      </nav>
    </header>
  );
}
