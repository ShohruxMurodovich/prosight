# prosight-locus-api

REST API for querying genomic locus data from RNAcentral public database.

Built with NestJS, TypeORM, PostgreSQL, JWT auth.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

API: `http://localhost:3000`  
Swagger: `http://localhost:3000/api/docs`

## Login

```
POST /auth/login
{ "username": "admin", "password": "admin123" }
```

Users:

| username | password    | role    |
|----------|-------------|---------|
| admin    | admin123    | admin   |
| normal   | normal123   | normal  |
| limited  | limited123  | limited |

## GET /locus

Requires `Authorization: Bearer <token>`.

Filters: `id`, `assemblyId`, `regionId`, `membershipStatus`  
Sideload: `include=locusMembers` (admin only)  
Pagination: `page`, `limit` (default/max 1000)  
Sort: `sortBy`, `sortOrder`

Role rules:
- **admin** — full access
- **normal** — no sideloading
- **limited** — only regionId `86118093 | 86696489 | 88186467`

## Tests

```bash
npm run test
npm run test:cov
```
