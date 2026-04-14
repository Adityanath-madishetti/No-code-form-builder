import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { type PublicFormData } from './runtimeForm.types';

import { type InstanceID, type PageID } from '@/form/components/base';

export interface ComponentRenderState {
  instanceId: InstanceID;
  isHidden: boolean;
  isEnabled: boolean;
}

interface PageRenderState {
  pageId: PageID;
  pageIndex: number;
  ComponentStates: Record<InstanceID, ComponentRenderState>;
  nextPageId: PageID | null;
}

interface FormRenderState {
  PageStates: Record<PageID, PageRenderState>;
  currentPageId: PageID | undefined;
}

export const runtimeFormSelector = {
  formData: (state: RuntimeFormStore) => state.formData,
  renderState: (state: RuntimeFormStore) => state.renderState,

  currentPageId: (state: RuntimeFormStore) => state.renderState?.currentPageId,

  currentPage: (state: RuntimeFormStore) => {
    const currentPageId = state.renderState?.currentPageId;
    if (!currentPageId || !state.formData) return undefined;
    return state.formData.version.pages.find(
      (page) => page.pageId === currentPageId
    );
  },

  currentPageComponentStates: (state: RuntimeFormStore) => {
    const currentPageId = state.renderState?.currentPageId;
    if (!currentPageId) return {};
    return state.renderState?.PageStates[currentPageId]?.ComponentStates || {};
  },

  currentPageComponentData: (state: RuntimeFormStore) => {
    const currentPageId = state.renderState?.currentPageId;
    if (!currentPageId || currentPageId === '') return [];
    const pageData = state.formData?.version.pages.find(
      (p) => p.pageId === currentPageId
    );
    return pageData?.components || [];
  },
};

interface RuntimeFormStore {
  formData: PublicFormData | undefined;
  renderState: FormRenderState | undefined;
  pageStack: PageID[];

  initRuntimeForm: (data: PublicFormData) => void;

  setComponentVisibility: (instanceId: InstanceID, isVisible: boolean) => void;
  setComponentEnabled: (instanceId: InstanceID, isEnabled: boolean) => void;

  setNextPageOfPage: (pageId: PageID, nextPageId: PageID | null) => void;
  setActivePage: (pageId: PageID) => void;

  pushPageStack: (pageId: PageID) => void;
  popPageStack: () => PageID | undefined;
}

export const useRuntimeFormStore = create<RuntimeFormStore>()(
  immer((set, get) => ({
    formData: undefined,
    renderState: undefined,

    pageStack: [],

    initRuntimeForm: (data) => {
      set((state) => {
        state.formData = data;
        state.pageStack = [];

        if (data.version.pages.length > 0) {
          const pageStates: Record<PageID, PageRenderState> = {};
          data.version.pages.forEach((page, index) => {
            const componentStates: Record<InstanceID, ComponentRenderState> =
              {};
            page.components.forEach((comp) => {
              componentStates[comp.componentId] = {
                instanceId: comp.componentId,
                isHidden: comp.props.hiddenByDefault as boolean,
                isEnabled: true, // TODO: derive from comp.props if needed
              };
            });

            pageStates[page.pageId] = {
              pageId: page.pageId,
              pageIndex: index,
              ComponentStates: componentStates,
              nextPageId:
                page.defaultNextPageId ??
                (index < data.version.pages.length - 1
                  ? data.version.pages[index + 1].pageId
                  : null),
            };
          });

          state.renderState = {
            PageStates: pageStates,
            currentPageId: data.version.pages[0]?.pageId,
          };
        }
      });
      console.log('initRuntimeForm Completed. Full Store State:', get());
    },

    setComponentVisibility: (instanceId, isVisible) =>
      set((state) => {
        if (!state.renderState) return;
        Object.values(state.renderState.PageStates).forEach((pageState) => {
          if (pageState.ComponentStates[instanceId]) {
            pageState.ComponentStates[instanceId].isHidden = !isVisible;
          }
        });
      }),

    setComponentEnabled: (instanceId, isEnabled) =>
      set((state) => {
        if (!state.renderState) return;
        Object.values(state.renderState.PageStates).forEach((pageState) => {
          if (pageState.ComponentStates[instanceId]) {
            pageState.ComponentStates[instanceId].isEnabled = isEnabled;
          }
        });
      }),

    setNextPageOfPage: (pageId, nextPageId) =>
      set((state) => {
        if (state.renderState?.PageStates[pageId]) {
          state.renderState.PageStates[pageId].nextPageId = nextPageId;
        }
      }),

    setActivePage: (pageId) =>
      set((state) => {
        if (state.renderState?.PageStates[pageId]) {
          state.renderState.currentPageId = pageId;
        }
      }),

    pushPageStack: (pageId: PageID) => {
      set((state) => {
        state.pageStack.push(pageId);
      });
    },

    popPageStack: () => {
      const currentStack = get().pageStack;

      if (currentStack.length === 0) {
        return undefined;
      }

      const pid = currentStack[currentStack.length - 1];

      set((state) => {
        state.pageStack.pop();
      });

      return pid;
    },
  }))
);
