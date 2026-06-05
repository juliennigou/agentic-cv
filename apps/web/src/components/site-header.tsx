import { signOut } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/current-user";

type SiteHeaderProps = {
  /** Onglet actif dans la navigation, pour l'état `aria-current`. */
  active?: "offres" | "compte" | "connexion";
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
          Offres
        </a>
        <a href="/compte" aria-current={active === "compte" ? "page" : undefined}>
          {user ? "Mon compte" : "Compte"}
        </a>
        {user ? (
          <form action={signOut}>
            <button className="nav-button" type="submit">
              Déconnexion
            </button>
          </form>
        ) : (
          <a href="/connexion" aria-current={active === "connexion" ? "page" : undefined}>
            Connexion
          </a>
        )}
      </nav>
    </header>
  );
}
