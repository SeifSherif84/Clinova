# Clinova 🏥

**Clinic Management & Appointment Booking Platform**

Clinova connects patients, doctors, clinics, and secretaries in a single platform for managing schedules, bookings, payments, reviews, and analytics.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Backend | C#, ASP.NET Core Web API, Entity Framework Core |
| Database | SQL Server |
| Frontend | React |
| Auth | JWT, Role-based authorization, Refresh tokens |
| Real-time | SignalR |
| Email | MailKit |
| Payments | Paymob (Standard APIs, Unified Checkout) |
| Mapping & Docs | AutoMapper, Swagger / OpenAPI |

## Architecture

Built on **Onion Architecture** with a clear separation between business logic, infrastructure, and presentation:

- **Domain**: entities, enums, core business rules
- **Services**: business logic
- **Repositories**: data access (Generic Repository + Unit of Work)
- **Specifications**: reusable query conditions
- **Presentation**: controllers / HTTP APIs
- **Shared**: DTOs, responses, common types (e.g. `PaginatedResult<T>`, `PaginatedReviewsResult<T>`)

## Roles

`Patient` · `Doctor` · `Secretary` · `Admin`

## Features

### Accounts & Access
- Registration, login, email confirmation, password management
- JWT authentication with refresh tokens
- Role-based authorization across all endpoints

### Doctors, Clinics & Invitations
- Doctor profiles, specialties, approval workflow
- Clinic creation and management, with per-clinic consultation fee and deposit percentage
- Separate invitation flows for doctors and secretaries
- Secretaries are linked to a single clinic and manage its bookings, including guest bookings and manual payment confirmation

### Scheduling
- Working hours per doctor/clinic with automatic slot generation
- Slot states: `Available` → `Reserved` → `Booked`
- Deleting a working hour removes only `Available` slots; existing reservations and bookings are preserved
- Double-booking protection via a unique filtered index, handling SQL errors `2601` / `2627`
- Egypt Standard Time used for all appointment time validation

### Appointments
- Lifecycle: `PendingPayment` → `Confirmed` → `Completed`, or `Cancelled` / `Expired` / `No-Show`
- Temporary slot reservation (30 minutes) with an automatic expiration service
- Unified cancellation policy, stored as a snapshot on each appointment:

| Case | Refund |
| --- | --- |
| Cancelled within 10 minutes of booking | Full |
| Cancelled 120+ minutes before the appointment | Full |
| Later patient cancellation | None |
| Cancelled by the clinic | Full |
| No-show | None |

### Payments
- **Deposit model:** the deposit is paid online, the remainder is paid at the clinic (e.g. 500 EGP fee × 20% = 100 EGP online, 400 EGP at clinic)
- Manual payment methods per clinic: Cash at Clinic, InstaPay, Vodafone Cash
- Online payment accounts and integrations per clinic, separated from manual methods
- Paymob flow: payment intent → Unified Checkout → webhook → HMAC verification → payment update → appointment confirmation
- Late-payment handling: a successful callback arriving after reservation expiry triggers an automatic refund instead of re-confirming the slot
- Dedicated refund records with idempotency keys to prevent duplicate refunds

### Reviews
- One review per completed appointment, 1–5 stars, optional comment, anonymous option
- Stars-only reviews are auto-approved; reviews with comments go to `Pending`
- Editing a comment returns the review to `Pending`
- Doctor rating is calculated from approved reviews only
- Patient APIs: submit, update, delete, list own reviews, view doctor reviews and rating summary
- Doctor API: view own approved reviews with total count and average rating

### Analytics
- Financial overview: collected, awaiting verification, refunds, net collected, payment method breakdown
- Appointment status analytics and doctor performance
- Light / Dark mode support

### Notifications
- Persistent notifications for invitations, booking status changes, and payments
- Real-time delivery via SignalR
- Email delivery via MailKit

## Project Status

| Module | Status |
| --- | --- |
| Auth, Doctors, Clinics, Patients | ✅ |
| Doctor & Secretary Invitations, Secretaries | ✅ |
| Working Hours, Appointment Slots, Appointments | ✅ |
| Manual Payment Methods, Online Payment Accounts | ✅ |
| Deposit Payments, Paymob, Refund Service | ✅ |
| Reviews (Patient & Doctor APIs) | ✅ |
| Analytics | ✅ |
| Notifications, SignalR, MailKit | ✅ |
| Admin review moderation (approve / reject) | 🚧 Planned |
| Prescriptions | 🚧 Planned |

## Getting Started

**Prerequisites:** .NET SDK, SQL Server, Visual Studio (or any compatible IDE)

```bash
git clone https://github.com/SeifSherif84/Clinova.git
cd Clinova
dotnet restore
```

1. Update the connection string and the Paymob / MailKit / JWT settings in the application configuration.
2. Apply migrations and run:

```bash
dotnet ef database update
dotnet run
```

3. Open Swagger UI from the URL shown in the console.

## Author

**Seif Sherif**: .NET Backend Developer
GitHub: [@SeifSherif84](https://github.com/SeifSherif84)
