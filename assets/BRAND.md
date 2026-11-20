# Aviso Previo — brand guide

**Name** · *Aviso previo* is Spanish for "prior notice", which is the thing the product protects.
**Audience** · Privacy counsel and DPOs who own the contracts, compliance leads who answer for them, and engineers who would otherwise ship past them.
**Personality** · Calm, exact, evidence-first. It reads like a well-kept contract register, not a dashboard toy. It states what the contract says, quotes it, and never guesses.

## Mark

An **A** whose crossbar is the **notice window** (teal) and whose apex is the **go-live date** (amber). That is the product in one shape: the window must close before the date.

| File | Use |
| --- | --- |
| `logo/aviso-previo-mark.svg` | App icon, avatars, favicon (dark tile) |
| `logo/aviso-previo-mark-mono.svg` | One-colour print, `currentColor` |
| `logo/aviso-previo-logo.svg` | Horizontal lockup on light backgrounds |
| `logo/aviso-previo-logo-reversed.svg` | Horizontal lockup on dark backgrounds |
| `icons/app-icon-144.png`, `app-icon-512.png` | Marketplace / Forge listing |
| `social/cover-1500x1000.png` | Devpost cover (3:2) |

Keep clear space equal to the width of the crossbar. Minimum size 24 px. Do not recolour the dot, rotate, or add effects.
Regenerate PNGs with `npm run assets`.

## Colour

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| Ink | `#101C2C` | `#EDEAE2` | Text, primary buttons |
| Paper | `#F6F4EF` | `#0C1520` | Page background (warm, not stark white) |
| Surface | `#FFFFFF` | `#121E2D` | Cards |
| Notice teal | `#0B8F82` | `#3CCFBF` | Confirmed, progress, the notice window |
| Hold amber | `#B7791F` | `#F2B544` | Awaiting review, the go-live date |
| Risk red | `#B3261E` | `#FF8A80` | Termination rights, counsel-to-decide |
| Region violet | `#4A3F91` | `#B9B0FF` | EU/UK data restrictions |

Colour carries meaning only: teal = settled, amber = pending, red = needs a person, violet = region rule. It is never decoration.

## Type

- **Source Serif 4** (600): headings, numerals, and **contract clauses**. Serif signals "this is the document".
- **Inter**: everything else (tables, labels, buttons).
- Both are bundled in `admin-ui` (Forge's CSP blocks external fonts).

## Voice

- Say what the contract says: "60 calendar days", not "a long notice period".
- Say who decides: "Counsel to decide", not "AI uncertain".
- No exclamation marks, no emoji, no "AI-powered" in the UI. Mandatory footer: *Aviso Previo summarizes your contracts. It is not legal advice.* and *Sample data · Fictional*.

## Where it lives in the product

- **Admin page** (`admin-ui/`, Custom UI) carries the full brand: tokens in `src/styles.css`, light and dark.
- **Issue panel / glance** (`src/frontend/`, UI Kit) uses native Atlassian components so it inherits Jira's theme, with the same colour semantics through Lozenges.
