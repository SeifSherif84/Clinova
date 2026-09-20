# DESIGN SYSTEM REFERENCE
## Clinova UI/UX Guidelines

Visual design rules extracted from the finalized Clinova frontend pages — for use by the frontend developer and by AI coding tools when generating new pages or components.

*Version 1.0 · Based on 5 finalized page implementations · Stack: React + TypeScript, Tailwind CSS, shadcn/ui, lucide-react*

---

## 1. Typography

Two font families are used deliberately. Font weight, not size alone, carries hierarchy — most UI text is bold or semibold; body copy stays small and muted.

### Font families

- **font-sans** — default UI font. Use for page titles, card titles, buttons, nav, labels, values. This is the workhorse family for ~95% of text.
- **font-heading** — reserved for a few "moment" headlines only: the dashboard greeting ("Good day, Name"), the large promotional headline ("Your workspace will grow with you"), and empty-state titles. Do not use it for ordinary card or section titles.

### Type scale

| Role | Classes | Weight | Notes |
|---|---|---|---|
| Page H1 (list/form pages) | `font-sans text-3xl sm:text-4xl font-bold` | Bold | Every page starts with one of these. |
| Detail hero H1 | `font-sans text-3xl sm:text-5xl font-bold` | Bold | Used on detail/profile hero cards only. |
| Dashboard greeting | `font-heading text-4xl sm:text-5xl lg:text-6xl font-bold` | Bold | Unique hero moment, tracking-tight. |
| Card / section title | `font-sans text-xl font-bold normal-case tracking-normal` | Bold | Always paired with a leading icon (see Icons). |
| List item title | `font-sans text-lg font-bold leading-tight` | Bold | e.g. clinic name on a card. |
| Empty state title | `font-heading text-2xl sm:text-3xl font-bold` | Bold | |
| Body / description | `text-xs sm:text-sm leading-6 text-muted-foreground` | Regular | Page subtitles, hint text under headers. |
| Eyebrow label (inside badge) | `text-[11px] font-semibold tracking-wider uppercase` | Semibold | Always inside a pill badge, never bare. |
| Micro label (over a value) | `text-[9px]–text-[10px] font-bold tracking-wider uppercase text-muted-foreground` | Bold | Sits directly above a strong value. |
| Value text | `text-sm font-bold` | Bold | Pairs with the micro label above. |
| Nav / link item | `text-sm font-bold` | Bold | See standardization note below. |
| Button label | `text-sm font-bold normal-case` | Bold | Never uppercase; Tailwind default button caps must be reset with `normal-case`. |

**Standardize:** sidebar nav items must always use `text-sm font-bold`. Earlier pages used a smaller `text-xs font-semibold` — that pattern is deprecated. Apply `text-sm font-bold` everywhere a sidebar/nav link appears.

### Readability rules

- Body/description text is always `text-muted-foreground` — never full-contrast black on supporting copy.
- Two type weights only in practice: `font-bold` for anything a user scans (titles, values, buttons, labels) and regular weight for descriptive sentences. Avoid `font-medium` / `font-semibold` as a final state — prior pages used them and were upgraded to bold for consistency.
- Minimum usable font size is `text-[9px]`, reserved strictly for uppercase micro-labels above a bold value — never for primary reading content.

---

## 2. Color

One primary accent drives the whole product. A second "warm" accent is used sparingly for attention states. All color usage is achieved by adjusting the opacity of two base tokens, not by introducing new hues.

### Palette roles

- **primary** — brand accent
- **warm** — secondary accent
- **destructive** — danger
- **emerald** — icon-box only
- **muted-foreground** — supporting text

### Use cases

| Use case | Token pattern |
|---|---|
| Primary button fill | `bg-primary text-primary-foreground hover:bg-primary/90` |
| Tinted background (badge, tile, hover) | `bg-primary/5 → /10 → /15` |
| Border on tinted elements | `border-primary/10 → /15 → /30` |
| Hover state on a card/tile border | `hover:border-primary/30` |
| Section-header icon box | `bg-emerald-50 text-emerald-600 / dark:bg-emerald-950/40 dark:text-emerald-400` |
| Warm accent (notification dot, pending status) | `bg-warm/10, text-warm, border-warm/20` |
| Destructive action / zone | `border-destructive/20 bg-destructive/5, text-destructive` |

**Rule:** never introduce a new raw hex color. Every color effect in these pages is one of `primary`, `warm`, `destructive`, or neutral surface tokens, layered with opacity (`/5` through `/30`) for tints and borders. The one fixed exception is the emerald icon-box used consistently for every card-section header icon — reuse that exact pair, don't invent alternate icon-box colors per section.

---

## 3. Spacing & layout

### Page shell

- Content container: `mx-auto w-full max-w-5xl|6xl|7xl p-4 sm:p-6 lg:p-10`. Pick the max-width by content density: forms ≈ `5xl`, profile ≈ `6xl`, card grids/dashboards ≈ `7xl`.
- Sticky header: `sticky top-0 z-30 min-h-20 border-b border-border bg-background/85 backdrop-blur-xl px-4 sm:px-6 lg:px-10`.
- Sidebar: fixed width `16.5rem`, hidden below `lg`, shown via `lg:grid lg:grid-cols-[16.5rem_1fr]` on the page's `<main>`.

