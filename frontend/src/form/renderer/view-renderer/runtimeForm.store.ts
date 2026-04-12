import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { type PublicFormData } from './runtimeForm.types';

import { type InstanceID, type PageID } from '@/form/components/base';

interface ComponentRenderState {
  instanceId: InstanceID;
  isHidden: boolean;
  isEnabled: boolean;
}

interface PageRenderState {
  pageId: PageID;
  pageIndex: number;
  ComponentStates: Record<InstanceID, ComponentRenderState>;
  previousPageId: PageID | undefined;
  nextPageId: PageID | undefined;
}

interface FormRenderState {
  PageStates: Record<PageID, PageRenderState>;
  currentPageId: PageID | undefined;
}

export const runtimeFormSelector = {
  formData: (state: RuntimeFormStore) => state.formData,
  renderState: (state: RuntimeFormStore) => state.renderState,

  currentPageId: (state: RuntimeFormStore) => state.renderState?.currentPageId,
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

  initRuntimeForm: (data: PublicFormData) => void;

  setComponentVisibility: (instanceId: InstanceID, isVisible: boolean) => void;
  setComponentEnabled: (instanceId: InstanceID, isEnabled: boolean) => void;

  setNextPageOfPage: (pageId: PageID, nextPageId: PageID | undefined) => void;
  setPreviousPageOfPage: (
    pageId: PageID,
    previousPageId: PageID | undefined
  ) => void;
  setActivePage: (pageId: PageID) => void;
}

export const useRuntimeFormStore = create<RuntimeFormStore>()(
  immer((set, get) => ({
    formData: undefined,
    renderState: undefined,

    initRuntimeForm: (data) => {
      set((state) => {
        state.formData = data;
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

            // pageStates[page.pageId] = {
            //   pageId: page.pageId,
            //   pageIndex: index,
            //   ComponentStates: componentStates,
            //   previousPageId:
            //     index > 0 ? data.version.pages[index - 1].pageId : undefined,
            //   nextPageId:
            //     index < data.version.pages.length - 1
            //       ? data.version.pages[index + 1].pageId
            //       : undefined,
            //   // Map directly from the static schema values injected by the builder
            //   // previousPageId: page.defaultPreviousPageId,
            //   // nextPageId: page.defaultNextPageId,
            // };
            // pageStates[page.pageId] = {
            //   pageId: page.pageId,
            //   pageIndex: index,
            //   ComponentStates: componentStates,
            //   // previousPageId:
            //   //   index > 0 ? data.version.pages[index - 1].pageId : undefined,
            //   // nextPageId:
            //   //   index < data.version.pages.length - 1
            //   //     ? data.version.pages[index + 1].pageId
            //   //     : undefined,
            //   // Map directly from the static schema values injected by the builder
            //   previousPageId: page.defaultPreviousPageId ? page.defaultPreviousPageId: pageStates[page.pageId].previousPageId,
            //   nextPageId: page.defaultNextPageId?page.defaultNextPageId : pageStates[page.pageId].nextPageId,
            // };

            pageStates[page.pageId] = {
              pageId: page.pageId,
              pageIndex: index,
              ComponentStates: componentStates,
              previousPageId:
                page.defaultPreviousPageId ??
                (index > 0 ? data.version.pages[index - 1].pageId : undefined),
              nextPageId:
                page.defaultNextPageId ??
                (index < data.version.pages.length - 1
                  ? data.version.pages[index + 1].pageId
                  : undefined),
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

    setPreviousPageOfPage: (pageId, previousPageId) =>
      set((state) => {
        if (state.renderState?.PageStates[pageId]) {
          state.renderState.PageStates[pageId].previousPageId = previousPageId;
        }
      }),

    setActivePage: (pageId) =>
      set((state) => {
        if (state.renderState?.PageStates[pageId]) {
          state.renderState.currentPageId = pageId;
        }
      }),
  }))
);

// interface FormRuntimeState {
//   // State
//   formData: RuntimeFormData | null;
//   evaluation: RuntimeEvaluation;

//   // Actions
//   initForm: (data: RuntimeFormData) => void;
//   setValue: (componentId: string, value: unknown) => void;
//   setValues: (values: Record<string, unknown>) => void;
//   setValidationError: (componentId: string, error: string | null) => void;
//   clearValidationErrors: () => void;
//   updateEvaluation: (evalData: Partial<RuntimeEvaluation>) => void;
//   resetForm: () => void;
// }

// // --- Initial State ---

// const initialEvaluationState: RuntimeEvaluation = {
//   values: {},
//   visibility: {},
//   enabled: {},
//   validationErrors: {},
//   nextPageId: null,
// };

// // --- Store Implementation ---

// export const useFormRuntimeStore = create<FormRuntimeState>()(
//   immer((set) => ({
//     // Initial State
//     formData: null,
//     evaluation: { ...initialEvaluationState },

//     // Actions
//     initForm: (data) =>
//       set((state) => {
//         state.formData = data;
//         // Optionally reset evaluation when a new form is loaded
//         state.evaluation = { ...initialEvaluationState };
//       }),

//     setValue: (componentId, value) =>
//       set((state) => {
//         state.evaluation.values[componentId] = value;
//         // Automatically clear validation error when a user types/changes a value
//         if (state.evaluation.validationErrors[componentId]) {
//           delete state.evaluation.validationErrors[componentId];
//         }
//       }),

//     setValues: (values) =>
//       set((state) => {
//         // Merge new values into existing values
//         state.evaluation.values = {
//           ...state.evaluation.values,
//           ...values,
//         };
//       }),

//     setValidationError: (componentId, error) =>
//       set((state) => {
//         if (error === null) {
//           delete state.evaluation.validationErrors[componentId];
//         } else {
//           state.evaluation.validationErrors[componentId] = error;
//         }
//       }),

//     clearValidationErrors: () =>
//       set((state) => {
//         state.evaluation.validationErrors = {};
//       }),

//     updateEvaluation: (evalData) =>
//       set((state) => {
//         // Deep merge the incoming evaluation data using Immer's draft mutation
//         if (evalData.values)
//           Object.assign(state.evaluation.values, evalData.values);
//         if (evalData.visibility)
//           Object.assign(state.evaluation.visibility, evalData.visibility);
//         if (evalData.enabled)
//           Object.assign(state.evaluation.enabled, evalData.enabled);
//         if (evalData.validationErrors)
//           Object.assign(
//             state.evaluation.validationErrors,
//             evalData.validationErrors
//           );

//         if (evalData.nextPageId !== undefined) {
//           state.evaluation.nextPageId = evalData.nextPageId;
//         }
//       }),

//     resetForm: () =>
//       set((state) => {
//         state.evaluation = { ...initialEvaluationState };
//       }),
//   }))
// );
