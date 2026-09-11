# Clinova API — Summary

A condensed reference to the Clinova backend API, covering all modules: Auth, Clinics, Doctors, Invitations, Lookups, Notifications, and Working Hours.

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

## Supporting / Cross-cutting
- **Global error/toast handling** — standard error shape, 401 → force logout, 403 → access-denied messaging
- **File upload components** — reusable for images (5 MB limit, `.jpg/.jpeg/.png/.webp`) used across Doctor Registration, Profile Picture, Clinic Images
- **Cascading location selector** — Governorate → Region, reusable for Add/Edit Clinic

## Not covered by this documentation (flag for backend team)
- Appointment Slots UI (booking, viewing available slots) — module not included in provided API docs
- Patient-side profile management — only Doctor's `/me` endpoints are documented here
- Specialty icons — `medical-specialties` endpoint omits `IconUrl`, needed if icons are part of the design
