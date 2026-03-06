# ProSight Locus API

A NestJS + TypeScript REST API that exposes genomic locus data from the **RNAcentral** public PostgreSQL database.

## 🚀 Features

- **GET /locus** — Paginated, filterable, sortable locus endpoint
- **JWT Authentication** — 3 pre-defined role-based users
- **Role-Based Access Control** — admin, normal, limited
- **Sideloading** — Optionally include `locusMembers` (admin only)
- **Swagger / OpenAPI** — Auto-generated docs at `/api/docs`
- **TypeORM** — Entities with relations, no raw SQL

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| NestJS + TypeScript | Framework |
| TypeORM | ORM / query builder |
| PostgreSQL (RNAcentral) | External data source |
| Passport + JWT | Authentication |
| Swagger (`@nestjs/swagger`) | API documentation |
| Jest | Unit testing |

---

## ⚡ Quick Start

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd prosight
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your settings (defaults already point to RNAcentral)
```

### 4. Start the server

```bash
# Development
npm run start:dev

# Production
npm run build && npm run start:prod
```

### 5. Access

- **API Base**: `http://localhost:3000`
- **Swagger UI**: `http://localhost:3000/api/docs`

---

## 🔐 Authentication

Call `POST /auth/login` to get a JWT token:

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Pre-defined Users

| Username | Password   | Role    | Permissions |
|----------|------------|---------|-------------|
| admin    | admin123   | admin   | All columns + sideloading allowed |
| normal   | normal123  | normal  | `rnc_locus` columns only, no sideloading |
| limited  | limited123 | limited | Data restricted to regionId IN (86118093, 86696489, 88186467) |

Then use the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

---

## 📡 API Reference

### GET /locus

Query parameters:

| Parameter | Type | Description |
|---|---|---|
| `id` | `number[]` | Filter by locus IDs (enum, multi-value) |
| `assemblyId` | `string` | Filter by assembly ID (single value) |
| `regionId` | `number[]` | Filter by region IDs from rnc_locus_members (enum, multi-value) |
| `membershipStatus` | `string` | Filter by membership status |
| `include` | `locusMembers` | Sideload related members (admin only) |
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Rows per page (default: 1000, max: 1000) |
| `sortBy` | enum | `id`, `assemblyId`, `locusStart`, `locusStop`, `memberCount` |
| `sortOrder` | enum | `ASC` or `DESC` |

### Example without sideloading

```json
{
  "data": [
    {
      "id": 3106326,
      "assemblyId": "WEWSeq_v.1.0",
      "locusName": "cfc38...",
      "publicLocusName": "432B32430F9FCBB8",
      "chromosome": "4A",
      "strand": "1",
      "locusStart": 547925668,
      "locusStop": 547987324,
      "memberCount": 259
    }
  ],
  "total": 1000,
  "page": 1,
  "limit": 1000
}
```

### Example with sideloading (`include=locusMembers`, admin only)

```json
{
  "data": [
    {
      "id": 3106352,
      "assemblyId": "Rrox_v1",
      "locusName": "12b97...",
      "publicLocusName": "30CA93230012AFC9",
      "chromosome": "KN300177.1",
      "strand": "-1",
      "locusStart": 1081562,
      "locusStop": 1081689,
      "memberCount": 1,
      "locusMembers": [
        {
          "locusMemberId": 3106352,
          "regionId": 85682522,
          "locusId": 2470322,
          "membershipStatus": "member",
          "ursTaxid": "URS0000A888AB_61622"
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 1000
}
```

---

## 🧪 Tests

```bash
# Unit tests
npm run test

# Test with coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## 📁 Project Structure

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts      ← POST /auth/login
│   ├── auth.service.ts
│   ├── auth.service.spec.ts    ← Unit tests
│   ├── users.data.ts           ← Pre-defined users
│   ├── jwt.strategy.ts
│   └── jwt-auth.guard.ts
├── common/
│   ├── decorators/
│   │   └── roles.decorator.ts
│   └── guards/
│       └── roles.guard.ts
├── locus/
│   ├── locus.module.ts
│   ├── locus.controller.ts     ← GET /locus
│   ├── locus.service.ts
│   ├── locus.service.spec.ts   ← Unit tests
│   ├── dto/
│   │   └── locus-query.dto.ts
│   └── entities/
│       ├── rnc-locus.entity.ts
│       └── rnc-locus-member.entity.ts
├── app.module.ts
└── main.ts                     ← Swagger setup
```

---

## 🗄️ Database

Uses the **RNAcentral public PostgreSQL** database (read-only):

| Field | Value |
|---|---|
| Host | hh-pgsql-public.ebi.ac.uk |
| Port | 5432 |
| Database | pfmegrnargs |
| User | reader |

Tables used: `rnc_locus` (rl) left joined with `rnc_locus_members` (rlm)
