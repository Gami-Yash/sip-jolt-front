# SIPJOLT Operations Manual v1.01

## Overview
SIPJOLT is a deterministic field operations platform designed to manage automated beverage machines (Jolt Automated Barista) across various building sites. Its primary purpose is to enforce a closed-loop delivery and maintenance workflow, ensuring immutable evidence capture to eliminate disputes. The system prioritizes human-submitted signals (photos, checklists, scans) over machine telemetry for all operations. It supports three main user roles: SIPJOLT Barista Specialist, Delivery Specialist, and Ops Manager, facilitating site maintenance, delivery proof, shipping, incident management, and site configuration. The platform allows for "soft warnings" where issues notify the Ops Manager but do not prevent technicians from continuing their work.

### v1.01 Key Features
- **Gate5 Shipping Framework**: 60/90 split delivery system (60-day ingredient cycle + 90-day cup cycle with 30-day offset)
- **Liquid Fortress 2.0**: Enhanced syrup packing protocol with individual poly bag containment
- **Zone-Based Shelf Organization**: A=Red (Syrups), B=Green (Powders), C=Yellow (Specialty), D=Gray (Maintenance), E=Blue (Cups)
- **Lucky Spin Gamification**: (Temporarily disabled for stability - code preserved)

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 19 and Vite 7, styled using Tailwind CSS 4, and utilizes Lucide React for iconography. It features Progressive Web App (PWA) support with offline capabilities and uses a context-based state management pattern with role-gated navigation.

### Backend Architecture
The backend runs on Node.js with Express 5, providing a modular REST API structure with dedicated routers for core operations, authentication, metrics, administration, landlord access, exception handling, KPI dashboards, and a consequence engine. It includes version-specific endpoints for new features and shared API routes for pull-based operating system features. Security middleware, including RLS policies and CORS handling, is implemented.

### Database Layer
Drizzle ORM with a PostgreSQL dialect is used for database interactions, specifically with Neon Database (serverless PostgreSQL). The schema is defined in `shared/schema.js`, and Drizzle Kit manages schema migrations. Strict multi-tenancy with RLS policies is enforced across all queries.

### Key Design Patterns
-   **Evidence Chain (Immutable Audit Trail)**: All events are recorded with comprehensive metadata, including tenant, site, machine, actor, device, timestamp, GPS, and evidence links. SHA-256 hash chaining ensures data integrity, and corrections are appended as new events rather than overwriting existing ones.
-   **Role-Based Access Control (RBAC)**: Defines specific permissions for SIPJOLT Barista Specialists (site maintenance, delivery acceptance), Delivery Specialists (POD capture), Ops Managers (administrative access, overrides), and Landlord Viewers (read-only access).
-   **Deterministic Workflows**: Utilizes an Action Rail pattern to display the most urgent task and employs soft prompt modes for recommendations rather than hard blockers. A watchdog service notifies Ops Managers of issues without locking out users.
-   **Role-Specific Onboarding**: Provides skippable, interactive training paths tailored for OPS_MANAGER, DRIVER, and PARTNER_TECHNICIAN roles, logging completion and skipped instances for review.
-   **Proof Capture Standards**: Includes GPS validation (50m geofence), photo quality gates, timestamp verification with clock drift detection, and an offline queue with a 1-hour sync SLA.
-   **Gamification System**: Incorporates "Lucky Spin" for incentives, a point system, and bonuses for fast task completion, along with a "Daily Coffee Perk" and an "Annual Vacation Race."
-   **5-Gate QC Packing System**: A step-by-step wizard for quality control during box packing, including weight checks, freshness locks, movement tests, and label verification.
-   **Ghost Delivery**: An unattended delivery workflow featuring site-specific access codes, GPS validation, and photo evidence capture, with a 24-hour partner acceptance deadline.
-   **Gate5 Shipping Framework (v1.01)**: Split delivery system with 60-day ingredient cycle (6 boxes) and 90-day cup cycle (4 boxes, 30-day offset). Liquid Fortress 2.0 protocol for syrup containment.

### UI/UX Decisions
The system has transitioned from a dark terminal aesthetic to a clean, white, Apple-centric design. Components like Card, Button, ActionRail, and SystemReadinessCard have been simplified. The UI supports haptic feedback and optional audio cues for gamification, with confetti celebrations for prize wins.

