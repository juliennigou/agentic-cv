# Direction artistique — Agentic CV

> **Guide narratif détaillé (le _pourquoi_).** Toute décision visuelle doit pouvoir
> se justifier par ce document.
>
> Les **valeurs exactes des tokens** (la source canonique lisible par les agents)
> vivent dans [`DESIGN.md`](../DESIGN.md) à la racine, au format Google Labs
> (front matter YAML). Le code les applique via les design tokens de
> `apps/web/src/app/globals.css`, miroir 1:1 du YAML. En cas de doute sur une
> valeur, `DESIGN.md` fait foi ; ce document explique l'intention.

## 1. Intention

Agentic CV aide des étudiants et jeunes diplômés à **trouver vite une offre V.I.E
pertinente** puis à **préparer une candidature propre**. L'interface doit donc se
comporter comme un **outil**, pas comme une vitrine marketing :

- on comprend en trois secondes à quoi sert la plateforme ;
- l'élément central est une **liste d'offres** lisible et filtrable ;
- rien ne distrait de la lecture et de la comparaison des offres.

Le produit doit paraître **moderne, épuré et précis**, et surtout **ne pas avoir
l'air d'un template généré**. On évite donc les marqueurs visuels devenus génériques :
gradients violets, ombres diffuses partout, gros coins arrondis, emojis décoratifs,
illustrations 3D, glassmorphism.

## 2. Personnalité visuelle — « tech sobre / mono »

Le parti pris est celui d'un **outil de travail soigné**, dans la lignée des produits
comme Linear, Vercel ou Mercury, mais avec une signature propre.

Trois principes :

1. **Le contenu d'abord.** Beaucoup de blanc, une grille stricte, une hiérarchie
   typographique nette. La couleur est rare et signifiante.
2. **Des lignes, pas des ombres.** La séparation se fait par des **hairlines** (filets
   d'1 px) et par l'espace, pas par des ombres portées. Le rendu reste plat et net.
3. **Une signature « machine ».** Le **monospace** (IBM Plex Mono) habille les détails
   structurés — labels, tags pays/contrat, dates, identifiants, compteurs. C'est ce qui
   donne le caractère « outil » et éloigne du look générique, sans nuire à la lisibilité
   du corps de texte.

## 3. Couleur

Palette froide, contrastée, économe. Une seule couleur d'accent forte ; le reste est
une échelle de gris neutres légèrement bleutés. Mode clair en premier, variables prêtes
pour un futur mode sombre.

| Rôle          | Token             | Clair     | Usage                                             |
| ------------- | ----------------- | --------- | ------------------------------------------------- |
| Fond          | `--bg`            | `#F6F7F9` | Fond de page, neutre froid très clair             |
| Surface       | `--surface`       | `#FFFFFF` | Cartes, champs, panneaux                          |
| Surface alt   | `--surface-2`     | `#F1F3F6` | Survol, zones secondaires, code                   |
| Encre         | `--ink`           | `#0E1217` | Texte principal, titres                           |
| Texte attenué | `--muted`         | `#5B6573` | Méta, labels, texte secondaire                    |
| Texte faible  | `--faint`         | `#8A93A1` | Placeholders, mentions                            |
| Hairline      | `--border`        | `#E4E7EC` | Bordures 1 px, séparateurs                        |
| Hairline fort | `--border-strong` | `#CBD1DA` | Bordures au survol / focus                        |
| Accent        | `--accent`        | `#2347F0` | Liens, action primaire, focus (cobalt électrique) |
| Accent survol | `--accent-hover`  | `#1B38C7` | État pressé / survol                              |
| Accent doux   | `--accent-soft`   | `#EAEEFE` | Fond de badge ou d'état sélectionné               |

Couleurs de **statut** (suivi de candidature, états système) — usage strictement
fonctionnel, jamais décoratif :

| Rôle      | Token       | Clair     |
| --------- | ----------- | --------- |
| Succès    | `--success` | `#0E8A5F` |
| Attention | `--warning` | `#B7791F` |
| Erreur    | `--danger`  | `#C0341D` |

Règles :

- **Un seul accent** à l'écran à la fois. Si tout est mis en avant, rien ne l'est.
- Le texte sur fond respecte un contraste **AA minimum** (`--ink` sur `--surface`,
  `--muted` réservé au texte secondaire ≥ 14 px).
- Les couleurs de statut ne servent qu'à informer (badge, point), pas à colorer des
  surfaces entières.

## 4. Typographie

Trois voix, un seul système :

| Usage              | Famille           | Token            | Pourquoi                                                                                  |
| ------------------ | ----------------- | ---------------- | ----------------------------------------------------------------------------------------- |
| Titres / display   | **Space Grotesk** | `--font-display` | Grotesque géométrique au caractère affirmé ; pose la signature sans nuire à la lisibilité |
| Corps / UI         | **IBM Plex Sans** | `--font-sans`    | Neutre, très lisible en petit, conçue pour les interfaces denses                          |
| Détails structurés | **IBM Plex Mono** | `--font-mono`    | Labels, tags, dates, chiffres, IDs ; donne le ton « outil »                               |

Plex Sans et Plex Mono sont de la même famille : le sans neutre et le mono se marient
naturellement, pendant que Space Grotesk apporte le caractère sur les titres.

**Échelle typographique** (base 16 px, ratio ~1.2–1.25) :

| Token         | Taille         | Usage                          |
| ------------- | -------------- | ------------------------------ |
| `--text-xs`   | 12 px          | Tags mono, mentions légales    |
| `--text-sm`   | 14 px          | Méta, labels, texte secondaire |
| `--text-base` | 16 px          | Corps de texte                 |
| `--text-lg`   | 18 px          | Sous-titres, intro             |
| `--text-xl`   | 21 px          | Titre de carte offre           |
| `--text-2xl`  | 28 px          | Titres de section              |
| `--text-3xl`  | clamp 34→52 px | Titre de page / hero           |

Règles :

- **Display** (Space Grotesk) uniquement pour `h1`/`h2` et le titre de carte. Jamais
  pour de longs paragraphes.
- **Mono** uniquement pour des fragments courts et structurés. Souvent en
  `letter-spacing` léger et parfois en MAJUSCULES pour les labels (`text-transform`).
- Interlignage : `1.1`–`1.2` sur les titres, `1.6` sur le corps.
- Longueur de ligne du corps ≤ ~70 caractères (`max-width` ~ 68ch).

## 5. Espacement, grille et rayons

**Échelle d'espacement** basée sur 4 px, exposée en tokens `--space-1` … `--space-12`
(4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 px). Tout padding/margin/gap doit utiliser
ces tokens, jamais une valeur arbitraire.

**Grille / largeurs :**

- Conteneur principal `--container` = `1120px`, marges latérales mini de `--space-4`.
- Liste d'offres : pleine largeur du conteneur, une offre par ligne (lecture verticale
  rapide), pas de grille en mosaïque.
