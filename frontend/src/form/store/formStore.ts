// src/form/store/formStore.ts
/**
 * Form Store (Zustand + Immer)
 * ---------------------------------------------------------------------------------------------
 * Central state management for the form builder.
 *
 * Responsibilities:
 * - Manages **form schema state** (form, pages, components)
 * - Manages **UI state** (selection, active page, drag state, side panel)
 * - Provides actions for **mutating form structure**
 * - Serves as the single source of truth for the editor
 *
 * Architecture:
 * - Split into:
 *   1. Schema State (persistent, serializable)
 *   2. UI State (ephemeral, editor-only)
 * - Uses `zustand` for lightweight state management
 * - Uses `immer` for safe immutable updates with mutable syntax
 *
 * Key Concepts:
 * - `pages`: normalized map of PageID -> FormPage
 * - `components`: normalized map of InstanceID -> BaseFormComponent
 * - `form.pages`: ordered list (defines layout order)
 * - `page.children`: ordered list (defines component order per page)
 *
 * Design Notes:
 * - Normalized state -> avoids deep nesting & simplifies updates
 * - Order is maintained separately via arrays (pages, children)
 * - UI state is intentionally kept separate from schema state
 *
 * ---------------------------------------------------------------------------------------------
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  ComponentMetadata,
  Form,
  FormAccess,
  FormID,
  FormMetadata,
  FormPage,
  FormSettings,
  InstanceID,
  PageID,
  FormTheme,
} from '../components/base';
import type {
  AnyFormComponent,
} from '../registry/componentRegistry';

const createForm = (id: FormID, name: string, metadata?: Partial<FormMetadata>): Form => ({
  id,
  name,
  metadata: {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...metadata,
  },
  theme: null,
  access: {
    visibility: 'private',
    editors: [],
    reviewers: [],
    viewers: [],
  },
  settings: {
    submissionLimit: null,
    closeDate: null,
    collectEmailMode: 'none',
    submissionPolicy: 'none',
    canViewOwnSubmission: false,
    confirmationMessage: 'Thank you for your response!',
  },
  pages: [],
});

const createFormPage = (id: PageID): FormPage => ({
  id,
  children: [],
  isTerminal: false,
});

import type {
  DRAG_CATALOG_COMPONENT_TYPE,
  DRAG_CATALOG_PAGE_TYPE,
  DRAG_COMPONENT_TYPE,
  DRAG_PAGE_TYPE,
} from '../utils/DndUtils';
import { DEFAULT_FORM_THEME } from '../theme/formTheme';
// import {
//   TEMP_COMPONENT_PLACEHOLDER_ID,
//   TEMP_PAGE_PLACEHOLDER_ID,
// } from '@/form/utils/DndUtils';

/**
 * Represents drag data when dragging a component from the catalog.
 */
export interface CatalogComponentDragData {
  type: DRAG_CATALOG_COMPONENT_TYPE;
  entry: {
    id: string;
    create: (id: string) => AnyFormComponent;
  };
}

/**
 * Represents drag data when dragging a new page from catalog.
 */
export interface CatalogPageDragData {
  type: DRAG_CATALOG_PAGE_TYPE;
}

/**
 * Represents drag data when moving an existing component.
 */
export interface FormComponentDragData {
  type: DRAG_COMPONENT_TYPE;
  instanceId: InstanceID;
  pageId?: PageID;
}

/**
 * Represents drag data when reordering pages.
 */
export interface FormPageDragData {
  type: DRAG_PAGE_TYPE;
  pageId: PageID;
}

export type FormDragData =
  | CatalogComponentDragData
  | CatalogPageDragData
  | FormComponentDragData
  | FormPageDragData;

// ------------------------------------------------------------------------------------------------
//
// State
//
// ------------------------------------------------------------------------------------------------

/**
 * Core form data (persistable).
 *
 * This is what should be saved/loaded from backend.
 */
interface FormSchemaState {
  form: Form | null;
  currentVersion: number;
  pages: Record<PageID, FormPage>;
  components: Record<InstanceID, AnyFormComponent>;
}

/**
 * UI-specific state (NOT persisted).
 */
interface FormUIState {
  activeComponentId: InstanceID | null;
  activePageId: PageID | null;
  activeDragData: FormDragData | null;

  activeSidePanelTab: string;

  catalogRefreshKey: number;
}

