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

---

## Project Architecture & Routing
