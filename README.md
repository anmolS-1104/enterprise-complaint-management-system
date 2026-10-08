# CompanyCMS: Intelligent Incident & Complaint Resolution System (ICRS)

An enterprise-grade, ITIL-aligned complaint management and resolution platform. The system combines Spring Boot REST services, JavaFX desktop clients, and Google Gemini NLP triage to automate ticket categorization, enforce zero-trust authentication, and streamline agent resolution workflows.

---

## Core Capabilities

- **Strict Zero-Trust Access Control**: Enforces an exact closed-list roster of 6 authorized customer accounts alongside 4 pre-provisioned support desks. Form validation mandates full name, verified email, a 10-digit phone number, and a secure password.
- **NLP Intent Classification & Auto-Routing**: Extracts complaint sentiment and semantic intent to automatically classify urgency (P1 to P4) and dispatch tickets directly to the responsible functional desk without manual intervention.
- **Unified Agent Command Center**: Department-isolated workspace featuring live queue monitoring, breached SLA timers, automated AI resolution drafts, and standardized resolution presets.
- **Enterprise Multi-Tier Architecture**: Spring Boot backend connected to MySQL persistence, desktop client views built with JavaFX/FXML, and cloud synchronization with Google AI Studio.

---

## ITIL Service Desk Structure

Incoming tickets are classified and dispatched across four functional departments:

| Service Desk | Desk ID[cite: 5] | Desk Lead[cite: 5] | Desk Email | Primary Intent Triggers |
| :--- | :---: | :--- | :--- | :--- |
| **Finance & Payroll**[cite: 5] | `#AGT-FIN-01`[cite: 5] | Elena Vance[cite: 5] | `finance@agent.company.com` | Billing discrepancies, duplicate transactions, refund requests, tax deduction issues |
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
- **Containerization**: Docker
- **Build Tool**: Apache Maven

---

## Repository Layout

```text
├── src/
│   ├── main/
│   │   ├── java/com/complaint/system/
│   │   │   ├── controllers/      # Spring Boot REST & JavaFX UI controllers
│   │   │   ├── services/         # NLP triage logic & SLA calculations
│   │   │   ├── models/           # Domain entity models (User, Ticket, Audit)
│   │   │   └── dao/              # MySQL persistence and data access objects
│   │   └── resources/
│   │       ├── CompanyCMS_Login.fxml
│   │       └── application.properties
├── Dockerfile                    # Multi-stage Java 21 container image
├── pom.xml                       # Maven build configuration
└── README.md
