import { getCurrentUser } from "@/features/auth/current-user";

type SiteHeaderProps = {
  /** Onglet actif dans la navigation, pour l'état `aria-current`. */
  active?: "offres" | "rapport" | "mes-vie" | "compte" | "connexion";
};

// Lien de nav : mono discret, accentué sur l'onglet actif (aria-current).
function navLinkClass(isActive: boolean) {
  return isActive
    ? "font-mono text-sm tracking-[0.02em] text-foreground"
    : "font-mono text-sm tracking-[0.02em] text-muted-foreground transition-colors hover:text-foreground";
}

export async function SiteHeader({ active }: SiteHeaderProps) {
  const user = await getCurrentUser();

  return (
    <header className="flex flex-col items-start gap-4 pb-8 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <a className="font-display text-lg font-semibold tracking-[-0.01em] text-foreground" href="/">
        Agentic CV
      </a>
      <nav className="flex gap-5" aria-label="Navigation principale">
        <a
          href="/offres"
          className={navLinkClass(active === "offres")}
          aria-current={active === "offres" ? "page" : undefined}
        >
          Les offres
        </a>
        {user ? (
          <a
            href="/rapport"
            className={navLinkClass(active === "rapport")}
            aria-current={active === "rapport" ? "page" : undefined}
          >
            Rapport
          </a>
        ) : null}
        {user ? (
          <a
            href="/mes-vie"
            className={navLinkClass(active === "mes-vie")}
            aria-current={active === "mes-vie" ? "page" : undefined}
          >
            Mes VIE
          </a>
        ) : null}
        <a
          href="/compte"
          className={navLinkClass(active === "compte")}
          aria-current={active === "compte" ? "page" : undefined}
        >
          {user ? "Mon compte" : "Compte"}
        </a>
        {user ? null : (
          <a
            href="/connexion"
            className={navLinkClass(active === "connexion")}
            aria-current={active === "connexion" ? "page" : undefined}
          >
            Connexion
          </a>
        )}
      </nav>
    </header>
  );
}
