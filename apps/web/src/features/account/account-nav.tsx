"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/compte/profil", label: "Profil", hint: "Identité & contact" },
  { href: "/compte/cv", label: "Mon CV", hint: "Dépôt & parcours" },
  { href: "/compte/recherche", label: "Recherche", hint: "Rôles & pays visés" }
] as const;

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="account-nav" aria-label="Navigation du compte">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="account-tab"
            aria-current={active ? "page" : undefined}
          >
            <span className="account-tab-label">{tab.label}</span>
            <span className="account-tab-hint">{tab.hint}</span>
          </Link>
        );
      })}
    </nav>
  );
}
