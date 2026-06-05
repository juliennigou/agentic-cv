# Cahier des charges Agentic CV

## Contexte

Agentic CV est un projet open source destine principalement aux etudiants et jeunes diplomes qui cherchent un V.I.E, un stage, une alternance ou un premier emploi.

Le probleme initial est simple: les offres existent deja, mais leur recherche, leur comparaison et leur exploitation pour candidater ne sont pas assez agreables. La plateforme doit centraliser des offres scrapees, les rendre plus faciles a explorer, puis permettre plus tard de generer des candidatures adaptees a chaque offre.

La premiere source ciblee est Business France V.I.E.

## Objectifs

### Priorite produit

La priorite est de prouver rapidement que la plateforme peut produire une base d'offres fiable et exploitable. Le premier jalon doit donc rester centre sur le scraping Business France, l'ETL commun et la qualite des donnees.

L'authentification et les documents arrivent ensuite pour preparer les usages personnalises. L'IA est importante, mais elle ne doit pas retarder la validation du socle scraping, compte et consultation.

### Objectifs V1

- Scraper les offres Business France V.I.E.
- Normaliser les offres dans une base commune.
- Eviter les doublons.
- Garder un historique des runs de scraping.
- Documenter comment ajouter une nouvelle source sans modifier le frontend.

### Objectifs V2

- Creer un compte utilisateur.
- Completer un profil candidat.
- Deposer un CV ou des documents.

### Objectifs V3

- Afficher les offres dans une interface claire.
- Permettre une recherche simple.
- Sauvegarder des offres.
- Suivre ses candidatures.

### Objectifs V4

- Analyser une offre avec IA.
- Comparer une offre au profil candidat.
- Generer un CV adapte.
- Generer une lettre de motivation.
- Exporter les documents.

## Hors scope initial

Ces fonctionnalites ne sont pas prioritaires pour la premiere version:

- Authentification obligatoire pour consulter les offres.
- Upload de documents.
- Scraping multi-sites complet.
- Paiement.
- Abonnement.
- Envoi automatique de candidatures.
- Agent IA autonome.
- Scoring avance des offres.
- Alertes email.
- Application mobile.
- Stockage persistant des cles API utilisateur.

## Utilisateurs cibles

### Etudiant ou jeune diplome

Besoins:

- Trouver rapidement des offres pertinentes.
- Comprendre si son profil correspond.
- Sauvegarder des offres interessantes.
- Preparer des candidatures propres.

### Administrateur projet

Besoins:

- Lancer ou surveiller les scrapers.
- Voir les erreurs.
- Verifier combien d'offres ont ete creees ou mises a jour.
- Ajouter progressivement de nouvelles sources.

## Parcours utilisateur cible

### Parcours V1

1. L'administrateur lance le scraper Business France.
2. Le systeme extrait, normalise et deduplique les offres.
3. Le systeme enregistre un run de scraping avec ses compteurs.
4. Les offres sont disponibles en base pour etre consultees par l'application.

### Parcours V2

1. L'utilisateur cree un compte.
2. Il complete son profil.
3. Il depose son CV de base.

### Parcours V3

1. L'utilisateur arrive sur la liste des offres.
2. Il recherche par mot-cle, pays, entreprise ou domaine.
3. Il consulte une page detail.
4. Il sauvegarde une offre dans son compte.
5. Il suit son statut de candidature.

### Parcours V4

1. L'utilisateur selectionne une offre.
2. Il demande une analyse de l'offre.
3. Il fournit sa cle API au moment de la generation ou utilise une configuration securisee.
4. Le systeme produit un CV adapte et/ou une lettre.
5. L'utilisateur telecharge le document.

## Fonctionnalites detaillees

## 1. Scraping Business France

### Description

Le systeme doit recuperer les offres V.I.E depuis Business France et les transformer en offres normalisees utilisables par l'application.

### Exigences

- Utiliser Playwright.
- Recuperer les pages de liste.
- Gerer la pagination.
- Recuperer les pages detail si necessaire.
- Extraire les champs disponibles.
- Enregistrer les donnees brutes pour debug.
- Normaliser les donnees.
- Inserer ou mettre a jour les offres en base.
- Enregistrer un run de scraping.

### Champs attendus

- Titre
- Entreprise
- Pays
- Ville
- Type de contrat
- Duree
- Description
- Profil recherche
- Date de publication
- URL source
- Identifiant externe si disponible

### Criteres d'acceptation

