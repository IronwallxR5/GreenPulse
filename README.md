# GreenPulse 🌱

A backend API for developers and DevOps teams to track the carbon footprint of their digital infrastructure. GreenPulse transforms abstract technical usage metrics into measurable CO2e (Carbon Dioxide Equivalent) scores.

## Project Overview

Instead of tracking generic tasks, GreenPulse monitors **Impact Events** such as:
- **Cloud Compute Usage** - Server instances and processing time
- **Data Storage** - Cloud storage consumption
- **Network Transfers** - Data transmission across networks
- **API Calls** - Request processing overhead

Each event type calculates its carbon footprint based on industry-standard conversion factors.

---

## Features Implemented

### Core CRUD Operations
- **Create**: Add new projects and impact logs with automatic CO2 calculation
- **Read**: Retrieve individual or all projects/impacts
- **Update**: Modify existing projects and impact entries
- **Delete**: Remove projects and impact logs (cascade delete)
- **List**: Get all projects and impacts with advanced filtering

### Advanced Features
- **Search & Filter**: Filter impacts by type, search by name/description
- **Sorting**: Sort by date, carbon score, or name (ascending/descending)
- **Pagination**: Limit results with page and limit parameters
- **Aggregation**: Get total CO2 summary with breakdown by type per project
- **Validation**: Zod schemas validate all incoming requests
- **Error Handling**: Clean HTTP status codes with descriptive messages
- **Authentication**: JWT-based user authentication with bcrypt password hashing
- **Project Grouping**: Organize impacts under projects for better tracking

---

## OOP Design Decisions

### 1. Inheritance & Polymorphism
The core of GreenPulse uses an **abstract base class** with specialized subclasses:

```typescript
ImpactEvent (Abstract Base Class)
    ├── ComputeEvent   → 0.5 kg CO2/hour
    ├── StorageEvent   → 0.12 kg CO2/GB/month
    ├── NetworkEvent   → 0.06 kg CO2/GB transferred
    └── ApiCallEvent   → 0.0001 kg CO2/request
```

Each subclass implements its own `calculateCO2()` method, demonstrating **polymorphism**. This design makes adding new impact types seamless without modifying existing code (Open/Closed Principle).

### 2. Layered Architecture (Separation of Concerns)
```
Controller → Service → Repository → Database
```

- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain business logic and CO2 calculations
- **Repositories**: Manage database operations (Prisma queries)
- **Models**: Define OOP classes with inheritance

### 3. Dependency Injection
Services receive their dependencies through constructors:
```typescript
class ImpactService {
  private impactRepository: ImpactRepository;
  private projectRepository: ProjectRepository;
  constructor() {
    this.impactRepository = new ImpactRepository();
    this.projectRepository = new ProjectRepository();
  }
}
```

### 4. Encapsulation
Repository classes hide all database implementation details. Services and controllers interact through clean interfaces without knowing the underlying data storage mechanism.

### 5. Single Responsibility Principle
Each class has one clear purpose:
- `ImpactRepository` → Database operations only
- `ImpactService` → Business logic and calculations
- `ImpactController` → HTTP request handling
- `ProjectService` → Project management logic

---

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Prisma with MySQL
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: Zod
- **Architecture**: OOP with layered design pattern

---

## Architecture Diagram