### Operations Command Center (OpsCommandCenter)
-   **Component**: `src/components/OpsCommandCenter.jsx` - Enterprise-grade control panel for Ops Managers
-   **Design**: Dark slate theme (slate-900/950) with professional sidebar navigation, distinct from technician's white Apple-centric design
-   **Navigation Sections**: Overview, Fleet Status, Shipments, Supply Chain, Machines, Technicians, Incidents, Reports, Admin
-   **Security**: Header displays real-time security status indicator with Shield icon
-   **KPI Dashboard**: Shows fleet metrics, active incidents, and operational status at a glance
-   **Machine Control**: Machines section provides access to Yile coffee machine integration panels (Mission Panel, Diagnostics)
-   **Role Isolation**: Ops Managers and Owners see only the Command Center; technicians see the simplified white dashboard
-   **Authentication**: Ops Manager login uses 4-digit code (demo: 4782)

## External Dependencies

### Database
-   **Neon Database**: Serverless PostgreSQL via `@neondatabase/serverless`.

### Authentication & Storage
-   **Firebase**: For user authentication (`firebase/auth`) and supplementary data storage (Firestore).
-   **Google Cloud Storage**: For object storage of evidence files via `@google-cloud/storage`.
-   **Replit Object Storage**: For additional file storage integration.

### AI Integration
-   **SIPJOLT Neural Core**: An AI powered by Gemini 1.5 Pro, acting as a sovereign enforcer. It is context-aware, integrates with a knowledge base of operational rules, and enforces role-based access control and brand protection. It provides a global, persistent assistant (Floating Chat FAB) and performs deterministic enforcement of rules.

### Yile Coffee Machine Integration (v1.01)
-   **External API**: Connects to Yile coffee machine API for remote machine management
-   **Backend Services**: `server/services/yile/yileApiService.js` (API client with token management), `server/services/yile/sovereignQueue.js` (rate-limited command queue)
-   **API Routes**: `/api/v1.01/yile-tech/*` (technician operations), `/api/v1.01/yile-admin/*` (admin diagnostics)
-   **Database Tables**: 8 tables for tracking machine status, commands, inventory, events, and API health
-   **Frontend Components**: `TechnicianMissionPanel.jsx` (machine controls, test brew), `AdminDiagnosticPanel.jsx` (7-tab diagnostic suite)
-   **Navigation**: Accessed via OpsCommandCenter > Machines section > "Yile Coffee Machine Control" card
-   **Machine**: #00000020868 linked to SITE-001 (site_id=2)
-   **Configuration**: Requires `YILE_INTEGRATION_ENABLED=true` to activate (currently disabled)

### Replenishment System (v1.01)
-   **Purpose**: Monitor machine bin levels and generate refill alerts for ingredients
-   **Backend Routes**: `/api/v1.01/replenishment/*` (settings, status, alerts, inventory checks)
-   **Database Tables**: `replenishment_settings` (per-device ingredient thresholds), `inventory_snapshots` (point-in-time levels), `refill_alerts` (warning/critical alerts)
-   **Frontend Component**: `ReplenishmentAlerts.jsx` in Fleet Dashboard device details
-   **Ingredient Mapping**: Normalizes Chinese/English Yile API names to standard ingredient names
-   **Threshold Logic**: Warning threshold > Critical threshold; alerts generated when levels drop below thresholds
-   **Fallback Behavior**: Graceful degradation when Yile API is unavailable - shows default values with note

### File Upload
-   **Uppy**: Handles file uploads, including AWS S3 multipart support (`@uppy/core`, `@uppy/dashboard`, `@uppy/aws-s3`, `@uppy/react`).

### Security
-   **bcrypt**: For password hashing.
-   **crypto-js**: For client-side cryptographic operations.

### UI Libraries
-   **qrcode.react**: For QR code generation.
-   **canvas-confetti**: For gamification rewards.
-   **ws**: For WebSocket support and real-time updates.

### Build & Development
-   **Vite**: For development server and production builds.
-   **tsx**: For TypeScript execution in scripts.