# ER Diagram — GreenPulse

## Overview

This Entity-Relationship diagram shows the database schema for the GreenPulse platform. **Implemented** entities are currently live in the codebase. **Planned** entities represent the future roadmap and are not yet implemented.

> [!NOTE]
> Entities marked with `🔜 Planned` are part of the architectural vision described in `idea.md` and will be implemented in future milestones.

---

```mermaid
erDiagram
    %% ===== IMPLEMENTED =====

    USERS {
        int id PK
        varchar email UK
        varchar password
        varchar name
        timestamp created_at
        timestamp updated_at
    }

    PROJECTS {
        int id PK
        varchar name
        text description
        int user_id FK
        timestamp created_at
        timestamp updated_at
    }

    IMPACT_LOGS {
        int id PK
        varchar name
        text description
        enum type "COMPUTE | STORAGE | NETWORK | API_CALL"
        float unit_value
        float carbon_score
        int project_id FK
        timestamp created_at
        timestamp updated_at
    }

    %% ===== PLANNED (Not Yet Implemented) =====

    ORGANIZATIONS {
        int id PK
        varchar name UK
        text description
        varchar industry
        decimal carbon_budget
        int created_by FK
        timestamp created_at
        timestamp updated_at
    }

    ORGANIZATION_MEMBERS {
        int id PK
        int organization_id FK
        int user_id FK
        enum role "MEMBER | ADMIN | OWNER"
        timestamp joined_at
    }

    REPORTS {
        int id PK
        int project_id FK
        int generated_by FK
        enum format "PDF | CSV"
        enum status "PENDING | COMPLETED | FAILED"
        varchar file_path
        text summary
        decimal total_co2
        int total_events
        timestamp period_start
        timestamp period_end
        timestamp generated_at
    }

    NOTIFICATIONS {
        int id PK
        int user_id FK
        enum type "THRESHOLD_ALERT | REPORT_READY | SYSTEM | ACTIVITY"
        varchar title
        text message
        boolean is_read
        timestamp created_at
    }

    CARBON_THRESHOLDS {
        int id PK
        int project_id FK
        int user_id FK
        float limit_value
        enum severity "WARNING | CRITICAL"
        boolean is_active
        timestamp last_triggered_at
        timestamp created_at
        timestamp updated_at
    }

    AUDIT_LOGS {
        int id PK
        int user_id FK
        varchar action
        varchar entity_type
        int entity_id
        text details
        varchar ip_address
        timestamp created_at
    }

    PLATFORM_CONFIG {
        int id PK
        varchar config_key UK
        text config_value
        varchar description
        int updated_by FK
        timestamp updated_at
    }

    %% ===== RELATIONSHIPS =====

    USERS ||--o{ PROJECTS : "owns"
    PROJECTS ||--o{ IMPACT_LOGS : "contains"

    ORGANIZATIONS ||--o{ ORGANIZATION_MEMBERS : "has"
    USERS ||--o{ ORGANIZATION_MEMBERS : "joins"
    USERS }o--o| ORGANIZATIONS : "belongs to"

    PROJECTS ||--o{ REPORTS : "generates"
    USERS ||--o{ REPORTS : "triggers"

    USERS ||--o{ NOTIFICATIONS : "receives"

    PROJECTS ||--o{ CARBON_THRESHOLDS : "monitored by"
    USERS ||--o{ CARBON_THRESHOLDS : "configures"

    USERS ||--o{ AUDIT_LOGS : "generates"
```

---

## Table Summary

| Status | Table | Description | Key Relationships |
|--------|-------|-------------|-------------------|
| ✅ | `USERS` | All platform users authenticated via JWT | → Projects |
| ✅ | `PROJECTS` | Carbon tracking boundaries (apps, services) | ← User (owner), → Impact Logs |
| ✅ | `IMPACT_LOGS` | Individual infrastructure events with carbon scores | ← Project |
| 🔜 | `ORGANIZATIONS` | Multi-tenant groups for enterprise carbon tracking | → Org Members, ← Users |
| 🔜 | `ORGANIZATION_MEMBERS` | Junction table for organization membership | ← Organization, ← User |
| 🔜 | `REPORTS` | Generated compliance reports (PDF/CSV) | ← Project, ← User |
| 🔜 | `NOTIFICATIONS` | In-app notifications for alerts and system events | ← User |
| 🔜 | `CARBON_THRESHOLDS` | User-defined CO2 limits per project | ← Project, ← User |
| 🔜 | `AUDIT_LOGS` | Tamper-proof action log for compliance | ← User |
| 🔜 | `PLATFORM_CONFIG` | System-wide configuration key-value pairs | ← User (admin) |

---

## Key Indexes

| Table | Index | Purpose |
|-------|-------|---------| 
| `USERS` | `(email)` | Fast login lookups, duplicate prevention |
| `PROJECTS` | `(user_id)` | List all projects owned by a user |
| `IMPACT_LOGS` | `(project_id)` | Fast retrieval of all events for a project |
| `IMPACT_LOGS` | `(type)` | Filter events by impact type |
| `IMPACT_LOGS` | `(created_at)` | Time-series queries and sorting |
| `REPORTS` | `(project_id, generated_at)` | Recent reports for a project |
| `NOTIFICATIONS` | `(user_id, is_read)` | Unread notification count |
| `AUDIT_LOGS` | `(entity_type, entity_id)` | Entity-specific audit trail lookup |
| `CARBON_THRESHOLDS` | `(project_id, is_active)` | Active thresholds for monitoring |
