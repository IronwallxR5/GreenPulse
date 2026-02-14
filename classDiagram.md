# Class Diagram — GreenPulse

## Overview

This class diagram shows the major classes, their attributes, methods, and relationships across the GreenPulse platform. The design follows **Clean Architecture** (Controller → Service → Repository) with strong **OOP principles** and **design patterns**.

> [!NOTE]
> Classes marked with `🔜 Planned` are part of the architectural vision and will be implemented in future milestones. All other classes are currently implemented.

---

```mermaid
classDiagram
    direction TB

    %% ===== DOMAIN MODELS & DTOs (Implemented) =====

    class User {
        -id: int
        -email: string
        -password: string
        -name: string
    }

    class Project {
        -id: int
        -name: string
        -description: string
        -userId: int
    }

    class ImpactLog {
        -id: int
        -name: string
        -type: ImpactType
        -unitValue: float
        -carbonScore: float
        -projectId: int
    }

    class ImpactType {
        <<enumeration>>
        COMPUTE
        STORAGE
        NETWORK
        API_CALL
    }

    class ImpactEvent {
        <<abstract>>
        #unitValue: float
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

    %% ===== SERVICE LAYER (Implemented) =====

    class ImpactService {
        -impactRepo: ImpactRepository
        -projectRepo: ProjectRepository
        +createImpact(dto: CreateImpactDTO): ImpactLog
        +getAllImpacts(projectId: int): ImpactLog[]
        +updateImpact(id: int, dto: UpdateImpactDTO): ImpactLog
        +deleteImpact(id: int): void
        +getSummary(projectId: int): Summary
        -calculateCO2(type: ImpactType, val: float): float
        -verifyProjectOwnership(projectId: int, userId: int): Project
    }

    class ProjectService {
        -projectRepo: ProjectRepository
        +createProject(dto: CreateProjectDTO): Project
        +getProjectById(id: int): Project
        +getAllProjects(userId: int): Project[]
        +updateProject(id: int, dto: UpdateProjectDTO): Project
        +deleteProject(id: int): void
        +getProjectSummary(id: int): Summary
    }

    class AuthService {
        -userRepo: UserRepository
        +register(dto: RegisterDTO): AuthResponse
        +login(dto: LoginDTO): AuthResponse
        -hashPassword(password: string): string
        -comparePassword(plain: string, hashed: string): boolean
        -generateToken(userId: int): string
    }

    %% ===== PLANNED SERVICE LAYER =====

    class ReportingService {
        <<planned>>
        -strategy: IReportStrategy
        +setStrategy(strategy: IReportStrategy): void
        +generateReport(projectId: int): ReportFile
    }

    class NotificationService {
        <<planned>>
        -observers: INotificationObserver[]
        +subscribe(obs: INotificationObserver): void
        +notify(event: AlertEvent): void
        +checkThreshold(projectId: int): void
    }

    %% ===== PLANNED STRATEGY & OBSERVER INTERFACES =====

    class IReportStrategy {
        <<interface - planned>>
        +generate(data: ReportData): ReportFile
    }

    class PdfReportStrategy {
        <<planned>>
        +generate(data: ReportData): ReportFile
    }

    class CsvReportStrategy {
        <<planned>>
        +generate(data: ReportData): ReportFile
    }

    class INotificationObserver {
        <<interface - planned>>
        +onEvent(event: AlertEvent): void
    }

    class EmailNotificationObserver {
        <<planned>>
        +onEvent(event: AlertEvent): void
    }

    class InAppNotificationObserver {
        <<planned>>
        +onEvent(event: AlertEvent): void
    }

    %% ===== CONTROLLER LAYER (Implemented) =====

    class ImpactController {
        -impactService: ImpactService
        +createImpact(req, res): void
        +getAllImpacts(req, res): void
        +getImpact(req, res): void
        +updateImpact(req, res): void
        +deleteImpact(req, res): void
        +getSummary(req, res): void
    }

    class ProjectController {
        -projectService: ProjectService
        +createProject(req, res): void
        +getAllProjects(req, res): void
        +getProject(req, res): void
        +updateProject(req, res): void
        +deleteProject(req, res): void
        +getProjectSummary(req, res): void
    }

    class AuthController {
        -authService: AuthService
        +register(req, res): void
        +login(req, res): void
    }

    %% ===== REPOSITORIES (Implemented) =====

    class ImpactRepository {
        +create(data: ImpactLog): ImpactLog
        +findById(id: int): ImpactLog
        +findByProjectId(id: int): ImpactLog[]
        +update(id: int, data): ImpactLog
        +delete(id: int): void
        +getSummaryByProjectId(id: int): Summary
    }

    class ProjectRepository {
        +create(data: Project): Project
        +findById(id: int): Project
        +findByUserId(id: int): Project[]
        +update(id: int, data): Project
        +delete(id: int): void
        +getSummary(id: int): Summary
    }

    class UserRepository {
        +create(data: RegisterDTO): User
        +findByEmail(email: string): User
        +findById(id: int): User
    }

    %% ===== RELATIONSHIPS =====

    User "1" --> "*" Project : owns
    Project "1" --> "*" ImpactLog : contains
    ImpactLog --> ImpactType
    
    ImpactEvent <|-- ComputeEvent : extends
    ImpactEvent <|-- StorageEvent : extends
    ImpactEvent <|-- NetworkEvent : extends
    ImpactEvent <|-- ApiCallEvent : extends
    
    ImpactController --> ImpactService
    ProjectController --> ProjectService
    AuthController --> AuthService

    ImpactService --> ImpactRepository
    ImpactService --> ProjectRepository
    ImpactService ..> ImpactEvent : creates via Factory
    ProjectService --> ProjectRepository
    AuthService --> UserRepository
    
    ReportingService --> IReportStrategy
    IReportStrategy <|.. PdfReportStrategy : implements
    IReportStrategy <|.. CsvReportStrategy : implements
    
    NotificationService --> INotificationObserver
    INotificationObserver <|.. EmailNotificationObserver : implements
    INotificationObserver <|.. InAppNotificationObserver : implements
```

---

## Design Patterns in the Class Diagram

| Pattern | Where Applied | Status | Purpose |
|---------|---------------|--------|---------|
| **Factory Method** | `ImpactService.calculateCO2()` | ✅ | Creates `ImpactEvent` subclasses based on `ImpactType` |
| **Strategy** | `ReportingService` + `IReportStrategy` | 🔜 | Swappable report formats (PDF/CSV) at runtime |
| **Observer** | `NotificationService` | 🔜 | Decouples threshold checks from alert delivery |
| **Repository** | `ImpactRepository`, `ProjectRepository` | ✅ | Abstracts database operations (Prisma) from services |
| **Polymorphism** | `ImpactEvent` hierarchy | ✅ | Subclass-specific `calculateCO2()` behavior |

## OOP Principles

| Principle | Application |
|-----------|-------------|
| **Encapsulation** | Services hide business logic; Repositories hide data access; Models satisfy SRP |
| **Abstraction** | Abstract base class `ImpactEvent` hides calculation details; Interfaces defined for Strategy/Observer |
| **Inheritance** | `ComputeEvent`, `StorageEvent`, etc. inherit from `ImpactEvent` |
| **Polymorphism** | Calculation engine executes the correct subclass method at runtime without `instanceof` checks |
