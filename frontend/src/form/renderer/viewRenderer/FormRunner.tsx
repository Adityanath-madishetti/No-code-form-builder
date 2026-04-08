// src/form/renderer/viewRenderer/FormRunner.tsx

import { useEffect, useRef } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import {
  runtimeFormSelector,
  useRuntimeFormStore,
} from './runtimeForm.store';
import { useShallow } from 'zustand/react/shallow';
import { backendToFrontend } from '@/lib/frontendBackendCompArray';
import { getComponentRenderer } from '@/form/registry/componentRegistry';
import type { ComponentID } from '@/form/components/base';
import { FormLogicEngine } from '@/form/logic/formLogicEngine';
import { Button } from '@/components/ui/button';

let globalGetValues: ((instanceId: string) => unknown) | null = null;

// eslint-disable-next-line react-refresh/only-export-components
export const getGlobalFieldValue = (instanceId: string): unknown => {
  if (!globalGetValues) {
    console.warn(
      `FormRunner is not mounted. Cannot read value for: ${instanceId}`
    );
    return undefined;
  }
  return globalGetValues(instanceId);
};

export function FormRunner() {
  const methods = useForm<Record<string, unknown>>({
    shouldUnregister: false,
    defaultValues: {},
  });

  const formData = useRuntimeFormStore((state) => state.formData);

  const logicEngineRef = useRef<FormLogicEngine | null>(null);

  const componentsData = useRuntimeFormStore(
    useShallow(runtimeFormSelector.currentPageComponentData)
  );

  const componentsStates = useRuntimeFormStore(
    useShallow(runtimeFormSelector.currentPageComponentStates)
  );

  // Grab the necessary state and actions to handle pagination
  const currentPageId = useRuntimeFormStore(runtimeFormSelector.currentPageId);
  const renderState = useRuntimeFormStore(runtimeFormSelector.renderState);
  const setActivePage = useRuntimeFormStore((s) => s.setActivePage);

  useEffect(() => {
    const rules = formData?.version.logic?.rules || [];
    const formulas = formData?.version.logic?.formulas || [];
    if (rules?.length > 0 || formulas?.length > 0) {
      logicEngineRef.current = new FormLogicEngine(rules, formulas);
      triggerLogicEvaluation(methods.getValues());
    }
  }, [formData, methods]);

  const triggerLogicEvaluation = async (
    currentValues: Record<string, unknown>
  ) => {
    if (!logicEngineRef.current) return;

    const { actions, computedValues } =
      await logicEngineRef.current.evaluate(currentValues);

    const store = useRuntimeFormStore.getState();

    actions.forEach((action) => {
      switch (action.type) {
        case 'SHOW':
          store.setComponentVisibility(action.targetId, true);
          break;
        case 'HIDE':
          store.setComponentVisibility(action.targetId, false);
          break;
        case 'ENABLE':
          store.setComponentEnabled(action.targetId, true);
          break;
        case 'DISABLE':
          store.setComponentEnabled(action.targetId, false);
          break;
        case 'SKIP_PAGE':
          // store.addSkippedPage(action.targetId);
          break;
      }
    });

    // Apply computed formula values directly to React Hook Form
    Object.entries(computedValues).forEach(([targetId, computedValue]) => {
      // PREVENT INFINITE LOOPS: Only set the value if it actually changed
      if (currentValues[targetId] !== computedValue) {
        console.log(`Setting computed value for ${targetId}:`, computedValue);
        methods.setValue(targetId, computedValue, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = methods.watch((value) => {
      console.log('Form values changed:', value);
      triggerLogicEvaluation(value as Record<string, unknown>);
    });

    return () => subscription.unsubscribe();
  }, [methods, methods.watch]);

  useEffect(() => {
    globalGetValues = methods.getValues;
    return () => {
      globalGetValues = null;
    };
  }, [methods.getValues]);

  const onSubmit = (data: unknown) => {
    console.log('Valid Form Data:', data);
  };

  const currentPageState =
    currentPageId && renderState ? renderState.PageStates[currentPageId] : null;

  const hasPrevious = !!currentPageState?.previousPageId;
  const hasNext = !!currentPageState?.nextPageId;

  const handleNext = async () => {
    const currentInstanceIds = componentsData.map((comp) => comp.componentId);
    const isPageValid = await methods.trigger(currentInstanceIds);
    if (!isPageValid) {
      console.log('Validation failed. Staying on current page.');
      return;
    }

    if (currentPageState?.nextPageId) {
      setActivePage(currentPageState.nextPageId);
    }
  };

  const handleBack = () => {
    if (currentPageState?.previousPageId) {
      setActivePage(currentPageState.previousPageId);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        {/* Render the components for the active page */}
        <div className="space-y-4">
          {componentsData.length === 0 ? (
            <p className="text-gray-500">
              No components to display on this page.
            </p>
          ) : (
            componentsData.map((comp) => {
              const frontendId = backendToFrontend[comp.componentType];
              const Renderer = getComponentRenderer(frontendId as ComponentID);

              const isHidden =
                componentsStates[comp.componentId]?.isHidden ?? false;
              if (isHidden) {
                return null;
              }

              if (!Renderer) {
                return (
                  <div
                    key={comp.componentId}
                    className="border bg-red-50 p-4 text-red-500"
                  >
                    Unknown component type: {comp.componentType}
                  </div>
                );
              }

              return (
                <div
                  key={comp.componentId}
                  className="rounded-md border bg-gray-50 p-4 shadow-sm"
                >
                  <p className="text-sm font-medium text-gray-700">
                    Label: <span className="font-bold">{comp.label}</span>
                  </p>
                  <p className="mb-4 text-xs text-gray-500">
                    Instance ID: {comp.componentId} | Type: {comp.componentType}
                  </p>
                  <Renderer
                    key={comp.componentId}
                    metadata={null}
                    props={comp.props}
                    validation={comp.validation}
                    instanceId={comp.componentId}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* --- Pagination Controls --- */}
        <div className="mt-8 flex items-center justify-between border-t pt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={handleBack}
            disabled={!hasPrevious}
          >
            Back
          </Button>

          {hasNext ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Next
            </Button>
          ) : (
            <Button
              type="submit"
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Submit
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

/**
 *  
// src/logic/ast-evaluator.ts
import { getGlobalFieldValue } from '@/form/renderer/viewRenderer/RenderForm';

export function evaluateCondition(targetId: string, expectedValue: string) {
  // Grab the value directly from the active RHF instance
  const currentValue = getGlobalFieldValue(targetId);
  
  return currentValue === expectedValue;
}
 */
