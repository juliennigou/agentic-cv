# Préparer ma candidature — plan d'implémentation

> Workspace de candidature : transforme une offre sauvegardée en un espace de
> travail dédié. MVP = l'app prépare un **pack de contexte** copiable pour
> ChatGPT, l'utilisateur itère côté ChatGPT, puis recolle CV ciblé / lettre /
> message dans l'app, sauvegarde un brouillon et valide.

## Décision d'architecture (verrouillée)

- **Un seul axe de statut.** On garde `Application.status: ApplicationStatus`
  comme axe pipeline unique (`in_progress` à la création du workspace,
  `completed` à la validation). **Pas** de `ApplicationWorkspaceStatus`.
- L'avancement « brouillon / validée » se **dérive** de `Application.validatedAt`.
- Le détail par document vit sur les **artefacts** (`ApplicationArtifact`).
- Route propre `/candidatures/[id]` (la candidature est un objet à part entière).
- Le CTA depuis l'offre passe par une **server action** (pas d'écriture DB sur un GET).
- MVP : pas de `contentJson` ni `documentId` sur les artefacts (réservés V2 : PDF, versions).

### Mécanique ChatGPT

On ne peut pas deep-linker une conversation pré-remplie. Mécanisme réel :
**bouton « copier le pack » + lien `chatgpt.com`**. Le champ
`chatgptConversationUrl` sert à ressaisir l'URL après coup pour rouvrir la conv.

### PII

Le pack **exclut par défaut** email / téléphone / `storagePath` / clés. Les
coordonnées ne sont incluses que via une option explicite (`includeContact`).

---

## Suivi d'avancement

Statuts : ⬜ à faire · 🟡 en cours · ✅ fait · ⚠️ bloqué

### Phase 1 — Schéma Prisma + migration ✅

- ✅ Enums `ApplicationArtifactKind`, `ApplicationArtifactStatus`
- ✅ `Application` : `+ chatgptConversationUrl`, `+ validatedAt`, `+ artifacts ApplicationArtifact[]`
- ✅ Modèle `ApplicationArtifact` (`@@unique([applicationId, kind])`, `onDelete: Cascade`, `@@map("application_artifacts")`)
- ✅ Migration `20260608130000_application_workspace` écrite à la main (évite le diff `embedding`/`fts`), appliquée via `migrate deploy` ; `migrate status` → « up to date », aucun drift
- ✅ `db:generate`

### Phase 2 — Repository ✅

Fichier : `packages/db/src/repositories/application-workspace-repository.ts`

- ✅ `createOrGetApplicationWorkspace` — profil + savedJob, **upsert** Application (status `in_progress` à la création seulement, jamais écrasé ensuite)
- ✅ `getApplicationWorkspace` — vérif appartenance (`findFirst id+userId` → `null`), offre + artefacts (Record par kind) + profil
- ✅ `saveApplicationDraft` — upsert par kind (`pasted`/`draft`), MAJ URL ChatGPT, garde appartenance
- ✅ `validateApplicationWorkspace` — exige 3 contenus, `validatedAt`, `status = completed`, artefacts `validated`
- ✅ Exports + const `APPLICATION_ARTIFACT_KINDS` depuis `index.ts` ; `pnpm --filter @agentic-cv/db typecheck` OK

### Phase 3 — Pack ChatGPT + schémas Zod ✅

Dossier : `apps/web/src/features/applications/`

- ✅ `application-schema.ts` — `prepareApplicationSchema`, `applicationDraftSchema` (contenus facultatifs), `applicationValidateSchema` (3 requis), `toArtifactInputs`, type `ApplicationArtifactKind` dérivé du tuple (pas de dépendance Prisma)
- ✅ `context-pack.ts` — `buildApplicationContextPack({ offer, profile, includeContact })` pure & déterministe ; CV parsé via `resumeSchema` ; PII exclue par défaut
- ✅ Vérif : aucun harnais de test web → vérifié via script jetable end-to-end (voir journal), pas de framework ajouté (YAGNI)

### Phase 4 — Server actions ✅

Fichier : `apps/web/src/features/applications/actions.ts`

- ✅ `prepareApplication` — auth/redirect via `/auth/continue?prepareJobOfferId=…`, createOrGet, redirect `/candidatures/[id]`
- ✅ `saveApplicationDraft` — Zod, persiste, revalidate (reste sur la page)
- ✅ `validateApplicationDraft` — Zod (3 requis), persiste puis valide, revalidate
- ✅ `/auth/continue` étendu pour reprendre la préparation après connexion

### Phase 5 — Route workspace ✅

Fichier : `apps/web/src/app/candidatures/[id]/page.tsx` (+ `context-pack-panel.tsx` client)

- ✅ Garde auth (redirect `/connexion?next=`) + validation uuid + `notFound()`
- ✅ Header (titre, entreprise, badge Brouillon/Validée)
- ✅ Section Pack (`ContextPackPanel` : textarea readonly + bouton copier + lien ChatGPT)
- ✅ Section retour (form : URL + 3 textareas + boutons Enregistrer / Valider via `formAction`)
- ✅ Aside (lien offre d'origine, retour `/mes-vie`)

### Phase 6 — Intégration parcours ✅

- ✅ `offres/[id]/page.tsx` — `<Button disabled>` remplacé par `<form action={prepareApplication}>` (CTA actif)
- ✅ `mes-vie/page.tsx` — bouton « Préparer / Revoir » (kanban + table) + badge « Validée »
- ✅ Repo `listUserFavoriteJobOffers` étendu avec `applicationValidatedAt` (+ type `TrackedJobOffer`)

### Phase 7 — Vérification ✅

- ✅ `db:generate` (client à jour)
- ✅ `pnpm typecheck` — 8/8
- ✅ `pnpm lint` — 0 erreur, 0 warning
- ✅ End-to-end via script jetable (createOrGet idempotent, pack OK, PII absente, save→`pasted`, validate→`completed`/`validated`, cleanup)
- ✅ HTTP : `/offres/[id]` rend le CTA actif (200) ; `/candidatures/[id]` compile et applique la garde d'auth (307 → `/connexion`)

---

## Journal d'implémentation

- **Phase 1** : migration écrite à la main (`20260608130000_application_workspace`) pour éviter le diff parasite `embedding`/`fts` ; `migrate status` confirme « up to date », zéro drift.
- **Phase 2** : `createOrGetApplicationWorkspace` en `upsert` (status `in_progress` à la création seulement) — coexiste avec le flux favoris/suivi existant qui crée aussi des `Application`.
- **Phase 3** : pas de harnais de test (vitest absent) → vérif par script tsx jetable, conforme à AGENTS.md « rester simple ».
- **Phase 7 (bugs corrigés)** : `.filter(Boolean)` ne narrow pas (→ prédicat `is string`) ; `== null` redondant supprimé (eqeqeq) ; `import type` pour le tuple ; const `workspaceProfileSelect` inutilisée supprimée.
- **Reste à valider manuellement** (nécessite une session connectée) : rendu visuel complet du workspace `/candidatures/[id]` une fois loggé, et copie du pack via le bouton client.

## Pistes V2 (hors MVP)

- Export PDF CV/lettre via `packages/documents` (champ `documentId` à ajouter aux artefacts).
- Versioning des brouillons (`contentJson`).
- Génération intégrée optionnelle via `packages/ai`/LiteLLM.
- Option `includeContact` exposée dans l'UI (coordonnées dans le pack).