- Un script permet de lancer le scraping Business France.
- Les offres sont visibles en base apres execution.
- Relancer le scraper ne cree pas de doublons.
- Les erreurs sont rattachees a un `scrape_run`.
- Les offres ont au minimum un titre, une URL source et une description.
- Le scraper indique clairement combien d'offres ont ete creees, mises a jour, ignorees et echouees.
- Un echec sur une offre ne bloque pas tout le run.

## 2. Pipeline ETL commune

### Description

Le scraping doit passer par une pipeline commune pour eviter de reecrire toute la logique a chaque nouvelle source.

### Etapes

```txt
extract -> parse -> normalize -> validate -> dedupe -> persist
```

### Exigences

- Definir un type commun `RawJobOffer`.
- Definir un type commun `NormalizedJobOffer`.
- Definir une interface `JobScraper`.
- Centraliser la validation.
- Centraliser la deduplication.
- Centraliser l'upsert.

### Criteres d'acceptation

- Business France utilise la pipeline commune.
- Ajouter une nouvelle source ne demande pas de modifier le frontend.
- La base stocke les offres dans un format commun.
- Une offre invalide est rejetee avec une raison exploitable.
- La logique de deduplication est testable sans lancer Playwright.

## 3. Interface offres

### Description

L'application doit permettre de consulter les offres plus confortablement que sur la source d'origine.

### Pages

- `/offres`
- `/offres/[id]`

### Fonctionnalites

- Liste des offres.
- Recherche textuelle.
- Filtre pays.
- Filtre entreprise.
- Filtre date de publication.
- Tri par date.
- Page detail.
- Lien vers l'offre originale.

### Criteres d'acceptation

- L'utilisateur peut trouver une offre par mot-cle.
- L'utilisateur peut filtrer par pays.
- L'utilisateur peut ouvrir le detail d'une offre.
- L'utilisateur peut acceder a l'annonce originale.
- La page liste reste utilisable meme si certains champs optionnels sont absents.
- Les offres affichees proviennent uniquement du format normalise, pas de donnees specifiques Business France.

## 4. Authentification

### Description

L'authentification devient prioritaire apres le socle scraping.

### Exigences

- Utiliser Supabase Auth.
- Connexion email/password.
- Deconnexion.
- Session persistante.
- Protection des pages de compte.

### Criteres d'acceptation

- Un utilisateur peut creer un compte.
- Un utilisateur peut se connecter.
- Un utilisateur non connecte ne peut pas acceder a son espace personnel.
- La consultation publique des offres reste possible sans compte.

## 5. Profil utilisateur

### Description

Le profil utilisateur contiendra les informations necessaires pour sauvegarder les preferences puis, plus tard, generer des candidatures.

### Champs V1

- Prenom
- Nom
- Localisation
- Roles cibles
- Pays cibles
- Competences
- Langues

### Criteres d'acceptation

- Un utilisateur connecte peut creer ou modifier son profil.
- Un utilisateur ne peut pas lire ou modifier le profil d'un autre utilisateur.
- Les champs du profil restent optionnels au depart pour reduire la friction d'inscription.

## 6. Documents utilisateur

### Description

L'utilisateur doit pouvoir rattacher des documents a son compte.

### Documents cibles

- CV de base.
- Lettre de motivation de base.
- Autres documents utiles.

### Exigences

- Upload via Supabase Storage.
- Metadata en base.
- Limite de taille fichier.
- Types acceptes a definir: PDF, DOCX, TXT au minimum.

### Criteres d'acceptation

- Un utilisateur peut uploader un CV.
- Le document est rattache a son compte.
- Un utilisateur ne peut pas acceder aux documents d'un autre utilisateur.
- Un fichier refuse affiche une erreur comprehensible: type non supporte, taille excessive ou upload echoue.

## 7. Sauvegarde et suivi des offres

### Description

L'utilisateur doit pouvoir garder une trace des offres interessantes.

### Fonctionnalites

- Sauvegarder une offre.
- Retirer une offre sauvegardee.
- Associer un statut de candidature.
- Ajouter des notes personnelles.

### Statuts initiaux

- `saved`
- `to_apply`
- `applied`
- `interview`
- `rejected`
- `accepted`

### Criteres d'acceptation

- Un utilisateur connecte peut sauvegarder et retirer une offre.
- Un utilisateur ne voit que ses propres offres sauvegardees.
- Le statut d'une candidature peut etre modifie sans perdre les notes.
- Une offre supprimee ou desactivee cote source reste consultable dans l'historique utilisateur si elle existe encore en base.

