# Clinova API — Summary

A condensed reference to the Clinova backend API, covering all modules: Auth, Clinics, Doctors, Invitations, Lookups, Notifications, Working Hours, Manual Payment Methods, and Online Payments (Paymob).

All endpoints use `Content-Type: application/json` unless noted otherwise (file uploads use `multipart/form-data`). Authenticated endpoints require `Authorization: Bearer <accessToken>`.

Standard error shape:
```json
{ "statusCode": 400, "title": "Bad Request", "message": "..." }
```

---

## 1. Auth Module — `/api/auth`

Handles registration, login, email confirmation, password reset/change, logout, and account deletion.

| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `/doctor-registration` | POST (multipart) | No | Creates a **pending** doctor account; requires syndicate card + national ID images; needs email confirmation **and** admin approval before login |
| `/patient-registration` | POST | No | Simple JSON registration; only needs email confirmation |
| `/login` | POST | No | Returns `accessToken` + `refreshToken` (refresh token expires in 14 days) |
| `/refresh-token` | POST | No | Rotates refresh token; old one becomes invalid |
| `/confirm-email` | GET (query: `email`, `token`) | No | Confirms email via link from inbox |
| `/resend-email-confirmation` | POST | No | Re-sends confirmation link |
| `/reset-password` | POST | No | Step 1 of forgot-password flow |
| `/update-password` | POST (query: `email`, `token`) | No | Step 2 of forgot-password flow |
| `/change-password` | POST | Yes | Requires current password |
| `/logout` | POST | Yes | Invalidates refresh token only; client must discard both tokens |
| `/account` (DELETE) | DELETE | Yes | Soft-deletes account; irreversible from client |

**Key rules:**
- **Password policy:** min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char (`@ $ ! % * ? &`)
- **Images (doctor reg):** `.jpg/.jpeg/.png/.webp`, max 5 MB
- Doctor login blocked with 403 if: email unconfirmed, approval pending, or rejected
- Deleted/nonexistent users get 401 on any authenticated request, globally

---

## 2. Clinics Module — `/api/clinics`

All endpoints require the **Doctor** role. Two access tiers apply per endpoint:
- **Member access** — doctor is owner or regular member
- **Owner access** — doctor must be the clinic's owner

| Endpoint | Method | Tier | Notes |
|---|---|---|---|
| `/` | POST (multipart) | Any doctor | Creates clinic; caller becomes Owner; up to 6 images + 6 phone numbers |
| `/{clinicId}` | PATCH | Owner | Partial update, JSON |
| `/{clinicId}` | DELETE | Owner | Soft-delete |
| `/{clinicId}/images` | POST (multipart) | Owner | Add images (1–6 per request, 6 total cap) |
| `/{clinicId}/images/{imageId}` | DELETE | Owner | Remove one image |
| `/{clinicId}/phone-numbers` | POST | Owner | Add phone (6 total cap) |
| `/{clinicId}/phone-numbers/{phoneNumberId}` | DELETE | Owner | Remove one phone |
| `/` | GET | Any doctor | List caller's own clinics |
| `/{clinicId}` | GET | Member | Full clinic details (images, phones) |
| `/{clinicId}/members/{memberId}` | DELETE | Owner | Remove a member (not the owner) |
| `/{clinicId}/members/me` | DELETE | Member | Leave clinic (blocked for owner) |
| `/{clinicId}/members` | GET | Member | List all members |

**Key rules:**
- Egyptian phone format: `^01[0125]\d{8}$` (11 digits, starts `01`, 3rd digit 0/1/2/5)
- Images: `.jpg/.jpeg/.png/.webp`, max 5 MB each

---

## 3. Doctors Module — `/api/doctors`

All endpoints operate only on the caller's **own** profile (`/me`) — no viewing/editing other doctors.

| Endpoint | Method | Notes |
|---|---|---|
| `/me` | GET | Full profile incl. approval status, verification docs |
| `/me` | PATCH | Partial update: `title`, `experienceYears`, `bio`, `dateOfBirth`, `gender` only |
| `/me/profile-picture` | PATCH (multipart) | Replace profile picture; old one deleted from storage |

**Gender enum:** `1 = Male`, `2 = Female`

---

## 4. Invitations Module — `/api/invitations`

Lets a clinic **Owner** invite doctors by email; invited doctor accepts/rejects.

