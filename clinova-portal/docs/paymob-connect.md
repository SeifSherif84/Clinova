# Paymob frontend integration

Entry point: **Clinic details → Online Payments**. All pages use the shared doctor workspace and clinic-owner access boundary.

## Implemented sequence

1. Connect Paymob: the original three-step setup remains intact.
2. Credentials Guide: all five credential explanations, official dashboard navigation, Test/Live guidance, and reusable screenshot viewing.
3. Secure form: independent sensitive-field visibility, field-level accessible errors, consent, and safe save presentation.
4. Connected settings: horizontal integration row with compact metadata and actions.
5. Status system: NotConfigured, Connected, NeedsAttention, and Disabled, driven exclusively by the backend.
6. Manage/Update: fixed saved masks, explicit replacement controls, and partial update payloads.
7. Help: nine localized tutorials using one shared page template.
8. Combined navigation, responsive, accessibility, and security audit.

Routes under `/doctor/clinics/:clinicId/payments`:

- `/`: Online Payments settings
- `/paymob/connect`: initial setup
- `/paymob/guide`: Credentials Guide
- `/paymob/manage`: Manage/Update
- `/paymob/help`: help index
- `/paymob/help/:topic`: tutorial

## Current backend reads

The existing endpoints are used, with no new backend code:

- `GET /api/payments/clinics/{clinicId}/configuration`
- `GET /api/online-payment-accounts/clinics/{clinicId}`

Both are loaded only after existing clinic/member reads establish owner access. Data is parsed into fresh allowlisted objects before reaching the query cache. Raw provider messages, arbitrary properties, key values, and unrecognized statuses are not stored or rendered. A failed read shows an unavailable/retry message; it never becomes NotConfigured or NeedsAttention.

Issue codes appear only when the status is NeedsAttention and the code is explicitly recognized. Patient declines, insufficient funds, 3D Secure failures, cancellations, and temporary transaction rejections are not inputs to this status system.

## Save/update boundary and remaining backend assumptions

Initial connection and updates remain frontend-only. No credential write endpoint is called by the routed pages, and the UI explains that saving is unavailable. There is no timer-based simulated success.

The reusable form accepts `onConnect(credentials)` and `onUpdate(changes)` callbacks. A future adapter must resolve only after encrypted storage succeeds, use HTTPS, discard response fields except safe metadata, and invalidate/refetch the settings metadata after a successful write. The test fixture supplies an isolated callback to exercise loading, success, error, and partial-update behavior.

Why these callbacks are not wired yet:

- The current account POST/PATCH contract accepts the four keys but does not include Card Integration ID.
- Card integrations are added through a separate endpoint; there is no corresponding integration-update endpoint in the inspected controller.
- There is no atomic five-field setup/update contract or safe partial-success recovery designed in these prompts.
- There are no account enable/disable/disconnect endpoints in the inspected controller. These actions remain explanatory entry points and never change the displayed state.
- The account metadata endpoint does not provide per-key presence flags. The UI relies on the current create contract requiring all four keys, and generates fixed masks for a saved account.
- No live credential verification or configuration check is triggered. Connected means saved; no verified claim or fabricated health timestamp is shown.

The current backend status endpoint maps PendingVerification to Connected. Its returned string is authoritative to the UI; backend enforcement of payment readiness remains a backend responsibility.

## Credential handling

New values live only in uncontrolled form inputs and a local request object during an authorized save callback. They are not put in React/global state, storage, URLs, analytics, console logs, or mutation caches. Submission immediately clears entered DOM values and visibility controls; completion clears the local payload. Raw save exceptions are discarded in favor of fixed copy.

Manage uses fixed masks for Public Key, Secret Key, HMAC Secret, and ApiKey. There are no saved-secret show buttons. Replace opens an empty field; canceling replacement discards its entry. Only selected fields are included in a partial update. Card Integration ID is shown only from safe integration metadata; ambiguous/missing integration data is not invented.

## Design and content

English and Arabic/RTL, light and dark themes, existing shadcn controls, shared section headings, the shared screenshot viewer, and consistent button/spacing tokens are reused. Screenshot sources are explicit placeholders; the viewer supports supplied images, fit/full-size viewing, scrolling, keyboard close, and focus restoration. Clinova tutorial screenshots are labeled as Clinova rather than Paymob.

Real screenshot assets and the three legal documents still need to be supplied. No legal policy text was invented.

Official sources:

- [Paymob dashboard documentation](https://developers.paymob.com/paymob-docs/getting-started/new-dashboard)
- [Paymob standard merchant onboarding explanation](https://developers.paymob.com/paymob-docs/beyond-payments/partner-onboarding)
- [Paymob website](https://paymob.com/)

The current dashboard documentation lists API Keys directly under Settings. The requested Developers path is retained with an explicit note to follow the actual dashboard labels.

## Combined validation

After all implementation steps:

- `npm run build`
- `npm run lint`
- `npm run test:e2e -- tests/connect-paymob.spec.ts tests/paymob-experience.spec.ts`

Coverage includes the original setup, all status/issue codes, safe parsing, partial replacements, error privacy, owner/auth gates, tutorial navigation, keyboard controls, supplied-image zoom, and 360/768/1440px layouts including Arabic dark mode.

## UX simplification pass

- Setup now uses the shared clinic-owner page frame, shows save availability before entry, and offers a direct jump to the form.
- The five-credential overview is compact. Full instructions and screenshots are shared between the standalone guide and an in-place dialog available in both connection and update forms.
- Opening the guide preserves uncontrolled entries without copying them to storage or application state. Closing restores focus; screenshot zoom remains available inside the guide.
- Form feedback shows a count of filled fields and the remaining authorization step. Editing one field no longer clears errors on other fields. Replacement inputs receive focus.
- Security details are available on demand; consent remains explicit. Legal document availability is stated once.
- Settings emphasize the next action and disclose unavailable controls. Failed metadata reads offer retry without suggesting a new connection.
- Help is grouped by intent; tutorials return to the help index, and setup links return directly to the form.
- No credential write, enable, disable, or verification backend behavior was added.
