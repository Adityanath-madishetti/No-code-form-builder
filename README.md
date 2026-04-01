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
