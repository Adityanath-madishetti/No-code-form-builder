// src/form/renderer/viewRenderer/FormPreview.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useShallow } from 'zustand/react/shallow';
import { runtimeFormSelector, useRuntimeFormStore } from './runtimeForm.store';
import { backendToFrontend } from '@/lib/frontendBackendCompArray';
import { getComponentRenderer } from '@/form/registry/componentRegistry';
import type { ComponentID, FormTheme } from '@/form/components/base';
import { FormLogicEngine } from '@/form/logic/formLogicEngine';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Eye, Loader2, AlertCircle } from 'lucide-react';
import { sharedProseClasses } from '@/components/RichTextEditor';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import type {
  PublicFormData,
  PublicLogicData,
  PublicPageData,
  VersionSettings,
} from './runtimeForm.types';
import { FormThemeProvider } from '@/form/theme/FormThemeProvider';

interface VersionData {
  formId: string;
  version: number;
  theme: FormTheme;
  meta: { name: string; description: string };
  settings: VersionSettings;
  pages: PublicPageData[];
  logic?: PublicLogicData;
}

export default function FormPreview() {
  const { formId } = useParams<{ formId: string }>();
  const logicEngineRef = useRef<FormLogicEngine | null>(null);

  // State for loading and error handling
  const [globalFormError, setGlobalFormError] = useState('');
  const [globalFormLoading, setGlobalFormLoading] = useState(true);

  const { initRuntimeForm } = useRuntimeFormStore();

  // --- Zustand Store Connections ---
  const formData = useRuntimeFormStore((state) => state.formData);
  const currentPage = useRuntimeFormStore(runtimeFormSelector.currentPage);
  const currentPageId = useRuntimeFormStore(runtimeFormSelector.currentPageId);
  const renderState = useRuntimeFormStore(runtimeFormSelector.renderState);

  const setActivePage = useRuntimeFormStore((s) => s.setActivePage);
  const pageStack = useRuntimeFormStore((s) => s.pageStack);
  const pushPageStack = useRuntimeFormStore((s) => s.pushPageStack);
  const popPageStack = useRuntimeFormStore((s) => s.popPageStack);

  useEffect(() => {
    if (!formId) return;

    setGlobalFormLoading(true);
    setGlobalFormError('');

    api
      .get<{ version: VersionData }>(`/api/forms/${formId}/versions/latest`)
      .then((res) => {
        const versionData = res.version;

        const formattedFormData: PublicFormData = {
          form: {
            formId: versionData.formId || formId,
            title: versionData.meta?.name || 'Form Preview',
          },
          version: {
            ...versionData,
            settings: versionData.settings || {
              submissionPolicy: 'open',
              collectEmailMode: 'none',
              canViewOwnSubmission: false,
            },
          },
        };

        initRuntimeForm(formattedFormData);
      })
      .catch((err) => {
        // Generic network/API error handling
        setGlobalFormError(
          err.response?.data?.message ||
            err.message ||
            'Failed to load form preview. Please check your connection.'
        );
      })
      .finally(() => {
        // Ensure loading state is turned off whether it succeeded or failed
        setGlobalFormLoading(false);
      });
  }, [formId, initRuntimeForm]);

  const componentsData = useRuntimeFormStore(
    useShallow(runtimeFormSelector.currentPageComponentData)
  );

  const componentsStates = useRuntimeFormStore(
    useShallow(runtimeFormSelector.currentPageComponentStates)
  );

  // --- React Hook Form Setup ---
  const methods = useForm<Record<string, unknown>>({
    // mode: 'onTouched',
    shouldUnregister: false,
    defaultValues: {},
  });

  // --- Logic Engine Circuit Breaker & Evaluation ---
  const cascadeCount = useRef(0);
  const cascadeResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerLogicEvaluation = useCallback(
    async (currentValues: Record<string, unknown>) => {
      if (!logicEngineRef.current) return;

      if (cascadeCount.current > 10) {
        console.error(
          'Logic Circuit Breaker Tripped! Infinite loop detected and aborted.'
        );
        return;
      }

      cascadeCount.current++;
      if (cascadeResetTimer.current) clearTimeout(cascadeResetTimer.current);
      cascadeResetTimer.current = setTimeout(() => {
        cascadeCount.current = 0;
      }, 100);

      const { actions, computedValues } =
        await logicEngineRef.current.evaluate(currentValues);

      const visibilityPatch: Record<string, boolean> = {};
      const enabledPatch: Record<string, boolean> = {};
      const valuePatch: Record<string, unknown> = {};
      const skipActions = actions.filter((a) => a.type === 'SKIP_PAGE');

      actions.forEach((action) => {
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
        }
      });

      Object.entries(computedValues).forEach(([targetId, computedValue]) => {
        valuePatch[targetId] = computedValue;
      });

      const store = useRuntimeFormStore.getState();

      Object.entries(visibilityPatch).forEach(([targetId, isVisible]) => {
        store.setComponentVisibility(targetId, isVisible);
      });

      Object.entries(enabledPatch).forEach(([targetId, isEnabled]) => {
        store.setComponentEnabled(targetId, isEnabled);
      });

      Object.entries(valuePatch).forEach(([targetId, newValue]) => {
        if (currentValues[targetId] !== newValue) {
          methods.setValue(targetId, newValue, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      });

      // --- Pagination / Skip Logic ---
      if (formData) {
        const pages = formData.version.pages;

        // Reset all pages to their default next behavior
        pages.forEach((page, index) => {
          // FIX: Respect the defaultNextPageId if it exists in the schema
          const nextId =
            page.defaultNextPageId ??
            (index < pages.length - 1 ? pages[index + 1].pageId : null);

          store.setNextPageOfPage(page.pageId, nextId);
        });

        // Apply dynamic skips
        skipActions.forEach((action) => {
          if (action.targetId && action.toPageId) {
            // targetId acts as the exact Page we are routing FROM
            // toPageId acts as the exact Page we are routing TO
            store.setNextPageOfPage(action.targetId, action.toPageId);
          }
        });
      }
    },
    [formData, methods]
  );

  useEffect(() => {
    const rules = formData?.version.logic?.rules || [];
    const formulas = formData?.version.logic?.formulas || [];

    if (rules.length > 0 || formulas.length > 0) {
      logicEngineRef.current = new FormLogicEngine(rules, formulas);
      triggerLogicEvaluation(methods.getValues());
    } else {
      logicEngineRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.version.logic]);

  useEffect(() => {
    const subscription = methods.watch((value) => {
      if (logicEngineRef.current) {
        triggerLogicEvaluation(value as Record<string, unknown>);
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [methods.watch, triggerLogicEvaluation]);

  const globalTheme = useRuntimeFormStore(
    useShallow(runtimeFormSelector.theme)
  );

  // --- Navigation & Submission Handlers ---
  const currentPageState =
    currentPageId && renderState ? renderState.PageStates[currentPageId] : null;

  const hasPrevious = pageStack.length > 0;
  const isTerminal = currentPage?.isTerminal;
  const isLastPageIndex = formData
    ? formData.version.pages.findIndex((p) => p.pageId === currentPageId) ===
      formData.version.pages.length - 1
    : false;
  const hasNext =
    !!currentPageState?.nextPageId && !isTerminal && !isLastPageIndex;

  const handleNext = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const visibleInstanceIds = componentsData
      .filter((comp) => !componentsStates[comp.componentId]?.isHidden)
      .map((comp) => comp.componentId);
    const isPageValid = await methods.trigger(visibleInstanceIds);
    if (!isPageValid) return;
    if (currentPageState?.nextPageId && currentPageId) {
      pushPageStack(currentPageId); // Push current page to stack before navigating
      setActivePage(currentPageState.nextPageId);
    }
  };

  const handleBack = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const prevPageId = popPageStack();
    if (prevPageId) {
      setActivePage(prevPageId);
    }
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    console.log('Preview Submission Payload:', data);
    alert('Form submitted in preview mode! Check console for payload.');
  };

  // --- Render Branches for Loading and Error ---

  if (globalFormLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="animate-pulse text-sm font-medium text-muted-foreground">
          Loading preview...
        </p>
      </div>
    );
  }

  if (globalFormError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">
            Unable to load form preview
          </p>
          <p className="max-w-md text-sm text-muted-foreground">
            {globalFormError}
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
        No form data loaded for preview.
      </div>
    );
  }

  // --- Main Form Render ---
  return (
    <FormThemeProvider globalTheme={globalTheme}>
      <div className="mx-auto mt-15 mb-15 max-w-3xl min-w-3xl">
        <div className="mb-4 flex items-center justify-center gap-2 rounded-md bg-blue-50 py-2 text-sm font-medium text-blue-700">
          <Eye className="h-4 w-4" />
          Preview Mode
        </div>

        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
            {/* Header Section */}
            <Card>
              <CardHeader>
                <div className="w-full bg-transparent text-5xl font-bold tracking-tight text-foreground outline-none">
                  <h1>{formData.form.title}</h1>
                </div>
              </CardHeader>
              {formData.version.meta.description && (
                <CardContent>
                  <div
                    className={sharedProseClasses}
                    dangerouslySetInnerHTML={{
                      __html: formData.version.meta.description,
                    }}
                  />
                </CardContent>
              )}
            </Card>

            <Separator className="mt-5" />

            {/* Page Meta Section */}
            {(currentPage?.title || currentPage?.description) && (
              <Card>
                <CardHeader>
                  <div className="text-4xl font-semibold tracking-tight">
                    {currentPage?.title}
                  </div>
                </CardHeader>
                {currentPage?.description && (
                  <CardContent>
                    <div className={`tracking-tight ${sharedProseClasses}`}>
                      {currentPage?.description}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Components Mapping */}
            <div className="space-y-4">
              {componentsData.length === 0 ? (
                <p className="text-gray-500">
                  No components to display on this page.
                </p>
              ) : (
                componentsData.map((comp) => {
                  const frontendId = backendToFrontend[comp.componentType];
                  const Renderer = getComponentRenderer(
                    frontendId as ComponentID
                  );

                  const isHidden =
                    componentsStates[comp.componentId]?.isHidden ?? false;

                  if (isHidden) return null;

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
                    // @ts-expect-error - Bypassing generic object type mismatch for build
                    <Renderer
                      key={comp.componentId}
                      metadata={null}
                      props={comp.props}
                      validation={comp.validation}
                      instanceId={comp.componentId}
                    />
                  );
                })
              )}
            </div>

            {/* Footer Navigation */}
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <div className="flex items-center gap-2">
                <Button
                  key="btn-back"
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={!hasPrevious}
                  className="bg-secondary text-primary"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>

              {hasNext ? (
                <Button
                  key="btn-next"
                  type="button"
                  variant="outline"
                  onClick={handleNext}
                  className="bg-secondary text-primary"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  key="btn-submit"
                  type="submit"
                  variant="outline"
                  className="bg-success text-black"
                >
                  Submit (Preview)
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </FormThemeProvider>
  );
}
