// src/form/renderer/viewRenderer/FormRunner.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm, FormProvider, type UseFormReturn } from 'react-hook-form';
import {
  runtimeFormSelector,
  useRuntimeFormStore,
  type ComponentRenderState,
} from './runtimeForm.store';
import { useShallow } from 'zustand/react/shallow';
import { backendToFrontend } from '@/lib/frontendBackendCompArray';
import { getComponentRenderer } from '@/form/registry/componentRegistry';
import type { ComponentID } from '@/form/components/base';
import { FormLogicEngine } from '@/form/logic/formLogicEngine';
import { Button } from '@/components/ui/button';

import {
  type PublicFormData,
  type SubmissionEntry,
  DEFAULT_VERSION_SETTINGS,
  type PublicPageData,
  type PublicComponent,
  type VersionSettings,
} from '@/form/renderer/viewRenderer/runtimeForm.types';
import { api } from '@/lib/api';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Pencil } from 'lucide-react';
import { ArrowLeft, ArrowRight, Send, Loader2 } from 'lucide-react';
import { sharedProseClasses } from '@/components/RichTextEditor';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LogIn, Mail } from 'lucide-react'; // Ensure LogIn and Mail are included here

function flattenResponses(
  pages: SubmissionEntry['pages']
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const page of pages || []) {
    for (const response of page.responses || []) {
      out[response.componentId] = response.response;
    }
  }
  return out;
}
function LoginDialog() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await login(email.trim());
      setOpen(false); // Close the dialog on success
      // Note: FormRunner's useEffect will automatically re-run and load the
      // form data because the `user` context will update!
    } catch {
      setError('Failed to log in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <LogIn className="mr-1.5 h-4 w-4" />
          Log In to Continue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold tracking-tight">
            Form Builder
          </DialogTitle>
          <DialogDescription className="text-center">
            Enter your email to sign in or create a new account to access this
            form.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4 py-2">
          <div className="relative">
            <Mail className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !email.trim()}
          >
            {isSubmitting ? 'Signing in...' : 'Continue with Email'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type TrueFormProps = {
  methods: UseFormReturn<
    Record<string, unknown>,
    unknown,
    Record<string, unknown>
  >;
  formData: PublicFormData;
  currentPage: PublicPageData | undefined;
  componentsData: PublicComponent[];
  componentsStates: Record<string, ComponentRenderState>;
  backendToFrontend: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getComponentRenderer: (id: ComponentID) => any;
  handleNext: () => void;
  handleBack: () => void;
  handleBackToList: () => void;
  onSubmit: (data: Record<string, unknown>) => void;

  hasNext: boolean;
  hasPrevious: boolean;

  submitting: boolean;

  editingSubmissionId?: string;
  submitDisabledByPolicy: boolean;
  showBackToList: boolean;

  sharedProseClasses?: string;
};

export function TrueForm({
  methods,
  formData,
  currentPage,
  componentsData,
  componentsStates,
  backendToFrontend,
  getComponentRenderer,

  handleNext,
  handleBack,
  handleBackToList,
  onSubmit,

  hasNext,
  hasPrevious,
  submitting,

  editingSubmissionId,
  submitDisabledByPolicy,
  showBackToList,

  sharedProseClasses = '',
}: TrueFormProps) {
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="w-full bg-transparent text-5xl font-bold tracking-tight text-foreground outline-none">
              {formData.form.title}
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
                // <div
                //   key={comp.componentId}
                //   className="rounded-md border bg-gray-50 p-4 shadow-sm"
                // >
                //   <p className="text-sm font-medium text-gray-700">
                //     Label: <span className="font-bold">{comp.label}</span>
                //   </p>
                //   <p className="mb-4 text-xs text-gray-500">
                //     Instance ID: {comp.componentId} | Type:{' '}
                //     {comp.componentType}
                //   </p>
                <Renderer
                  key={comp.componentId}
                  metadata={null}
                  props={comp.props}
                  validation={comp.validation}
                  instanceId={comp.componentId}
                />
                // </div>
              );
            })
          )}
        </div>
        <div className="mt-8 flex items-center justify-between border-t pt-6">
          <div className="flex items-center gap-2">
            <Button
              key="btn-back"
              type="button"
              variant="secondary"
              onClick={handleBack}
              disabled={!hasPrevious || submitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {/* --- UI: Cancel Editing Button --- */}
            {showBackToList && (
              <Button
                key="btn-cancel-edit"
                type="button"
                variant="outline"
                onClick={handleBackToList}
              >
                Switch to Submissions
              </Button>
            )}
          </div>

          {hasNext ? (
            <Button
              key="btn-next"
              type="button"
              onClick={handleNext}
              disabled={
                submitting || (submitDisabledByPolicy && !editingSubmissionId)
              }
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              key="btn-submit"
              type="submit"
              disabled={
                submitting || (submitDisabledByPolicy && !editingSubmissionId)
              }
              className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : editingSubmissionId ? (
                <>
                  Update Submission
                  <Pencil className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Submit
                  <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

export function FormRunner() {
  const { formId } = useParams<{ formId: string }>();
  const [globalFormError, setGlobalFormError] = useState('');
  const [globalFormLoading, setGlobalFormLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userEmail, setUserEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const logicEngineRef = useRef<FormLogicEngine | null>(null);

  const [hasLocalSubmission, setHasLocalSubmission] = useState(false);

  const { initRuntimeForm } = useRuntimeFormStore();

  const [mySubmissions, setMySubmissions] = useState<SubmissionEntry[]>([]);
  const [editingSubmissionId, setEditingSubmissionId] = useState<
    string | undefined
  >(undefined);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    if (!formId) return;

    let isMounted = true;

    const loadData = async () => {
      setGlobalFormLoading(true);
      setGlobalFormError('');

      try {
        const res = await api.get<PublicFormData>(
          `/api/forms/${formId}/public`
        );
        if (!isMounted) return;

        initRuntimeForm(res);
        const localSubmissionFlag = localStorage.getItem(
          `form_${formId}_submitted`
        );
        if (localSubmissionFlag === 'true') {
          setHasLocalSubmission(true);
        }

        const currentEmail = user?.email || '';
        if (currentEmail) {
          setUserEmail(currentEmail);
        }

        const settings = res.version.settings;

        if (settings.collectEmailMode === 'required' && !currentEmail) {
          throw new Error(
            'Authentication required: You must be logged in to access this form.'
          );
        }

        if (user) {
          try {
            const subRes = await api.get<{ submissions: SubmissionEntry[] }>(
              `/api/forms/${formId}/submissions/mine`
            );
            if (isMounted) setMySubmissions(subRes.submissions || []);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (subErr) {
            if (isMounted) setMySubmissions([]);
          }
        }
      } catch (err) {
        if (isMounted)
          setGlobalFormError((err as Error).message || 'Form not found');
      } finally {
        if (isMounted) setGlobalFormLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [formId, initRuntimeForm, user, user?.email]);

  const formData = useRuntimeFormStore((state) => state.formData);
  const currentPage = useRuntimeFormStore(runtimeFormSelector.currentPage);
  const currentPageId = useRuntimeFormStore(runtimeFormSelector.currentPageId);
  const renderState = useRuntimeFormStore(runtimeFormSelector.renderState);

  const setActivePage = useRuntimeFormStore((s) => s.setActivePage);
  const pageStack = useRuntimeFormStore((s) => s.pageStack);
  const pushPageStack = useRuntimeFormStore((s) => s.pushPageStack);
  const popPageStack = useRuntimeFormStore((s) => s.popPageStack);

  // --- Policy Enforcement Derived State ---
  const settings: VersionSettings = useMemo(
    () => formData?.version.settings || DEFAULT_VERSION_SETTINGS,
    [formData?.version.settings]
  );

  const hasExisting = mySubmissions.length > 0;
  const canEditSubmission =
    settings?.submissionPolicy === 'edit_only' ||
    settings?.submissionPolicy === 'edit_and_resubmit';

  // const canResubmit =
  //   settings?.submissionPolicy === 'resubmit_only' ||
  //   settings?.submissionPolicy === 'edit_and_resubmit';

  const submitDisabledByPolicy = useMemo(() => {
    if (!settings) return false;

    // If the user is actively editing, submission is always allowed
    if (editingSubmissionId) return false;

    // If the user already has a submission, check if they can make a NEW one
    if (hasExisting) {
      if (
        settings.submissionPolicy === 'none' || // "none" means submit only once
        settings.submissionPolicy === 'edit_only' // Can edit, but cannot create new
      ) {
        return true;
      }
    }

    // 2. Anonymous User Check (Client-side truth)
    // If they aren't logged in, but their browser remembers submitting, and the policy is "once"
    if (!user && hasLocalSubmission) {
      if (
        settings.submissionPolicy === 'none' ||
        settings.submissionPolicy === 'edit_only'
      ) {
        return true;
      }
    }

    return false;
  }, [settings, editingSubmissionId, hasExisting, user, hasLocalSubmission]);

  const showHistoryList = !!(
    settings?.canViewOwnSubmission &&
    user &&
    hasExisting &&
    !editingSubmissionId &&
    !isCreatingNew
  );
  const showBackToList = !!(
    settings?.canViewOwnSubmission &&
    user &&
    hasExisting
  );

  const isLockedOut =
    submitDisabledByPolicy && !showHistoryList && !editingSubmissionId;

  const methods = useForm<Record<string, unknown>>({
    mode: 'onTouched',
    shouldUnregister: false,
    defaultValues: {},
  });

  const componentsData = useRuntimeFormStore(
    useShallow(runtimeFormSelector.currentPageComponentData)
  );

  const componentsStates = useRuntimeFormStore(
    useShallow(runtimeFormSelector.currentPageComponentStates)
  );

  const startEditingSubmission = (submission: SubmissionEntry) => {
    setEditingSubmissionId(submission.submissionId);
    setIsCreatingNew(false);
    const flatValues = flattenResponses(submission.pages);
    methods.reset(flatValues);
    if (submission.email) setUserEmail(submission.email);
    if (formData?.version.pages[0]) {
      setActivePage(formData.version.pages[0].pageId);
    }
  };

  const handleStartNew = () => {
    setIsCreatingNew(true);
    setEditingSubmissionId(undefined);
    methods.reset({});
    setUserEmail(user?.email || '');
    if (formData?.version.pages[0]) {
      setActivePage(formData.version.pages[0].pageId);
    }
  };

  const handleBackToList = () => {
    setIsCreatingNew(false);
    setEditingSubmissionId(undefined);
    methods.reset({});
    setUserEmail(user?.email || '');
    if (formData?.version.pages[0]) {
      setActivePage(formData.version.pages[0].pageId);
    }
  };

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
        cascadeCount.current = 0; // Reset after things settle down
      }, 100);

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
          // FIX: Respect the defaultNextPageId if it exists in the schema
          const nextId =
            page.defaultNextPageId ??
            (index < pages.length - 1 ? pages[index + 1].pageId : null);

          store.setNextPageOfPage(page.pageId, nextId);
        });

        // Step B: Apply active skips dynamically to their specific origin pages
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

  // Only re-run if the logic schema actually changes
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

  const onSubmit = async (data: Record<string, unknown>) => {
    if (!formId || !formData) return;
    setGlobalFormError(''); // Clear any previous errors

    const settings = formData.version.settings;
    if (settings.collectEmailMode === 'required' && !userEmail?.trim()) {
      setGlobalFormError('Email is required for this form.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Grab the current global states from Zustand
      const storeState = useRuntimeFormStore.getState();
      const pageStates = storeState.renderState?.PageStates || {};

      // 2. Build the nested payload structure
      const pagesPayload = formData.version.pages.map((page) => {
        // Extract the component states specifically for this page
        const currentPageState = pageStates[page.pageId];
        const componentStatesForPage = currentPageState?.ComponentStates || {};

        const activeResponses = page.components
          .filter((comp) => comp.componentType !== 'heading') // Ignore visual components
          .filter((comp) => {
            const state = componentStatesForPage[comp.componentId];

            // Use the new nested schema properties
            if (state?.isHidden) return false;
            if (state?.isEnabled === false) return false;

            return true;
          })
          .filter(
            (comp) =>
              data[comp.componentId] !== undefined &&
              data[comp.componentId] !== ''
          )
          .map((comp) => ({
            componentId: comp.componentId,
            response: data[comp.componentId],
          }));

        return {
          pageNo: page.pageNo,
          responses: activeResponses,
        };
      });

      const payload = {
        email: settings.collectEmailMode === 'none' ? undefined : userEmail,
        pages: pagesPayload,
      };

      // Branch to PATCH if updating, POST if new
      if (editingSubmissionId) {
        await api.patch(
          `/api/forms/${formId}/submissions/${editingSubmissionId}/mine`,
          payload
        );
      } else {
        await api.post(`/api/forms/${formId}/submissions`, payload);
        localStorage.setItem(`form_${formId}_submitted`, 'true');
      }

      // 4. Redirect on success
      navigate(`/forms/${formId}/success`);
    } catch (err) {
      setGlobalFormError(
        (err as Error).message || 'Submission failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const currentPageState =
    currentPageId && renderState ? renderState.PageStates[currentPageId] : null;

  const hasPrevious = pageStack.length > 0;
  const hasNext = !!currentPageState?.nextPageId;

  const handleNext = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const currentInstanceIds = componentsData.map((comp) => comp.componentId);
    const isPageValid = await methods.trigger(currentInstanceIds);
    if (!isPageValid) {
      console.log('Validation failed. Staying on current page.');
      return;
    }

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
  if (globalFormError || !formData) {
    const requiresLogin = /authentication required/i.test(globalFormError);

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        {!requiresLogin && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
        )}
        <div className="mb-2 flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">
            {requiresLogin ? 'Sign In Required' : 'Error loading form'}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {requiresLogin
              ? 'The creator of this form requires you to sign in before continuing.'
              : globalFormError ||
                'We could not find the form you are looking for.'}
          </p>
        </div>

        {requiresLogin && <LoginDialog />}
      </div>
    );
  }

  if (isLockedOut) {
    return (
      <div className="mx-auto mt-15 mb-15 max-w-3xl">
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="mb-4 h-10 w-10 text-amber-500" />
            <h2 className="text-xl font-semibold text-amber-900">
              Already Submitted
            </h2>
            <p className="mt-2 text-amber-700">
              You have already completed this form. Multiple submissions are not
              permitted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-15 mb-15 max-w-3xl">
      {showHistoryList ? (
        <>
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <h2 className="text-lg font-semibold">Your Submissions</h2>
              {!submitDisabledByPolicy && (
                <Button size="sm" onClick={handleStartNew}>
                  New Submission
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {mySubmissions.length === 0 ? (
                <div className="text-xs text-muted-foreground">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {mySubmissions.map((submission) => (
                    <div
                      key={submission.submissionId}
                      className="flex items-center justify-between rounded border border-border px-3 py-2"
                    >
                      <div className="text-sm font-medium text-muted-foreground">
                        {new Date(submission.createdAt).toLocaleString()}
                      </div>
                      {canEditSubmission && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEditingSubmission(submission)}
                        >
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Edit
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {submitDisabledByPolicy && editingSubmissionId && (
            <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              New submissions are disabled by form policy. Edit an existing
              submission above.
            </div>
          )}

          {submitDisabledByPolicy && !editingSubmissionId && (
            <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              New submissions are disabled by form policy.
            </div>
          )}
        </>
      ) : (
        <>
          {submitDisabledByPolicy && !editingSubmissionId && (
            <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              New submissions are disabled by form policy.
            </div>
          )}

          <TrueForm
            methods={methods}
            formData={formData}
            currentPage={currentPage}
            componentsData={componentsData}
            componentsStates={componentsStates}
            backendToFrontend={backendToFrontend}
            getComponentRenderer={getComponentRenderer}
            handleNext={handleNext}
            handleBack={handleBack}
            handleBackToList={handleBackToList}
            onSubmit={onSubmit}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            submitting={submitting}
            editingSubmissionId={editingSubmissionId}
            submitDisabledByPolicy={submitDisabledByPolicy}
            showBackToList={showBackToList}
            sharedProseClasses={sharedProseClasses}
          />
        </>
      )}
    </div>
  );
}
