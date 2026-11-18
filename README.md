# Clinova 🏥
### Clinic Management & Appointment Booking Platform

Clinova is a comprehensive clinic management and appointment booking platform designed to connect patients, doctors, clinics, and secretaries through a centralized healthcare management system.

The platform streamlines clinic operations by providing appointment scheduling, working hours management, online and manual payment processing, deposit payments, refund handling, notifications, reviews, and analytics.

Built with **ASP.NET Core Web API** and **React**, Clinova focuses on maintainability, scalability, secure access control, and well-structured business logic.

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- User registration and authentication.
- JWT-based authentication and authorization.
- Role-based access control.
- Email confirmation.
- Password management.
- Refresh token support.
- Secure access to protected API endpoints.

### 👨‍⚕️ Doctor Management
- Doctor profiles and professional information.
- Medical specialties management.
- Doctor approval workflow.
- Doctor-clinic relationships.
- Clinic access and ownership validation.
- Doctor dashboard and performance analytics.

### 🏥 Clinic Management
- Clinic creation and management.
- Clinic membership management.
- Doctor-clinic association.
- Clinic consultation fees and deposit percentage configuration.
- Clinic-specific payment configuration.
- Clinic working hours and appointment scheduling.

### ✉️ Invitations Management
- Doctor invitation management.
- Secretary invitation management.
- Invitation lifecycle and status management.
- Clinic-related invitation workflows.
- Notification integration for invitation events.

### 👩‍💼 Secretary Management
- Secretary account management.
- Secretary-clinic association.
- Secretary invitation and onboarding workflow.
- Appointment management through authorized secretary accounts.
- Guest appointment reservation support.
- Manual payment confirmation workflows.

### 🕒 Working Hours & Appointment Slots
- Doctor working hours management.
- Automatic appointment slot generation.
- Available, Reserved, and Booked slot states.
- Slot activation and deactivation.
- Safe handling of working hour changes.
- Protection against double booking.
- Database-level concurrency protection.

### 📅 Appointment Management
- Patient appointment booking.
- Appointment management for doctors and secretaries.
- Temporary slot reservation during payment.
- Appointment confirmation after successful payment.
- Appointment expiration handling.
- Appointment cancellation.
- Clinic and patient cancellation workflows.
- Appointment status lifecycle management.
- Guest appointment support.

### 💳 Payment Management

Clinova supports both manual and online payment methods.

**Manual Payment Methods**
- Clinic-specific manual payment methods.
- Cash at clinic.
- Manual bank transfer and other configured transfer methods.
- Manual payment verification and confirmation.

**Online Payment Accounts**
- Clinic-specific online payment accounts.
- Paymob account configuration.
- Payment integration management.
- Account activation and deactivation.
- Validation of clinic ownership and payment configuration.

### 💰 Deposit Payments
- Advance deposit payment support.
- Configurable clinic deposit percentages.
- Automatic deposit and remaining balance calculation.
- Payment tracking and status management.
- Separate handling of deposit payments and remaining clinic payments.
- Reservation expiration handling.

### 🔄 Paymob Integration & Refund Management
- Paymob payment integration.
- Payment Intent creation.
- Unified Checkout integration.
- Payment callback processing.
- HMAC signature verification.
- Payment status synchronization.
- Automated deposit refund handling.
- Refund status tracking.
- Idempotency protection for refund operations.
- Handling of late payment callbacks after appointment expiration.

### ⭐ Reviews & Ratings
- Patients can submit reviews for completed appointments.
- Rating system from 1 to 5 stars.
- Optional review comments.
- Anonymous reviews.
- Patient review management (create, update, and delete).
- Review approval workflow.
- Doctor-specific review listing.
- Patient-facing doctor reviews.
- Doctor rating summaries.
- Average rating and rating breakdown.
- Pagination for review listings.
- Only approved reviews contribute to public doctor ratings.