| Endpoint | Method | Access |
|---|---|---|
| `/send/clinic/{clinicId}` | POST | Owner of clinic |
| `/sent` | GET | Own sent invitations |
| `/received` | GET | Own received invitations |
| `/accept/{invitationId}` | POST | Must be receiver |
| `/reject/{invitationId}` | POST | Must be receiver |
| `/cancel/{invitationId}` | POST | Must be sender |

**Status values:** `Pending`, `Accepted`, `Rejected`. Cancelling **deletes** the record outright (no "Cancelled" status). Real-time notifications fire on send/accept/reject/cancel.

---

## 5. Lookups Module — `/api/lookups`

Read-only reference data for dropdowns/filters. Most endpoints require an authenticated user (Doctor or Patient). Medical specialties are public because doctor registration requires a specialty before the user has an account.

| Endpoint | Returns |
|---|---|
| `/genders` | `{id, name}` — Male/Female |
| `/days-of-week` | `{id, name}` — Sunday(0)…Saturday(6) |
| `/medical-specialties` | Public. 34 seeded specialties (`{id, name}`) used during doctor registration |
| `/governorates` | 27 Egyptian governorates |
| `/regions?governorateId=` | Regions within a governorate (cascading dropdown) |

Never hardcode IDs — always read from the live response.

---

## 6. Notifications Module — `/api/notifications`

Any authenticated user. Two parts: REST API + SignalR hub for live push.

| Endpoint | Method | Notes |
|---|---|---|
| `/` | GET | Full notification list |
| `/{notificationId}/mark-as-read` | POST | Returns 204; no-op if already read |
| `/mark-all-as-read` | POST | Returns 204 |

**Types:** `InvitationReceived`, `InvitationAccepted`, `InvitationRejected`, `InvitationCancelled`, `MemberRemoved`, `MemberLeft`

**SignalR hub:** `/hubs/notifications`, event `ReceiveNotification`, authenticated via the same Bearer token (pass via `accessTokenFactory`). Use REST as source of truth on load/reconnect; hub for live updates only.

---

## 7. Working Hours Module — `/api/working-hours`

Defines a doctor's availability at a clinic per day of week; drives automatic appointment-slot generation.

| Endpoint | Method | Access |
|---|---|---|
| `/clinic/{clinicId}` | POST | Clinic member; creates one entry per (doctor, clinic, day) |
| `/{workingHourId}/clinic/{clinicId}` | PATCH | Member + entry owner; can't change `day` |
| `/{workingHourId}/clinic/{clinicId}` | DELETE | Member + entry owner |
| `/clinic/{clinicId}` | GET | Member; lists caller's own entries |
| `/{workingHourId}/clinic/{clinicId}/activate` | PATCH | Member + entry owner |
| `/{workingHourId}/clinic/{clinicId}/deactivate` | PATCH | Member + entry owner |

**⚠ Validation gap:** On Create, `day`/`startTime`/`endTime` aren't `[Required]`-enforced — missing fields silently default (`day`→Sunday, times→`00:00:00`). Always send all three explicitly.

**Time format:** `"HH:mm:ss"`. **Slot duration:** 1–1440 min, properly validated.

**Slot lifecycle:**
- Create/Activate → generates bookable slots for a rolling window
- Update → recalculates future unbooked slots only; booked appointments untouched
- Delete → removes all unbooked slots (past + future); booked appointments preserved
- Deactivate → removes future unbooked slots, stops new generation; booked appointments preserved

---

## 8. Manual Payment Methods Module — `/api/manual-payment-methods`

A "manual payment method" is a clinic-configured way to receive payment outside of an automated gateway (e.g. a Vodafone Cash number or an InstaPay handle) that patients can pay to manually.

**Auth & access:** All endpoints require authentication. Management endpoints (add, update, delete, activate, deactivate, owner listing) require role **Doctor** + **Owner** access on the clinic (regular members are blocked, same as Clinics module). The patient-facing listing requires role **Patient** and has no ownership requirement — any patient can view a clinic's active methods.

**`ManualPaymentMethodType` enum:** `1 = VodafoneCash`, `2 = InstaPay` — sent as numeric value on create, returned as string name (`type`) in responses.

**`accountIdentifier`:** free-text, max 100 chars, no format validation server-side (e.g. phone number for Vodafone Cash, handle/IPA for InstaPay) — frontend should apply its own input hints/formatting per type.

