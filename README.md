<div align="center">

# 🌱 GreenPulse

**Carbon Footprint Tracking Platform for Digital Infrastructure**

[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

*Transform abstract infrastructure metrics into measurable CO₂e scores — every compute hour, every GB stored, every API call.*

---

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [CO2 Formulas](#-co2-calculation-formulas) · [Roadmap](#-roadmap)

</div>

---

## 📋 Overview

**GreenPulse** is a full-stack carbon tracking platform that enables developers and DevOps teams to measure the carbon footprint of their digital infrastructure. It monitors **Impact Events** — cloud compute usage, data storage, network transfers, and API calls — and calculates their CO₂ equivalent using a **Polymorphic Calculation Engine**.

The platform is built with a React frontend and a Node.js/Express backend following **Clean Architecture** principles. The core engine uses **abstract base classes and inheritance** to compute emissions differently for each infrastructure event type — adding a new event type requires only creating a new subclass, with **zero changes to existing business logic** (Open/Closed Principle).

---

## ✨ Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Polymorphic CO2 Engine** | ✅ | Abstract base class with type-specific subclasses (`ComputeEvent`, `StorageEvent`, `NetworkEvent`, `ApiCallEvent`) |
| **Project Management** | ✅ | Full CRUD with edit and ownership verification — only the project owner can view, modify, or delete |
| **Impact Event Logging** | ✅ | Record infrastructure events with auto-calculated carbon scores, edit and delete support |
| **Search, Filter & Sort** | ✅ | Filter by type, search by name/description, sort by carbon score or date with pagination |
| **Project Summaries** | ✅ | Aggregate CO₂ by type with total count and per-type breakdown |
| **PDF/CSV Reports** | ✅ | Downloadable compliance reports using the Strategy Pattern (`pdfkit` + `json2csv`) |
| **Analytics Dashboard** | ✅ | Per-project and cross-project CO₂ charts using Recharts |
| **Carbon Threshold Alerts** | ✅ | Budget-based alerts using the Observer Pattern — fires and persists an alert whenever total CO₂ exceeds the set limit |
| **Budget Progress Tracking** | ✅ | Visual progress bar showing current CO₂ usage vs. configured budget per project |
| **User Profile** | ✅ | Profile page with account info sourced from `GET /api/auth/me` |
| **JWT Authentication** | ✅ | Secure token-based auth with 7-day configurable expiry |
| **Zod Validation** | ✅ | Schema-based request validation with descriptive error messages |
| **Organization Management** | 🔜 | Multi-tenant team-based carbon tracking |
| **RBAC** | 🔜 | Role-based access control (User / Admin / System) |

---

## 🏗 Architecture

### Layered Clean Architecture

```
Client (React)
      │
      ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────┐
│  Route +     │────▶│   Service    │────▶│  Repository  │────▶│ Database│
│  Middleware  │     │ (Business    │     │ (Data Access)│     │(Postgres)│
│ (Auth + Zod) │     │  Logic)      │     │              │     │         │
└─────────────┘     └──────────────┘     └──────────────┘     └─────────┘
                           │
                    ┌──────┴────────┐
                    ▼               ▼
             ┌──────────┐   ┌──────────────┐
             │ImpactEvent│   │Notification  │
             │(Polymorphic│  │Service       │
             │CO2 Calc)  │   │(Observer)    │
             └──────────┘   └──────────────┘
```

### OOP Class Hierarchy

```
ImpactEvent (Abstract Base Class)
    ├── ComputeEvent   → 0.5 kg CO₂/hour
    ├── StorageEvent   → 0.12 kg CO₂/GB/month
    ├── NetworkEvent   → 0.06 kg CO₂/GB transferred
    └── ApiCallEvent   → 0.0001 kg CO₂/request
```

### Design Patterns Used

| Pattern | Where | Purpose |
|---------|-------|---------|
| **Factory Method** | `ImpactService.calculateCO2()` | Instantiates the correct `ImpactEvent` subclass from `ImpactType` |
| **Polymorphism** | `ImpactEvent` hierarchy | Each subclass computes CO₂ differently via `calculateCO2()` |
| **Strategy** | `ReportingService` | Swappable PDF and CSV report generators behind a common `IReportStrategy` interface |
| **Observer** | `NotificationService` (singleton) | Subscribers are notified when a project's CO₂ exceeds its budget; alert persisted to DB |
| **Repository** | All data access classes | Abstracts Prisma queries from business logic |
| **Chain of Responsibility** | Middleware pipeline | Auth → Validation → Controller |
| **Dependency Injection** | Service constructors | Services receive repository dependencies |

### Separation of Concerns

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Controllers** | HTTP request/response handling | `ImpactController`, `ProjectController`, `AuthController` |
| **Services** | Business logic, CO₂ calculations, ownership checks | `ImpactService`, `ProjectService`, `NotificationService` |
| **Repositories** | Database operations (Prisma queries) | `ImpactRepository`, `AlertRepository`, `UserRepository` |
| **Models** | OOP classes with inheritance | `ImpactEvent` abstract class and subclasses |
| **Middleware** | Cross-cutting concerns | `authenticateToken`, `validateImpactCreate` |

---

## 📁 Project Structure

```
GreenPulse/
├── backend/
│   ├── src/
│   │   ├── server.ts                           # Entry point
│   │   ├── app.ts                              # Express app configuration
│   │   ├── config/
│   │   │   └── prisma.ts                       # Prisma client singleton
│   │   ├── models/
│   │   │   └── ImpactEvent.ts                  # Abstract class + subclasses (Polymorphism)
│   │   ├── repositories/
│   │   │   ├── alert.repository.ts             # Alert data access
│   │   │   ├── impact.repository.ts            # ImpactLog data access
│   │   │   ├── project.repository.ts           # Project data access
│   │   │   └── user.repository.ts              # User data access
│   │   ├── services/
│   │   │   ├── auth.service.ts                 # JWT auth + password hashing
│   │   │   ├── impact.service.ts               # CO₂ calculation + Factory Pattern
│   │   │   ├── project.service.ts              # Project business logic + alerts
│   │   │   ├── notifications/
│   │   │   │   └── NotificationService.ts      # Observer Pattern for threshold alerts
│   │   │   └── reporting/
│   │   │       ├── IReportStrategy.ts          # Strategy interface
│   │   │       ├── PdfReportStrategy.ts        # PDF generation (pdfkit)
│   │   │       └── CsvReportStrategy.ts        # CSV generation (json2csv)
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts              # Auth HTTP handlers (register, login, me)
│   │   │   ├── impact.controller.ts            # Impact HTTP handlers
│   │   │   └── project.controller.ts           # Project + budget + alerts handlers
│   │   ├── routes/
│   │   │   ├── auth.routes.ts                  # /api/auth
│   │   │   ├── impact.routes.ts                # /api/projects/:id/impacts
│   │   │   └── project.routes.ts               # /api/projects
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts              # JWT verification
│   │   │   └── validation.middleware.ts        # Zod schema validation
│   │   └── utils/
│   │       └── interfaces.ts                   # TypeScript DTOs & interfaces
│   ├── prisma/
│   │   └── schema.prisma                       # Database schema
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx                             # Router + protected routes
│   │   ├── context/
│   │   │   └── AuthContext.tsx                 # Auth state provider
│   │   ├── components/
│   │   │   ├── layout/Layout.tsx               # Shared navbar + outlet
│   │   │   └── ui/                             # Reusable UI primitives (shadcn)
│   │   ├── pages/
│   │   │   ├── Auth/                           # Login + Register pages
│   │   │   ├── Dashboard/                      # Project list + create/edit/delete
│   │   │   ├── ProjectView/                    # Impact logs + budget + alerts panel
│   │   │   ├── Analytics/                      # Cross-project CO₂ charts
│   │   │   └── Profile/                        # User profile page
│   │   ├── services/
│   │   │   ├── api.ts                          # Axios instance with auth interceptor
│   │   │   ├── auth.service.ts                 # register, login, me
│   │   │   ├── project.service.ts              # project CRUD + budget + alerts
│   │   │   └── impact.service.ts               # impact CRUD
│   │   └── hooks/
│   │       └── useDebounce.ts                  # Debounce helper for search input
│   └── package.json
├── ErDiagram.md                                # Entity-Relationship diagram
├── classDiagram.md                             # Class diagram (UML)
├── sequenceDiagram.md                          # Sequence diagram
├── useCaseDiagram.md                           # Use case diagram
├── idea.md                                     # Full project vision & scope
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** 12+ (running locally or remote)
- **npm** v9+

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/IronwallxR5/GreenPulse.git
cd GreenPulse/backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your PostgreSQL credentials and a strong JWT secret
```

### Environment Configuration

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/GreenPulse?schema=public"
PORT=8080
NODE_ENV=development
JWT_SECRET="your-super-secret-key-min-32-characters"
JWT_EXPIRES_IN=7d
```

### Database Setup

```bash
# Run migrations (creates all tables including alerts)
npx prisma migrate dev

# Or if migrating from scratch:
npx prisma migrate dev --name init
```

### Run the Backend

```bash
# Development (hot reload)
npm run dev

# Production
npm run build && npm start
```

> Backend starts at `http://localhost:8080`

### Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

> Frontend starts at `http://localhost:5173`

---

## 📡 API Reference

### Base URL

```
http://localhost:8080
```

All protected endpoints require: `Authorization: Bearer <token>`

---

### 🔐 Authentication

<details>
<summary><b>POST</b> <code>/api/auth/register</code> — Register a new user</summary>

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response** `201 Created`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "email": "user@example.com", "name": "John Doe" }
}
```
</details>

<details>
<summary><b>POST</b> <code>/api/auth/login</code> — Login</summary>

**Request:**
```json
{ "email": "user@example.com", "password": "password123" }
```

**Response** `200 OK`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "email": "user@example.com", "name": "John Doe" }
}
```
</details>

