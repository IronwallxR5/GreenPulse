<div align="center">

# 🌱 GreenPulse

**Carbon Footprint Tracking Platform for Digital Infrastructure**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

*Transform abstract infrastructure metrics into measurable CO2e scores — every compute hour, every GB stored, every API call.*

---

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [API Reference](#-api-reference) · [CO2 Formulas](#-co2-calculation-formulas) · [Roadmap](#-roadmap)

</div>

---

## 📋 Overview

**GreenPulse** is a backend API that enables developers and DevOps teams to track the carbon footprint of their digital infrastructure. Instead of tracking generic tasks, GreenPulse monitors **Impact Events** — cloud compute usage, data storage, network transfers, and API calls — and calculates their CO2 equivalent using a **Polymorphic Calculation Engine**.

The core engine uses **abstract base classes and inheritance** to compute emissions differently for each infrastructure event type. Adding a new event type requires only creating a new subclass — **zero changes to existing business logic** (Open/Closed Principle).

---

## ✨ Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Polymorphic CO2 Engine** | ✅ | Abstract base class with type-specific subclasses (`ComputeEvent`, `StorageEvent`, `NetworkEvent`, `ApiCallEvent`) |
| **Project Management** | ✅ | Full CRUD with ownership verification — only the project owner can view, edit, or delete |
| **Impact Event Logging** | ✅ | Record infrastructure actions with auto-calculated carbon scores |
| **Search & Filter** | ✅ | Filter by type, search by name/description, sort by carbon score or date |
| **Pagination** | ✅ | Configurable page size and page number for all list endpoints |
| **Project Summaries** | ✅ | Aggregate CO2 by type with total count and breakdown |
| **JWT Authentication** | ✅ | Secure token-based auth with 7-day configurable expiry |
| **Zod Validation** | ✅ | Schema-based request validation with descriptive error messages |
| **Analytics Dashboard** | 🔜 | Real-time charts with per-project and per-type breakdowns |
| **PDF/CSV Reports** | 🔜 | Downloadable compliance reports (Strategy Pattern) |
| **Threshold Alerts** | 🔜 | Carbon limit notifications (Observer Pattern) |
| **Organization Management** | 🔜 | Multi-tenant team-based carbon tracking |
| **RBAC** | 🔜 | Role-based access control (User / Admin / System) |

---

## 🏗 Architecture

### Layered Clean Architecture

```
Client Request
      │
      ▼
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────┐
│  Route +     │────▶│   Service    │────▶│  Repository  │────▶│ Database│
│  Middleware  │     │ (Business    │     │ (Data Access)│     │ (MySQL) │
│ (Auth + Zod) │     │  Logic)      │     │              │     │         │
└─────────────┘     └──────────────┘     └──────────────┘     └─────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ ImpactEvent  │
                    │ (Polymorphic │
                    │  CO2 Calc)   │
                    └──────────────┘
```

### OOP Class Hierarchy

```
ImpactEvent (Abstract Base Class)
    ├── ComputeEvent   → 0.5 kg CO2/hour
    ├── StorageEvent   → 0.12 kg CO2/GB/month
    ├── NetworkEvent   → 0.06 kg CO2/GB transferred
    └── ApiCallEvent   → 0.0001 kg CO2/request
```

### Design Patterns Used

| Pattern | Where | Purpose |
|---------|-------|---------|
| **Factory Method** | `ImpactService.calculateCO2()` | Instantiates correct `ImpactEvent` subclass from `ImpactType` |
| **Polymorphism** | `ImpactEvent` hierarchy | Each subclass computes CO2 differently via `calculateCO2()` |
| **Repository** | All data access classes | Abstracts Prisma queries from business logic |
| **Chain of Responsibility** | Middleware pipeline | Auth → Validation → Controller |
| **Dependency Injection** | Service constructors | Services receive repository dependencies |

### Separation of Concerns

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Controllers** | HTTP request/response handling only | `ImpactController`, `ProjectController` |
| **Services** | Business logic, CO2 calculations, ownership checks | `ImpactService`, `AuthService` |
| **Repositories** | Database operations (Prisma queries) | `ImpactRepository`, `UserRepository` |
| **Models** | OOP classes with inheritance | `ImpactEvent` abstract class |
| **Middleware** | Cross-cutting concerns | `authenticateToken`, `validateImpactCreate` |

---

## 📁 Project Structure

```
GreenPulse/
├── backend/
│   ├── src/
│   │   ├── server.ts                       # Entry point
│   │   ├── app.ts                          # Express app configuration
│   │   ├── config/
│   │   │   └── prisma.ts                   # Prisma client singleton
│   │   ├── models/
│   │   │   └── ImpactEvent.ts              # Abstract class + subclasses (Polymorphism)
│   │   ├── repositories/
│   │   │   ├── impact.repository.ts        # ImpactLog data access
│   │   │   ├── project.repository.ts       # Project data access
│   │   │   └── user.repository.ts          # User data access
│   │   ├── services/
│   │   │   ├── impact.service.ts           # CO2 calculation + Factory Pattern
│   │   │   ├── project.service.ts          # Project business logic
│   │   │   └── auth.service.ts             # JWT auth + password hashing
│   │   ├── controllers/
│   │   │   ├── impact.controller.ts        # Impact HTTP handlers
│   │   │   ├── project.controller.ts       # Project HTTP handlers
│   │   │   └── auth.controller.ts          # Auth HTTP handlers
│   │   ├── routes/
│   │   │   ├── impact.routes.ts            # /api/projects/:id/impacts
│   │   │   ├── project.routes.ts           # /api/projects
│   │   │   └── auth.routes.ts              # /api/auth
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts           # JWT verification
│   │   │   └── validation.middleware.ts     # Zod schema validation
│   │   └── utils/
│   │       └── interfaces.ts               # TypeScript DTOs & interfaces
│   ├── prisma/
│   │   └── schema.prisma                   # Database schema
│   ├── package.json
│   └── tsconfig.json
├── idea.md                                 # Full project vision & scope
├── ErDiagram.md                            # Entity-Relationship diagram
├── classDiagram.md                         # Class diagram (UML)
├── sequenceDiagram.md                      # Sequence diagram
├── useCaseDiagram.md                       # Use case diagram
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher
- **MySQL** 8.0+ (running locally or remote)
- **npm** v9+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/IronwallxR5/GreenPulse.git
cd GreenPulse/backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your MySQL credentials and a strong JWT secret
```

### Environment Configuration

Create `backend/.env` with the following:

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/greenpulse"
PORT=8080
NODE_ENV=development
JWT_SECRET="your-super-secret-key-min-32-characters"
JWT_EXPIRES_IN=7d
```

### Database Setup

```bash
# Generate Prisma client and run migrations
npx prisma migrate dev --name init
npx prisma generate
```

### Run the Server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

> Server starts at `http://localhost:8080`

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
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```
</details>

<details>
<summary><b>POST</b> <code>/api/auth/login</code> — Login</summary>

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** `200 OK`:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": 1, "email": "user@example.com", "name": "John Doe" }
}
```
</details>

---

### 📂 Projects (Protected)

<details>
<summary><b>POST</b> <code>/api/projects</code> — Create project</summary>

```json
{ "name": "Cloud Infrastructure", "description": "Main cloud setup" }
```
**Response** `201 Created`
</details>

<details>
<summary><b>GET</b> <code>/api/projects</code> — List all projects</summary>

Returns all projects owned by the authenticated user.
</details>

<details>
<summary><b>GET</b> <code>/api/projects/:id</code> — Get single project</summary>

Returns project details with impact log count.
</details>

<details>
<summary><b>PUT</b> <code>/api/projects/:id</code> — Update project</summary>

```json
{ "name": "Updated Name", "description": "Updated description" }
```
</details>

<details>
<summary><b>DELETE</b> <code>/api/projects/:id</code> — Delete project</summary>

Cascade deletes all associated impact logs.
</details>

<details>
<summary><b>GET</b> <code>/api/projects/:id/summary</code> — Get CO2 summary</summary>

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

---

### 📊 Impact Events (Protected, nested under Projects)

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
  "description": "Production server running 24/7",
  "type": "COMPUTE",
  "unitValue": 24,
  "carbonScore": 12,
  "projectId": 1,
  "createdAt": "2026-02-12T04:57:46.251Z",
  "updatedAt": "2026-02-12T04:57:46.251Z"
}
```
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

<details>
<summary><b>GET</b> <code>/api/projects/:projectId/impacts/summary</code> — Get impact summary</summary>

Returns aggregated CO2 totals and breakdown by type for the project.
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

# Get project CO2 summary
curl http://localhost:8080/api/projects/1/summary \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔬 CO2 Calculation Formulas

Each impact type uses a scientifically-informed emission factor applied through **polymorphic method dispatch**:

| Impact Type | Formula | Emission Factor | Example |
|-------------|---------|-----------------|---------|
| **COMPUTE** | `unitValue × 0.5` | 0.5 kg CO2/hour | 24 hours → **12 kg CO2** |
| **STORAGE** | `unitValue × 0.12` | 0.12 kg CO2/GB/month | 100 GB → **12 kg CO2** |
| **NETWORK** | `unitValue × 0.06` | 0.06 kg CO2/GB transferred | 50 GB → **3 kg CO2** |
| **API_CALL** | `unitValue × 0.0001` | 0.0001 kg CO2/request | 10,000 calls → **1 kg CO2** |

---

## 🗄 Database Schema

```
User (1) ──→ (many) Projects (1) ──→ (many) ImpactLogs
```

```prisma
model User {
  id         Int       @id @default(autoincrement())
  email      String    @unique
  password   String
  name       String
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  projects   Project[]
}

