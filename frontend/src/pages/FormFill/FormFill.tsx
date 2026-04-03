import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Pencil, LogIn, ArrowLeft, ArrowRight } from 'lucide-react';
import { FillFieldRenderer } from './FillFieldRenderer';
import {
  evaluateRuntimeLogic,
  getComponentOrderForPage,
  hasRequiredValidation,
  isResponseEmpty,
  type RuntimeLogicPayload,
  type RuntimePage,
} from './runtimeLogic';

interface VersionSettings {
  collectEmailMode: 'none' | 'optional' | 'required';
  submissionPolicy:
    | 'none'
    | 'edit_only'
    | 'resubmit_only'
    | 'edit_and_resubmit';
  canViewOwnSubmission: boolean;
  confirmationMessage?: string;
}

interface PublicFormData {
  form: { formId: string; title: string };
  version: {
    formId: string;
    version: number;
    meta: { name: string; description: string };
    settings: VersionSettings;
    pages: RuntimePage[];
    logic?: RuntimeLogicPayload;
  };
}

interface SubmissionEntry {
  submissionId: string;
  email?: string | null;
  status: string;
  createdAt: string;
  pages: Array<{
    pageNo: number;
    responses: Array<{ componentId: string; response: unknown }>;
  }>;
}

const DEFAULT_VERSION_SETTINGS: VersionSettings = {
  collectEmailMode: 'none',
  submissionPolicy: 'none',
  canViewOwnSubmission: false,
};

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

function getOrCreateSeed(formId: string): string {
  const key = `form-fill-seed:${formId}`;
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, next);
  return next;
}

