# GreenPulse

GreenPulse is a full-stack carbon footprint tracking platform for digital infrastructure. It helps teams measure and understand emissions from compute, storage, network transfer, and API calls using consistent CO2 calculations.

## Overview

GreenPulse currently provides:

- Email/password authentication with JWT
- Google OAuth sign-in and account linking by email
- Project CRUD with strict ownership checks
- Impact event CRUD with automatic CO2 score calculation
- Search, filter, sort, and pagination for impact logs
- Per-project summary and cross-project analytics dashboards
- Carbon budget thresholds with persisted alert records
- Real-time threshold alerts in Project View (WebSocket with SSE fallback)
- PDF and CSV report export

## Tech Stack

### Backend

- Node.js + Express 5 + TypeScript
- Prisma ORM + PostgreSQL
- JWT auth (`jsonwebtoken`) + password hashing (`bcryptjs`)
- Google OAuth (`passport`, `passport-google-oauth20`)
- Request validation with Zod
- Socket.IO for authenticated alert fan-out
- PDF generation with PDFKit

### Frontend

- React 19 + TypeScript + Vite
- React Router + route-level lazy loading
- TanStack Query for server state
- Tailwind CSS + reusable UI primitives
- Recharts for analytics visualizations
- Axios with auth header interceptor

## Architecture

GreenPulse follows a layered structure:

1. Controllers handle HTTP concerns.
2. Services enforce business rules and orchestration.
3. Repositories isolate database access through Prisma.

### Core Patterns Used

- Polymorphism: `ImpactEvent` subclasses implement type-specific CO2 formulas.
- Factory Method: `ImpactService` selects the correct `ImpactEvent` subclass from `ImpactType`.
- Strategy: `ReportingService` swaps `PdfReportStrategy` and `CsvReportStrategy` at runtime.
- Observer (lightweight): `NotificationService` notifies in-process observers and persists alerts when thresholds are exceeded.
- Repository: data access classes encapsulate Prisma queries.

## Current Project Structure

```text
GreenPulse/
  backend/
    prisma/
      schema.prisma
    src/
      app.ts
      server.ts
      config/
        passport.ts
        prisma.ts
      controllers/
        auth.controller.ts
        impact.controller.ts
        project.controller.ts
      middleware/
        auth.middleware.ts
        validation.middleware.ts
      models/
        ImpactEvent.ts
      repositories/
        alert.repository.ts
        impact.repository.ts
        project.repository.ts
        user.repository.ts
      routes/
        auth.routes.ts
        impact.routes.ts
        project.routes.ts
      services/
        auth.service.ts
        impact.service.ts
        project.service.ts
        notifications/
          NotificationService.ts
        reporting/
          CsvReportStrategy.ts
          IReportStrategy.ts
          PdfReportStrategy.ts
          ReportingService.ts
      utils/
        interfaces.ts
  frontend/
    src/
      App.tsx
      main.tsx
      index.css
      context/
        AuthContext.tsx
      components/
        layout/
          Layout.tsx
        ui/
          ...
      hooks/
        useDebounce.ts
      pages/
        Analytics/
        Auth/
        Dashboard/
        Profile/
        ProjectView/
      services/
        api.ts
        auth.service.ts
        impact.service.ts
        project.service.ts
```

## Quick Start

### 1) Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` before running.

### Required Backend Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string for Prisma |
| `PORT` | Backend port (default `8080`) |
| `NODE_ENV` | Runtime mode (`development` / `production`) |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `JWT_EXPIRES_IN` | JWT expiry (example: `7d`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client id |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL handled by backend |
| `FRONTEND_URL` | Frontend URL used by CORS and OAuth redirect |
| `SESSION_SECRET` | Session secret required for OAuth state handling |

Run migrations and start server:

```bash
npx prisma migrate dev --name init
npm run dev
```

Backend runs at `http://localhost:8080`.

### 2) Frontend Setup

```bash
cd frontend
npm install
```

Create or update `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

Start frontend:

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`.

## API Summary

All protected routes require:

```text
Authorization: Bearer <token>
```

### Auth Routes

| Method | Endpoint | Protected | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register user |
| `POST` | `/api/auth/login` | No | Login with email/password |
| `GET` | `/api/auth/me` | Yes | Current user profile |
| `GET` | `/api/auth/google` | No | Start Google OAuth |
| `GET` | `/api/auth/google/callback` | No | OAuth callback and frontend redirect |

### Project Routes

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/projects` | Create project |
| `GET` | `/api/projects` | List projects for current user |
| `GET` | `/api/projects/:id` | Get one project |
| `PUT` | `/api/projects/:id` | Update project |
| `DELETE` | `/api/projects/:id` | Delete project |
| `GET` | `/api/projects/:id/summary` | Aggregate project emissions |
| `GET` | `/api/projects/:id/report?format=pdf|csv` | Download report |
| `PUT` | `/api/projects/:id/budget` | Set or clear carbon budget |
| `GET` | `/api/projects/:id/alerts` | List threshold alerts |
| `GET` | `/api/projects/:id/alerts/stream` | Subscribe to live threshold alerts (SSE fallback) |
| `PATCH` | `/api/projects/:id/alerts/read` | Mark alerts read |

### Realtime Channel

Socket.IO connection:

- Connect to backend URL with JWT token in `auth.token`.
- Emit `subscribe-project` with `{ projectId }`.
- Receive `threshold-alert` events when project budget is exceeded.

### Impact Routes

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/projects/:projectId/impacts` | Create impact event |
| `GET` | `/api/projects/:projectId/impacts` | List impacts with query filters |
| `GET` | `/api/projects/:projectId/impacts/summary` | Project impact summary |
| `GET` | `/api/projects/:projectId/impacts/:id` | Get one impact |
| `PUT` | `/api/projects/:projectId/impacts/:id` | Update impact |
| `DELETE` | `/api/projects/:projectId/impacts/:id` | Delete impact |

Supported impact list query params:

- `type`: `COMPUTE`, `STORAGE`, `NETWORK`, `API_CALL`
- `search`: free text against name/description
- `sortBy`: `createdAt`, `carbonScore`, `name`
- `sortOrder`: `asc`, `desc`
- `page`: page number
- `limit`: page size

## CO2 Calculation Rules

| Impact Type | Formula |
|---|---|
| `COMPUTE` | `unitValue * 0.5` |
| `STORAGE` | `unitValue * 0.12` |
| `NETWORK` | `unitValue * 0.06` |
| `API_CALL` | `unitValue * 0.0001` |

## Database Model Summary

- `User` owns many `Project`
- `Project` has many `ImpactLog`
- `Project` has many `Alert`
- Deleting a project cascades to impact logs and alerts

See `backend/prisma/schema.prisma` for source of truth.

## Documentation Index

- `idea.md`: product intent, scope, and roadmap
- `classDiagram.md`: UML class diagram and design pattern mapping
- `ErDiagram.md`: ER diagram aligned with Prisma schema
- `sequenceDiagram.md`: key request flows
- `useCaseDiagram.md`: actor/use-case view of implemented and planned behavior

## Roadmap

Planned next milestones:

- Organization and team-level multi-tenancy
- RBAC with role-scoped permissions
- Audit logging for compliance reporting
- Cloud provider ingestion adapters
- Automated recurring compliance reports