- Barre d'outils (recherche + filtres) : recherche extensible + filtres à largeur fixe.

**Rayons** — discrets, cohérents avec le ton « tech » (pas de grandes courbes) :

| Token           | Valeur | Usage                       |
| --------------- | ------ | --------------------------- |
| `--radius-sm`   | 4 px   | Champs, boutons, tags       |
| `--radius-md`   | 6 px   | Cartes, panneaux            |
| `--radius-full` | 999 px | Points de statut, pastilles |

## 6. Bordures, ombres, profondeur

- **Bordure standard** : 1 px `--border`. C'est le séparateur par défaut.
- **Pas d'ombres décoratives.** Une seule ombre très subtile autorisée
  (`--shadow-sm`) pour décoller un élément flottant (menu, popover). Les cartes
  posées dans le flux n'ont **pas** d'ombre — elles se définissent par leur hairline.
- La profondeur se lit par la **couleur de surface** (`--surface` vs `--surface-2`) et
  l'espace, pas par l'empilement d'ombres.

## 7. États et interaction

- **Focus visible obligatoire** : anneau `2px` `--accent` avec un léger décalage
  (`outline-offset`). Jamais de `outline: none` sans remplacement.
- **Survol** : on renforce la bordure (`--border` → `--border-strong`) et/ou on passe
  la surface en `--surface-2`. Pas de déplacement ni d'ombre qui « gonfle ».
- **Liens** : couleur `--accent`, soulignement à l'survol, jamais de gras superflu.
- **Transitions** : courtes et sobres — `--motion-fast` 120 ms, `--motion` 200 ms,
  courbe `ease`/`cubic-bezier(0.2, 0, 0, 1)`. On anime `color`, `background`,
  `border-color`, `opacity` — pas de grandes animations de layout.
- Respecter `prefers-reduced-motion`.

## 8. Composants clés (V1)

**Carte offre** (`.offer-card`) — l'atome central du produit :

- Surface blanche, hairline, rayon `--radius-md`, padding `--space-5`.
- Titre en Space Grotesk (`--text-xl`).
- Méta en mono (`--text-sm`, `--muted`) : entreprise · pays · ville · date, séparés par
  des points médians ou des tags.
- Tags (pays / contrat / durée) en mono `--text-xs`, fond `--surface-2`, hairline.
- Au survol : bordure renforcée, fond légèrement teinté. La carte entière est cliquable.

**Barre d'outils** (`.toolbar`) : champ de recherche large + filtres (pays, tri).
Champs hauts de 44 px, hairline, focus accent. Labels associés pour l'accessibilité.

**État vide** (`.empty-state`) : bordure en pointillés, texte `--muted`, message qui
explique _quoi faire_ (pas juste « aucun résultat »).

**Barre de navigation** (`.topbar`) : marque (`.brand`) à gauche en Space Grotesk,
navigation discrète à droite en `--muted`. Minimal, sans fond ni ombre.

## 9. Accessibilité (socle)

- Contraste texte AA minimum partout.
- Cibles tactiles ≥ 44 px.
- Tout élément interactif atteignable au clavier avec focus visible.
- `lang="fr"` sur le document, libellés `aria-label` sur les zones de recherche et nav.
- Ne pas coder l'information uniquement par la couleur (les statuts ont un libellé).

## 10. Ce qu'on évite (anti-patterns)

- Gradients colorés, néons, glassmorphism, ombres diffuses multiples.
- Coins très arrondis (> 8 px) sur les conteneurs.
- Emojis et illustrations décoratives dans l'UI produit.
- Multiplier les couleurs d'accent.
- Texte gris clair sur fond clair en dessous de 14 px.
- Animations longues ou « rebondissantes ».

---

_Mise en œuvre : voir les design tokens en tête de `apps/web/src/app/globals.css`.
Les polices sont chargées via `next/font` dans `apps/web/src/app/layout.tsx` et
exposées en variables CSS (`--font-display`, `--font-sans`, `--font-mono`)._
