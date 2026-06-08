"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { signOut } from "@/features/auth/actions";

const TABS = [
  { href: "/compte/profil", label: "Profil", hint: "Identité & contact" },
  { href: "/compte/cv", label: "Mon CV", hint: "Dépôt & parcours" },
  { href: "/compte/recherche", label: "Recherche", hint: "Rôles & pays visés" }
] as const;

// Onglet : actif sur surface + bordure, avec liseré accent à gauche en desktop.
const tabClass =
  "grid shrink-0 content-center gap-0.5 min-h-11 rounded-sm border border-transparent px-4 py-2 text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:border-border aria-[current=page]:bg-card aria-[current=page]:text-foreground md:aria-[current=page]:shadow-[inset_3px_0_0_var(--accent)]";
const tabLabelClass = "font-mono text-sm font-medium tracking-[0.02em]";
const tabHintClass = "hidden text-xs text-[var(--faint)] md:block";

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex gap-2 overflow-x-auto border-b border-border pb-2 [scrollbar-width:none] md:sticky md:top-5 md:flex-col md:gap-1 md:overflow-visible md:border-b-0 md:pb-0"
      aria-label="Navigation du compte"
    >
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={tabClass}
            aria-current={active ? "page" : undefined}
          >
            <span className={tabLabelClass}>{tab.label}</span>
            <span className={tabHintClass}>{tab.hint}</span>
          </Link>
        );
      })}

      <form action={signOut}>
        <button className={`${tabClass} w-full cursor-pointer text-left`} type="submit">
          <span className={tabLabelClass}>Déconnexion</span>
          <span className={tabHintClass}>Fermer ma session</span>
        </button>
      </form>
    </nav>
  );
}
