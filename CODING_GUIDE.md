# DISHA - MERN Stack Developer Handbook v1.0

[cite_start]This handbook defines the engineering standards for MERN Stack development across all repositories[cite: 9]. [cite_start]It covers the frontend HOST application, module frontends, and backend API services[cite: 9]. [cite_start]The goal is to ensure consistency, scalability, and MFE-readiness across teams[cite: 10].

## Architecture Overview

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend HOST** | [cite_start]React + TypeScript [cite: 13] | [cite_start]Shell application, shared UI [cite: 13] |
| **Module Frontend** | [cite_start]React + MFE [cite: 13] | [cite_start]Feature modules, micro-frontends [cite: 13] |
| **Backend API** | [cite_start]Node + Express [cite: 13] | [cite_start]Domain-driven REST API [cite: 13] |
| **Database** | [cite_start]MongoDB + Prisma [cite: 13] | [cite_start]Data persistence layer [cite: 13] |

## 1. Frontend HOST Folder Structure
[cite_start]The HOST application utilizes a feature-oriented, scalable structure designed to support Micro-Frontend (MFE) architectures[cite: 18]. [cite_start]Each directory has a clear responsibility and boundary[cite: 19].

* [cite_start]**`assets/`**: Contains all static resources used by the application[cite: 36]. [cite_start]No logic or cross-imports are allowed[cite: 36].
* [cite_start]**`config/`**: Holds global and environment-specific configuration[cite: 47]. [cite_start]This includes feature flags, federation setup, routing, and application constants[cite: 47].
* [cite_start]**`shared/`**: Houses reusable, presentational components and styling utilities[cite: 66]. [cite_start]This must remain free of business logic and API calls[cite: 66, 67].
* [cite_start]**`features/`**: The core business domain layer where each feature is self-contained[cite: 83]. [cite_start]Features are designed for easy extraction into standalone MFEs[cite: 84]. [cite_start]Internal implementation details stay private, exposing a clean public API via `index.ts`[cite: 104, 105].
* [cite_start]**`hooks/`**: Global reusable React hooks that are not tied to any specific feature[cite: 108]. [cite_start]These are consumed by more than one feature[cite: 109].
* [cite_start]**`layouts/`**: Reusable page layout wrappers that define the structural shell[cite: 116]. [cite_start]They should not contain business logic[cite: 116].
* [cite_start]**`pages/`**: Route-level components that act as glue[cite: 123]. [cite_start]They own routing context but contain no business logic or direct API calls[cite: 123, 131].
* [cite_start]**`services/`**: Global API infrastructure, such as the HTTP client and interceptors[cite: 137].
* [cite_start]**`styles/`**: Global styling configuration and app-wide tokens[cite: 144].
* [cite_start]**`stores/`**: Global state management stores[cite: 153].
* [cite_start]**`validators/`**: Global validation schemas used across multiple features[cite: 160].
* [cite_start]**`utils/`**: Pure helper functions with no side effects and no external dependencies[cite: 167].
* [cite_start]**`types/`**: Global TypeScript type contracts shared across the application[cite: 177].

## 2. Module Frontend Structure
[cite_start]The Module Frontend repository uses a high-level application partitioning layer[cite: 259]. [cite_start]It groups related pages and micro-frontends under logical modules[cite: 260].

* [cite_start]**`modules/`**: The primary partitioning layer representing a logical application domain[cite: 270]. [cite_start]Modules can contain multiple pages and one or more micro-frontends[cite: 271].
* [cite_start]**`pages/`**: Page components are scoped to their parent module and compose features, layouts, and shared components[cite: 294]. [cite_start]They must not have direct API calls, state ownership, or cross-module imports[cite: 303, 304, 305].
* [cite_start]**`microFrontends/`**: Each micro-frontend is an independently deployable runtime unit[cite: 308]. [cite_start]It communicates only via defined contracts and prohibits direct imports from sibling MFEs or parent modules[cite: 322, 323].

