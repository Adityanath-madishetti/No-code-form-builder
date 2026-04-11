// src/form/renderer/viewRenderer/FormRunner.tsx

import { useEffect, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { runtimeFormSelector, useRuntimeFormStore } from './runtimeForm.store';
import { useShallow } from 'zustand/react/shallow';
import { backendToFrontend } from '@/lib/frontendBackendCompArray';
import { getComponentRenderer } from '@/form/registry/componentRegistry.helpers';
import type { ComponentID } from '@/form/components/base';
import { FormLogicEngine } from '@/form/logic/formLogicEngine';
import { Button } from '@/components/ui/button';

import type { PublicFormData } from '@/form/renderer/viewRenderer/runtimeForm.types';
import { api } from '@/lib/api';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { sharedProseClasses } from '@/components/RichTextEditor';

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
  const { formId } = useParams<{ formId: string }>();
  const [globalFormError, setGlobalFormError] = useState('');
  const [globalFormLoading, setGlobalFormLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userEmail, setUserEmail] = useState('');

  const { initRuntimeForm } = useRuntimeFormStore();

  useEffect(() => {
    if (!formId) return;
    api
      .get<PublicFormData>(`/api/forms/${formId}/public`)
      .then((res) => {
        console.log('shitres', res);
        initRuntimeForm(res);
        if (user?.email) setUserEmail(user.email);
      })
      .catch((err) => setGlobalFormError(err.message || 'Form not found'))
      .finally(() => setGlobalFormLoading(false));
  }, [formId, initRuntimeForm, user?.email]);

  const methods = useForm<Record<string, unknown>>({
    shouldUnregister: false,
    defaultValues: {},
  });

  const formData = useRuntimeFormStore((state) => state.formData);

  const logicEngineRef = useRef<FormLogicEngine | null>(null);

  // --- CIRCUIT BREAKER REF ---
  const cascadeCount = useRef(0);
  const cascadeResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const componentsData = useRuntimeFormStore(
    useShallow(runtimeFormSelector.currentPageComponentData)
  );

  const componentsStates = useRuntimeFormStore(
    useShallow(runtimeFormSelector.currentPageComponentStates)
  );

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
  });

  const triggerLogicEvaluation = async (
    currentValues: Record<string, unknown>
  ) => {
    if (!logicEngineRef.current) return;

    // --- 1. CIRCUIT BREAKER CHECK ---
    if (cascadeCount.current > 10) {
      console.error(
        'Logic Circuit Breaker Tripped! Infinite loop detected and aborted.'
      );
      return;
    }

    cascadeCount.current++;
    if (cascadeResetTimer.current) clearTimeout(cascadeResetTimer.current);
    cascadeResetTimer.current = setTimeout(() => {
      cascadeCount.current = 0; // Reset after things settle down
    }, 100);
    // --------------------------------

    const { actions, computedValues } =
      await logicEngineRef.current.evaluate(currentValues);

    // --- 2. ACTION DEDUPLICATION (The "Partial Ordering") ---
    const visibilityPatch: Record<string, boolean> = {};
    const enabledPatch: Record<string, boolean> = {};
    const valuePatch: Record<string, unknown> = {};
    // Separate SKIP actions to be processed based on their origin page
    const skipActions = actions.filter((a) => a.type === 'SKIP_PAGE');

    actions.forEach((action) => {
      // If multiple rules target the same component, the last one evaluated wins.
      switch (action.type) {
        case 'SHOW':
          visibilityPatch[action.targetId] = true;
          break;
        case 'HIDE':
          visibilityPatch[action.targetId] = false;
          break;
        case 'ENABLE':
          enabledPatch[action.targetId] = true;
          break;
        case 'DISABLE':
          enabledPatch[action.targetId] = false;
          break;
        case 'SET_VALUE':
          valuePatch[action.targetId] = action.value;
          break;
        // case 'SKIP_PAGE': handled separately
      }
    });

    // Formulas take precedence over standard SET_VALUE actions
    Object.entries(computedValues).forEach(([targetId, computedValue]) => {
      valuePatch[targetId] = computedValue;
    });

    // --- 3. APPLY PATCHES CLEANLY ---
    const store = useRuntimeFormStore.getState();

    Object.entries(visibilityPatch).forEach(([targetId, isVisible]) => {
      store.setComponentVisibility(targetId, isVisible);
    });

    Object.entries(enabledPatch).forEach(([targetId, isEnabled]) => {
      store.setComponentEnabled(targetId, isEnabled);
    });

    // Apply values to React Hook Form (Strictly checking to prevent trigger loops)
    Object.entries(valuePatch).forEach(([targetId, newValue]) => {
      if (currentValues[targetId] !== newValue) {
        methods.setValue(targetId, newValue, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    });

    if (formData) {
      const pages = formData.version.pages;

      // Step A: Reset all pages to their default sequential routing.
      // This automatically "reverts" navigation if a skip condition is no longer met.
      pages.forEach((page, index) => {
        const prevId = index > 0 ? pages[index - 1].pageId : undefined;
        const nextId = index < pages.length - 1 ? pages[index + 1].pageId : undefined;
        store.setPreviousPageOfPage(page.pageId, prevId);
        store.setNextPageOfPage(page.pageId, nextId);
      });

      // Helper to recursively find the first instanceId in a logic condition tree
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const findInstanceId = (cond: any): string | null => {
        if (cond?.type === 'leaf') return cond.instanceId;
        if (cond?.type === 'group' && Array.isArray(cond.conditions)) {
          for (const c of cond.conditions) {
            const id = findInstanceId(c);
            if (id) return id;
          }
        }
        return null;
      };

      // Helper to find if an action ID exists inside nested logic arrays
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actionExistsInTree = (actionsTree: any[], actionId: string): boolean => {
        if (!actionsTree) return false;
        for (const a of actionsTree) {
          if (a.id === actionId) return true;
          if (a.type === 'CONDITIONAL') {
            if (actionExistsInTree(a.thenActions, actionId)) return true;
            if (actionExistsInTree(a.elseActions, actionId)) return true;
          }
        }
        return false;
      };

      // Step B: Apply active skips dynamically to their specific origin pages
      skipActions.forEach((action) => {
        // 1. Find the rule that generated this action
        const rule = formData.version.logic?.rules?.find(
          (r) =>
            actionExistsInTree(r.thenActions, action.id) ||
            actionExistsInTree(r.elseActions, action.id)
        );

        if (rule) {
          // 2. Extract the instanceId that triggers the rule
          const instanceId = findInstanceId(rule.condition);
          if (instanceId) {
            // 3. Find the page that contains that component
            const sourcePage = pages.find((p) =>
              p.components.some((c) => c.componentId === instanceId)
            );

            // 4. Overwrite pointers for the origin page specifically
            if (sourcePage) {
              store.setNextPageOfPage(sourcePage.pageId, action.targetId);
              store.setPreviousPageOfPage(action.targetId, sourcePage.pageId);
            }
          }
        }
      });
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = methods.watch((value) => {
      triggerLogicEvaluation(value as Record<string, unknown>);
    });
    return () => subscription.unsubscribe();
  });

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

  if (globalFormLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="animate-pulse text-sm font-medium text-muted-foreground">
          Loading form...
        </p>
      </div>
    );
  }

  // TODO: add auth requirement part
  // if (globalFormError && !formData) {
  //   const requiresLogin = /authentication required/i.test(globalFormError);
  //   return (
  //     <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
  //       <p className="text-sm text-destructive">
  //         {globalFormError || 'Form not found'}
  //       </p>
  //       {requiresLogin ? (
  //         <Button asChild>
  //           <Link to="/login">
  //             <LogIn className="mr-1.5 h-4 w-4" />
  //             Log In
  //           </Link>
  //         </Button>
  //       ) : (
  //         <Button variant="outline" size="sm" onClick={() => navigate('/')}>
  //           Back
  //         </Button>
  //       )}
  //     </div>
  //   );
  // }

  if (globalFormError || !formData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-5 w-5 text-destructive" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            Error loading form
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {globalFormError ||
              'We could not find the form you are looking for.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <div className="w-full bg-transparent text-5xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/20">
            {formData.form.title}
          </div>

          <div
            className={sharedProseClasses}
            dangerouslySetInnerHTML={{
              __html: formData.version.meta.description,
            }}
          />

          {/* <p className="text-md h-auto w-full bg-transparent tracking-tight text-foreground placeholder:text-muted-foreground/20">
            {formData.version.meta.description}
          </p> */}
        </div>
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
