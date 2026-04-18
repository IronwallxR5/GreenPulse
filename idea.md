# GreenPulse Product Idea (Updated)

## Vision

GreenPulse helps software teams treat carbon impact as a first-class engineering signal, alongside performance and cost. The platform turns operational infrastructure activity into measurable CO2 data that can be tracked, summarized, and reported.

## Problem

Most engineering teams can answer:

- How much did this service cost?
- How fast is this endpoint?

But they cannot easily answer:

- What is the carbon impact of this workload?
- Which project contributes most to total emissions?
- Are we exceeding an internal carbon budget?

GreenPulse addresses this gap with project-scoped impact logging and deterministic calculation rules.

## What Is Implemented Today

### Platform Foundations

- Full-stack architecture: React frontend + Express/TypeScript backend
- PostgreSQL persistence via Prisma
- Layered backend design (controller -> service -> repository)

### Authentication

- Email/password registration and login
- JWT-protected API routes
- Google OAuth login flow
- Google account linking for existing users with matching email

### Carbon Tracking

- Project CRUD with ownership checks
- Impact event CRUD under each project
- Supported impact types: `COMPUTE`, `STORAGE`, `NETWORK`, `API_CALL`
- Automatic CO2 calculation using polymorphic event classes
- Search/filter/sort/pagination for impact logs

### Reporting and Insights

- Project summary endpoint with totals and type breakdown
- Analytics UI with cross-project and by-type visualizations
- Downloadable PDF and CSV reports (strategy-based generation)

### Budgeting and Alerts

- Optional per-project carbon budget
- Threshold check after impact creation
- Persistent alerts table when threshold is exceeded
- API and UI support for viewing alerts and marking them as read
- Real-time threshold alert delivery via WebSocket (with SSE compatibility endpoint)

### Audit and Compliance

- Structured audit log entries for key project and impact mutations
- Project-level API to review chronological change history
- Project view panel for recent audit trail visibility
- Recurring compliance report schedules (daily/weekly/monthly)
- Automated compliance snapshot generation with history per project

## Architectural Intent

GreenPulse intentionally uses OOP and pattern-oriented design where it provides real value:

- Factory + Polymorphism for impact type calculation logic
- Strategy for report output formats
- Observer-style notification service for threshold events
- Repository pattern for clean database abstraction

This keeps feature growth manageable as impact types, report formats, and notification channels expand.

## Scope Boundaries (Current)

In scope now:

- Single-tenant user-owned projects
- Manual impact event entry through API/UI
- Export-oriented reporting (PDF/CSV)
- In-app alert persistence

Out of scope now:

- Direct ingestion from cloud provider APIs
- Streaming event ingestion pipeline
- RBAC and organization-level multi-tenancy
- Audit-log governance model

## Roadmap Priorities

1. Add organizations and team workspaces.
2. Introduce RBAC (member/admin roles).
3. Integrate cloud provider usage ingestion.
4. Add organization-level audit retention and export controls.
5. Add organization-level report distribution channels.

## Success Criteria

GreenPulse is succeeding when a team can:

- Identify its highest-emission project quickly.
- Set a budget and receive actionable threshold alerts.
- Export report artifacts for internal sustainability reporting.
- Extend logic (new impact types or report format) without major refactors.
