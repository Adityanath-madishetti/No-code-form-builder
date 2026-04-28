# No-Code Form Builder & Workflow

A full-stack no-code form builder that lets users create, publish, and collect responses on dynamic forms — all through a visual drag-and-drop interface.

## Architecture

```
├── backend/     # Express + MongoDB REST API
├── frontend/    # React + Vite SPA
└── docs/        # Design documents
```

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **MongoDB** (local or Atlas)

### 1. Backend

```bash
cd backend
cp .env.example .env   # Set MONGO_URI, JWT_SECRET
npm install
npm run dev             # → http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local   # Set VITE_API_BASE_URL
npm install
npm run dev             # → http://localhost:5173
```

## Fluxoris Partner Integration

This repo is integrated with `ai-workflow-copilot` (Fluxoris) for:
1. Exchanging partner user identity for a Fluxoris JWT
2. Publishing form schema to Fluxoris
3. Connecting an approved template + publishing workflow from partner UI
4. Posting run-status events back to partner backend

### What Changed In This Repo

1. Dockerized local stack with isolated ports and Mongo
   - `docker-compose.yml` at repo root
   - Frontend: `http://localhost:5175`
   - Backend: `http://localhost:5002`
   - Mongo: `localhost:27018` (separate from Fluxoris stack)

2. Partner backend bridge endpoints
   - `POST /api/partner/fluxoris/exchange-token`
   - `POST /api/partner/fluxoris/events`
   - `GET /api/partner/fluxoris/events`
   - See backend details in `backend/README.md`

3. Fluxoris integration UI in frontend
   - Page: `src/pages/FluxorisMfeDryRunPage.tsx`
   - Route: `/integrations/fluxoris-mfe-dry-run`
   - Uses package `@fluxoris/partner-mfe` for:
     - Template picker
     - Schema publish
     - Template workflow builder
     - Publish-and-connect flow

4. Form schema auto-derivation + readable keys
   - Auto-loads from `/api/forms/{formId}/versions/latest`
   - Builds readable schema keys (example: `your_name`)
   - Stores source-to-readable mapping (`instance-* -> readable_key`)
   - Mapping is sent during schema publish so webhook payload can be remapped before Fluxoris validation/execution

5. Strict schema constraints for Fluxoris path
   - Integration enforces top-level:
     - `type: "object"`
     - `additionalProperties: false`
     - `required` coverage alignment with `properties`

### Current Integration Mode

Use package mode (recommended):
1. `@fluxoris/partner-mfe` is installed from `frontend/vendor/*.tgz`
2. Do not mix package mode and remote-federation mode at the same time

### Updating The Partner MFE Package (Versioned Flow)

When Fluxoris package changes:

1. Build and pack in Fluxoris repo
```bash
cd ../ai-workflow-copilot/packages/fluxoris-partner-mfe
npm version patch --no-git-tag-version
npm pack --cache /tmp/npm-cache-local
```

2. Copy tarball into this repo
```bash
cp fluxoris-partner-mfe-x.y.z.tgz ../No-Code-Form-Builder-And-Workflow/frontend/vendor/
```

3. Point dependency to new version
```bash
cd ../No-Code-Form-Builder-And-Workflow/frontend
npm pkg set dependencies.@fluxoris/partner-mfe='file:./vendor/fluxoris-partner-mfe-x.y.z.tgz'
```

4. Refresh lockfile
```bash
npm install --legacy-peer-deps --cache /tmp/npm-cache-local
```

5. Rebuild frontend container
```bash
cd ..
docker compose build --no-cache frontend
docker compose up -d frontend
```

### Local Run Checklist

1. Start partner stack:
```bash
docker compose up --build -d
```

2. Seed demo data:
```bash
docker compose exec backend npm run seed:demo
```

3. Ensure Fluxoris backend/frontend are running (`:8000` and `:5173` by your setup)

4. Open partner UI:
   - `http://localhost:5175`
   - Go to integration page
   - Exchange token
   - Publish schema
   - Connect template/workflow

## Features

| Feature | Status |
|---------|--------|
| Email-only authentication (JWT) | ✅ |
| Drag-and-drop form editor | ✅ |
| Component catalog (Header, Input, Radio, Checkbox, Dropdown) | ✅ |
| Form versioning (save creates a new version) | ✅ |
| Publish & share forms | ✅ |
| Form filling & submission | ✅ |
| Submission tracking on dashboard | ✅ |
| Form preview mode | ✅ |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Zustand, dnd-kit, Tiptap |
| Backend | Express 5, Mongoose 9, JWT |
| Database | MongoDB |
| UI Components | shadcn/ui, Radix UI, Lucide Icons |

## License

MIT