### 📊 Analytics & Dashboard
- Financial overview.
- Collected payments tracking.
- Awaiting verification amounts.
- Refund tracking.
- Net collected revenue.
- Payment method breakdown.
- Appointment status analytics.
- Doctor performance metrics.
- Interactive data visualization.
- Light and dark theme support.

### 🔔 Notifications & Real-Time Communication
- Persistent notification management.
- Real-time notification delivery using SignalR.
- Clinic invitation notifications.
- Event-driven notification workflows.
- Real-time communication between the backend and connected clients.

### 📧 Email Services
- Email sending infrastructure using MailKit.
- Email-based communication workflows.
- Integration with authentication and invitation-related processes.

---

## 🏗️ Backend Architecture

Clinova's backend is built using **ASP.NET Core Web API** and follows **Onion Architecture** principles to maintain a clear separation of concerns and keep business logic independent from infrastructure details.

The architecture is organized into dedicated layers:

- **Domain Layer:** Core business entities, enums, and domain-related logic.
- **Services Layer:** Application business logic and use-case implementation.
- **Infrastructure Layer:** Database access, external integrations, and infrastructure services.
- **Presentation Layer:** RESTful API controllers and HTTP endpoints.
- **Shared Layer:** Common DTOs, response models, and shared contracts.

### Design Patterns & Principles

The backend uses several established software engineering practices:

- Onion Architecture.
- Repository Pattern.
- Unit of Work.
- Specification Pattern.
- Service Layer.
- Dependency Injection.
- Entity Framework Core.
- DTO-based request and response contracts.
- Pagination.
- Separation of concerns.
- RESTful API design.

---

## 🛠️ Technology Stack

### Backend

| Technology | Purpose |
|---|---|
| C# | Programming Language |
| ASP.NET Core Web API | Backend Framework |
| Entity Framework Core | ORM |
| SQL Server | Relational Database |
| JWT | Authentication |
| SignalR | Real-Time Communication |
| MailKit | Email Services |
| AutoMapper | Object Mapping |
| Paymob | Online Payment Integration |
| Swagger / OpenAPI | API Documentation |

### Frontend

| Technology | Purpose |
|---|---|
| React | Frontend Library |
| JavaScript / TypeScript | Frontend Development |
| REST APIs | Backend Communication |

### Development & Testing Tools

- Visual Studio / Visual Studio Code.
- Git & GitHub.
- Postman.
- Swagger UI.

---

## 🗄️ Database & Data Management

Clinova uses **SQL Server** with **Entity Framework Core** for database management and persistence.

The database is designed around the platform's main business entities and their relationships, including:

- Users and role-specific accounts.
- Doctors and clinics.
- Patients and secretaries.
- Doctor and secretary invitations.
- Working hours and appointment slots.
- Appointments.
- Manual payment methods.
- Online payment accounts and integrations.
- Deposit payments and refunds.
- Reviews and ratings.
- Notifications.

### Data Integrity & Business Rules

Special attention is given to data consistency and concurrency:

- Unique constraints to prevent duplicate bookings.
- Filtered indexes for appointment slot availability.
- Handling database concurrency exceptions.
- Safe appointment expiration and slot release.
- Validation of entity ownership and user permissions.
- Idempotent refund processing.
- Snapshotting cancellation policy settings at booking time.

---

## 💳 Appointment & Payment Workflow

One of Clinova's core workflows is the appointment booking and deposit payment process.

The typical patient booking lifecycle is:

1. The patient selects an available appointment slot.
2. The system temporarily reserves the selected slot.
3. An appointment is created with a `PendingPayment` status.
4. A deposit payment is created based on the clinic's configured deposit percentage.
5. The patient completes the payment through the available payment provider.
6. The backend verifies the payment callback and its HMAC signature.
7. The payment is marked as successful.
8. The appointment becomes `Confirmed`.
9. The appointment slot becomes `Booked`.

### Reservation Expiration

Pending reservations have a limited expiration period. If payment is not completed before expiration:

- The appointment becomes `Expired`.
- The pending payment is updated accordingly.
- The reserved slot becomes available again.

The system also handles late payment callbacks to prevent expired appointments from being incorrectly confirmed or previously released slots from being booked again.

