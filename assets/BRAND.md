# Aviso Previo — brand guide

**Name** · *Aviso previo* is Spanish for "prior notice", which is the thing the product protects.
**Audience** · Privacy counsel and DPOs who own the contracts, compliance leads who answer for them, and engineers who would otherwise ship past them.
**Personality** · Calm, exact, evidence-first. It reads like a well-kept contract register, not a dashboard toy. It states what the contract says, quotes it, and never guesses.

## Principles

Minimal and quiet. Hairlines and whitespace instead of boxes, shadows and fills. One accent colour. Type does the work.

## Mark

A plain **A** whose crossbar is the **notice window**, in the one accent colour. No tile, no effects.

| File | Use |
| --- | --- |
| `logo/aviso-previo-mark.svg` | Glyph on light backgrounds |
| `logo/aviso-previo-mark-mono.svg` | One colour via `currentColor` |
| `logo/aviso-previo-logo.svg` / `-reversed.svg` | Horizontal lockup, light / dark backgrounds |
| `icons/app-icon.svg`, `app-icon-144.png`, `app-icon-512.png`, `favicon.svg` | Marketplace, Forge listing, favicon (the only place a dark tile is used) |
| `social/cover-1500x1000.png` | Devpost cover (3:2) |

Clear space equals the crossbar width. Minimum 20 px. Regenerate PNGs with `npm run assets`.

## Colour

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| Ink | `#141414` | `#EDEDEA` | Text, primary button |
| Paper | `#FCFCFB` | `#0E0E0F` | Background |
| Line | `#EBEBE7` | `#232325` | Hairlines |
| Muted | `#8B8B86` | `#7C7C77` | Secondary text |
| Accent teal | `#0B7A70` | `#4FD1C1` | Confirmed, progress, the mark |

Status is a 6 px dot beside plain text: teal confirmed, amber awaiting review, red counsel to decide. Never a filled badge.

## Type

- **Inter**: all UI text, headings, numerals (light weight for big figures).
- **Source Serif 4**: contract clauses only, so the signed wording always looks like the document.
- Both are bundled in `admin-ui` (Forge's CSP blocks external fonts).

## Voice

- Say what the contract says: "60 calendar days", not "a long notice period".
- Say who decides: "Counsel to decide", not "AI uncertain".
- No exclamation marks, emoji or "AI-powered" in the UI. Footer: *Aviso Previo summarizes your contracts. It is not legal advice.* and *Sample data · Fictional*.

## Where it lives

- **Admin page** (`admin-ui/`, Custom UI): full brand, tokens in `src/styles.css`, light and dark.
- **Issue panel / glance** (`src/frontend/`, UI Kit): native Atlassian components, same status semantics through Lozenges.