// ------------------------------------------------------------------------------------------------
//
// Actions
//
// ------------------------------------------------------------------------------------------------

interface FormSchemaActions {
  initForm: (
    id: FormID,
    name: string,
    metadata?: Partial<FormMetadata>
  ) => void;
  loadForm: (
    form: Form,
    pages: FormPage[],
    components: AnyFormComponent[],
    version?: number
  ) => void;
  setCurrentVersion: (version: number) => void;
  updateFormName: (name: string) => void;
  updateFormMetadata: (metadata: Partial<FormMetadata>) => void;

  updateFormTheme: (theme: Partial<FormTheme>) => void;
  updateFormAccess: (access: Partial<FormAccess>) => void;
  updateFormSettings: (settings: Partial<FormSettings>) => void;

  addPage: (insertIndex?: number, customId?: PageID) => PageID;
  removePage: (pageId: PageID) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  updatePageTitle: (pageId: PageID, name: string) => void;
  updatePageDesc: (pageId: PageID, desc: string) => void;

  addComponent: (
    pageId: PageID,
    component: AnyFormComponent,
    index?: number
  ) => void;
  removeComponent: (instanceId: InstanceID) => void;
  moveComponent: (
    fromPageId: PageID,
    fromIndex: number,
    toPageId: PageID,
    toIndex: number
  ) => void;
  updateComponentProps: (instanceId: InstanceID, props: unknown) => void;
  updateComponentMetadata: (
    instanceId: InstanceID,
    metadata: Partial<ComponentMetadata>
  ) => void;

  updateComponentValidation: (
    instanceId: InstanceID,
    validation: unknown
  ) => void;

  duplicateComponent: (instanceId: InstanceID) => InstanceID | undefined;
}

interface FormUIActions {
  setActiveComponent: (instanceId: InstanceID | null) => void;
  setActivePage: (pageId: PageID | null) => void;
  setActiveDragData: (data: FormDragData | null) => void;

  setActiveSidePanelTab: (tab: string) => void;

  refreshCatalog: () => void;
}

export type FormStore = FormSchemaState &
  FormUIState &
  FormSchemaActions &
  FormUIActions;

// ------------------------------------------------------------------------------------------------
//
// Helpers
//
// ------------------------------------------------------------------------------------------------

/**
 * Ensures only the last page is marked as `isTerminal = true`.
 *
 * Called after any page ordering change.
 */
function syncTerminalFlags(state: {
  form: Form | null;
  pages: Record<PageID, FormPage>;
}) {
  if (!state.form) return;
  state.form.pages.forEach((id, i, arr) => {
    state.pages[id].isTerminal = i === arr.length - 1;
  });
}

// ------------------------------------------------------------------------------------------------
//
// Selectors
//
// ------------------------------------------------------------------------------------------------

/**
 * Predefined selectors for accessing store state efficiently.
 *
 * Helps avoid unnecessary re-renders when used with Zustand.
 */
export const formSelectors = {
  form: (s: FormStore) => s.form,
  formMetadata: (s: FormStore) => s.form?.metadata,
  formTheme: (s: FormStore) => s.form?.theme ?? null, // <-- Add this selector
  formAccess: (s: FormStore) => s.form?.access ?? null,
  formSettings: (s: FormStore) => s.form?.settings ?? null,
  pages: (s: FormStore) => s.pages,
  components: (s: FormStore) => s.components,
  activePage: (s: FormStore) =>
    s.activePageId ? (s.pages[s.activePageId] ?? null) : null,
  activeComponent: (s: FormStore) =>
    s.activeComponentId ? (s.components[s.activeComponentId] ?? null) : null,
  componentById: (instanceId: InstanceID) => (s: FormStore) =>
    s.components[instanceId] ?? null,
  pageById: (pageId: PageID) => (s: FormStore) => s.pages[pageId] ?? null,
};

// ------------------------------------------------------------------------------------------------
//
// Store
//
// ------------------------------------------------------------------------------------------------