```mermaid
classDiagram
    class ImpactEvent {
        <<abstract>>
        +id: number
        +name: string
        +unitValue: number
        +type: ImpactType
        +calculateCO2()* number
    }

    class ComputeEvent {
        +calculateCO2() number
    }

    class StorageEvent {
        +calculateCO2() number
    }

    class NetworkEvent {
        +calculateCO2() number
    }

    class ApiCallEvent {
        +calculateCO2() number
    }

    class ProjectController {
        -projectService: ProjectService
        +createProject(req, res)
        +getAllProjects(req, res)
        +getProject(req, res)
        +updateProject(req, res)
        +deleteProject(req, res)
        +getProjectSummary(req, res)
    }

    class ProjectService {
        -projectRepository: ProjectRepository
        +createProject(data, userId)
        +getAllProjects(userId)
        +getProjectById(id, userId)
        +updateProject(id, data, userId)
        +deleteProject(id, userId)
        +getProjectSummary(id, userId)
    }

    class ProjectRepository {
        +create(data)
        +findById(id)
        +findByUserId(userId)
        +update(id, data)
        +delete(id)
        +getSummary(id)
    }

    class ImpactController {
        -impactService: ImpactService
        +createImpact(req, res)
        +getAllImpacts(req, res)
        +getImpact(req, res)
        +updateImpact(req, res)
        +deleteImpact(req, res)
        +getSummary(req, res)
    }

    class ImpactService {
        -impactRepository: ImpactRepository
        -projectRepository: ProjectRepository
        +createImpact(data, projectId, userId)
        +getAllImpacts(projectId, userId, filters)
        +getImpactById(id, userId)
        +updateImpact(id, data, userId)
        +deleteImpact(id, userId)
        +getSummary(projectId, userId)
        -calculateCO2(type, unitValue)
        -verifyProjectOwnership(projectId, userId)
    }

    class ImpactRepository {
        +create(data)
        +findById(id)
        +findByProjectId(projectId, filters)
        +update(id, data)
        +delete(id)
        +getSummaryByProjectId(projectId)
    }

    class AuthController {
        -authService: AuthService
        +register(req, res)
        +login(req, res)
    }

    class AuthService {
        -userRepository: UserRepository
        +register(data)
        +login(data)
        -hashPassword(password)
        -comparePassword(plain, hashed)
        -generateToken(userId)
    }

    class UserRepository {
        +create(data)
        +findByEmail(email)
        +findById(id)
    }

    ImpactEvent <|-- ComputeEvent
    ImpactEvent <|-- StorageEvent
    ImpactEvent <|-- NetworkEvent
    ImpactEvent <|-- ApiCallEvent

    ProjectController --> ProjectService
    ProjectService --> ProjectRepository

    ImpactController --> ImpactService
    ImpactService --> ImpactRepository
    ImpactService --> ProjectRepository
    ImpactService ..> ImpactEvent : uses

    AuthController --> AuthService
    AuthService --> UserRepository
```

---

## Data Model

```
User (1) ──→ (many) Projects (1) ──→ (many) ImpactLogs
```

---

## Project Structure

```
src/
├── server.ts                       # Entry point
├── app.ts                          # Express app configuration
├── config/
│   └── prisma.ts                   # Prisma client singleton
├── models/
│   └── ImpactEvent.ts              # OOP classes (Inheritance & Polymorphism)
├── repositories/                   # Data Access Layer
│   ├── impact.repository.ts
│   ├── project.repository.ts
│   └── user.repository.ts
├── services/                       # Business Logic Layer
│   ├── impact.service.ts
│   ├── project.service.ts
│   └── auth.service.ts
├── controllers/                    # HTTP Request Handlers
│   ├── impact.controller.ts
│   ├── project.controller.ts
│   └── auth.controller.ts
├── routes/                         # API Route Definitions
│   ├── impact.routes.ts
│   ├── project.routes.ts
│   └── auth.routes.ts
├── middleware/                     # Validation & Authentication
│   ├── auth.middleware.ts
│   └── validation.middleware.ts
└── utils/
    └── interfaces.ts               # TypeScript interfaces & DTOs

prisma/
└── schema.prisma                   # Database schema
```

---

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MySQL (running locally)
- npm

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/IronwallxR5/GreenPulse.git
cd GreenPulse
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/GreenPulse"
PORT=8080
NODE_ENV=development
JWT_SECRET="your-super-secret-key-min-32-characters"
JWT_EXPIRES_IN=7d
```

4. **Set up the database**
```bash
npx prisma migrate dev --name initial_schema
npx prisma generate
```

5. **Run the development server**
```bash
npm run dev
```

Server will start at `http://localhost:8080`

### Build for Production
```bash
npm run build
npm start
```

---

## API Documentation

### Base URL
```
http://localhost:8080
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
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

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

---

### Project Endpoints (Protected)

All protected endpoints require: `Authorization: Bearer <token>`

#### Create Project
```http
POST /api/projects
Content-Type: application/json