<details>
<summary><b>GET</b> <code>/api/auth/me</code> — Get current user profile 🔒</summary>

**Response** `200 OK`:
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-04-12T10:00:00.000Z"
}
```
</details>

---

### 📂 Projects (Protected 🔒)

<details>
<summary><b>POST</b> <code>/api/projects</code> — Create project</summary>

```json
{ "name": "Cloud Infrastructure", "description": "Main cloud setup" }
```
**Response** `201 Created`
</details>

<details>
<summary><b>GET</b> <code>/api/projects</code> — List all projects</summary>

Returns all projects owned by the authenticated user, with `_count.impactLogs`.
</details>

<details>
<summary><b>GET</b> <code>/api/projects/:id</code> — Get single project</summary>

Returns project details including `carbonBudget` and impact log count.
</details>

<details>
<summary><b>PUT</b> <code>/api/projects/:id</code> — Update project</summary>

```json
{ "name": "Updated Name", "description": "Updated description" }
```
</details>

<details>
<summary><b>DELETE</b> <code>/api/projects/:id</code> — Delete project</summary>

Cascade deletes all associated impact logs and alerts.
</details>

<details>
<summary><b>GET</b> <code>/api/projects/:id/summary</code> — Get CO₂ summary</summary>

**Response** `200 OK`:
```json
{
  "totalCO2": 78,
  "totalLogs": 3,
  "byType": [
    { "type": "COMPUTE", "totalCO2": 24, "count": 1 },
    { "type": "STORAGE", "totalCO2": 24, "count": 1 },
    { "type": "NETWORK", "totalCO2": 30, "count": 1 }
  ]
}
```
</details>

<details>
<summary><b>GET</b> <code>/api/projects/:id/report</code> — Download report</summary>

**Query Params:** `?format=pdf` (default) or `?format=csv`

Downloads a compliance report as a file attachment. Uses the **Strategy Pattern** — `PdfReportStrategy` or `CsvReportStrategy` is selected at runtime.
</details>

<details>
<summary><b>PUT</b> <code>/api/projects/:id/budget</code> — Set carbon budget</summary>

```json
{ "carbonBudget": 100.0 }
```
Set to `null` to clear the budget. Once set, an alert is automatically created whenever total CO₂ reaches or exceeds this value (Observer Pattern).
</details>

<details>
<summary><b>GET</b> <code>/api/projects/:id/alerts</code> — Get threshold alerts</summary>

Returns all alerts for the project, newest first.

**Response** `200 OK`:
```json
[
  {
    "id": 1,
    "projectId": 1,
    "message": "Carbon budget exceeded for project #1. Total CO₂: 105.2400 kg — Budget: 100.0000 kg.",
    "totalCO2": 105.24,
    "budget": 100.0,
    "isRead": false,
    "createdAt": "2026-04-12T11:45:00.000Z"
  }
]
```
</details>

<details>
<summary><b>PATCH</b> <code>/api/projects/:id/alerts/read</code> — Mark all alerts as read</summary>

Marks all unread alerts for the project as read.

**Response** `200 OK`: `{ "message": "All alerts marked as read" }`
</details>

---

### 📊 Impact Events (Protected 🔒, nested under Projects)

<details>
<summary><b>POST</b> <code>/api/projects/:projectId/impacts</code> — Log impact event</summary>

**Request:**
```json
{
  "name": "AWS EC2 Instance",
  "description": "Production server running 24/7",
  "type": "COMPUTE",
  "unitValue": 24
}
```

**Impact Types:** `COMPUTE` | `STORAGE` | `NETWORK` | `API_CALL`

**Response** `201 Created`:
```json
{
  "id": 1,
  "name": "AWS EC2 Instance",
  "type": "COMPUTE",
  "unitValue": 24,
  "carbonScore": 12,
  "projectId": 1,
  "createdAt": "2026-04-12T04:57:46.251Z"
}
```

> If the project has a `carbonBudget` set and the new total CO₂ meets or exceeds it, an alert is automatically created.
</details>

<details>
<summary><b>GET</b> <code>/api/projects/:projectId/impacts</code> — List impacts (with filters)</summary>

**Query Parameters:**

| Parameter | Description | Options |
|-----------|-------------|---------|
| `type` | Filter by impact type | `COMPUTE`, `STORAGE`, `NETWORK`, `API_CALL` |
| `search` | Search in name/description | any string |
| `sortBy` | Sort field | `createdAt`, `carbonScore`, `name` |
| `sortOrder` | Sort direction | `asc`, `desc` |
| `page` | Page number | default: `1` |
| `limit` | Items per page | default: `10` |

**Example:**
```
GET /api/projects/1/impacts?type=COMPUTE&search=AWS&sortBy=carbonScore&sortOrder=desc&page=1&limit=10
```
</details>

<details>
<summary><b>GET</b> <code>/api/projects/:projectId/impacts/:id</code> — Get single impact</summary>

Returns impact details with associated project info.
</details>

<details>
<summary><b>PUT</b> <code>/api/projects/:projectId/impacts/:id</code> — Update impact</summary>

```json
{ "name": "Updated Name", "unitValue": 30 }
```
Carbon score is automatically recalculated when `type` or `unitValue` changes.
</details>

<details>
<summary><b>DELETE</b> <code>/api/projects/:projectId/impacts/:id</code> — Delete impact</summary>
</details>

---

## 🧪 Testing with cURL

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass1234","name":"Test User"}'

# Login & save token
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass1234"}' | jq -r '.token')

# Create project
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"My Cloud","description":"Cloud infrastructure"}'

# Log an impact event
curl -X POST http://localhost:8080/api/projects/1/impacts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"EC2 Server","type":"COMPUTE","unitValue":24}'

# Set a carbon budget (alerts fire when exceeded)
curl -X PUT http://localhost:8080/api/projects/1/budget \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"carbonBudget": 10}'

# Get threshold alerts
curl http://localhost:8080/api/projects/1/alerts \
  -H "Authorization: Bearer $TOKEN"

# Get project CO₂ summary
curl http://localhost:8080/api/projects/1/summary \
  -H "Authorization: Bearer $TOKEN"

# Download CSV report
curl "http://localhost:8080/api/projects/1/report?format=csv" \
  -H "Authorization: Bearer $TOKEN" \
  -o report.csv
```

