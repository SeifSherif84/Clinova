# Clinova 🏥

**Clinic Management & Appointment Booking System**

Clinova is an online clinic management and appointment booking system designed to connect patients, doctors, and clinics through a centralized platform.

Patients can discover doctors, book appointments, and manage their bookings, while doctors and clinics can manage working hours, schedules, and appointments.

## 🎯 Overview

Clinova aims to simplify the process of managing clinics and scheduling medical appointments by providing a centralized backend system for patients, doctors, clinics, and other healthcare staff.

The project is being developed as a modular backend system with a focus on maintainability, scalability, and clean separation of responsibilities.

## ✨ Features

### Authentication & Authorization

* User registration and authentication
* JWT-based authentication
* Role-based authorization
* Email confirmation
* Password management
* Refresh token support

### Doctor Management

* Doctor profiles
* Medical specialties
* Doctor approval workflow
* Doctor-Clinic relationships

### Clinic Management

* Clinic creation and management
* Clinic membership management
* Doctor invitations
* Clinic-related notifications

### Notifications

* Persistent notifications
* Real-time notifications using SignalR
* Clinic invitation notifications

### Appointment Management

* Working hours management
* Available time slots
* Appointment booking and management

> 🚧 Some modules are currently under development.

## 🏗️ Backend Architecture

Clinova is built using **ASP.NET Core Web API** with a layered and modular approach.

The backend follows several established software design patterns and practices, including:

* Service Layer
* Repository Pattern
* Unit of Work
* Specification Pattern
* Dependency Injection
* Entity Framework Core
* AutoMapper
* RESTful API design

## 🛠️ Technologies

| Technology            | Purpose                 |
| --------------------- | ----------------------- |
| C#                    | Programming Language    |
| ASP.NET Core          | Web API Framework       |
| Entity Framework Core | ORM                     |
| SQL Server            | Database                |
| JWT                   | Authentication          |
| SignalR               | Real-time Communication |
| AutoMapper            | Object Mapping          |
| Swagger / OpenAPI     | API Documentation       |
| Postman               | API Testing             |

## 📦 Project Modules

The backend is organized around several core business modules:

* Authentication
* Doctors
* Clinics
* Invitations
* Notifications
* Secretaries
* Working Hours
* Available Slots
* Appointments
* Payments
* Prescriptions
* Reviews

## 🔐 Security

The API uses JWT-based authentication and authorization to protect secured endpoints and identify authenticated users.

Role and permission-related rules are applied at the API level to ensure that users can only perform operations they are authorized to perform.

## ⚡ Real-Time Communication

Clinova uses **SignalR** to provide real-time notification delivery.

For example, when a doctor receives a clinic invitation, the notification can be delivered to the connected client without requiring the user to refresh the application.

## 🗄️ Database

The application uses **SQL Server** with **Entity Framework Core** for data access and persistence.

The database is designed around the main business entities and their relationships, including users, doctors, clinics, invitations, notifications, and appointment-related data.

## 📖 API Documentation

The API is documented using **Swagger / OpenAPI**.

Swagger can be used to explore available endpoints, request models, responses, and authentication requirements.

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

* .NET SDK
* SQL Server
* Visual Studio or another compatible IDE

### Installation

Clone the repository:

```bash
git clone https://github.com/SeifSherif84/Clinova.git
```

Navigate to the project directory:

```bash
cd Clinova
```

Restore dependencies:

```bash
dotnet restore
```

Update the database connection string in the application configuration.

Apply Entity Framework Core migrations:

```bash
dotnet ef database update
```

Run the application:

```bash
dotnet run
```

Open the Swagger UI from the URL displayed by the application.

## 📌 Project Status

🚧 **In Development**

The core authentication, doctor, clinic, invitation, and notification modules have been implemented. Additional modules are currently being developed.

## 🔮 Planned Modules

* Secretary Management
* Working Hours
* Available Slots
* Appointment Management
* Payment Integration
* Prescription Management
* Reviews

## 👨‍💻 Author

**Seif Sherif**

.NET Backend Developer | C# | ASP.NET Core

GitHub: [@SeifSherif84](https://github.com/SeifSherif84)