{
  "name": "Cloud Infrastructure",
  "description": "Main cloud setup"
}
```

#### Get All Projects
```http
GET /api/projects
```

#### Get Single Project
```http
GET /api/projects/:id
```

#### Update Project
```http
PUT /api/projects/:id
Content-Type: application/json

{
  "name": "Updated Name"
}
```

#### Delete Project
```http
DELETE /api/projects/:id
```

#### Get Project CO2 Summary
```http
GET /api/projects/:id/summary
```

---

### Impact Endpoints (Protected, Nested under Projects)

#### Create Impact
```http
POST /api/projects/:projectId/impacts
Content-Type: application/json

{
  "name": "AWS EC2 Instance",
  "description": "Production server running 24/7",
  "type": "COMPUTE",
  "unitValue": 24
}
```

**Impact Types:**
- `COMPUTE` - Cloud compute (hours)
- `STORAGE` - Data storage (GB/month)
- `NETWORK` - Data transfer (GB)
- `API_CALL` - API requests (count)

**Response:**
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

#### Get All Impacts (with filters)
```http
GET /api/projects/:projectId/impacts?type=COMPUTE&search=AWS&sortBy=carbonScore&sortOrder=desc&page=1&limit=10
```

**Query Parameters:**
| Parameter | Description | Options |
|-----------|-------------|---------|
| `type` | Filter by impact type | `COMPUTE`, `STORAGE`, `NETWORK`, `API_CALL` |
| `search` | Search in name/description | any string |
| `sortBy` | Sort field | `createdAt`, `carbonScore`, `name` |
| `sortOrder` | Sort direction | `asc`, `desc` |
| `page` | Page number | default: 1 |
| `limit` | Items per page | default: 10 |

#### Get Single Impact
```http
GET /api/projects/:projectId/impacts/:id
```

#### Update Impact
```http
PUT /api/projects/:projectId/impacts/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "unitValue": 30
}
```

#### Delete Impact
```http
DELETE /api/projects/:projectId/impacts/:id
```

#### Get Impact Summary for Project
```http
GET /api/projects/:projectId/impacts/summary
```

**Response:**
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

---

## CO2 Calculation Formulas

| Impact Type | Formula | Example |
|------------|---------|---------|
| **COMPUTE** | `unitValue × 0.5 kg` | 24 hours → 12 kg CO2 |
| **STORAGE** | `unitValue × 0.12 kg` | 100 GB → 12 kg CO2 |
| **NETWORK** | `unitValue × 0.06 kg` | 50 GB → 3 kg CO2 |
| **API_CALL** | `unitValue × 0.0001 kg` | 10,000 calls → 1 kg CO2 |

---

## Testing the API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass1234","name":"Test User"}'
```

**Login & Save Token:**
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass1234"}' | jq -r '.token')
```

**Create Project:**
```bash
curl -X POST http://localhost:8080/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"My Cloud","description":"Cloud infrastructure"}'
```

**Create Impact:**
```bash
curl -X POST http://localhost:8080/api/projects/1/impacts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"EC2 Server","type":"COMPUTE","unitValue":24}'
```

**Get Project Summary:**
```bash
curl http://localhost:8080/api/projects/1/summary \
  -H "Authorization: Bearer $TOKEN"
```

---

## Database Schema

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
  description String?
  userId      Int
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  impactLogs  ImpactLog[]
}

model ImpactLog {
  id          Int        @id @default(autoincrement())
  name        String
  description String?
  type        ImpactType
  unitValue   Float
  carbonScore Float
  projectId   Int
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  project     Project    @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

enum ImpactType {
  COMPUTE
  STORAGE
  NETWORK
  API_CALL
}
```

---

## Future Enhancements

- Role-based access control (ADMIN/USER)
- Date range filtering for time-based analytics
- PDF report generation for carbon footprint
- Cloud provider API integration for automated tracking
- Real-time dashboard with WebSocket updates
- Multi-organization support

---

## Contributing

This project was built as part of the SESD Workshop assignment demonstrating clean OOP architecture in Node.js with TypeScript.

## Author

**Padam Rathi**

## License

ISC