---

## 🔬 CO₂ Calculation Formulas

Each impact type uses a scientifically-informed emission factor applied through **polymorphic method dispatch**:

| Impact Type | Formula | Emission Factor | Example |
|-------------|---------|-----------------|---------|
| **COMPUTE** | `unitValue × 0.5` | 0.5 kg CO₂/hour | 24 hours → **12 kg CO₂** |
| **STORAGE** | `unitValue × 0.12` | 0.12 kg CO₂/GB/month | 100 GB → **12 kg CO₂** |
| **NETWORK** | `unitValue × 0.06` | 0.06 kg CO₂/GB transferred | 500 GB → **30 kg CO₂** |
| **API_CALL** | `unitValue × 0.0001` | 0.0001 kg CO₂/request | 10,000 calls → **1 kg CO₂** |

---

## 🗄 Database Schema

```
User (1) ──→ (many) Projects (1) ──→ (many) ImpactLogs
                    Projects (1) ──→ (many) Alerts
```

```prisma
model User {
  id        Int       @id @default(autoincrement())
  email     String    @unique
  password  String
  name      String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  projects  Project[]
}

model Project {
  id           Int         @id @default(autoincrement())
  name         String
  description  String?     @db.Text
  userId       Int
  carbonBudget Float?      // CO₂ threshold in kg — alerts fire when exceeded
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  impactLogs   ImpactLog[]
  alerts       Alert[]
}

model ImpactLog {
  id          Int        @id @default(autoincrement())
  name        String
  description String?    @db.Text
  type        ImpactType
  unitValue   Float
  carbonScore Float
  projectId   Int
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model Alert {
  id        Int      @id @default(autoincrement())
  projectId Int
  message   String   @db.Text
  totalCO2  Float
  budget    Float
  isRead    Boolean  @default(false)
  createdAt DateTime @default(now())
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

enum ImpactType {
  COMPUTE
  STORAGE
  NETWORK
  API_CALL
}
```

