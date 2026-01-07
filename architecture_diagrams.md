# System Architecture Diagram

## Medication Alarm to Device Command Integration Flow

```mermaid
graph TB
    subgraph "Mobile Application Layer"
        A[Medication Schedule] --> B[AlarmService]
        B --> C[Local Notification]
        B --> D[Medication Command Bridge]
        
        E[User App] --> F[TopoAlarmOverlay]
        F --> G[TopoAlarmService]
        G --> H[Intake Recording]
    end
    
    subgraph "Backend Services"
        I[Cloud Functions] --> J[Medication Monitor]
        I --> K[Real-time Triggers]
        I --> L[Command Executor]
        
        M[Medication Command Bridge] --> N[Command Queue]
        M --> O[Patient-Device Resolver]
        M --> P[Timeout Manager]
        
        Q[Command Auditing] --> R[Audit Logger]
        Q --> S[Performance Monitor]
        Q --> T[Error Handler]
    end
    
    subgraph "Database Layer"
        U[Firestore] --> V[Medications]
        U --> W[Users/Patients]
        U --> X[Command Logs]
        U --> Y[Audit Trail]
        
        Z[RTDB] --> AA[Device Commands]
        Z --> BB[Device State]
        Z --> CC[Dispense Events]
    end
    
    subgraph "Device Layer (ESP8266)"
        DD[device-m1947 Family] --> EE[Command Poller]
        EE --> FF[Topo Executor]
        FF --> GG[State Reporter]
        GG --> HH[Alarm System]
    end
    
    subgraph "Notification System"
        II[Caregiver Notifications] --> JJ[Push Notifications]
        II --> KK[Critical Events]
        II --> LL[Emergency Alerts]
    end
    
    %% Data Flow Connections
    D --> I
    J --> M
    K --> L
    L --> AA
    N --> BB
    O --> CC
    P --> DD
    
    BB --> GG
    GG --> Z
    CC --> U
    
    II --> U
    KK --> JJ
    LL --> Z
    
    %% Real-time Updates
    Z -.->|Real-time State| E
    Z -.->|Command Status| M
    U -.->|Alarm Events| II
    
    classDef mobileClass fill:#e1f5fe
    classDef backendClass fill:#f3e5f5
    classDef databaseClass fill:#e8f5e8
    classDef deviceClass fill:#fff3e0
    classDef notificationClass fill:#fce4ec
    
    class A,B,C,D,E,F,G,H mobileClass
    class I,J,K,L,M,N,O,P,Q,R,S,T backendClass
    class U,V,W,X,Y,Z,AA,BB,CC databaseClass
    class DD,EE,FF,GG,HH deviceClass
    class II,JJ,KK,LL notificationClass
```

## Command Execution Flow

```mermaid
sequenceDiagram
    participant MA as Mobile AlarmService
    participant MB as MedicationBridge
    participant CF as Cloud Functions
    participant RTDB as Firebase RTDB
    participant DEV as ESP8266 Device
    participant FS as Firestore
    participant NOT as Notification System
    
    Note over MA,NOT: Medication Alarm Triggered
    
    MA->>MA: Schedule Local Alarm
    MA->>CF: Trigger Alarm Event
    
    CF->>MB: Process Alarm
    MB->>MB: Resolve Patient-Device
    MB->>MB: Queue Topo Command
    
    par Local Alarm
        MA->>MA: Show Notification
    and Device Command
        MB->>RTDB: Send Topo Command
        DEV->>RTDB: Poll Commands
        DEV->>DEV: Execute Topo
        DEV->>RTDB: Update State
    end
    
    RTDB->>MB: Command Acknowledged
    MB->>FS: Log Command Execution
    
    alt Command Successful
        DEV->>RTDB: current_status = 'DOSE_TAKEN'
        RTDB->>MA: Real-time Update
        MA->>MA: Update Topo Overlay
        MB->>NOT: Notify Success
    else Command Failed
        DEV->>RTDB: current_status = 'DOSE_MISSED'
        RTDB->>MB: Command Failed
        MB->>MB: Retry Logic
        MB->>NOT: Notify Failure
    end
    
    Note over MA,NOT: Synchronized Alarm Experience
```

## Database Schema Overview

```mermaid
erDiagram
    MEDICATIONS ||--o{ MEDICATION_ALARMS : triggers
    MEDICATIONS ||--o{ MEDICATION_COMMANDS : generates
    USERS ||--o{ MEDICATIONS : owns
    USERS ||--o{ DEVICES : controls
    DEVICES ||--o{ MEDICATION_COMMANDS : receives
    DEVICES ||--o{ DEVICE_COMMANDS : executes
    
    MEDICATIONS {
        string id PK
        string patientId FK
        string name
        string dosage
        array times
        string frequency
        boolean trackInventory
    }
    
    MEDICATION_ALARMS {
        string id PK
        string medicationId FK
        string patientId FK
        timestamp scheduledTime
        timestamp triggeredAt
        string status
        array alarmIds
    }
    
    MEDICATION_COMMANDS {
        string id PK
        string medicationId FK
        string patientId FK
        string deviceId FK
        string commandType
        string status
        timestamp executedAt
        number retryCount
    }
    
    USERS {
        string id PK
        string email
        string role
        string name
        string deviceId
    }
    
    DEVICES {
        string id PK
        string primaryPatientId FK
        string firmwareVersion
        boolean online
        object commandConfig
    }
    
    COMMAND_AUDIT_LOGS {
        string id PK
        string commandId FK
        string medicationId FK
        string patientId FK
        string action
        timestamp timestamp
        object metadata
    }