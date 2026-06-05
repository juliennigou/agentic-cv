---
version: alpha
name: Agentic CV
description: >
  Design system for Agentic CV — a tool that helps students find V.I.E job
  offers and prepare clean applications. Style: "tech-sober / mono" — light
  background, hairline borders, a single cool accent, and monospace for
  structured details. Canonical token source; mirrored 1:1 in
  apps/web/src/app/globals.css. Extended rationale (FR): docs/direction-artistique.md.

colors:
  bg: "#f6f7f9"
  surface: "#ffffff"
  surfaceAlt: "#f1f3f6"
  ink: "#0e1217"
  muted: "#5b6573"
  faint: "#8a93a1"
  border: "#e4e7ec"
  borderStrong: "#cbd1da"
  accent: "#2347f0"
  accentHover: "#1b38c7"
  accentSoft: "#eaeefe"
  onAccent: "#ffffff"
  success: "#0e8a5f"
  warning: "#b7791f"
  danger: "#c0341d"

typography:
  pageTitle:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.125rem, 5vw, 3.25rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  sectionTitle:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  cardTitle:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  brand:
    fontFamily: "Space Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    letterSpacing: "-0.01em"
  bodyLarge:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "IBM Plex Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  meta:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    letterSpacing: "0.02em"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    letterSpacing: "0.02em"
  tag:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.02em"

rounded:
  sm: "4px"
  md: "6px"
  full: "999px"

spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  7: "32px"
  8: "40px"
  9: "48px"
  10: "64px"
  11: "80px"
  12: "96px"

components:
  topbar:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.muted}"
  brand:
    typography: "{typography.brand}"
    textColor: "{colors.ink}"
  navLink:
    typography: "{typography.meta}"
    textColor: "{colors.muted}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.border}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "0 {spacing.4}"
  button:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.onAccent}"
    rounded: "{rounded.sm}"
    height: "44px"
    padding: "0 {spacing.5}"
    typography: "{typography.label}"
  buttonHover:
    backgroundColor: "{colors.accentHover}"
  offerCard:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    padding: "{spacing.5}"
  offerCardHover:
    borderColor: "{colors.borderStrong}"
  offerMeta:
    typography: "{typography.meta}"
    textColor: "{colors.muted}"
  tag:
    backgroundColor: "{colors.surfaceAlt}"
    textColor: "{colors.muted}"
    borderColor: "{colors.border}"
    rounded: "{rounded.sm}"
    typography: "{typography.tag}"
    padding: "{spacing.1} {spacing.2}"
  emptyState:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.muted}"
    borderColor: "{colors.borderStrong}"
    rounded: "{rounded.md}"
    padding: "{spacing.6}"
  focusRing:
    borderColor: "{colors.accent}"
---

# Agentic CV — Design System

Agentic CV is a **tool**, not a marketing site. It helps students and recent
graduates **find a relevant V.I.E offer fast** and then **prepare a clean
application**. The central object is a **scannable, filterable list of offers**.
Everything serves reading and comparing offers; nothing decorative competes with it.

The aesthetic is **tech-sober / mono**: a precise, calm working tool in the spirit
of Linear, Vercel or Mercury, with its own signature. It must look modern, clean
and intentional — and deliberately **not look like a generated template**.

## Overview

Three guiding principles:

1. **Content first.** Generous whitespace, a strict grid, a sharp typographic
   hierarchy. Color is rare and meaningful.
2. **Lines, not shadows.** Separation comes from **hairlines** (1px borders) and
   space, never from drop shadows. The surface stays flat and crisp.
3. **A "machine" signature.** Monospace (IBM Plex Mono) dresses structured details
   — labels, country/contract tags, dates, IDs, counters. This is the identity
   marker that pushes the design away from the generic look, without hurting body
   readability.

Light mode ships first; tokens are structured so a dark theme can be added later.

## Colors

Cool, contrasted, frugal palette. **One** strong accent (`accent`, cobalt
`#2347f0`); everything else is a neutral, slightly blue-tinted gray scale.

