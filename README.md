# GreenPulse

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

### Core CRUD Operations ✅
- **Create**: Add new impact logs with automatic CO2 calculation
- **Read**: Retrieve individual or all impact logs
- **Update**: Modify existing impact entries
- **Delete**: Remove impact logs
- **List**: Get all impacts with advanced filtering

### Advanced Features ✅
- **Search & Filter**: Filter by impact type, search by name/description
- **Sorting**: Sort by date, carbon score, or name (ascending/descending)
- **Pagination**: Limit results with page and limit parameters
- **Aggregation**: Get total CO2 summary with breakdown by type
- **Validation**: Zod schemas validate all incoming requests
- **Error Handling**: Clean HTTP status codes with descriptive messages
- **Authentication**: JWT-based user authentication with bcrypt password hashing

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
  constructor() {
    this.impactRepository = new ImpactRepository();
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
        +createImpact(data, userId)
        +getAllImpacts(userId, filters)
        +getImpactById(id, userId)
        +updateImpact(id, data, userId)
        +deleteImpact(id, userId)
        +getSummary(userId)
        -calculateCO2(type, unitValue)
    }
    
    class ImpactRepository {
        +create(data)
        +findById(id)
        +findByUserId(userId, filters)
        +update(id, data)
        +delete(id)
        +getSummaryByUserId(userId)
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
    
    ImpactController --> ImpactService
    ImpactService --> ImpactRepository
    ImpactService ..> ImpactEvent : uses
    
    AuthController --> AuthService
    AuthService --> UserRepository
```

---

## Project Structure

```
src/
├── server.ts                      # Entry point
├── app.ts                         # Express app configuration
├── config/
│   └── prisma.ts                  # Prisma client singleton
├── models/
│   └── ImpactEvent.ts            # OOP classes (Inheritance & Polymorphism)
├── repositories/                  # Data Access Layer
│   ├── impact.repository.ts
│   └── user.repository.ts
├── services/                      # Business Logic Layer
│   ├── impact.service.ts
│   └── auth.service.ts
├── controllers/                   # HTTP Request Handlers
│   ├── impact.controller.ts
│   └── auth.controller.ts
├── routes/                        # API Route Definitions
│   ├── impact.routes.ts
│   └── auth.routes.ts
├── middleware/                    # Validation & Authentication
│   ├── auth.middleware.ts
│   └── validation.middleware.ts
└── utils/
    └── interfaces.ts              # TypeScript interfaces & DTOs

prisma/
└── schema.prisma                  # Database schema
```

---

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MySQL (running locally)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone "https://github.com/IronwallxR5/GreenPulse.git"
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
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

**Response:** Same as registration

---

### Impact Endpoints (Protected)

All impact endpoints require authentication. Include the JWT token in the `Authorization` header:
```
Authorization: Bearer <your-token>
```

#### Create Impact
```http
POST /api/impact
Content-Type: application/json
Authorization: Bearer <token>

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
  "userId": 1,
  "createdAt": "2026-02-03T18:04:06.899Z",
  "updatedAt": "2026-02-03T18:04:06.899Z"
}
```

#### Get All Impacts (with filters)
```http
GET /api/impact?type=COMPUTE&search=AWS&sortBy=carbonScore&sortOrder=desc&page=1&limit=10
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (optional): Filter by impact type
- `search` (optional): Search in name/description
- `sortBy` (optional): `createdAt`, `carbonScore`, or `name`
- `sortOrder` (optional): `asc` or `desc`
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "AWS EC2 Instance",
      "type": "COMPUTE",
      "carbonScore": 12,
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

#### Get Single Impact
```http
GET /api/impact/:id
Authorization: Bearer <token>
```

#### Update Impact
```http
PUT /api/impact/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Updated Name",
  "unitValue": 30
}
```

#### Delete Impact
```http
DELETE /api/impact/:id
Authorization: Bearer <token>
```

#### Get CO2 Summary
```http
GET /api/impact/summary
Authorization: Bearer <token>
```

**Response:**
```json
{
  "totalCO2": 27,
  "totalLogs": 3,
  "byType": [
    {
      "type": "COMPUTE",
      "totalCO2": 12,
      "count": 1
    },
    {
      "type": "STORAGE",
      "totalCO2": 12,
      "count": 1
    },
    {
      "type": "NETWORK",
      "totalCO2": 3,
      "count": 1
    }
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
  -d '{"email":"test@example.com","password":"pass123","name":"Test User"}'
```

**Login & Save Token:**
```bash
TOKEN=$(curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}' | jq -r '.token')
```

**Create Impact:**
```bash
curl -X POST http://localhost:8080/api/impact \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"EC2 Server","type":"COMPUTE","unitValue":24}'
```

**Get Summary:**
```bash
curl http://localhost:8080/api/impact/summary \
  -H "Authorization: Bearer $TOKEN"
```

---

## Database Schema

```prisma
model User {
  id         Int          @id @default(autoincrement())
  email      String       @unique
  password   String
  name       String
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt
  impactLogs ImpactLog[]
}

model ImpactLog {
  id          Int        @id @default(autoincrement())
  name        String
  description String?
  type        ImpactType
  unitValue   Float
  carbonScore Float
  userId      Int
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  user        User       @relation(fields: [userId], references: [id])
}

enum ImpactType {
  COMPUTE
  STORAGE
  NETWORK
  API_CALL
}
```

---

<!-- ## Future Enhancements

- Add Project model for grouping impacts by projects
- Implement role-based access control (ADMIN/USER)
- Add date range filtering for time-based analytics
- Generate PDF reports of carbon footprint
- Integration with cloud provider APIs for automated tracking
- Real-time dashboard with WebSocket updates
- Multi-organization support -->

---

## Contributing

This project was built as part of the SESD Workshop assignment demonstrating clean OOP architecture in Node.js with TypeScript.

Contributions, issues, and feature requests are welcome!

## Author

**Padam Rathi**

## License

ISC
