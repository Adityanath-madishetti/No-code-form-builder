# Frontend Refactoring Plan (DISHA Compliance)

This plan outlines the steps required to align the `frontend` repository with the **DISHA - MERN Stack Developer Handbook | v1.0** standards.

## 01 Structural Alignment (`src/` Root)

The current structure has several deviations from the feature-oriented, scalable architecture defined in DISHA.

### [NEW] `src/shared/`
- **Action**: Create `src/shared/components/`, `src/shared/hooks/`, and `src/shared/styles/`.
- **Target**: Move general-purpose UI components from `src/components/ui` and `src/components/*.tsx` (e.g., `Button`, `Input`, `ColorPicker`) to `src/shared/components/`.
- **Rules**: Shared components must be "dumb" (presentational) and must not import from `features/` or `pages/`.

### [MOVE] `src/form/` → `src/features/form/`
- **Action**: Move the entire `form/` directory to `src/features/form/`.
- **Barrel Export**: Create `src/features/form/index.ts` to expose only public components (e.g., `FormBuilder`, `FormRenderer`), hooks, and types.
- **Internal Refactor**: Reorganize internal folders to match:
  - `components/`, `hooks/`, `services/`, `validators/`, `types/`, `stores/`.

### [MOVE] `src/components/layout/` → `src/layouts/`
- **Action**: Move layout-specific components (e.g., `DashboardLayout`, `AuthLayout`) to `src/layouts/`.
- **Note**: Ensure these components don't contain business logic.

### [MOVE] `src/lib/` → `src/services/` & `src/utils/`
- **Action**:
  - Move `api.ts`, `firebase.ts`, `formApi.ts`, `groupApi.ts`, `themeApi.ts` to `src/services/`.
  - Move `utils.ts` to `src/utils/`.
  - Move `frontendBackendCompArray.ts` to `src/services/` or `src/utils/` depending on its usage.

### [REORGANIZE] `src/routes/` → `src/config/`
- **Action**: Consolidate route definitions into `src/config/routes.ts` or a `src/config/routes/` directory.

---

## 02 Naming Convention Alignment

### [RENAME] Folder Names (kebab-case)
All directories must use kebab-case. The following in `src/pages/` and elsewhere need renaming:
- `src/pages/Dashboard/` → `src/pages/dashboard/`
- `src/pages/FormEditor/` → `src/pages/form-editor/`
- `src/pages/FormFill/` → `src/pages/form-fill/`
- `src/pages/FormReview/` → `src/pages/form-review/`
- `src/pages/Login/` → `src/pages/login/`
- `src/form/ai` etc. (once moved to `features/form`, keep kebab-case).

### [RENAME] Hook Files (camelCase)
- `src/hooks/use-mobile.ts` → `src/hooks/useMobile.ts`

### [RENAME] Store Files (`.store.ts`)
- Ensure all state stores use the `<name>.store.ts` suffix.

---

## 03 Module Frontend (MFE) Alignment

### [MOVE] `src/microfrontend/` → `src/modules/`
According to Section 04, the partitioning layer should be `modules/`.
- **Action**: Create `src/modules/submissions/microFrontends/submission-viewer/`.
- **Move**: Move `SubmissionViewModule.tsx` and `EmbedSubmissionView.tsx` to this new MFE boundary.

---

## 04 Assets Reorganization

### [NEW] `src/assets/` Subfolders
- **Action**: Organize `src/assets/` into `images/`, `icons/`, and `fonts/`.
- **Target**: Move existing SVGs and images into appropriate subfolders.

---

## 05 Implementation Roadmap

1.  **Phase 1: Foundation**
    - [ ] Create `src/shared/`, `src/features/`, `src/modules/`, `src/layouts/`.
    - [ ] Reorganize `src/assets/`.
2.  **Phase 2: Shared & Layouts**
    - [ ] Move `src/components/ui/` to `src/shared/components/`.
    - [ ] Move `src/components/layout/` to `src/layouts/`.
    - [ ] Fix all imports.
3.  **Phase 3: Global Services**
    - [ ] Move `src/lib/` to `src/services/` and `src/utils/`.
    - [ ] Fix all imports.
4.  **Phase 4: Feature Encapsulation**
    - [ ] Move `src/form/` to `src/features/form/`.
    - [ ] Add `src/features/form/index.ts` barrel export.
    - [ ] Update page imports to use the feature barrel.
5.  **Phase 5: Naming & Routes**
    - [ ] Rename PascalCase/kebab-case folders to strict kebab-case.
    - [ ] Migrate `src/routes/` to `src/config/`.

---

## 06 Verification Plan

- **Automated**:
  - `npm run build`: Verify no broken imports or type errors.
  - `npm run lint`: Verify no naming convention warnings.
- **Manual**:
  - Verify Form Editor functionality.
  - Verify Form Filling and Submission.
  - Verify Submission Review and Analytics.
  - Verify Authentication flows.