export default function FormFill() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<PublicFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [email, setEmail] = useState('');
  const [pageIndex, setPageIndex] = useState(0);

  const [mineLoading, setMineLoading] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<SubmissionEntry[]>([]);
  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (!formId) return;
    api
      .get<PublicFormData>(`/api/forms/${formId}/public`)
      .then((res) => {
        setData(res);
        if (user?.email) setEmail(user.email);
      })
      .catch((err) => setError(err.message || 'Form not found'))
      .finally(() => setLoading(false));
  }, [formId, user?.email]);

  useEffect(() => {
    if (!formId || !data || !user) return;
    if (!data.version.settings.canViewOwnSubmission) return;

    setMineLoading(true);
    api
      .get<{ submissions: SubmissionEntry[] }>(
        `/api/forms/${formId}/submissions/mine`
      )
      .then((res) => setMySubmissions(res.submissions || []))
      .catch(() => setMySubmissions([]))
      .finally(() => setMineLoading(false));
  }, [formId, data, user]);

  useEffect(() => {
    document.title = data?.version.meta.name
      ? `${data.version.meta.name} — Form Builder`
      : 'Form — Form Builder';
  }, [data]);

  const settings: VersionSettings = useMemo(
    () => data?.version.settings || DEFAULT_VERSION_SETTINGS,
    [data?.version.settings]
  );

  const sessionSeed = useMemo(() => (formId ? getOrCreateSeed(formId) : ''), [formId]);

  const runtime = useMemo(() => {
    if (!data) {
      return {
        values: {},
        visibility: {},
        enabled: {},
        validationErrors: {},
        nextPageId: null,
      };
    }
    return evaluateRuntimeLogic(data.version.logic, data.version.pages, responses);
  }, [data, responses]);

  const canEditSubmission =
    settings.submissionPolicy === 'edit_only' ||
    settings.submissionPolicy === 'edit_and_resubmit';
  const canResubmit =
    settings.submissionPolicy === 'resubmit_only' ||
    settings.submissionPolicy === 'edit_and_resubmit';
  const hasExisting = mySubmissions.length > 0;

  const submitDisabledByPolicy = useMemo(() => {
    if (!settings) return false;
    if (!user) return false;
    if (!hasExisting) return false;
    if (settings.submissionPolicy === 'none') return true;
    if (settings.submissionPolicy === 'edit_only' && !editingSubmissionId) {
      return true;
    }
    return false;
  }, [settings, user, hasExisting, editingSubmissionId]);

  const currentPage = data?.version.pages[pageIndex] || null;
  const orderedCurrentComponents = useMemo(() => {
    if (!currentPage || !data) return [];
    return getComponentOrderForPage(
      currentPage,
      data.version.logic?.componentShuffleStacks,
      sessionSeed
    ).filter((component) => runtime.visibility[component.componentId] !== false);
  }, [currentPage, data, runtime.visibility, sessionSeed]);

  const validatePages = useCallback(
    (scope: 'current' | 'all') => {
      if (!data) return { ok: true, errors: {} as Record<string, string>, firstPage: 0 };
      const errors: Record<string, string> = {};
      const pagesToCheck =
        scope === 'all'
          ? data.version.pages
          : data.version.pages[pageIndex]
            ? [data.version.pages[pageIndex]]
            : [];
      let firstInvalidPage = pageIndex;

      for (const page of pagesToCheck) {
        for (const component of page.components) {
          const componentId = component.componentId;
          if (component.componentType === 'heading') continue;
          if (runtime.visibility[componentId] === false) continue;
          if (runtime.enabled[componentId] === false) continue;

          const required =
            hasRequiredValidation(component) ||
            (component.required as boolean | undefined) === true;
          if (required && isResponseEmpty(runtime.values[componentId])) {
            errors[componentId] = `${component.label || 'Field'} is required`;
            firstInvalidPage = Math.min(firstInvalidPage, page.pageNo - 1);
          }
          if (runtime.validationErrors[componentId]) {
            errors[componentId] = runtime.validationErrors[componentId];
            firstInvalidPage = Math.min(firstInvalidPage, page.pageNo - 1);
          }
        }
      }

      return {
        ok: Object.keys(errors).length === 0,
        errors,
        firstPage: firstInvalidPage,
      };
    },
    [data, pageIndex, runtime]
  );

  const startEditingSubmission = (submission: SubmissionEntry) => {
    setEditingSubmissionId(submission.submissionId);
    setResponses(flattenResponses(submission.pages));
    setEmail(submission.email || user?.email || '');
    setPageIndex(0);
    setFieldErrors({});
  };

  const buildSubmissionPages = useCallback(() => {
    if (!data) return [];
    return data.version.pages.map((page) => ({
      pageNo: page.pageNo,
      responses: page.components
        .filter((component) => component.componentType !== 'heading')
        .filter((component) => runtime.visibility[component.componentId] !== false)
        .filter((component) => runtime.enabled[component.componentId] !== false)
        .filter((component) => runtime.values[component.componentId] !== undefined)
        .map((component) => ({
          componentId: component.componentId,
          response: runtime.values[component.componentId],
        })),
    }));
  }, [data, runtime]);

  const handleSubmit = useCallback(async () => {
    if (!formId || !data) return;
    setError('');

    if (settings.collectEmailMode === 'required' && !email.trim()) {
      setError('Email is required for this form.');
      return;
    }

    const allValidation = validatePages('all');
    if (!allValidation.ok) {
      setFieldErrors(allValidation.errors);
      setPageIndex(allValidation.firstPage);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        email: settings.collectEmailMode === 'none' ? undefined : email,
        pages: buildSubmissionPages(),
      };

      if (editingSubmissionId) {
        await api.patch(
          `/api/forms/${formId}/submissions/${editingSubmissionId}/mine`,
          payload
        );
      } else {
        await api.post(`/api/forms/${formId}/submissions`, payload);
      }

      navigate(`/forms/${formId}/success`);
    } catch (err) {
      setError((err as Error).message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [
    formId,
    data,
    settings.collectEmailMode,
    email,
    validatePages,
    buildSubmissionPages,
    editingSubmissionId,
    navigate,
  ]);

  const handleNext = () => {
    if (!data || !currentPage) return;
    const validation = validatePages('current');
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});

    let nextIndex = pageIndex + 1;
    if (runtime.nextPageId) {
      const target = data.version.pages.findIndex(
        (page) => page.pageId === runtime.nextPageId
      );
      if (target !== -1 && target !== pageIndex && target > pageIndex) {
        nextIndex = target;
      }
    }

    if (nextIndex >= data.version.pages.length) {
      void handleSubmit();
      return;
    }
    setPageIndex(nextIndex);
  };

  const handleBack = () => {
    setPageIndex((prev) => Math.max(0, prev - 1));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !data) {
    const requiresLogin = /authentication required/i.test(error);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-destructive">{error || 'Form not found'}</p>
        {requiresLogin ? (
          <Button asChild>
            <Link to="/login">
              <LogIn className="mr-1.5 h-4 w-4" />
              Log In
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            Back
          </Button>
        )}
      </div>
    );
  }

  if (!data || !currentPage) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Form not found.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b border-border bg-background px-6 py-4">
        <h1 className="text-xl font-semibold">{data.version.meta.name}</h1>
        {data.version.meta.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {data.version.meta.description}
          </p>
        )}
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        {settings.canViewOwnSubmission && user && (
          <section className="mb-8 rounded-lg border border-border bg-background p-4">
            <h2 className="text-sm font-semibold">Your Submissions</h2>
            {mineLoading ? (
              <div className="mt-2 text-xs text-muted-foreground">Loading...</div>
            ) : mySubmissions.length === 0 ? (
              <div className="mt-2 text-xs text-muted-foreground">No submissions yet.</div>
            ) : (
              <div className="mt-3 space-y-2">
                {mySubmissions.map((submission) => (
                  <div
                    key={submission.submissionId}
                    className="flex items-center justify-between rounded border border-border px-3 py-2"
                  >
                    <div className="text-xs text-muted-foreground">
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
          </section>
        )}

        {submitDisabledByPolicy && !editingSubmissionId && (
          <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            New submissions are disabled by form policy.{' '}
            {canEditSubmission ? 'Edit an existing submission.' : ''}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {pageIndex + 1} / {data.version.pages.length}
          </span>
          <span>{currentPage.title || `Page ${currentPage.pageNo}`}</span>
        </div>

        <section className="rounded-lg border border-border bg-background p-4">
          <div className="space-y-5">
            {orderedCurrentComponents.map((component) => (
              <div key={component.componentId} className="space-y-2">
                {component.componentType !== 'heading' && (
                  <label className="text-sm font-medium">
                    {component.label}
                    {(hasRequiredValidation(component) || component.required) &&
                      runtime.visibility[component.componentId] !== false &&
                      runtime.enabled[component.componentId] !== false && (
                        <span className="ml-1 text-destructive">*</span>
                      )}
                  </label>
                )}
                <FillFieldRenderer
                  component={component}
                  value={runtime.values[component.componentId]}
                  disabled={runtime.enabled[component.componentId] === false}
                  error={
                    fieldErrors[component.componentId] ||
                    runtime.validationErrors[component.componentId]
                  }
                  shuffleSeed={sessionSeed}
                  onChange={(nextValue) => {
                    setResponses((prev) => ({
                      ...prev,
                      [component.componentId]: nextValue,
                    }));
                  }}
                />
              </div>
            ))}
          </div>
        </section>

        {settings.collectEmailMode !== 'none' && (
          <div className="mt-5 rounded-lg border border-border bg-background p-4">
            <label className="mb-1 block text-sm font-medium">
              Email
              {settings.collectEmailMode === 'required' ? ' *' : ''}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              required={settings.collectEmailMode === 'required'}
            />
          </div>
        )}

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={pageIndex === 0 || submitting}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Button>
            {editingSubmissionId && canResubmit && (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingSubmissionId(null);
                  setResponses({});
                  setEmail(user?.email || '');
                  setPageIndex(0);
                }}
              >
                Switch to New Submission
              </Button>
            )}
          </div>

          {pageIndex < data.version.pages.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={submitting || (submitDisabledByPolicy && !editingSubmissionId)}
            >
              Next
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || (submitDisabledByPolicy && !editingSubmissionId)}
            >
              {submitting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-1.5 h-4 w-4" />
              )}
              {editingSubmissionId ? 'Update Submission' : 'Submit'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

