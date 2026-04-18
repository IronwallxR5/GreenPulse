# Class Diagram - GreenPulse

This class diagram reflects the current implementation in `backend/src`.

```mermaid
classDiagram
    direction TB

    class User {
        +id: int
        +email: string
        +password: string_nullable
        +googleId: string_nullable
        +name: string
        +createdAt: DateTime
        +updatedAt: DateTime
    }

    class Project {
        +id: int
        +name: string
        +description: string_nullable
        +userId: int
        +carbonBudget: float_nullable
        +createdAt: DateTime
        +updatedAt: DateTime
    }

    class ImpactLog {
        +id: int
        +name: string
        +description: string_nullable
        +type: ImpactType
        +unitValue: float
        +carbonScore: float
        +projectId: int
        +createdAt: DateTime
        +updatedAt: DateTime
    }

    class Alert {
        +id: int
        +projectId: int
        +message: string
        +totalCO2: float
        +budget: float
        +isRead: boolean
        +createdAt: DateTime
    }

    class AuditLog {
        +id: int
        +userId: int
        +projectId: int_nullable
        +action: string
        +entityType: string
        +entityId: int_nullable
        +metadata: json_nullable
        +createdAt: DateTime
    }

    class ReportSchedule {
        +id: int
        +projectId: int_unique
        +userId: int
        +frequency: ReportFrequency
        +format: ReportFormat
        +isActive: boolean
        +nextRunAt: DateTime
        +lastRunAt: DateTime_nullable
        +createdAt: DateTime
        +updatedAt: DateTime
    }

    class ComplianceReport {
        +id: int
        +projectId: int
        +userId: int
        +scheduleId: int_nullable
        +format: ReportFormat
        +totalCO2: float
        +totalLogs: int
        +byType: json
        +generatedAt: DateTime
    }

    class ImpactType {
        <<enumeration>>
        COMPUTE
        STORAGE
        NETWORK
        API_CALL
    }

    class ReportFrequency {
        <<enumeration>>
        DAILY
        WEEKLY
        MONTHLY
    }

    class ReportFormat {
        <<enumeration>>
        PDF
        CSV
    }

    class ImpactEvent {
        <<abstract>>
        +id: int
        +name: string
        +unitValue: float
        +type: ImpactType
        +createdAt: Date
        +calculateCO2(): float*
    }

    class ComputeEvent {
        +calculateCO2(): float
    }

    class StorageEvent {
        +calculateCO2(): float
    }

    class NetworkEvent {
        +calculateCO2(): float
    }

    class ApiCallEvent {
        +calculateCO2(): float
    }

    class AuthController {
        -authService: AuthService
        -userRepository: UserRepository
        +register(req, res): void
        +login(req, res): void
        +me(req, res): void
        +googleCallback(req, res): void
    }

    class ProjectController {
        -projectService: ProjectService
        -reportingService: ReportingService
        +createProject(req, res): void
        +getProject(req, res): void
        +getAllProjects(req, res): void
        +updateProject(req, res): void
        +deleteProject(req, res): void
        +getProjectSummary(req, res): void
        +getProjectReport(req, res): void
        +getReportSchedule(req, res): void
        +upsertReportSchedule(req, res): void
        +deleteReportSchedule(req, res): void
        +getComplianceReports(req, res): void
        +runComplianceReportNow(req, res): void
        +setBudget(req, res): void
        +getAlerts(req, res): void
        +getAuditLogs(req, res): void
        +streamAlerts(req, res): void
        +markAlertsRead(req, res): void
    }

    class ImpactController {
        -impactService: ImpactService
        +createImpact(req, res): void
        +getImpact(req, res): void
        +getAllImpacts(req, res): void
        +updateImpact(req, res): void
        +deleteImpact(req, res): void
        +getSummary(req, res): void
    }

    class AuthService {
        -userRepository: UserRepository
        +register(data): AuthResponse
        +login(data): AuthResponse
        +generateToken(userId): string
        -hashPassword(password): string
        -comparePassword(plain, hash): boolean
    }

    class ProjectService {
        -projectRepository: ProjectRepository
        -alertRepository: AlertRepository
        -auditService: AuditService
        +createProject(data, userId): Project
        +getProjectById(id, userId): Project
        +getAllProjects(userId): ProjectList
        +updateProject(id, data, userId): Project
        +deleteProject(id, userId): void
        +getProjectSummary(id, userId): Summary
        +setBudget(id, budget, userId): Project
        +getAlerts(id, userId): AlertList
        +getAuditLogs(id, userId, filters): AuditLogList
        +markAlertsRead(id, userId): void
    }

    class ImpactService {
        -impactRepository: ImpactRepository
        -projectRepository: ProjectRepository
        -notificationService: NotificationService
        -auditService: AuditService
        +createImpact(data, projectId, userId): ImpactLog
        +getImpactById(id, userId): ImpactLog
        +getAllImpacts(projectId, userId, filters): ImpactList
        +updateImpact(id, data, userId): ImpactLog
        +deleteImpact(id, userId): void
        +getSummary(projectId, userId): Summary
        -verifyProjectOwnership(projectId, userId): Project
        -calculateCO2(type, unitValue): float
    }

    class AuditService {
        -auditRepository: AuditRepository
        -projectRepository: ProjectRepository
        +log(input): AuditLog
        +getProjectAuditLogs(projectId, userId, filters): AuditLogList
    }

    class ComplianceService {
        -projectRepository: ProjectRepository
        -impactRepository: ImpactRepository
        -reportScheduleRepository: ReportScheduleRepository
        -complianceReportRepository: ComplianceReportRepository
        -auditService: AuditService
        +getReportSchedule(projectId, userId): ReportSchedule_nullable
        +upsertReportSchedule(projectId, userId, data): ReportSchedule
        +deleteReportSchedule(projectId, userId): DeleteResult
        +getComplianceReports(projectId, userId, filters): ComplianceReportList
        +runComplianceReportNow(projectId, userId, format): ComplianceReport
        +runDueSchedules(): void
    }

    class NotificationService {
        <<singleton>>
        -observers: ThresholdObserverList
        -alertRepo: AlertRepository
        +getInstance(): NotificationService
        +subscribe(observer): void
        +unsubscribe(observer): void
        +notifyThresholdExceeded(projectId, totalCO2, budget): PromiseVoid
    }

    class AlertSocketGateway {
        <<singleton>>
        +initialize(httpServer): void
        +emitThresholdAlertToProject(projectId, payload): void
        -resolveTokenFromHandshake(socket): string_nullable
        -verifyToken(token): JwtPayload_nullable
    }

    class ReportingService {
        -strategy: IReportStrategy
        -impactRepo: ImpactRepository
        -projectRepo: ProjectRepository
        +setStrategy(strategy): void
        +generateReport(projectId): ReportFile
    }

    class IReportStrategy {
        <<interface>>
        +generate(data): ReportContent
        +contentType: string
        +fileExtension: string
    }

    class PdfReportStrategy {
        +generate(data): Buffer
    }

    class CsvReportStrategy {
        +generate(data): string
    }

    class UserRepository {
        +create(data): User
        +findByEmail(email): UserNullable
        +findById(id): UserNullable
        +findByGoogleId(googleId): UserNullable
        +upsertGoogleUser(data): User
        +linkGoogleId(userId, googleId): User
    }

    class ProjectRepository {
        +create(data): Project
        +findById(id): ProjectNullable
        +findByUserId(userId): ProjectList
        +update(id, data): Project
        +delete(id): void
        +getSummary(id): Summary
    }

    class ImpactRepository {
        +create(data): ImpactLog
        +findById(id): ImpactLogNullable
        +findByProjectId(projectId, filters): ImpactList
        +update(id, data): ImpactLog
        +delete(id): void
        +getSummaryByProjectId(projectId): Summary
    }

    class AlertRepository {
        +create(data): Alert
        +findByProjectId(projectId): AlertList
        +markRead(id): Alert
        +markAllRead(projectId): void
        +countUnread(projectId): int
    }

    class AuditRepository {
        +create(data): AuditLog
        +findByProjectId(projectId, userId, filters): AuditLogList
    }

    class ReportScheduleRepository {
        +findByProjectId(projectId): ReportSchedule_nullable
        +upsertByProject(data): ReportSchedule
        +deleteByProjectId(projectId): void
        +findDueSchedules(now, limit): ReportScheduleList
        +updateRunState(id, nextRunAt, lastRunAt): ReportSchedule
    }

    class ComplianceReportRepository {
        +create(data): ComplianceReport
        +findByProjectId(projectId, filters): ComplianceReportList
    }

    User "1" --> "*" Project : owns
    Project "1" --> "*" ImpactLog : contains
    Project "1" --> "*" Alert : raises
    User "1" --> "*" AuditLog : records
    Project "1" --> "*" AuditLog : scopes
    Project "1" --> "1" ReportSchedule : schedules
    User "1" --> "*" ReportSchedule : configures
    Project "1" --> "*" ComplianceReport : snapshots
    User "1" --> "*" ComplianceReport : generates
    ReportSchedule "1" --> "*" ComplianceReport : produces
    ImpactLog --> ImpactType

    ImpactEvent <|-- ComputeEvent
    ImpactEvent <|-- StorageEvent
    ImpactEvent <|-- NetworkEvent
    ImpactEvent <|-- ApiCallEvent

    AuthController --> AuthService
    AuthController --> UserRepository
    ProjectController --> ProjectService
    ProjectController --> ReportingService
    ProjectController --> ComplianceService
    ImpactController --> ImpactService

    AuthService --> UserRepository
    ProjectService --> ProjectRepository
    ProjectService --> AlertRepository
    ProjectService --> AuditService
    ImpactService --> ImpactRepository
    ImpactService --> ProjectRepository
    ImpactService --> NotificationService
    ImpactService --> AuditService
    ImpactService ..> ImpactEvent : factory + polymorphism

    NotificationService --> AlertRepository
    NotificationService --> AlertSocketGateway
    AuditService --> AuditRepository
    AuditService --> ProjectRepository
    ComplianceService --> ProjectRepository
    ComplianceService --> ImpactRepository
    ComplianceService --> ReportScheduleRepository
    ComplianceService --> ComplianceReportRepository
    ComplianceService --> AuditService
    ReportingService --> ProjectRepository
    ReportingService --> ImpactRepository
    ReportingService --> IReportStrategy
    IReportStrategy <|.. PdfReportStrategy
    IReportStrategy <|.. CsvReportStrategy
```

## Pattern Mapping

| Pattern | Location | Purpose |
|---|---|---|
| Factory Method | `ImpactService.calculateCO2()` | Chooses event subclass from `ImpactType` |
| Polymorphism | `ImpactEvent` hierarchy | Type-specific emission formulas |
| Strategy | `ReportingService` + report strategies | Runtime selection of PDF/CSV generation |
| Observer (lightweight) | `NotificationService` | Threshold notification fan-out + durable alert record |
| Pub/Sub Gateway | `AlertSocketGateway` + Socket.IO rooms | Project-scoped realtime multi-client alert delivery |
| Audit Trail | `AuditService` + `AuditRepository` | Durable traceability for key project/impact mutations |
| Scheduling | `ComplianceService` + scheduler | Automated recurring compliance snapshots |
| Repository | `*.repository.ts` classes | Database abstraction over Prisma |

## Planned Extensions (Not Implemented Yet)

- Role/permission classes for RBAC
- Additional notification channels (email/webhook)
- Cloud ingestion connectors and normalization models
