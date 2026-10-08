# CompanyCMS: Intelligent Incident & Complaint Resolution System (ICRS)

An enterprise-grade, ITIL-aligned complaint management and resolution platform. The system combines Spring Boot REST services, JavaFX desktop clients, and Google Gemini NLP triage to automate ticket categorization, enforce zero-trust authentication, and streamline agent resolution workflows.

---

## Core Capabilities

- **Strict Zero-Trust Access Control**: Enforces an exact closed-list roster of 6 authorized customer accounts alongside 4 pre-provisioned support desks. Form validation mandates full name, verified email, a 10-digit phone number, and a secure password.
- **NLP Intent Classification & Auto-Routing**: Extracts complaint sentiment and semantic intent to automatically classify urgency (P1 to P4) and dispatch tickets directly to the responsible functional desk without manual intervention.
- **Unified Agent Command Center**: Department-isolated workspace featuring live queue monitoring, breached SLA timers, automated AI resolution drafts, and standardized resolution presets[cite: 5].
- **Enterprise Multi-Tier Architecture**: Spring Boot backend connected to MySQL persistence, desktop client views built with JavaFX/FXML, and cloud synchronization with Google AI Studio[cite: 1].

---

## ITIL Service Desk Structure

Incoming tickets are classified and dispatched across four functional departments:

| Service Desk | Desk ID | Desk Lead | Desk Email | Primary Intent Triggers |
| :--- | :---: | :--- | :--- | :--- |
| **Finance & Payroll** | `#AGT-FIN-01`[cite: 5] | Elena Vance[cite: 5] | `finance@agent.company.com` | Billing discrepancies, duplicate transactions, refund requests, tax deduction issues |
| **Technical Support** | `#AGT-TECH-01` | Alex Rivera | `tech@agent.company.com` | HTTP 500 errors, system crashes, timeout exceptions, database replication failures |
| **Logistics Desk** | `#AGT-LOG-01` | Marcus Vance | `logistics@agent.company.com` | Courier delays, tracking issues, damaged packaging, transit failures |
| **Customer Care** | `#AGT-CARE-01` | Sarah Jenkins | `care@agent.company.com` | Account settings, general inquiries, policy clarifications, profile updates |

---

## Access Credentials Roster

### 1. Whitelisted Customer Accounts
Only these 6 exact corporate customer accounts are authorized to register or log in to submit tickets:

| Customer Name | Authorized Email | Phone Number | Password |
| :--- | :--- | :---: | :---: |
| **Anmol** | `anmol.client@gmail.com` | `1234567891` | `client123` |
| **Acme** | `client.acme@gmail.com` | `1234567891` | `client123` |
| **BMC** | `client.bmc@gmail.com` | `1234567891` | `client123` |
| **Sam** | `client@acmecorp.com` | `1234567891` | `client123` |
| **Standard Customer** | `customer@client.com` | `9876543210` | `client123` |
| **Enterprise Client** | `client@client.com` | `9876543211` | `client123` |

### 2. Pre-Provisioned Agent Desks
Support agent accounts cannot self-register; access is restricted to direct credential sign-in:

- **Finance & Payroll**: `finance@agent.company.com` / `finance123`
- **Technical Support**: `tech@agent.company.com` / `tech123`
- **Customer Care**: `care@agent.company.com` / `care123`
- **Logistics Desk**: `logistics@agent.company.com` / `logistics123`

---

## Technical Stack

- **Backend Runtime**: Java 21, Spring Boot (Web, JDBC, Security)
- **Database**: MySQL 8.0
- **Desktop Frontend**: JavaFX 21, FXML
- **AI & NLP Integration**: Google Gemini API via Google AI Studio
- **Containerization**: Docker[cite: 1]
- **Build Tool**: Apache Maven

---

## Repository Structure