export const useFormStore = create<FormStore>()(
  immer((set) => ({
    form: null,
    currentVersion: 1,
    pages: {},
    components: {},

    activeComponentId: null,
    activePageId: null,
    activeDragData: null,

    activeSidePanelTab: 'overview',
    catalogRefreshKey: 0,

    initForm: (id, name, metadata) =>
      set((state) => {
        const form = createForm(id, name, metadata);
        const firstPage = createFormPage(`${id}-page-1`);
        form.pages.push(firstPage.id);
        state.form = form;
        state.pages = { [firstPage.id]: firstPage };
        state.components = {};
        // state.activePageId = firstPage.id;
        state.activePageId = null;
        state.activeComponentId = null;
      }),

    loadForm: (form, pages, components, version) =>
      set((state) => {
        state.form = form;
        state.currentVersion = version ?? 1;
        state.pages = Object.fromEntries(pages.map((p) => [p.id, p]));
        state.components = Object.fromEntries(
          components.map((c) => [c.instanceId, c])
        );
        // state.activePageId = pages[0]?.id ?? null;
        state.activePageId = null;
        state.activeComponentId = null;
      }),

    setCurrentVersion: (version) =>
      set((state) => {
        state.currentVersion = version;
      }),

    updateFormName: (name) =>
      set((state) => {
        if (!state.form) return;
        state.form.name = name;
        state.form.metadata.updatedAt = new Date().toISOString();
      }),

    updateFormMetadata: (metadata: Partial<FormMetadata>) =>
      set((state) => {
        if (!state.form) return;
        Object.assign(state.form.metadata, metadata);
        state.form.metadata.updatedAt = new Date().toISOString();
      }),

    updateFormTheme: (themeUpdates: Partial<FormTheme>) =>
      set((state) => {
        if (!state.form) return;

        // If theme is currently null, initialize it with a default baseline
        if (!state.form.theme) {
          state.form.theme = DEFAULT_FORM_THEME;
        }

        // Apply the partial updates over the existing theme
        Object.assign(state.form.theme, themeUpdates);

        // Optionally bump the updatedAt timestamp
        state.form.metadata.updatedAt = new Date().toISOString();
      }),

    updateFormAccess: (accessUpdates: Partial<FormAccess>) =>
      set((state) => {
        if (!state.form) return;
        Object.assign(state.form.access, accessUpdates);
        state.form.metadata.updatedAt = new Date().toISOString();
      }),

    updateFormSettings: (settingsUpdates: Partial<FormSettings>) =>
      set((state) => {
        if (!state.form) return;
        Object.assign(state.form.settings, settingsUpdates);
        state.form.metadata.updatedAt = new Date().toISOString();
      }),

    addPage: (insertIndex, customId) => {
      const newPageId = customId || `page-${crypto.randomUUID()}`;
      set((state) => {
        if (!state.form) return;
        const page = createFormPage(newPageId);
        state.pages[newPageId] = page;

        // Insert exactly where the hover gap is
        if (insertIndex === undefined || insertIndex === -1) {
          state.form.pages.push(newPageId);
        } else {
          state.form.pages.splice(insertIndex, 0, newPageId);
        }
        syncTerminalFlags(state);
      });
      return newPageId;
    },

    removePage: (pageId) =>
      set((state) => {
        if (!state.form || state.form.pages.length <= 1) return;
        for (const instanceId of state.pages[pageId].children) {
          delete state.components[instanceId];
          if (state.activeComponentId === instanceId)
            state.activeComponentId = null;
        }
        delete state.pages[pageId];
        state.form.pages = state.form.pages.filter((id) => id !== pageId);
        syncTerminalFlags(state);
        if (state.activePageId === pageId) {
          // state.activePageId = state.form.pages[0] ?? null;
          state.activePageId = null;
        }
      }),

    reorderPages: (fromIndex, toIndex) =>
      set((state) => {
        if (!state.form) return;
        const [moved] = state.form.pages.splice(fromIndex, 1);
        state.form.pages.splice(toIndex, 0, moved);
        syncTerminalFlags(state);
      }),

    updatePageTitle: (pageId: PageID, name: string) =>
      set((state) => {
        if (!state.form || state.form.pages.length === 1) return;
        state.pages[pageId].title = name;
      }),

    updatePageDesc: (pageId: PageID, desc: string) =>
      set((state) => {
        if (!state.form || state.form.pages.length === 1) return;
        state.pages[pageId].description = desc;
      }),

    addComponent: (pageId, component, index) =>
      set((state) => {
        state.components[component.instanceId] = component;
        const children = state.pages[pageId]?.children;
        if (!children) return;
        if (index === undefined) {
          children.push(component.instanceId);
        } else {
          children.splice(index, 0, component.instanceId);
        }
      }),

    removeComponent: (instanceId) =>
      set((state) => {
        for (const page of Object.values(state.pages)) {
          page.children = page.children.filter((id) => id !== instanceId);
        }
        delete state.components[instanceId];
        if (state.activeComponentId === instanceId)
          state.activeComponentId = null;
      }),

    moveComponent: (fromPageId, fromIndex, toPageId, toIndex) =>
      set((state) => {
        const fromChildren = state.pages[fromPageId]?.children;
        const toChildren = state.pages[toPageId]?.children;
        if (!fromChildren || !toChildren) return;
        if (fromChildren[fromIndex] === undefined) return;

        const [moved] = fromChildren.splice(fromIndex, 1);

        const adjustedToIndex =
          fromPageId === toPageId && toIndex > fromIndex
            ? toIndex - 1
            : toIndex;

        toChildren.splice(adjustedToIndex, 0, moved);
      }),

    updateComponentProps: (instanceId, props) =>
      set((state) => {
        if (!state.components[instanceId]) return;

        // Merge the new props with the existing props
        Object.assign(
          state.components[instanceId].props as Record<string, unknown>,
          props as Record<string, unknown>
        );
      }),

    updateComponentMetadata: (instanceId, metadata) =>
      set((state) => {
        if (!state.components[instanceId]) return;
        Object.assign(state.components[instanceId].metadata, metadata);
      }),

    updateComponentValidation: (instanceId: InstanceID, validation: unknown) =>
      set((state) => {
        if (!state.components[instanceId]) return;
        Object.assign(
          state.components[instanceId].validation as Record<string, unknown>,
          validation as Record<string, unknown>
        );
      }),

    duplicateComponent: (instanceId) => {
      // 1. Declare the variable outside the set function's scope
      let newInstanceId: InstanceID | undefined;

      set((state) => {
        const originalComponent = state.components[instanceId];
        if (!originalComponent) return;

        // Find the page that contains this component and its exact index
        let targetPageId: PageID | null = null;
        let targetIndex = -1;

        for (const page of Object.values(state.pages)) {
          const index = page.children.indexOf(instanceId);
          if (index !== -1) {
            targetPageId = page.id;
            targetIndex = index;
            break;
          }
        }

        if (!targetPageId || targetIndex === -1) return;

        // Deep clone the component to ensure no nested object references are shared.
        const clonedComponent = JSON.parse(JSON.stringify(originalComponent));

        // 2. Assign the value to the outer variable
        newInstanceId = `${clonedComponent.type}-${crypto.randomUUID()}`;
        clonedComponent.instanceId = newInstanceId;

        // Register the new component in the state map
        state.components[newInstanceId] = clonedComponent;

        // Insert the new component's ID just below the duplicated one
        state.pages[targetPageId].children.splice(
          targetIndex + 1,
          0,
          newInstanceId
        );

        // Automatically select the newly duplicated component
        state.activeComponentId = newInstanceId;
      });

      // 3. Return the variable after the state mutation is complete
      return newInstanceId;
    },

    //==================
    setActiveComponent: (instanceId) =>
      set((state) => {
        console.groupCollapsed(
          `%c[Store] setActiveComponent`,
          'color: #d7c0ff; font-weight: bold;'
        );

        console.log('Prev:', {
          activeComponentId: state.activeComponentId,
          activePageId: state.activePageId,
        });

        console.log('Next:', {
          activeComponentId: instanceId,
        });

        state.activeComponentId = instanceId;

        console.log('Result:', {
          activeComponentId: state.activeComponentId,
        });

        console.groupEnd();
      }),

    setActivePage: (pageId) =>
      set((state) => {
        console.groupCollapsed(
          `%c[Store] setActivePage`,
          'color: #d7c0ff; font-weight: bold;'
        );

        console.log('Prev:', {
          activePageId: state.activePageId,
          activeComponentId: state.activeComponentId,
        });

        console.log('Next:', {
          activePageId: pageId,
        });

        state.activePageId = pageId;

        console.log('Result:', {
          activePageId: state.activePageId,
        });

        console.groupEnd();
      }),

    setActiveDragData: (data) => set({ activeDragData: data }),
    // setPendingCatalogItem: (item) => set({ pendingCatalogItem: item }),

    setActiveSidePanelTab: (tab) => set({ activeSidePanelTab: tab }),

    refreshCatalog: () =>
      set((state) => ({ catalogRefreshKey: state.catalogRefreshKey + 1 })),
  }))
);

