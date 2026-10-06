# 🗂️ Intelligent Enterprise Complaint Management System

A multi-tier IT service management (ITSM) and complaint triage platform engineered in Java 21. The platform combines a Spring Boot REST API backend with a responsive JavaFX desktop client, providing automated ticket intake, rule-based department routing, SLA priority assignment, and persistent storage via AWS RDS MySQL.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#-project-structure)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Configuration & Environment](#configuration--environment)
- [Getting Started](#getting-started)

---

## Overview

The **Enterprise Complaint Management System** automates the lifecycle of internal and client service requests. By leveraging automated classification engines and department-specific polymorphism, tickets are ingested, assigned a severity level, routed to designated department agents, and tracked until resolution.

- **Automated Routing**: Categorizes complaints into Technical, Finance, Logistics, or Customer Care queues.
- **Role-Based Workflows**: Tailored interfaces for both general users filing issues and department agents managing resolution lifecycles.
- **Centralized Cloud Persistence**: Backed by a cloud-managed AWS RDS MySQL instance (`complaints_db`).
- **Audit & Analytics**: Integrated event logging and graphical performance analytics for department metrics.

---

## Key Features

- **Classification Engine**: Parses ticket context to infer category, target department, and urgency tiers (`LOW`, `NORMAL`, `HIGH`, `URGENT`).
- **Polymorphic Department Handlers**: Object-oriented department abstractions (`TechnicalDepartment`, `FinanceDepartment`, `LogisticsDepartment`) applying specialized SLA thresholds.
- **Multi-View JavaFX Client**: FXML-based screens for authentication, ticket registration, submission history, agent resolution queues, and department analytics.
- **RESTful Integration**: Decoupled client-server communication using Spring Boot REST controllers and DTO serialization.
- **Secure Data Access**: Custom DAO (Data Access Object) layer with connection pooling to AWS RDS MySQL.

---

## Tech Stack

### Core Technologies
| Technology | Component | Description |
| :--- | :--- | :--- |
| **Java 21 (LTS)** | Core Platform | Modern Java LTS runtime leveraging records and enhanced concurrency |
| **Spring Boot 3.x** | Backend Runtime | RESTful microservice layer exposing administrative and ingestion endpoints |
| **JavaFX 21** | Presentation Tier | Modern desktop GUI built using FXML, custom CSS, and controller bindings |
| **MySQL 8.0** | Cloud Database | Managed AWS RDS instance for multi-tenant data storage |
| **Apache Maven** | Build Automation | Dependency management, lifecycle phases, and packaging |
| **Docker** | Containerization | Multi-stage image build targeted for container execution |

---

## System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Tier                        │
│   JavaFX 21 Desktop GUI (FXML + CSS)                        │
│   - Login & Registration (AuthController)                   │
│   - Ticket Ingestion & History (ComplaintController)        │
│   - Department Agent Desk & Analytics (AgentDashboard)      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON (via ApiClient)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Tier                         │
│   Spring Boot 3.x REST Services (:8080)                     │
│   - ComplaintRestController / AuthController                │
│   - ClassificationEngine & ResolutionManager                │
│   - Polymorphic Department Models (Tech/Finance/Logistics)  │
└──────────────────────────────┬──────────────────────────────┘
                               │ JDBC / SQL Wire Protocol (Port 3306)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Tier                              │
│   AWS RDS MySQL 8.0 (ap-south-1)                            │
│   Database: complaints_db                                   │
│   - Tables: users, complaints, agents                       │
└─────────────────────────────────────────────────────────────┘


enterprise-complaint-management-system/
├── .ai/
│   └── mcp/
│       └── mcp.json                         # Model Context Protocol / AI configs
├── .github/
│   └── workflows/
│       └── deploy.yml                       # CI/CD deployment pipeline
├── src/
│   ├── main/
│   │   ├── java/com/complaint/system/
│   │   │   ├── controllers/                 # JavaFX UI & Spring REST controllers
│   │   │   │   ├── AgentController.java
│   │   │   │   ├── AgentDashboardController.java
│   │   │   │   ├── AnalyticsController.java
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── ComplaintController.java
│   │   │   │   ├── ComplaintRestController.java
│   │   │   │   ├── HistoryController.java
│   │   │   │   ├── LoginController.java
│   │   │   │   ├── RegisterController.java
│   │   │   │   └── UserController.java
│   │   │   ├── dao/                         # Data Access Objects & JDBC implementations
│   │   │   │   ├── AgentDAO.java
│   │   │   │   ├── AgentDAOImpl.java
│   │   │   │   ├── ComplaintDAO.java
│   │   │   │   ├── ComplaintDAOImpl.java
│   │   │   │   ├── UserDAO.java
│   │   │   │   └── UserDAOImpl.java
│   │   │   ├── dto/                         # Data Transfer Objects
│   │   │   │   ├── ComplaintDTO.java
│   │   │   │   ├── LoginRequest.java
│   │   │   │   └── LoginResponse.java
│   │   │   ├── model/                       # Domain models & Department polymorphism
│   │   │   │   ├── Agent.java
│   │   │   │   ├── Complaint.java
│   │   │   │   ├── Department.java
│   │   │   │   ├── FinanceDepartment.java
│   │   │   │   ├── LogisticsDepartment.java
│   │   │   │   ├── TechnicalDepartment.java
│   │   │   │   └── User.java
│   │   │   ├── service/                     # Business logic & classification triage
│   │   │   │   ├── AgentService.java
│   │   │   │   ├── ClassificationEngine.java
│   │   │   │   ├── ComplaintService.java
│   │   │   │   ├── ResolutionManager.java
│   │   │   │   └── UserService.java
│   │   │   ├── util/                        # Helpers, networking & database connections
│   │   │   │   ├── ApiClient.java
│   │   │   │   ├── ComplaintApp.java
│   │   │   │   ├── DBConnection.java
│   │   │   │   ├── FileLogger.java
│   │   │   │   └── Session.java
│   │   │   ├── BackendApplication.java      # Spring Boot application entry point
│   │   │   ├── ClientApp.java               # JavaFX client lifecycle manager
│   │   │   └── Launcher.java                # Main bootstrap executable
│   │   └── resources/                       # JavaFX FXML layouts, styling & config
│   │       ├── agent_dashboard.fxml
│   │       ├── analytics.fxml
│   │       ├── application.properties       # Spring & RDS MySQL datasource config
│   │       ├── dashboard.fxml
│   │       ├── history.fxml
│   │       ├── login.fxml
│   │       ├── register.fxml
│   │       ├── schema.sql
│   │       └── styles.css
│   └── test/
│       └── java/com/complaint/system/service/
│           └── ComplaintServiceTest.java    # Automated unit tests
├── .gitignore
├── Dockerfile                               # Cloud Run containerization
├── pom.xml                                  # Maven dependencies & build lifecycle
└── README.md                                # Project documentation