| Endpoint | Method | Access | Notes |
|---|---|---|---|
| `/clinics/{clinicId}` | POST | Doctor, Owner | Adds a payment method; created **active** by default; `type` + `accountIdentifier` in body |
| `/{paymentMethodId}/clinics/{clinicId}` | PATCH | Doctor, Owner | Updates `accountIdentifier` only — `type` is immutable |
| `/{paymentMethodId}/clinics/{clinicId}` | DELETE | Doctor, Owner | Permanently removes; blocked (400) if it has payment history — deactivate instead |
| `/clinics/{clinicId}` | GET | Patient | Lists only **active** methods for a clinic (no `isActive` field — all implicitly active); no membership requirement |
| `/clinics/{clinicId}/management` | GET | Doctor, Owner | Lists **all** methods (active + inactive) with `isActive` field, for owner management |
| `/{paymentMethodId}/clinics/{clinicId}/activate` | PATCH | Doctor, Owner | Makes an inactive method visible to patients again |
| `/{paymentMethodId}/clinics/{clinicId}/deactivate` | PATCH | Doctor, Owner | Hides a method from patients while preserving payment history |

**Key rules:**
- Duplicate guard: the same `type` + `accountIdentifier` combination can't be added twice to the same clinic (400, "This payment method has already been added to the clinic.")
- Delete is permanent and only allowed if the method has never been used in a payment; otherwise 400 ("...cannot be deleted because it has existing payments. Please deactivate it instead.") — frontend can attempt Delete first and fall back to suggesting Deactivate on that error
- **⚠ Non-idempotent toggles:** unlike Working Hours' activate/deactivate (which return a friendly 200 on repeat calls), Activate/Deactivate here return a real 400 if the method is already in that state ("This payment method is already active/inactive."). Check current `isActive` (from the owner/management listing) before calling, or handle the 400 gracefully in the UI
- To change a method's `type`: delete the old one (if no payment history) and add a new one, or deactivate the old one and add a new one alongside it

**Error responses common across endpoints:** `404` clinic not found; `403` (inferred) caller not a member of the clinic, or a member but not the owner ("Only the clinic owner can make this action."); `404` `paymentMethodId` doesn't exist; `403` (inferred) `paymentMethodId` belongs to a different clinic; `500` on save failure; `400` standard model validation failures.

---

## 9. Online Payments Module — `/api/online-payment-accounts` & `/api/integrations`

Lets a clinic **Owner** connect a **Paymob** online payment account and enable payment methods (Card / Wallet) on it. Two controllers:
- **Online Payment Accounts** — configure / update / list the clinic's gateway account
- **Payment Integrations** — enable a specific payment method on an existing account

Only **Paymob** has working endpoints. `Stripe` exists in the provider enum but has **no configuration endpoint** — treat it as unavailable in the frontend.

**Auth & access:** All endpoints require authentication and role **Doctor** + **Owner** access on the clinic. Regular clinic members cannot manage payment accounts.

**`provider` enum:** `1 = Paymob` (supported), `2 = Stripe` (not available yet)

**`status` enum (`OnlinePaymentAccountStatus`):**

| Value | Name | Meaning |
|---|---|---|
| 1 | `NotConfigured` | Default/unused — accounts are created directly in `PendingVerification` |
| 2 | `PendingVerification` | Credentials saved, awaiting verification; set automatically on create **and** on any credential update |
| 3 | `Ready` | Verified and usable (`isReady = true`) |
| 4 | `Restricted` | Limited functionality |
| 5 | `Disabled` | Disabled — blocks adding new payment integrations |
| 6 | `NeedsAttention` | Requires the doctor's attention |

How an account moves from `PendingVerification` to `Ready` (or the other states) isn't in the controller code — likely an async process. **Re-fetch** the list endpoint to observe status changes; don't assume an immediate transition after Configure/Update.

**`paymentMethod` enum (`OnlinePaymentMethod`):** `1 = Card`, `2 = Wallet`