### Vertical rhythm

- Gap between a title block and the content below it: `mt-5` or `mt-6`.
- Gap between stacked cards/sections: `grid gap-5` (forms, detail columns) or `gap-4` (card grids).
- Inside a card's content: `grid gap-3` to `gap-5` depending on density; form fields use `gap-5`.

### Grids

| Context | Pattern |
|---|---|
| Card/list grid | `grid gap-4 md:grid-cols-2 xl:grid-cols-3` |
| Detail page two-column | `grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(20rem,1fr)]` |
| Form field pairs | `grid gap-5 sm:grid-cols-2` |
| Small stat tiles inside a card | `grid grid-cols-2 gap-3` |

---

## 4. Components

### Cards

- Standard card: `rounded-2xl border border-border bg-card`.
- Card header: `!pb-3 border-b border-border/40`; title is `flex items-center gap-2 font-sans text-xl font-bold normal-case tracking-normal`, always preceded by the standard icon box (see Icons).
- Interactive/clickable card (list items you can open): add `transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg`.
- Hero card (page-top gradient banner): `rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/12 via-card to-primary/5`, optionally with a faint blurred decorative circle (`absolute blur-2xl/3xl bg-primary/10`) or a subtle dot-pattern SVG overlay at `opacity-[0.06]`.
- Empty state card: `rounded-3xl border border-dashed border-primary/25 bg-gradient-to-br from-primary/5 via-card to-warm/5`, centered text, with a pulsing icon: an outer `animate-ping bg-primary/10` ring behind a solid `size-20 rounded-3xl bg-primary/10 text-primary shadow-inner` icon circle.
- Info/value tile (inside a card, e.g. a read-only field): `rounded-2xl border border-border/60 bg-background/45 p-4`, `hover:border-primary/30 hover:bg-primary/5` transition, leading icon box + micro-label/value pair.
- Mini stat tile (compact number inside a grid): `rounded-xl bg-background p-3`, no border, micro-label + bold value.

### Buttons

| Variant | Classes | When to use |
|---|---|---|
| Primary | `h-11 rounded-xl bg-primary text-sm font-bold normal-case text-primary-foreground hover:bg-primary/90` | Main page action (save, create, submit). |
| Outline / secondary | `variant="outline" h-11 rounded-xl text-sm font-bold normal-case` | Cancel, retry, secondary actions. |
| Icon-only | `variant="outline" size="icon" rounded-xl border-border bg-card/40 text-muted-foreground` | Header utility actions (notifications, sign out). |
| Destructive | `variant="destructive" text-sm font-bold normal-case` | Delete/leave/remove actions only, inside a clearly marked danger zone. |
| Pill toggle (segmented control) | `rounded-full h-11 px-5 text-sm font-bold normal-case` | Two-way view switches (e.g. Received/Sent), wrapped in a `rounded-full border bg-card/70 p-2` track. |

- Always pair an icon with the label (lucide icon first, text second) — buttons are never icon-only unless it's a header utility button with `aria-label`.
- Loading state: swap the leading icon for `<LoaderCircle className="animate-spin" />` and set `disabled` while a mutation is pending. Never disable without a spinner — the user needs visible feedback.
- Never use Tailwind's default uppercase button text — always add `normal-case`.

### Badges

- **Eyebrow badge** (top of every page, above the H1): `rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase`, with a `size-3` leading icon. This is the single most repeated pattern in the app — reuse it verbatim on every new page.
- **Status badge** (accepted/rejected/pending, owner/member): rounded-full, small padding (`px-2.5 py-1`), `text-[10px] font-bold`, color driven entirely by state — success uses primary tones, danger uses destructive tones, pending uses warm tones. Border + background + text always come from the same color family.
- **Count badge** (inside a toggle/tab): small rounded-full pill, `px-2 py-0.5 text-xs`, inverted style (light bg) when its parent tab is active, muted when inactive.

### Icons

| Context | Size |
|---|---|
| Inline with badge/eyebrow text | `size-3` |
| Inline with body copy (e.g. address line) | `size-3.5` to `size-4` |
| Buttons, nav items, inputs | `size-4` |
| Section/card header icon box | `size-7` |
| List-item leading avatar icon | `size-5` to `size-6` |
| Empty-state big icon | `size-9` |

- Icon source is exclusively lucide-react — do not mix in another icon set.
- The recurring "icon box" — `grid place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400` at `size-10` — precedes every card-section title. Always reuse this exact box; do not vary its color per section.
- A second, separate icon-box style — `size-10/11 rounded-xl bg-primary/10 text-primary` — is used for list-item leading avatars and info tiles (not section headers). Keep these two icon-box styles distinct and consistent with their respective contexts.

### Inputs & forms

