# Clinova change log and UI implementation guide

This document records the repository update pulled on 2026-09-16 and defines the UI conventions that future changes must preserve. It applies to the whole repository, with the detailed design rules applying to `clinova-portal/`.

## Synced baseline

- Remote: `origin` (`https://github.com/SeifSherif84/Clinova.git`)
- Default branch: `master` (this repository does not use a `main` branch)
- Previous local commit: `0590705`
- Pulled commit: `67407e1`
- Pull method: fast-forward only

## What the pulled changes added

### Backend and API

- Added patient appointment creation, listing, and detail endpoints under `api/appointment`.
- Added appointment service abstractions, implementation, specifications, AutoMapper profiles, and response/request DTOs.
- Appointment creation now reserves an available slot, snapshots consultation/deposit/remaining amounts, creates a pending payment, and gives the reservation a 15-minute expiry.
- Added the `Reserved` appointment-slot state and direct doctor/clinic navigation from slots.
- Expanded payment data with `CreatedAt`, optional `PaidAt`, optional proof URL, and an optional clinic payment method while payment is pending.
- Updated appointment/payment database configuration and added an EF Core migration for the new structure.
- Extended base specifications/evaluation and service-manager wiring to support the appointment queries.
- Adjusted clinic payment-method and available-slot mapping/response behavior.
- Updated login failure wording and application startup/configuration, including CORS/base URL and mapper registration changes.

### Frontend behavior

- Added a centralized error system: API errors are normalized into localized notifications, duplicate messages are suppressed, unexpected browser errors are caught, and route-level failures have a dedicated screen.
- Added global API activity feedback and route-change progress feedback.
- Changed the router to lazy-load most application pages, protect doctor-only routes, restore scroll position, and use shared pending/error components.
- Expanded English and Arabic translations for the doctor profile, clinics, validation, errors, loading states, and navigation.
- Added typed frontend models for doctors and clinics and expanded auth typing.
- Added doctor profile viewing/editing, profile-picture upload, clinic summary links, account data, and verification-document links.
- Added a doctor clinic workspace: clinic list, empty/loading/error states, clinic creation, clinic details/editing, gallery uploads, phone management, member management, ownership controls, and leave/delete actions.
- Added reusable doctor workspace, root layout, route progress, API loader, error boundary, error context/provider, and error-handler components.

### Visual design refresh

- Increased logo, navigation, profile, badge, body-copy, icon, and action sizing to improve legibility.
- Made primary calls to action pill-shaped on marketing pages and consistently rounded on application pages.
- Strengthened dashboard and workspace typography; operational page and card titles now use bold sans-serif, while marketing/auth hero headings retain the editorial display face.
- Added softer teal and warm accent gradients, translucent surfaces, blurred background orbs, subtle borders, and restrained shadows.
- Added status pills, icon tiles, richer empty states, profile/clinic hero cards, and responsive card grids.
- Added motion for route progress, dashboard diagrams, ripples, status pulses, and hover elevation, with reduced-motion fallbacks where motion is decorative.
- Preserved light/dark themes and improved Arabic typography and RTL behavior.

## UI design contract

### Foundations

- Keep theme values in `clinova-portal/src/App.css`. Use semantic utilities such as `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary`, `bg-warm`, and `text-destructive`; do not introduce page-local hex colors.
- Preserve the light and dark token sets. Any explicit status palette must include an appropriate `dark:` treatment.
- Body text uses Noto Sans; Arabic uses Noto Sans Arabic. Use `font-heading`/Playfair Display for marketing, auth, and editorial hero copy. Use `font-sans font-bold` for doctor workspace page titles and functional card headings.
- Primary teal communicates trusted actions and active states. Warm amber is a secondary highlight. Destructive red is reserved for errors, removal, leaving, and deletion.

### Shape, surface, and spacing

- Application controls use `rounded-xl`; ordinary cards use `rounded-2xl`; major hero, loading, empty, and auth surfaces use `rounded-3xl`; badges and marketing CTAs may use `rounded-full`.
- Standard application cards use `border border-border bg-card`. Emphasized surfaces may use low-opacity semantic gradients such as `from-primary/10 via-card to-warm/5`.
- Prefer subtle `ring-1 ring-foreground/5`, restrained shadows, and translucent `bg-card/*` surfaces. Avoid heavy borders, fully saturated backgrounds, and decorative effects that reduce text contrast.
- Workspace page containers should normally use `mx-auto w-full`, a task-appropriate `max-w-*`, and `p-4 sm:p-6 lg:p-10`.
- Use compact, consistent gaps: `gap-2` or `gap-3` inside controls/list rows, `gap-4` or `gap-5` between cards, and larger spacing only for hero sections.

### Layout patterns