```text
enterprise-complaint-ai-app/
│
├── .github/
│   └── workflows/
│       └── build-deploy.yml               # CI/CD automated build & packaging workflow[cite: 1]
│
├── .ai/
│   └── mcp/                               # Google AI Studio / MCP synchronization configs[cite: 1]
│
├── src/                                   # Cloud Web Layer (Google AI Studio deployment)[cite: 1]
│   ├── components/
│   │   ├── CustomerPortal.tsx             # Ticket submission & tracking portal
│   │   └── AgentCommandCenter.tsx         # Unified ITIL desk command center & SLA queue[cite: 5]
│   ├── services/
│   │   └── nlpTriage.ts                   # Client-side intent extraction & routing logic
│   ├── App.tsx                            # Root application view & role router
│   └── main.tsx                           # Application entry point
│
├── JAVA-PROJECT/                          # Enterprise Backend & JavaFX Application[cite: 1]
│   │
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/complaint/system/
│   │   │   │   ├── CompanyCMSApplication.java       # Spring Boot main entry point
│   │   │   │   ├── JavaFXMain.java                  # JavaFX desktop client entry point
│   │   │   │   │
│   │   │   │   ├── config/
│   │   │   │   │   ├── SecurityConfig.java          # Zero-Trust CORS & route rules
│   │   │   │   │   └── DatabaseConfig.java          # MySQL DataSource & JdbcTemplate setup
│   │   │   │   │
│   │   │   │   ├── controllers/
│   │   │   │   │   ├── AuthController.java          # Whitelist verification controller
│   │   │   │   │   ├── RegisterController.java      # Customer registration controller
│   │   │   │   │   ├── TicketController.java        # REST endpoints for complaint lifecycle
│   │   │   │   │   ├── AgentCommandCenterController.java # Queue & desk resolution handler[cite: 5]
│   │   │   │   │   └── JavaFXLoginController.java   # Desktop client authentication handler
│   │   │   │   │
│   │   │   │   ├── services/
│   │   │   │   │   ├── TriageService.java           # Rule-based NLP classifier across 4 desks
│   │   │   │   │   ├── TicketService.java           # Complaint persistence & routing manager
│   │   │   │   │   ├── SlaMonitorService.java       # SLA timer breach calculations (P1–P4)[cite: 5]
│   │   │   │   │   └── AuthService.java             # Roster whitelist & credentials matching
│   │   │   │   │
│   │   │   │   ├── models/
│   │   │   │   │   ├── User.java                    # Customer & Support Agent entity model
│   │   │   │   │   ├── Ticket.java                  # Complaint record entity
│   │   │   │   │   ├── ServiceDesk.java             # ITIL Functional Desk enum (FIN, TECH, LOG, CARE)[cite: 5]
│   │   │   │   │   ├── TriageResult.java            # NLP output schema model
│   │   │   │   │   └── AuditLog.java                # Immutable action log entity[cite: 5]
│   │   │   │   │
│   │   │   │   └── dao/
│   │   │   │       ├── UserDao.java                 # MySQL user persistence
│   │   │   │       ├── TicketDao.java               # Ticket CRUD queries & queue filters[cite: 5]
│   │   │   │       └── AuditLogDao.java             # Timestamped resolution audit records[cite: 5]
│   │   │   │
│   │   │   └── resources/
│   │   │       ├── application.properties           # MySQL connection details & port bindings
│   │   │       ├── schema.sql                       # Database DDL initialization script
│   │   │       ├── CompanyCMS_Login.fxml            # Desktop login view layout
│   │   │       ├── CompanyCMS_CustomerPortal.fxml   # Desktop complaint filing interface
│   │   │       ├── CompanyCMS_AgentCommandCenter.fxml # Desktop agent triage console[cite: 5]
│   │   │       └── styles/
│   │   │           └── theme.css                    # Dark enterprise styling theme[cite: 5]
│   │   │
│   │   └── test/
│   │       └── java/com/complaint/system/
│   │           ├── AuthWhitelistTest.java           # Tests verifying 6-email access & rejections
│   │           └── TriageRoutingTest.java           # Tests verifying NLP desk classification
│   │
│   └── pom.xml                            # Maven dependencies (Spring Boot, JavaFX, MySQL)
│
├── .gitignore                             # Git ignore rules (target/, .idea/, *.class)[cite: 1]
├── Dockerfile                             # Container build configuration[cite: 1]
└── README.md                              # Project documentation
