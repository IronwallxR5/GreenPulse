# GreenPulse — Carbon Footprint Tracking Platform for Digital Infrastructure

## Overview

**GreenPulse** is a full-stack Enterprise SaaS platform that enables organizations to track, analyze, and reduce the carbon footprint of their digital infrastructure in real-time. From compute workloads and storage provisioning to network traffic and API calls — every operational action generates a measurable environmental impact.

Traditional cloud monitoring tools focus on performance and cost, but completely ignore the **environmental cost** of digital operations. **GreenPulse** fills this gap by providing a **Polymorphic Calculation Engine** — a core architectural component that uses **abstract base classes and inheritance** to calculate CO2 emissions differently for each type of infrastructure event (Compute, Storage, Network, API Calls). This engine enforces the **Open/Closed Principle**: adding a new event type requires only creating a new subclass — zero changes to existing business logic.

---

## Problem Statement

1. **Invisible carbon cost** — Cloud providers report uptime and cost, but never the CO2 generated per compute hour, per GB stored, or per million API calls.
2. **No standardized measurement** — Different infrastructure types (compute vs. storage vs. network) produce vastly different carbon footprints, but most tools apply a single flat multiplier.
3. **Lack of project-level tracking** — Organizations run hundreds of microservices but have no way to attribute carbon emissions to specific projects or teams.
4. **No actionable insights** — Even when carbon data exists, there are no alerts, trend analysis, or optimization recommendations.
5. **Compliance gaps** — With rising ESG (Environmental, Social, Governance) regulations, companies need auditable carbon footprint reports for their digital operations.

---

## Scope

### In Scope
- Polymorphic CO2 calculation engine with type-specific emission factors
- Project-based carbon footprint organization and tracking
- Impact Event logging with automatic carbon score computation
- User authentication and authorization (JWT + RBAC)
- Real-time analytics dashboard with per-project and per-type breakdowns
- PDF and CSV report generation (Strategy Pattern)
- Threshold-based carbon alerts and notifications (Observer Pattern)
- Organization and team management for enterprise use
- RESTful API with full CRUD for Projects, Impact Logs, Users
- Filtering, search, sorting, and pagination for all data views
- Data export capabilities for compliance reporting

### Out of Scope (for Milestone 1)
- Direct cloud provider API integration (AWS CloudWatch, GCP Monitoring)
- Real-time streaming ingestion from infrastructure agents
- Machine learning-based carbon optimization recommendations
- Mobile application (web-only for now)
- Blockchain-based carbon credit ledger (architectural placeholder only)

---

## Key Features

### 1. Polymorphic Calculation Engine
- **Abstract Base Class**: `ImpactEvent` defines the contract — every event type must implement `calculateCO2()`.
- **Type-Specific Subclasses**: `ComputeEvent` (0.5 kg/unit), `StorageEvent` (0.12 kg/unit), `NetworkEvent` (0.06 kg/unit), `ApiCallEvent` (0.0001 kg/unit).
- **Factory-Based Instantiation**: A Factory Method determines which subclass to create based on the `ImpactType` enum at runtime.
- **Extensible by Design**: New event types can be added without modifying existing code.

### 2. Project Management
- **Create Projects**: Define digital projects (applications, services, environments) as carbon tracking boundaries.
- **Project Dashboard**: Per-project carbon summary with total CO2, log count, and breakdown by event type.
- **Project Lifecycle**: Full CRUD with ownership verification — only the project owner can view, edit, or delete.

### 3. Impact Event Logging
- **Log Events**: Record infrastructure actions with type, unit value, and optional description.
- **Auto-Calculated Scores**: Carbon score is computed polymorphically at creation time — no manual input needed.
- **Filtering & Search**: Filter by impact type, search by name/description, sort by carbon score or date, paginate results.

### 4. Analytics & Reporting
- **Carbon Summaries**: Aggregate CO2 by project, by type, or across the entire organization.
- **Trend Analysis**: Historical carbon emission trends with time-series visualizations.
- **PDF Report Generation**: Generate downloadable PDF compliance reports using the Strategy Pattern (`IReportStrategy` → `PdfReportStrategy`).
- **Export Data**: CSV export for integration with external ESG reporting tools.

### 5. Notification & Alert System
- **Threshold Alerts**: Set CO2 limits per project — get notified when emissions exceed a defined threshold.
- **Observer Pattern**: `NotificationService` decouples alert producers from consumers, enabling email, in-app, and webhook delivery channels.
- **Activity Feed**: Real-time feed of recent impact events and carbon milestones.

### 6. Organization & Team Management
- **Multi-Tenant**: Organizations can onboard multiple teams, each managing their own projects.
- **Team-Level Analytics**: Aggregate carbon footprint across all projects owned by a team.
- **Admin Controls**: Organization admins can manage members, set carbon budgets, and enforce policies.

### 7. Admin & Compliance Tools
- **Load Monitoring**: Monitor system-wide event ingestion rates and calculation latency.
- **Compliance Dashboard**: Ensure all projects comply with organizational carbon policies.
- **Audit Logs**: Complete tamper-proof audit trail of all data mutations (CREATE/UPDATE/DELETE).

### 8. Authentication & Security
- **JWT-Based Auth**: Secure token-based authentication with 7-day expiry.
- **Role-Based Access Control (RBAC)**: User, Admin, and System roles with scoped permissions.
- **Password Hashing**: bcrypt with salt rounds for secure credential storage.

---

## Tech Stack

| Layer          | Technology                                       |
|----------------|--------------------------------------------------|
| **Frontend**   | React.js, Chart.js / Recharts                    |
| **Backend**    | Node.js (Express.js), TypeScript                 |
| **Database**   | MySQL (Relational), Prisma ORM                   |
| **Auth**       | JWT + RBAC (Role-Based Access Control)           |
| **API**        | RESTful API (Express Router)                     |
| **Reporting**  | PDFKit / jsPDF (PDF), csv-writer (CSV)           |
| **Testing**    | Jest, Supertest                                  |
| **DevOps**     | Docker, GitHub Actions CI/CD                     |

---

## Architecture Principles

- **Clean Architecture**: Controllers → Services → Repositories separation
- **OOP Principles**: Encapsulation, Abstraction, Inheritance, Polymorphism throughout the domain model
- **Design Patterns** (used where they naturally fit):
  - **Factory Method** — Creating the correct `ImpactEvent` subclass based on `ImpactType` enum
  - **Strategy** — Report generation algorithms (PDF vs CSV)
  - **Observer** — Notification system for carbon threshold alerts
  - **Template Method** — Summary generation and report building process
  - **Repository** — Data access abstraction (`ImpactRepository`, `ProjectRepository`)
  - **Chain of Responsibility** — Middleware pipeline (Auth → Validation → Controller)
- **SOLID Principles** adherence across all modules
- **Repository Pattern** for data access abstraction
- **DTO Pattern** for data transfer between layers

---

## User Roles

| Role       | Description                                                                    |
|------------|--------------------------------------------------------------------------------|
| **User**   | Manages projects, logs impact events, views analytics, generates reports.      |
| **Admin**  | Full system access, user management, organization configuration, audit logs.   |
| **System** | Internal processes: auto-calculation, threshold monitoring, report scheduling. |