- Public and auth pages use a centered `max-w-7xl` shell, soft background decoration, a responsive two-column hero at large sizes, and centered content on small screens.
- Auth pages must use `AuthShell`; do not recreate its brand/header/illustration/card layout per page.
- Doctor clinic pages must use `DoctorWorkspaceShell`. Extend the shell when navigation changes instead of copying the sidebar and top bar.
- The doctor workspace uses a desktop sidebar at `lg`, a sticky translucent top bar, compact mobile branding, and content that remains single-column until there is enough width for a useful secondary column.
- List grids typically progress from one column to `md:grid-cols-2` and then `xl:grid-cols-3`. Detail screens may use an asymmetric `xl` two-column grid.
- Keep page headers consistent: eyebrow/status badge, bold sans-serif title, short muted description, and an optional primary action aligned opposite when space permits.

### Components and visual hierarchy

- Reuse primitives from `src/components/ui/` and shared components such as `Brand`, `PreferencesControls`, `FormField`, `Notice`, `AuthShell`, and `DoctorWorkspaceShell` before creating new wrappers.
- Use Lucide icons. Common icon tiles are `size-10` to `size-14`, `rounded-xl`/`rounded-2xl`, and a low-opacity semantic background.
- Use badges for short categories, statuses, counts, and eyebrows-not for paragraphs or primary actions.
- Use a single obvious primary action per card or page section. Secondary actions should use outline or ghost variants. Destructive actions must use the destructive variant and require confirmation when data or access will be removed.
- Keep card titles direct and functional. Supporting copy should normally be `text-xs` or `text-sm`, `leading-5`/`leading-6`, and `text-muted-foreground`.
- Empty, loading, and error states must occupy the same layout region as the content they replace. Give users a retry or next action when one is available.

### Forms, data, and feedback

- Use `FormField` for ordinary inputs and match its 3rem height, `rounded-xl`, semantic border/background, and focus ring for custom fields.
- Put field labels above controls. Show validation next to the field or in `Notice`; do not rely on color alone.
- Validate file type, size, and count before upload. Current image rules are JPEG/PNG/WebP, at most 5 MB each, and at most six clinic images.
- Use TanStack Query for server state. Keep stable, hierarchical query keys and invalidate every affected list/detail query after a successful mutation.
- Use the shared API client and centralized reporting for general failures. Pass `{ notifyOnError: false }` only when the page deliberately renders the error locally.
- Every request-backed area needs explicit loading, error, empty, and success behavior. Disable pending actions and show `LoaderCircle` in the triggering control.
- User-visible text belongs in both English and Arabic resources in `src/i18n.ts`; do not add hard-coded UI copy.

### Responsive, RTL, accessibility, and motion

- Build mobile-first. Verify narrow phone, tablet, and desktop layouts; do not depend on the desktop sidebar for access to essential actions.
- Use logical direction utilities (`start`, `end`, `ms`, `me`, `ps`, `pe`, `border-e`, `text-start`, `text-end`) instead of left/right when direction matters.
- Mirror directional icons with `rtl:rotate-180` or `rtl:-scale-x-100`. Avoid letter spacing in Arabic; the global RTL rules already switch the heading font.
- Icon-only controls require localized `aria-label` text. Decorative images/SVGs must be hidden from assistive technology; informative images need localized alternative text.
- Preserve visible keyboard focus and native labels. Loading and error feedback should use suitable `role`, `aria-live`, and `aria-hidden` attributes.
- Motion should be subtle and communicate progress, state, or affordance. Add `motion-reduce:animate-none` to decorative animation and avoid layout-shifting hover effects.

## Do not copy these baseline inconsistencies

- `.animate-glow` is referenced but its implementation is currently commented out in `App.css`; do not rely on it until the animation is deliberately restored or the class is removed.
- The doctor profile still duplicates workspace shell markup. New doctor pages must use `DoctorWorkspaceShell`; a future refactor should migrate the profile page instead of duplicating it again.
- Check every utility class against the installed Tailwind version. Do not repeat apparent typos or undefined tokens merely because they exist in a pulled page.
- Keep source files formatted and readable. Several pulled JSX sections are densely compressed; new work should use normal project formatting.

## Definition of done for frontend changes

1. Reuse the established shell and shared UI primitives.
2. Add English and Arabic copy and verify both LTR and RTL layouts.
3. Verify light and dark themes.
4. Verify loading, error, empty, success, disabled, and permission-dependent states.
5. Check keyboard access, labels, focus, contrast, reduced motion, and mobile layout.
6. Run from `clinova-portal/`:

   ```bash
   npm run lint
   npm run build
   ```

7. Do not consider a UI change complete if it introduces TypeScript, ESLint, or production-build errors.
