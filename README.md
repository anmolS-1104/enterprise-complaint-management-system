# 🗂️ Intelligent Enterprise Complaint Management System

A cloud-native, full-stack IT service management (ITSM) and complaint triage platform. The system features an AI-assisted intake portal providing real-time sentiment analysis, automated priority classification, and rule-based department routing backed by an AWS RDS MySQL database and hosted on Google Cloud Run.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Architecture & Routing](#project-architecture--routing)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Environment Configuration](#environment-configuration)
- [Local Setup & Deployment](#local-setup--deployment)

---

## Overview

The platform modernizes enterprise ticket intake and resolution. Incoming user issues are analyzed in real time as the user types, categorized by domain, assigned an SLA priority tier, and routed to specialized department queues with automated agent attribution.

- **Real-time Live Triage**: Evaluates text input dynamically using a keyword and heuristic engine.
- **Multi-Modal Logging**: Supports standard text descriptions, document attachments, and voice notes.
- **Centralized Cloud Persistence**: Backed by a managed AWS RDS MySQL instance (`complaints_db`).
- **Automated Agent Dispatch**: Dispatches tickets into designated department queues (Customer Care, Technical Support, Finance & Payroll, Logistics).

---

## Key Features

- **Live Triage Prediction**: Real-time evaluation of department (e.g., *Finance & Payroll*), category (e.g., *Billing*), and priority tier (*P1 Critical*, *P2 High*, *P3 Medium*, *P4 Low*).
- **Sentiment Detection**: Dynamically scores input tone (e.g., `NEUTRAL`, `NEGATIVE`, `URGENT`) to adjust routing weight.
- **Agent Attribution**: Routes complaints directly to specialized agents (e.g., Alex Rivera for Tech Support, Sarah Jenkins for Care, Marcus Vance for Logistics).
- **Multi-Format Ingestion**: Ingests JSON-serialized attachments and voice note metadata alongside ticket descriptions.

---

## Tech Stack

### Frontend & Client Tier
| Technology | Role |
| :--- | :--- |
| **React 18 / Vite** | Single-page application framework and UI state management |
| **Tailwind CSS** | Dark-mode enterprise design system |
| **Lucide React** | Visual iconography, indicators, and status badges |
| **Web Audio API** | Voice note recording directly in the browser |

### Backend & Cloud Runtime
| Technology | Role |
| :--- | :--- |
| **Node.js / Express** | High-throughput REST API backend handling routing and validation |
| **MySQL2** | Connection pooling and querying to managed AWS RDS |
| **Google Cloud Run** | Fully managed containerized serverless hosting |
| **Git / GitHub** | Version control with a single primary branch (`main`) |

### Database Layer
| Technology | Role |
| :--- | :--- |
| **AWS RDS MySQL 8.0** | Cloud relational database instance (`ap-south-1`) |
| **Schema Name** | `complaints_db` |


## Project Architecture & Routing## Project Architecture & Routing

┌────────────────────────────────────────────────────────┐
│             Web Client (React 18 + Vite)               │
│   - Live Input Monitoring & Heuristic Triage           │
│   - In-Browser Voice Recording (Web Audio API)         │
│   - Attachment Base64 Serialization                    │
└───────────────────────────┬────────────────────────────┘
│ HTTPS / JSON
▼
┌────────────────────────────────────────────────────────┐
│          Google Cloud Run (Node.js & Express)          │
│   - REST API Controller (/api/complaints)              │
│   - Fallback Sanitization & Default Injection          │
│   - SLA Priority Tier Evaluator                        │
└───────────────────────────┬────────────────────────────┘
│ MySQL Wire Protocol (Port 3306)
▼
┌────────────────────────────────────────────────────────┐
│               AWS RDS MySQL 8.0 Instance               │
│   Endpoint: complaints-db.czoe06ig4twu.ap-south-1...   │
│   - Database: complaints_db                            │
│   - Tables: users, complaints                          │
└────────────────────────────────────────────────────────┘


### Department Assignment Matrix

| Trigger Domain / Keywords | Predicted Department | Category | Default Agent |
| :--- | :--- | :--- | :--- |
| Server, virus, system, crash, hardware, bug | **Technical Support** | Technical | Alex Rivera (`#AGT-TECH-01`) |
| Salary, refund, billing, payment, payroll | **Finance & Payroll** | Billing | Dedicated Billing Desk |
| Delivery, courier, package, tracking, transit | **Logistics** | Logistics | Marcus Vance (`#AGT-LOG-01`) |
| Account, access, water supply, general inquiry | **Customer Care** | General Inquiry | Sarah Jenkins (`#AGT-CARE-01`) |

---

## Database Schema

Primary operational schema: `complaints_db`

```sql
CREATE TABLE complaints_db.complaints (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT 1,
    customer_id INT DEFAULT 1,
    description TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General Inquiry',
    department VARCHAR(100) DEFAULT 'Customer Care',
    priority VARCHAR(50) DEFAULT 'LOW',
    status VARCHAR(50) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT NULL,
    agent_notes TEXT NULL,
    agent_id VARCHAR(50) NULL,
    agent_name VARCHAR(255) NULL,
    attachments TEXT NULL,
    voice_note TEXT NULL
);

CREATE TABLE complaints_db.users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    role VARCHAR(50) DEFAULT 'CUSTOMER',
    department VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
API Endpoints

## Project Architecture & Routing