## 3. Backend API Structure
[cite_start]The backend follows a domain-driven design that aligns with the frontend's MFE architecture[cite: 330]. [cite_start]Each module maps to an application domain for clean separation and independent scaling[cite: 331].

* [cite_start]**`modules/`**: Each module corresponds to a business domain[cite: 344].
    * [cite_start]`*.controller.ts`: Handles HTTP requests/responses and delegates to the service[cite: 348].
    * [cite_start]`*.service.ts`: Contains business logic and orchestrates repository calls[cite: 348].
    * [cite_start]`*.repository.ts`: Handles database queries and abstracts Prisma/MongoDB[cite: 348].
    * [cite_start]`*.routes.ts`: Defines and exports the Express Router for the module[cite: 348].
    * [cite_start]`*.schema.ts`: Zod validation schemas for request validation[cite: 348].
    * [cite_start]`*.types.ts`: TypeScript interfaces and types for the module[cite: 348].
* [cite_start]**`shared/`**: Reusable backend logic for truly cross-cutting concerns[cite: 358].
* [cite_start]**`database/`**: Database configuration, Prisma schema, and migration files[cite: 368].
* [cite_start]**`middlewares/`**: Express middleware functions kept pure without business logic[cite: 378].
* [cite_start]**`routes/`**: Central route registration file that assembles all module routers[cite: 386].
* [cite_start]**`utils/`**: Pure backend utility functions with no side effects[cite: 397].
* [cite_start]**`server.ts`**: The application entry point responsible for bootstrapping Express, registering middleware, and starting the HTTP server[cite: 405].

## 4. Naming Conventions
[cite_start]Consistent naming ensures readability and easy navigation[cite: 187].

| Type | Convention | Example |
| :--- | :--- | :--- |
| [cite_start]**Folders** | kebab-case [cite: 189] | [cite_start]`user-profile/`, `auth-flow/` [cite: 189] |
| **tsx Files (React)** | [cite_start]PascalCase [cite: 189] | [cite_start]`UserProfile.tsx`, `AuthLayout.tsx` [cite: 189] |
| [cite_start]**ts Files (Non-React)** | camelCase [cite: 189] | [cite_start]`httpClient.ts`, `formatDate.ts` [cite: 189] |
| **Stores** | [cite_start]`<name>.store.ts` [cite: 189] | [cite_start]`auth.store.ts`, `cart.store.ts` [cite: 189] |
| **Validators** | [cite_start]`<name>.schema.ts` [cite: 189] | [cite_start]`email.schema.ts`, `user.schema.ts` [cite: 189] |
| **Hooks** | [cite_start]`use<Name>.ts` [cite: 189] | [cite_start]`useAuth.ts`, `useDebounce.ts` [cite: 189] |
| **Index files** | [cite_start]`index.ts` [cite: 189] | [cite_start]`features/User/index.ts` [cite: 189] |

## 5. Architecture Principles & Anti-patterns
* [cite_start]**Dependency Direction**: Dependencies must always flow in one direction: outward from the core domain, never inward from the UI[cite: 423].
* [cite_start]**Feature Encapsulation**: Features own their logic, UI, and data access[cite: 421]. [cite_start]Internal implementation details stay private via barrel exports (`index.ts`)[cite: 421].
* [cite_start]**Strict Isolation**: Modules never directly import from each other[cite: 421].
* **Anti-patterns to Avoid**:
    * [cite_start]Importing directly into a feature from another feature rather than using `index.ts`[cite: 465].
    * [cite_start]Adding API calls directly to page components[cite: 465].
    * [cite_start]Putting business logic inside `shared/components`[cite: 465].
    * [cite_start]Using a module folder name in PascalCase instead of kebab-case[cite: 466].
    * [cite_start]Skipping the `index.ts` in a feature, which breaks MFE extraction[cite: 467].
    * [cite_start]Writing database queries directly in controllers[cite: 467].
    * [cite_start]Making cross-module imports in the module frontend[cite: 467].