- `bg` / `surface` / `surfaceAlt` — page background, cards, hover & secondary zones.
- `ink` / `muted` / `faint` — primary text, secondary text, placeholders.
- `border` / `borderStrong` — default hairline, and the reinforced border on hover/focus.
- `accent` / `accentHover` / `accentSoft` — links, primary action, focus ring, selected-state fill.
- `success` / `warning` / `danger` — **functional only** (application status, system
  states). Never used to fill whole surfaces or as decoration.

Rules: only **one accent on screen at a time**; text meets **WCAG AA** contrast
(`muted` reserved for secondary text ≥ 14px); status colors only inform (badge or dot).

## Typography

Three voices, one system:

- **Space Grotesk** (`pageTitle`, `sectionTitle`, `cardTitle`, `brand`) — geometric
  grotesque with character. Sets the signature on titles only; never long paragraphs.
- **IBM Plex Sans** (`body`, `bodyLarge`) — neutral, highly legible in dense UI.
- **IBM Plex Mono** (`meta`, `label`, `tag`) — structured details; the "tool" tone.
  Often slightly tracked, sometimes uppercased for labels.

Plex Sans and Plex Mono are siblings, so the neutral body and the mono blend
naturally while Space Grotesk carries the character.

Line-height: `1.1`–`1.2` on titles, `1.6` on body. Keep body measure ≤ ~68ch.

## Layout

- Main container width **1120px**, side gutters ≥ `spacing.8` (desktop).
- Offer list is **full container width, one offer per row** (fast vertical scan) —
  not a card mosaic.
- Toolbar: an expanding search field plus fixed-width filters (country, sort).
- Spacing uses the 4px scale (`spacing.1` … `spacing.12`) exclusively — no
  arbitrary values.

## Elevation & Depth

- Default separator is a **1px `border` hairline**.
- **No decorative shadows.** A single very subtle shadow is allowed for genuinely
  floating elements (menu, popover). Cards in the flow have **no** shadow — they are
  defined by their hairline.
- Depth reads through **surface color** (`surface` vs `surfaceAlt`) and space, not
  stacked shadows.

## Shapes

Discreet radii consistent with the tech tone — no large curves.

- `rounded.sm` (4px) — fields, buttons, tags.
- `rounded.md` (6px) — cards, panels.
- `rounded.full` — status dots, pills.

## Components

- **offerCard** — the central atom. White surface, hairline, `rounded.md`,
  `spacing.5` padding. Title in `cardTitle`; meta in `offerMeta` (mono) as
  company · country · city · date; optional `tag`s for country/contract/duration.
  Whole card is clickable; on hover the border reinforces (`offerCardHover`).
- **field** — 44px tall, hairline, `rounded.sm`; on focus the border becomes
  `accent` with a visible ring.
- **button** — primary action on `accent` / `onAccent`, `buttonHover` on press.
- **tag** — mono `tag` typography, `surfaceAlt` fill, hairline; short structured
  values, usually uppercased.
- **emptyState** — dashed `borderStrong`, `muted` text; the message says _what to
  do_, not just "no results".
- **topbar / brand / navLink** — minimal bar, no background or shadow; brand in
  Space Grotesk, nav links in muted mono.
- **focusRing** — 2px `accent` outline with offset on every interactive element;
  never remove focus without a replacement.

Motion is short and sober (120ms / 200ms, ease-out); animate `color`,
`background`, `border-color`, `opacity` — not layout. Respect
`prefers-reduced-motion`.

## Do's and Don'ts

**Do**

- Separate with hairlines and whitespace.
- Keep a single accent; let status colors only inform.
- Use mono for short, structured fragments (tags, meta, dates, IDs).
- Keep one offer per row for fast scanning.
- Guarantee a visible focus state and AA contrast everywhere.

**Don't**

- No gradients, neon, glassmorphism, or multiple diffuse shadows.
- No large radii (> 8px) on containers.
- No decorative emojis or illustrations in the product UI.
- No multiple accent colors.
- No light-gray text on light background below 14px.
- No long or bouncy animations.