| Endpoint | Method | Access | Notes |
|---|---|---|---|
| `/api/online-payment-accounts/clinics/{clinicId}` | POST | Doctor, Owner | Configure a new Paymob account (max one per clinic); body: `publicKey`, `secretKey`, `hmacSecret`, `apiKey` — all required; starts in `PendingVerification` |
| `/api/online-payment-accounts/{accountId}/clinics/{clinicId}` | PATCH | Doctor, Owner | Update credentials; all four fields optional but at least one required; blank/whitespace = keep current value; puts account back in `PendingVerification` |
| `/api/online-payment-accounts/clinics/{clinicId}` | GET | Doctor, Owner | Lists the clinic's account(s) with integrations; `[]` if none |
| `/api/integrations/online-payment-accounts/{accountId}/clinics/{clinicId}` | POST | Doctor, Owner | Enable Card/Wallet on an account; body: `paymentMethod` (1/2), `integrationId` (int ≥ 1, issued by Paymob) |

**GET response shape:**
```json
[
  {
    "id": 1,
    "provider": "Paymob",
    "status": "Ready",
    "isReady": true,
    "integrations": [
      { "id": 5, "paymentMethod": "Card", "integrationId": 123456, "isActive": true }
    ]
  }
]
```
`isReady` is `true` exactly when `status` is `"Ready"`. `merchantId` and configuration-issue fields exist on the record but are **not** returned.

**Key rules:**
- **Credentials are write-only:** `publicKey`, `secretKey`, `hmacSecret`, `apiKey` are never returned in any response (the last three are encrypted at rest). Never pre-fill — show masked placeholders (e.g. `••••••••`) and let the doctor re-enter values to change them
- Credential fields have no format/length validation beyond being non-empty
- `integrationId` is Paymob's own ID from the doctor's Paymob dashboard — not generated by this API; the doctor must obtain it first
- Add Integration is rejected if the account is `Disabled` ("This Paymob account is disabled.") or the same `paymentMethod` is already integrated ("A Card payment integration is already configured for this clinic.")
- Update with all four fields blank → 400 ("Please provide at least one field to update.")
- **Success messages (200):** Configure → "Your Paymob credentials were saved and are pending verification."; Update → "Your Paymob account credentials were updated and are pending verification."; Add Integration → "A Card payment integration is configured for this Paymob account." (echoes the method name)

**Error responses:** `404` clinic not found; `403` (inferred) caller not a member / not the owner; `404` `accountId` doesn't exist; `400` account isn't a Paymob account; `400` Paymob account already configured (Configure); `500` save failure; `400` standard model validation failures.

**⚠ Different from other modules:** when `accountId` belongs to a *different clinic* than the one in the URL, this module returns a confirmed **400** (not the 403 pattern used in Clinics / Working Hours / Manual Payment Methods). Handle it as a 400.

**⚠ Possible backend bug (Update):** in the provided code, updating `apiKey` writes the new encrypted value into the account's **`hmacSecret`** field instead of `apiKey` (`hmacSecret` is assigned twice). Effects: sending `apiKey` alone silently overwrites `hmacSecret` and leaves the real `apiKey` unchanged; sending both `hmacSecret` and `apiKey` stores the `apiKey` value as `hmacSecret`. **Flag to backend before relying on `apiKey` updates** — until fixed, consider warning users or disabling independent `apiKey` updates in the UI.

**Not available (no endpoint):** removing/deactivating a payment integration once added, and disabling/deleting an online payment account. Only create + list exist for integrations; create/update/list for accounts.

---

# Frontend Pages Needed

Based on the endpoints above, here's the page/screen breakdown by user flow:

## Public / Unauthenticated
- **Landing / Role selection** — choose Doctor vs Patient signup
- **Doctor Registration** — multi-field form + file uploads (syndicate card, national ID), specialty dropdown (from Lookups)
- **Patient Registration** — simple form
- **Login**
- **Email Confirmation landing** — handles the `email`/`token` query-string link
- **Forgot Password (request link)**
- **Reset Password (set new password)** — handles `email`/`token` query-string link
- **Pending Approval / Rejected screen** — shown when doctor login is blocked by 403 (pending or rejected states)

## Shared (Doctor + Patient, authenticated)
- **Notifications panel/page** — list, mark-as-read, live updates via SignalR, unread badge
- **Account Settings** — change password, delete account
- **My Profile** (patient view, if patient profile fields exist elsewhere — not in this doc)

## Doctor — Profile
- **My Profile (view)** — `GET /doctors/me`
- **Edit Profile** — title, experience, bio, DOB, gender
- **Edit Profile Picture** — separate upload flow

