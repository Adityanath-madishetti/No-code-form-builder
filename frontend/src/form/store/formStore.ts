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
import { createForm, createFormPage } from '../components/base.factories';
import type {
  BaseFormComponent,
  ComponentMetadata,
  Form,
  FormID,
  FormMetadata,
  FormPage,
  InstanceID,
  PageID,
} from '../components/base';

/**
 * Represents drag data when dragging a component from the catalog.
 */
export interface CatalogComponentDragData {
  type: 'catalog-component';
  entry: {
    id: string;
    create: (id: string) => BaseFormComponent;
  };
}

/**
 * Represents drag data when dragging a new page from catalog.
 */
export interface CatalogPageDragData {
  type: 'catalog-page';
}

/**
 * Represents drag data when moving an existing component.
 */
export interface FormComponentDragData {
  type: 'component';
  instanceId: InstanceID;
  pageId?: PageID;
}

/**
 * Represents drag data when reordering pages.
 */
export interface FormPageDragData {
  type: 'page';
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
  pages: Record<PageID, FormPage>;
  components: Record<InstanceID, BaseFormComponent>;
}

/**
 * UI-specific state (NOT persisted).
 */
interface FormUIState {
  selectedInstanceId: InstanceID | null;
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
    components: BaseFormComponent[]
  ) => void;
  updateFormName: (name: string) => void;

  addPage: (insertIndex?: number, customId?: PageID) => PageID;
  removePage: (pageId: PageID) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;

  addComponent: (
    pageId: PageID,
    component: BaseFormComponent,
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
}

interface FormUIActions {
  selectComponent: (instanceId: InstanceID | null) => void;
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
  pages: (s: FormStore) => s.pages,
  components: (s: FormStore) => s.components,
  activePage: (s: FormStore) =>
    s.activePageId ? (s.pages[s.activePageId] ?? null) : null,
  selectedComponent: (s: FormStore) =>
    s.selectedInstanceId ? (s.components[s.selectedInstanceId] ?? null) : null,
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
    pages: {},
    components: {},

    selectedInstanceId: null,
    activePageId: null,
    activeDragData: null,

    activeSidePanelTab: 'properties',
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
        state.selectedInstanceId = null;
      }),

    loadForm: (form, pages, components) =>
      set((state) => {
        state.form = form;
        state.pages = Object.fromEntries(pages.map((p) => [p.id, p]));
        state.components = Object.fromEntries(
          components.map((c) => [c.instanceId, c])
        );
        // state.activePageId = pages[0]?.id ?? null;
        state.activePageId = null;
        state.selectedInstanceId = null;
      }),

    updateFormName: (name) =>
      set((state) => {
        if (!state.form) return;
        state.form.name = name;
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
          if (state.selectedInstanceId === instanceId)
            state.selectedInstanceId = null;
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
        if (state.selectedInstanceId === instanceId)
          state.selectedInstanceId = null;
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

    selectComponent: (instanceId) =>
      set((state) => {
        state.selectedInstanceId = instanceId;
      }),

    setActivePage: (pageId) =>
      set((state) => {
        state.activePageId = pageId;
      }),

    setActiveDragData: (data) => set({ activeDragData: data }),
    // setPendingCatalogItem: (item) => set({ pendingCatalogItem: item }),

    setActiveSidePanelTab: (tab) => set({ activeSidePanelTab: tab }),

    refreshCatalog: () =>
      set((state) => ({ catalogRefreshKey: state.catalogRefreshKey + 1 })),
  }))
);

// ------------------------------------------------------------------------------------------------
//
// Serialization Layer
//
// ------------------------------------------------------------------------------------------------

/**
 * Serializable representation of the form.
 * This is what gets stored / sent over network.
 */
export interface SerializedForm {
  form: Form;
  pages: FormPage[];
  components: BaseFormComponent[];
}

/**
 * Loads a serialized form into the store.
 *
 * - Deserializes components using registry
 * - Hydrates Zustand store
 */
import { deserializeComponent } from '../registry/componentRegistry';

export function loadFromJSON(json: SerializedForm) {
  const components = json.components.map(deserializeComponent);

  useFormStore.getState().loadForm(json.form, json.pages, components);
}

export function serializeForm(): SerializedForm {
  const state = useFormStore.getState();
  if (!state.form) throw new Error('No form loaded');

  return {
    form: state.form,
    pages: state.form.pages.map((id) => state.pages[id]),
    components: state.form.pages.flatMap((pageId) =>
      state.pages[pageId].children.map((id) => state.components[id])
    ),
  };
}

export function printFormJSON() {
  const serialized = serializeForm();
  console.log(JSON.stringify(serialized, null, 2));
}