## 8. IA et generation de documents

### Description

Cette partie est prevue mais non prioritaire.

### Fonctionnalites futures

- Analyse structuree d'une offre.
- Extraction des competences attendues.
- Matching avec le profil candidat.
- Generation d'un CV adapte.
- Generation d'une lettre de motivation.
- Export des documents.

### Strategie cles API

Pour garder le projet gratuit:

- L'utilisateur utilisera sa propre cle API.
- En premiere version IA, la cle pourra etre fournie au moment de la generation.
- Le stockage chiffre des cles sera etudie seulement si necessaire.

## Contraintes techniques

- Code open source.
- Projet auto-hebergeable.
- Cout minimal.
- TypeScript sur toute la stack applicative.
- PostgreSQL comme base principale.
- Prisma pour le schema et les migrations.
- Playwright pour les scrapers.
- Supabase pour auth, base et storage au depart.
- Design modulaire pour ajouter d'autres sources d'offres.

## Contraintes legales et securite

- Verifier les conditions d'utilisation des sites scrapes.
- Limiter la frequence de scraping.
- Eviter toute surcharge des services sources.
- Respecter les fichiers `robots.txt` quand ils s'appliquent.
- Prevoir un mode de desactivation rapide d'une source si le scraping pose probleme.
- Stocker les donnees personnelles avec prudence.
- Activer RLS sur les tables utilisateur.
- Ne jamais exposer de documents utilisateur publiquement.
- Ne pas stocker de cle API en clair.

## Risques et arbitrages

- Business France peut modifier son site: le scraper doit etre isole, observable et facile a corriger.
- Le scraping peut etre fragile ou legalement limite: la V1 doit fonctionner avec une source desactivable et une documentation claire.
- Le projet vise un cout minimal: eviter les services payants obligatoires dans le chemin critique.
- Les comptes et documents ajoutent des donnees personnelles: ne pas les introduire avant d'avoir des politiques RLS et une gestion storage propres.
- L'IA peut devenir couteuse ou difficile a securiser: elle reste hors MVP strict et utilisera d'abord une cle fournie ponctuellement par l'utilisateur.

## Roadmap

### Etape 1: Socle scraping

- Initialiser le monorepo.
- Configurer Prisma et Supabase.
- Creer le schema `job_offers`.
- Creer le schema `scrape_runs`.
- Implementer `scraper-core`.
- Implementer `scraper-business-france`.
- Ajouter un script CLI.
- Tester la deduplication.

### Etape 2: Auth et compte

- Configurer Supabase Auth.
- Creer l'espace utilisateur.
- Creer le profil candidat.
- Ajouter les politiques RLS.

### Etape 3: Interface offres et documents

- Creer la page liste.
- Creer la page detail.
- Ajouter recherche et filtres.
- Ajouter tri.
- Configurer Supabase Storage.
- Ajouter l'upload de CV.
- Lister les documents du compte.
- Preparer les schemas pour documents generes.

### Etape 4: Suivi candidature

- Sauvegarde d'offres.
- Statuts de candidature.
- Notes.

### Etape 5: IA

- Ajouter le package `ai`.
- Integrer OpenAI Agents SDK.
- Generer une analyse d'offre.
- Generer un CV adapte.
- Generer une lettre.

## Definition du MVP

Le MVP strict est:

- Une base d'offres Business France alimentee par scraper.
- Une pipeline ETL generique.
- Des runs de scraping observables.
- Une documentation claire pour ajouter une nouvelle source.

Le MVP strict ne contient pas:

- Compte utilisateur.
- Interface avancee.
- Upload de documents.
- Sauvegarde d'offres.
- Generation IA.

L'authentification, les documents et l'interface utilisateur viennent juste apres, mais ne doivent pas bloquer la validation du scraper et de la pipeline ETL.

## Definition de succes

Le projet est considere reussi pour la premiere version si:

- Le scraper Business France fonctionne de bout en bout.
- Les offres sont propres, dedupliquees et pretes a etre consultees par l'application.
- L'architecture permet d'ajouter une deuxieme source sans refonte.
- Les premiers ecrans peuvent ensuite exploiter les offres sans logique specifique Business France.
- Le cout d'hebergement reste nul ou tres faible.
- Un contributeur open source peut comprendre ou ajouter une source a partir de la documentation.
