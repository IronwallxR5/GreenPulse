# Sequence Diagram — GreenPulse

## Main Flow: End-to-End Impact Event Logging (User Logs Event → Factory Creates Subclass → Polymorphic CO2 Calculation → Notification)

This sequence diagram illustrates the complete lifecycle of an infrastructure impact event — from a user logging the event, through factory-based instantiation, polymorphic calculation, and repository persistence, to threshold evaluation and notification.

---

```mermaid
sequenceDiagram
    actor U as User
    participant FE as Frontend (React)
    participant API as API Gateway (Express)
    participant Auth as Auth Middleware
    participant Val as Validation Middleware
    participant IS as ImpactService
    participant Factory as ImpactEvent Factory
    participant Poly as ImpactEvent Subclass
    participant IR as ImpactRepository
    participant PR as ProjectRepository
    participant NS as NotificationService
    participant DB as MySQL (Prisma)
    participant RS as ReportingService

    Note over U, DB: Phase 1 — Authentication & Request Validation

    U ->> FE: Click "Log Impact Event"
    FE ->> API: POST /api/projects/:projectId/impacts (name, type, unitValue)
    API ->> Auth: Validate JWT Token
    Auth -->> API: Token Valid (userId attached)
    API ->> Val: Validate Request Body
    Val -->> API: Validation Passed
    API ->> IS: createImpact(dto, projectId, userId)

    Note over U, DB: Phase 2 — Ownership Verification & Factory Pattern

    IS ->> PR: findById(projectId)
    PR ->> DB: SELECT * FROM projects WHERE id = :projectId
    DB -->> PR: Project Record
    PR -->> IS: Project Data
    IS ->> IS: Verify Ownership (project.userId === user.id)

    IS ->> Factory: calculateCO2(type, unitValue)
    Note right of Factory: Factory Method Pattern<br/>Instantiates correct subclass<br/>based on ImpactType

    alt type === COMPUTE
        Factory ->> Poly: new ComputeEvent(unitValue)
    else type === STORAGE
        Factory ->> Poly: new StorageEvent(unitValue)
    else type === NETWORK
        Factory ->> Poly: new NetworkEvent(unitValue)
    else type === API_CALL
        Factory ->> Poly: new ApiCallEvent(unitValue)
    end

    Note over U, DB: Phase 3 — Polymorphic CO2 Calculation

    Factory ->> Poly: event.calculateCO2()
    Note right of Poly: Polymorphism<br/>Subclass-specific calculation executes
    Poly -->> Factory: carbonScore
    Factory -->> IS: Calculated Score

    Note over U, DB: Phase 4 — Persistence (Repository Pattern)

    IS ->> IR: create({ ...dto, carbonScore, projectId })
    IR ->> DB: INSERT INTO impact_logs ...
    DB -->> IR: Created Record
    IR -->> IS: Impact Log Object

    Note over U, DB: Phase 5 — Threshold Monitoring (Observer Pattern)

    IS ->> NS: checkThreshold(projectId)
    NS ->> IR: getSummaryByProjectId(projectId)
    IR -->> NS: Project Carbon Total

    Note right of NS: Observer Pattern<br/>If total > threshold, notify observers

    alt totalCO2 > threshold
        NS ->> NS: Trigger Alert Observers
        NS ->> U: Push Notification: "⚠️ Threshold Exceeded!"
        NS ->> DB: INSERT INTO notifications ...
    end

    IS -->> API: 201 Created
    API -->> FE: Impact Log Response
    FE -->> U: "Event Logged Successfully"

    Note over U, DB: Phase 6 — Report Generation (Strategy Pattern)

    U ->> FE: Click "Download Report"
    FE ->> API: GET /api/projects/:projectId/reports?format=pdf
    API ->> RS: generateReport(projectId, format)
    
    Note right of RS: Strategy Pattern<br/>Selects PdfReportStrategy or CsvReportStrategy

    RS ->> RS: Strategy.generate(data)
    RS -->> API: Report File
    API -->> FE: Download Stream
```

---

## Flow Summary

| Phase | Description | Key Patterns Used |
|-------|-------------|-------------------|
| **1. Auth & Validation** | JWT token validation and request body schema validation via middleware pipeline. | Chain of Responsibility |
| **2. Factory Pattern** | `ImpactType` determines which `ImpactEvent` subclass (`ComputeEvent`, etc.) is instantiated. | Factory Method |
| **3. Polymorphism** | `calculateCO2()` is called on the specific subclass instance to compute emissions. | Polymorphism, Abstraction |
| **4. Persistence** | Data access is abstracted via Repository, keeping business logic clean. | Repository Pattern |
| **5. Monitoring** | Thresholds are checked after every write; alerts are dispatched if limits are breached. | Observer Pattern |
| **6. Reporting** | Report generation algorithm is selected at runtime based on the requested format. | Strategy Pattern |
