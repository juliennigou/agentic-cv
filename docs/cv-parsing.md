# Parsing de CV (gratuit)

Flux de la fonctionnalité « déposer un CV → pré-remplir le profil ». Objectif :
rester 100 % gratuit, sans API payante.

## Étapes

1. **Upload** (`apps/web/src/features/account/cv-actions.ts`) — server action
   `uploadResume`. Valide le PDF (≤ 5 Mo, `application/pdf`) avec Zod.
2. **Stockage** — le PDF est déposé dans le bucket privé Supabase Storage
   `user-documents` (chemin `{userId}/{uuid}.pdf`) via le client service-role
   (`apps/web/src/lib/supabase/admin.ts`) et tracé dans `user_documents`
   (type `base_resume`). Sauté proprement si `SUPABASE_SERVICE_ROLE_KEY` absent.
3. **Extraction texte** (`packages/documents`) — `extractPdfText`, en local via
   `unpdf` (dérivé de pdf.js). Aucun appel réseau. Un PDF scanné (sans couche
   texte) lève `EmptyPdfTextError` → message clair (l'OCR est hors scope).
4. **Structuration** (`packages/ai/src/resume/litellm.ts`) — `structureResume`
   envoie le texte au proxy LiteLLM (`deepseek/deepseek-chat` par défaut, quasi
   gratuit), même canal que la structuration des offres. Sortie validée par
   `resumeSchema` (`@agentic-cv/shared`).
5. **Relecture & enregistrement** — le CV structuré est renvoyé au client
   (`cv-upload.tsx` → `resume-review-form.tsx`) pour correction, puis
   `saveResumeProfile` écrit `user_profiles.resume_data` et synchronise les
   champs plats `skills[]` / `languages[]` / contact.

## Configuration

- Bucket Supabase **privé** `user-documents` + `SUPABASE_SERVICE_ROLE_KEY`.
- `LITELLM_BASE_URL` (+ `LITELLM_API_KEY` si protégé). Sans LiteLLM, le fichier
  est conservé mais le profil n'est pas pré-rempli.
- Modèle ajustable via `LITELLM_RESUME_MODEL`.

## Hors scope

- OCR des PDF scannés (coût/poids).
- Embedding du CV pour les alertes « offres ↔ CV » : `resume_data` est conçu pour
  l'alimenter ensuite (réutilisera `embedTexts` / pgvector déjà en place).
