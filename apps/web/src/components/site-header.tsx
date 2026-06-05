type SiteHeaderProps = {
  /** Onglet actif dans la navigation, pour l'état `aria-current`. */
  active?: "offres" | "compte";
};

export function SiteHeader({ active }: SiteHeaderProps) {
  return (
    <header className="topbar">
      <a className="brand" href="/">
        Agentic CV
      </a>
      <nav className="nav" aria-label="Navigation principale">
        <a href="/offres" aria-current={active === "offres" ? "page" : undefined}>
          Offres
        </a>
        <a href="/compte" aria-current={active === "compte" ? "page" : undefined}>
          Compte
        </a>
      </nav>
    </header>
  );
}
