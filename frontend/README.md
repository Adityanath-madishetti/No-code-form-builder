# Frontend — Form Builder UI

React 19 SPA built with Vite, TypeScript, Tailwind CSS 4, Zustand, and dnd-kit.

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5000/api` |

## Project Structure

```
src/
├── App.tsx                    # Router + AuthProvider
├── main.tsx                   # Entry point
├── index.css                  # Tailwind + theme tokens
├── contexts/
│   └── AuthContext.tsx         # JWT auth state (login, logout, user)
├── lib/
│   ├── api.ts                 # Fetch wrapper with auth headers
│   ├── formApi.ts             # Backend ↔ Zustand serialization bridge
│   └── utils.ts               # cn() and helpers
├── form/
│   ├── components/            # Component definitions (Header, Input, Radio, etc.)
│   ├── registry/
│   │   └── componentRegistry.ts   # Catalog, renderers, prop editors
│   └── store/
│       ├── formStore.ts       # Zustand store (pages, components, selection)
│       └── formSerialization.ts
├── pages/
│   ├── Login/page.tsx         # Email-only login
│   ├── Home.tsx               # Dashboard (my forms + my submissions)
│   ├── FormEditor/
│   │   ├── FormEditor.tsx     # Main editor with DnD, toolbar, panels
│   │   └── components/        # Canvas, sidebar, properties, debug panels
│   └── FormFill/
│       ├── FormFill.tsx       # Public form filling + submit
│       ├── FormPreview.tsx    # Owner preview (read-only)
│       └── FormSuccess.tsx    # Submission confirmation
├── components/
│   └── ui/                    # shadcn/ui primitives (Button, Input, etc.)
└── styles/                    # Additional CSS
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/login` | `Login` | Email login / auto-registration |
| `/` | `Home` | Dashboard — my forms + submissions |
| `/form-builder/:formId` | `FormEditor` | Visual form editor |
| `/forms/:formId` | `FormFill` | Fill a published form |
| `/forms/:formId/preview` | `FormPreview` | Owner preview mode |
| `/forms/:formId/success` | `FormSuccess` | Post-submission confirmation |

## Key Libraries

| Library | Purpose |
|---------|---------|
| **Zustand** + **Immer** | Form state management with immutable updates |
| **dnd-kit** | Drag-and-drop for component catalog → canvas |
| **react-rnd** | Resizable panels in the editor |
| **Tiptap** | Rich text editing for the Header component |
| **shadcn/ui** + **Radix UI** | Accessible UI primitives |
| **Tailwind CSS 4** | Utility-first styling |
| **Lucide React** | Icon set |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npm run preview` | Preview production build locally |