- Text input / select trigger: `h-12 rounded-xl border border-input bg-background/40 px-3`, focus state `focus-visible:border-primary/50` or `focus:ring-2 focus:ring-primary/10`.
- Textarea: same `rounded-xl` treatment, `min-h-48 resize-y`.
- Label: `text-xs font-semibold text-foreground/80`, always above the field, never inline/floating.
- File upload zone: dashed border drop-zone — `rounded-2xl border border-dashed border-primary/30 bg-primary/4 p-4/5` with a centered icon, hover to `bg-primary/8`.
- Validation/error messages render through the shared Notice component (error tone by default, `tone="success"` for confirmations) placed directly above the form — do not invent inline red text patterns.

### Navigation

- Sidebar link (inactive): `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground`, icon `size-4`.
- Sidebar link (active): same classes plus `bg-sidebar-accent text-sidebar-foreground [&>svg]:text-sidebar-primary`.
- The sidebar shell (logo, nav list, "secure session" footer card) should live in exactly one shared component so every page stays in sync — do not re-implement the sidebar markup per page.

---

## 5. Interaction & motion

- Card hover: lift + accent border + shadow — `transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg`. Applied to any card that navigates somewhere on click.
- Tile/row hover: border + tint only, no lift — `hover:border-primary/30 hover:bg-primary/5`. Used for non-navigating list rows and info tiles.
- Icon-box hover (inside a hoverable parent): deepen the tint one step, e.g. `group-hover:bg-primary/15`.
- Async buttons always show a spinner (`LoaderCircle` with `animate-spin`) in place of their icon while `isPending`, and disable the button meanwhile.
- Empty states use a soft `animate-ping` ring behind the icon for gentle ambient motion — do not use this effect anywhere except empty states.
- Respect reduced motion: any decorative animation (spin, ping, pulse) must include a `motion-reduce:animate-none` fallback.

---

## 6. Borders, radius & shadow

### Radius hierarchy

| Radius | Use for |
|---|---|
| `rounded-xl` | Buttons, inputs, small icon boxes, tiles, file-drop zones |
| `rounded-2xl` | Standard cards, section icon boxes, info tiles |
| `rounded-3xl` | Hero/banner cards, empty-state cards, large avatar frames |
| `rounded-full` | Badges, pills, avatars, status dots, segmented-control track |

### Shadows

Kept minimal by default — most cards rely on a border only, not a shadow. Use shadows sparingly and purposefully:

- `hover:shadow-lg` on interactive cards, as feedback for hover only (no resting shadow).
- `shadow-inner` on the empty-state icon circle, for subtle depth.
- `shadow-sm` on the "secure session" sidebar footer card.
- Never stack a heavy drop shadow on a resting card — the visual language is flat with border-based separation, not shadow-based.

### Borders

- Default separator: `border-border` (neutral hairline).
- Tinted borders always use the `primary` (or `warm` / `destructive`) token at low opacity — never a separate gray-blue border color.
- Dashed borders are reserved for two specific meanings: an upload drop-zone, and an empty-state card. Don't use dashed borders decoratively elsewhere.

---

## 7. Responsive behavior

- Build mobile-first; add `sm:` / `lg:` / `xl:` variants rather than designing desktop-first and squeezing down.
- Sidebar is desktop-only (`hidden lg:flex`); on smaller screens the compact logo (`<Brand compact />`) appears in the header instead.
- Card grids collapse: 3 columns (`xl`) → 2 columns (`md`) → 1 column (mobile default). Never hard-code a fixed column count without responsive fallbacks.
- Headline sizes step down through breakpoints, e.g. `text-3xl sm:text-4xl` or `text-4xl sm:text-5xl lg:text-6xl` — always provide at least one intermediate step, don't jump straight from mobile size to desktop size.
- Non-essential header elements (search bar, secondary user info) hide below `lg` / `sm` rather than shrinking illegibly.
- Two-column detail layouts (`xl:grid-cols-[...]`) stack to a single column below `xl` automatically via the grid default.

---

## 8. Quick checklist for a new page

- [ ] Page wrapped in the shared sidebar shell, not a re-implemented sidebar.
- [ ] Eyebrow badge + `font-sans text-3xl sm:text-4xl font-bold` H1 + muted description at the top.
- [ ] Content wrapped in `mx-auto max-w-{5xl|6xl|7xl} p-4 sm:p-6 lg:p-10`.
- [ ] Every card: `rounded-2xl border border-border bg-card`, header icon box in the standard emerald pair, title `text-xl font-bold`.
- [ ] Buttons: `h-11 rounded-xl text-sm font-bold normal-case`, icon + label, spinner while pending.
- [ ] Colors limited to `primary` / `warm` / `destructive` tokens at varying opacity — no new hex values.
- [ ] Empty state (if applicable) follows the dashed-card + ping-icon pattern.
- [ ] Responsive variants present at `sm` / `lg` / `xl` for grids and headline sizes.

---

*Prepared from Clinova's finalized page implementations (dashboard, add-clinic, clinic-details, doctor-clinics, doctor-invitations, doctor-profile) for use by both the frontend developer and AI coding assistants generating new Clinova UI.*
