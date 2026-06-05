import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Agentic CV",
  description: "Recherche d'offres V.I.E et candidatures adaptees pour etudiants."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

