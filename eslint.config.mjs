// Flat config ESLint v9 — monorepo TypeScript (pnpm + Turbo).
// Règles de qualité/bugs ; le formatage est délégué à Prettier
// (eslint-config-prettier désactive les règles de style en conflit).
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    // Artefacts générés / non sources — jamais lintés.
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/*.tsbuildinfo",
      "**/next-env.d.ts",
      "packages/db/prisma/migrations/**",
      "packages/db/generated/**"
    ]
  },

  // Base JS + TypeScript recommandé (sans type-checking, rapide et suffisant ici).
  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      globals: { ...globals.node }
    },
    rules: {
      // Cohérent avec AGENTS.md : pas d'any non justifié, pas de var inutilisée.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      // Préférer `import type` pour les imports de types (convention du repo).
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "separate-type-imports" }
      ],
      eqeqeq: ["error", "always"],
      "no-console": "off"
    }
  },

  // App Next.js : règles core-web-vitals.
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    languageOptions: {
      globals: { ...globals.browser }
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // App Router : pas de dossier `pages/`, règle non pertinente.
      "@next/next/no-html-link-for-pages": "off"
    }
  },

  // Doit rester en dernier : neutralise les règles en conflit avec Prettier.
  prettier
);
