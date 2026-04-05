# Web POS System

A comprehensive restaurant Point-of-Sale (POS) system inspired by iChef, built with a modern tech stack for reliability, scalability, and ease of use in busy restaurant environments.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  Next.js 14 (App Router) + TypeScript + Tailwind CSS            │
│  - POS Interface (tablet-optimized)                             │
│  - Admin Dashboard                                              │
│  - Kitchen Display System (KDS)                                 │
└──────────────────────┬──────────────────────────────────────────┘
                       │ REST API (JWT)
┌──────────────────────▼──────────────────────────────────────────┐
│                      API Layer                                   │
│  Spring Boot 3.2 (Java 21)                                      │
│  - Business logic & validation                                  │
│  - JWT authentication & role-based authorization                │
│  - RESTful endpoints                                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │ JDBC / JPA
┌──────────────────────▼──────────────────────────────────────────┐
│                    Data Layer                                    │
│  Supabase (PostgreSQL)                                          │
│  - Row Level Security (RLS)                                     │
│  - Supabase Auth (JWT)                                          │
│  - Real-time subscriptions (optional)                           │
└─────────────────────────────────────────────────────────────────┘
```

## User Roles

| Role    | Permissions                                              |
|---------|----------------------------------------------------------|
| OWNER   | Full access to all features, reports, staff management   |
| MANAGER | Orders, reports, clock records, end-of-day settlement    |
| STAFF   | POS ordering, clock in/out, basic table management       |
| KITCHEN | Kitchen display only, mark orders complete               |

## Features

### POS Interface
- Table selection with color-coded status (green/red/yellow)
- Category-tabbed menu browsing
- Modifier/option selection modal
- Cart management with quantity controls
- Checkout with multiple payment methods (Cash, Credit Card, LINE Pay, JKOPay)
- Cash change calculation
- Receipt printing (extensible)

### Kitchen Display System (KDS)
- Real-time order queue
- Item-level completion tracking
- Order priority visualization

### Admin Dashboard
- Menu management (categories, items, modifiers)
- Table/area management
- Staff management with role assignment
- Daily reports with revenue breakdowns
- Clock records and salary calculation

### Back-of-House
- Clock in/out with PIN
- Staff attendance tracking
- Hourly wage calculation

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS          |
| State    | Zustand, TanStack Query                       |
| Backend  | Spring Boot 3.2, Java 21                      |
| Database | Supabase (PostgreSQL 15)                      |
| Auth     | Supabase Auth + JWT                           |
| DevOps   | Docker Compose                                |

## Project Structure

```
web-pos/
├── frontend/               # Next.js 14 application
│   └── src/
│       ├── app/
│       │   ├── (auth)/     # Login pages
│       │   ├── (admin)/    # Admin dashboard pages
│       │   └── (pos)/      # POS interface pages
│       ├── components/     # Reusable UI components
│       ├── lib/            # Utilities, types, API client
│       └── store/          # Zustand state stores
├── backend/                # Spring Boot application
│   └── src/main/java/com/webpos/
│       ├── config/         # Security, JWT configuration
│       ├── controller/     # REST controllers
│       ├── service/        # Business logic
│       ├── entity/         # JPA entities
│       ├── repository/     # Spring Data repositories
│       ├── dto/            # Request/response DTOs
│       └── exception/      # Exception handling
├── database/
│   ├── migrations/         # Ordered SQL migrations
│   └── seed/               # Demo data
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 20+
- Java 21+
- Maven 3.9+
- Docker & Docker Compose (optional)
- A Supabase project

### 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run migrations in the Supabase SQL editor:
   ```sql
   -- Run in order:
   -- database/migrations/001_initial_schema.sql
   -- database/migrations/002_seed_data.sql
   -- database/seed/demo_data.sql  (optional)
   ```
3. Copy your project URL and keys from Settings > API

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# NEXT_PUBLIC_API_URL=http://localhost:8080

npm install
npm run dev
```

Frontend runs at http://localhost:3000

### 3. Backend Setup

```bash
cd backend
cp src/main/resources/application.yml.example src/main/resources/application.yml

# Edit application.yml with your database URL
# datasource:
#   url: jdbc:postgresql://db.your-project.supabase.co:5432/postgres
#   username: postgres
#   password: your-db-password

./mvnw spring-boot:run
```

Backend runs at http://localhost:8080

API docs (Swagger UI): http://localhost:8080/swagger-ui.html

### 4. Docker Compose (Full Stack)

```bash
# Copy and edit environment files first
cp frontend/.env.example frontend/.env.local
# Edit the .env files...

docker-compose up -d
```

## API Endpoints

| Method | Endpoint                     | Role Required | Description              |
|--------|------------------------------|---------------|--------------------------|
| POST   | /api/v1/auth/login           | Public        | Login with email/password|
| POST   | /api/v1/auth/logout          | Any           | Logout                   |
| GET    | /api/v1/menu/categories      | Any           | List categories          |
| POST   | /api/v1/menu/categories      | MANAGER+      | Create category          |
| GET    | /api/v1/menu/items           | Any           | List menu items          |
| POST   | /api/v1/menu/items           | MANAGER+      | Create menu item         |
| GET    | /api/v1/tables               | Any           | List tables              |
| POST   | /api/v1/orders               | STAFF+        | Create order             |
| GET    | /api/v1/orders/active        | STAFF+        | Get active orders        |
| POST   | /api/v1/orders/{id}/checkout | STAFF+        | Checkout order           |
| POST   | /api/v1/clock/in             | Any           | Clock in                 |
| POST   | /api/v1/clock/out            | Any           | Clock out                |
| GET    | /api/v1/reports/daily        | MANAGER+      | Daily report             |

## Default Credentials (Seed Data)

| Email                    | Password   | Role    |
|--------------------------|------------|---------|
| owner@restaurant.com     | password123| OWNER   |
| manager@restaurant.com   | password123| MANAGER |
| staff@restaurant.com     | password123| STAFF   |

> **Note:** Change these credentials immediately in production!

## Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Backend (application.yml)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://db.your-project.supabase.co:5432/postgres
    username: postgres
    password: your-password
jwt:
  secret: your-256-bit-secret
  expiration: 86400000  # 24 hours in ms
```

## Development Notes

- The kitchen display (`/pos/kitchen`) auto-refreshes every 10 seconds
- Table status updates are reflected in real-time via polling
- All monetary values are stored as integers (cents) in the database
- Timestamps use UTC; display timezone is configurable per store
- The frontend uses Zustand for local state and TanStack Query for server state

## License

MIT