---

## 🗺 Roadmap

| Feature | Status |
|---------|--------|
| Polymorphic CO₂ calculation engine | ✅ Done |
| Project-based tracking with full CRUD | ✅ Done |
| Impact event logging with auto-calculation | ✅ Done |
| Edit impact events and projects | ✅ Done |
| JWT authentication + user profile | ✅ Done |
| Search, filter, sort, pagination | ✅ Done |
| Request validation (Zod) | ✅ Done |
| PDF/CSV report generation (Strategy Pattern) | ✅ Done |
| Analytics dashboard with charts | ✅ Done |
| Carbon threshold alerts (Observer Pattern) | ✅ Done |
| Budget progress bar per project | ✅ Done |
| Role-based access control (RBAC) | 🔜 Planned |
| Organization & team management | 🔜 Planned |
| Cloud provider API integration (AWS/GCP) | 🔜 Planned |
| Audit logging for compliance | 🔜 Planned |
| Real-time WebSocket updates | 🔜 Planned |

---

## 📚 Documentation

Detailed UML and design documentation is available in the repository root:

| Document | Description |
|----------|-------------|
| [idea.md](idea.md) | Full project vision, problem statement, and scope |
| [ErDiagram.md](ErDiagram.md) | Entity-Relationship diagram (Mermaid) |
| [classDiagram.md](classDiagram.md) | Class diagram with OOP principles |
| [sequenceDiagram.md](sequenceDiagram.md) | End-to-end request lifecycle |
| [useCaseDiagram.md](useCaseDiagram.md) | Actor-based use case diagram |

---

## 👤 Author

**Padam Rathi**