## Doctor — Clinics
- **My Clinics (list)** — `GET /clinics`
- **Add Clinic** — form + image upload + phone numbers, region cascading dropdown (governorate → region)
- **Clinic Details** — view info, images, phone numbers, members
- **Edit Clinic** — owner-only partial update
- **Manage Clinic Images** — add/delete, 6-image cap indicator
- **Manage Clinic Phone Numbers** — add/delete, 6-number cap indicator
- **Clinic Members list** — view members, owner can remove members, member can leave

## Doctor — Invitations
- **Sent Invitations** — list + cancel action
- **Received Invitations** — list + accept/reject actions
- **Invite Doctor to Clinic** — form (owner-only), likely inline on Clinic Details page

## Doctor — Working Hours / Schedule
- **Working Hours per Clinic (list)** — shows all days, active/inactive state
- **Add Working Hours** — day picker (from Lookups), start/end time, slot duration
- **Edit Working Hours**
- **Activate/Deactivate toggle** — inline action on the list

## Doctor — Manual Payment Methods
- **Manage Payment Methods (owner view)** — `GET /manual-payment-methods/clinics/{clinicId}/management`, shows active + inactive, likely inline on Clinic Details page
- **Add Payment Method** — type selector (Vodafone Cash / InstaPay) + account identifier input, with per-type formatting hint
- **Edit Payment Method** — account identifier only (type shown read-only)
- **Activate/Deactivate toggle** — inline action on the list; handle non-idempotent 400 on repeat clicks
- **Delete confirmation** — attempt delete, fall back to "deactivate instead" messaging on the has-payments 400

## Doctor — Online Payments (Paymob)
- **Online Payments Overview (owner view)** — `GET /online-payment-accounts/clinics/{clinicId}`; shows account status badge (`PendingVerification` / `Ready` / `Restricted` / `Disabled` / `NeedsAttention`), `isReady` state, and integrations list; empty state with a "Connect Paymob" CTA when the list is `[]`; likely a section/tab on Clinic Details (owner-only)
- **Connect Paymob Account** — form with `publicKey`, `secretKey`, `hmacSecret`, `apiKey` (secret fields as password inputs); hide/disable once an account exists (only one per clinic); show "pending verification" confirmation after save
- **Update Paymob Credentials** — all fields optional with masked placeholders (never pre-filled); require at least one non-blank field; consider disabling independent `apiKey` edits until the backend bug is confirmed fixed
- **Add Payment Integration** — payment method selector (Card / Wallet) + numeric `integrationId` input with a hint that it comes from the doctor's Paymob dashboard; hide methods already integrated; block when account is `Disabled`
- **Status refresh / polling** — re-fetch the account list to observe verification status changes after Configure/Update
- **Stripe** — not shown (no endpoint available)

## Patient — Payment Methods
- **Clinic Payment Methods (view)** — `GET /manual-payment-methods/clinics/{clinicId}`, read-only list shown during booking/checkout at a clinic

## Supporting / Cross-cutting
- **Global error/toast handling** — standard error shape, 401 → force logout, 403 → access-denied messaging (note: Online Payments returns **400**, not 403, for an `accountId` belonging to another clinic)
- **File upload components** — reusable for images (5 MB limit, `.jpg/.jpeg/.png/.webp`) used across Doctor Registration, Profile Picture, Clinic Images
- **Cascading location selector** — Governorate → Region, reusable for Add/Edit Clinic
- **Masked secret input component** — reusable write-only credential field for Paymob keys

## Not covered by this documentation (flag for backend team)
- Appointment Slots UI (booking, viewing available slots) — module not included in provided API docs
- Patient-side profile management — only Doctor's `/me` endpoints are documented here
- Specialty icons — `medical-specialties` endpoint omits `IconUrl`, needed if icons are part of the design
- **Paymob `apiKey` update bug** — `apiKey` is written into `hmacSecret` on PATCH (see Section 9)
- **Online payment account/integration lifecycle** — no endpoints to remove/deactivate an integration or disable/delete an account; no documented trigger for `PendingVerification` → `Ready`
- **Patient-side online checkout flow** — no endpoint documented for patients to pay via Card/Wallet; only owner-side configuration is covered
- **Stripe** — present in the provider enum but no configuration endpoint