---

## 🔄 Cancellation & Refund Policy

Clinova implements a centralized cancellation and refund policy.

The policy includes:

- A booking cancellation grace period.
- A full-refund cancellation window.
- Full deposit refunds for clinic-initiated cancellations.
- No refund for cancellations outside the eligible refund windows.
- No refund for patient no-shows.
- Refund tracking and processing.
- Cancellation policy snapshots stored with appointments.

The policy is designed to provide consistent cancellation rules across clinics rather than relying on individually configured clinic cancellation policies.

---

## 🔐 Security

Security is implemented across the application using:

- JWT-based authentication.
- Role-based authorization.
- Protected API endpoints.
- Ownership and access validation.
- Request validation.
- Secure payment callback verification.
- HMAC verification for Paymob callbacks.
- Controlled access to clinic and appointment operations.

The system ensures that users can only access and perform operations permitted by their roles and relationships.

---

## ⚡ Real-Time Communication

Clinova uses **SignalR** to support real-time notification delivery.

This allows connected clients to receive notifications without requiring manual page refreshes.

For example, when a doctor receives a clinic invitation, the notification can be delivered to the connected application in real time.

---

## 📖 API Documentation & Testing

The backend API is documented using **Swagger / OpenAPI**.

Swagger provides an interactive interface for exploring:

- Available API endpoints.
- Request and response models.
- Authentication requirements.
- API operations.

Postman is also used for API testing and validating application workflows.

---

## 🚀 Getting Started

### Prerequisites

Make sure the following tools are installed:

- [.NET SDK](https://dotnet.microsoft.com/download)
- [SQL Server](https://www.microsoft.com/en-us/sql-server)
- [Node.js](https://nodejs.org/)
- npm
- Visual Studio or Visual Studio Code
- Git

### Backend Setup

**1. Clone the repository**

```bash
git clone https://github.com/SeifSherif84/Clinova.git
```

**2. Navigate to the project directory**

```bash
cd Clinova
```

**3. Restore dependencies**

```bash
dotnet restore
```

**4. Configure application settings**

Update the database connection string and required configuration values in the appropriate application settings.

Depending on the enabled features, configuration may include:

- SQL Server connection string.
- JWT settings.
- Email service settings.
- Paymob credentials.
- Other required environment-specific settings.

Do not commit sensitive credentials or API keys to source control.

**5. Apply database migrations**

```bash
dotnet ef database update
```

**6. Run the backend application**

Navigate to the ASP.NET Core startup project and execute:

```bash
dotnet run
```

The API will be available at the configured application URL.

Open the Swagger UI to explore and test the API endpoints.

### Frontend Setup

Navigate to the React frontend directory:

```bash
cd <frontend-directory>
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Configure the frontend API base URL according to the backend environment.

---

## 📌 Project Status

**Currently in Development**

The core Clinova platform has been implemented, including:

- Authentication & Authorization.
- Doctors & Clinics.
- Doctor & Secretary Invitations.
- Patients & Secretaries.
- Notifications & SignalR.
- Working Hours & Appointment Slots.
- Appointment Management.
- Manual & Online Payment Methods.
- Deposit Payments.
- Paymob Integration.
- Deposit Refund Management.
- Reviews & Ratings.
- Analytics & Dashboard.
- MailKit Email Services.
- Onion Architecture and backend infrastructure.

### Remaining Module

- **Prescription Management** — Planned for implementation.

---

## 🔮 Future Enhancements

- Prescription creation and management.
- Additional healthcare workflow enhancements.
- Further improvements to analytics and reporting.
- Additional platform capabilities as the project evolves.

---

## 👨‍💻 Author

**Seif Sherif**

.NET Backend Developer | C# | ASP.NET Core

GitHub: [@SeifSherif84](https://github.com/SeifSherif84)

**Repository:** [Clinova](https://github.com/SeifSherif84/Clinova)

---

*Clinova — Connecting Patients, Doctors, and Clinics through a smarter healthcare management platform.*
