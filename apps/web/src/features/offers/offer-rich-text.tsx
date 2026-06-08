/**
 * Rendu lisible du texte brut d'une offre (mission, profil, entreprise).
 *
 * Les sources scrappées mêlent : blocs séparés par lignes vides, puces (`•`,
 * `-`, `*`), sections numérotées (`1. Titre`), sous-titres en capitales ou
 * terminés par `:`, et sous-listes (une puce finissant par `:` suivie de lignes
 * nues). Affiché tel quel dans un `<p>`, tout s'écrase en un pavé. Ce composant
 * reconstruit la hiérarchie sans rien réécrire du contenu.
 */

type OfferListItem = { text: string; children: string[] };

type OfferTextBlock =
  | { type: "heading"; text: string }
  | { type: "list"; items: OfferListItem[] }
  | { type: "paragraph"; text: string };

// Caractères de formatage invisibles fréquents dans le scrap (espace
// zéro-largeur, ZWNJ/ZWJ, BOM, soft hyphen…). La catégorie Unicode `Cf` les
// couvre sans avoir à insérer ces caractères dans la source.
const INVISIBLE_CHARS = /\p{Cf}/gu;

// Puces glyphes : reconnues même sans espace après (ex. "•Apple").
const GLYPH_BULLET = /^([•·▪◦‣])\s*(.+)$/;
// Puces tiret/astérisque : exigent un espace pour ne pas casser un mot.
const DASH_BULLET = /^[-–—*+]\s+(.+)$/;
// Ligne numérotée : "1. …" / "2) …".
const NUMBERED = /^\d+[.)]\s+(.+)$/;

/** Extrait le texte d'une puce (glyphe ou tiret), ou `null` si la ligne n'en est pas une. */
function stripBullet(line: string): string | null {
  const glyph = line.match(GLYPH_BULLET);
  if (glyph) return glyph[2].trim();
  const dash = line.match(DASH_BULLET);
  if (dash) return dash[1].trim();
  return null;
}

/** Une ligne courte sans ponctuation finale, en capitales ou terminée par `:`, est un sous-titre. */
function isHeading(line: string): boolean {
  if (line.length > 64) return false;
  if (/[.!?]$/.test(line)) return false;
  if (!/[a-zA-ZÀ-ÿ]/.test(line)) return false;
  const isAllCaps = line === line.toUpperCase();
  const endsWithColon = line.endsWith(":");
  return isAllCaps || endsWithColon;
}

export function parseOfferText(raw: string): OfferTextBlock[] {
  const cleaned = raw.replace(/\r\n/g, "\n").replace(INVISIBLE_CHARS, "");
  const lines = cleaned.split("\n").map((line) => line.trim());

  const blocks: OfferTextBlock[] = [];
  let currentList: OfferListItem[] | null = null;

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      blocks.push({ type: "list", items: currentList });
    }
    currentList = null;
  };

  // La dernière puce attend-elle des sous-items ? (elle finit par `:`)
  const openParent = (): OfferListItem | null => {
    if (!currentList || currentList.length === 0) return null;
    const last = currentList[currentList.length - 1];
    return last.text.endsWith(":") ? last : null;
  };

  for (const line of lines) {
    // Une ligne vide ne ferme pas la liste : puces et sous-items sont espacés.
    if (line.length === 0) {
      continue;
    }

    const bulletText = stripBullet(line);
    if (bulletText !== null) {
      if (!currentList) currentList = [];
      currentList.push({ text: bulletText, children: [] });
      continue;
    }

    // Ligne numérotée : intitulé court = sous-titre de section ("1. Support
    // Informatique Local") ; sinon vraie étape ordonnée → paragraphe.
    const numbered = line.match(NUMBERED);
    if (numbered) {
      flushList();
      const body = numbered[1].trim();
      const looksLikeTitle = body.length <= 60 && !/[,;.]$/.test(body);
      blocks.push(
        looksLikeTitle ? { type: "heading", text: line } : { type: "paragraph", text: line }
      );
      continue;
    }

    if (isHeading(line)) {
      flushList();
      blocks.push({ type: "heading", text: line });
      continue;
    }

    // Ligne nue après une puce finissant par `:` → sous-item de cette puce.
    const parent = openParent();
    if (parent) {
      parent.children.push(line);
      continue;
    }

    flushList();
    blocks.push({ type: "paragraph", text: line });
  }
  flushList();

  return blocks;
}

export function OfferRichText({ text }: { text: string }) {
  const blocks = parseOfferText(text);

  return (
    <div className="grid gap-3">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <p
              key={index}
              className="mt-2 font-sans text-base font-semibold tracking-[-0.01em] text-foreground first:mt-0"
            >
              {block.text}
            </p>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="m-0 grid list-none gap-1.5 p-0">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="grid gap-1.5">
                  <div className="flex gap-2.5 leading-relaxed text-[var(--ink)]">
                    <span aria-hidden className="mt-[2px] select-none text-[var(--accent)]">
                      •
                    </span>
                    <span>{item.text}</span>
                  </div>
                  {item.children.length > 0 ? (
                    <ul className="m-0 grid list-none gap-1 pl-7">
                      {item.children.map((child, childIndex) => (
                        <li
                          key={childIndex}
                          className="flex gap-2.5 leading-relaxed text-muted-foreground"
                        >
                          <span aria-hidden className="mt-[2px] select-none text-[var(--faint)]">
                            –
                          </span>
                          <span>{child}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="m-0 leading-relaxed text-[var(--ink)]">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