model Project {
  id          Int         @id @default(autoincrement())
  name        String
  description String?     @db.Text
  userId      Int
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  impactLogs  ImpactLog[]
  @@index([userId])
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
  @@index([projectId])
  @@index([type])
  @@index([createdAt])
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
| Polymorphic CO2 calculation engine | ✅ Done |
| Project-based tracking with CRUD | ✅ Done |
| Impact event logging with auto-calculation | ✅ Done |
| JWT authentication | ✅ Done |
| Search, filter, sort, pagination | ✅ Done |
| Request validation (Zod) | ✅ Done |
| Role-based access control (RBAC) | 🔜 Planned |
| PDF/CSV report generation (Strategy Pattern) | 🔜 Planned |
| Carbon threshold alerts (Observer Pattern) | 🔜 Planned |
| Organization & team management | 🔜 Planned |
| Analytics dashboard with time-series charts | 🔜 Planned |
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

## 🤝 Contributing

This project was built as part of the **SESD Workshop** assignment demonstrating clean OOP architecture in Node.js with TypeScript. Contributions are welcome — feel free to open issues and pull requests.

---

## 👤 Author

**Padam Rathi**
- GitHub: [@IronwallxR5](https://github.com/IronwallxR5)

## 📄 License

This project is licensed under the **ISC License**.
