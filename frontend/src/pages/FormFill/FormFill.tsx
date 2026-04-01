import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { getComponentRenderer } from '@/form/registry/componentRegistry';
import type { ComponentID } from '@/form/components/base';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Pencil, LogIn } from 'lucide-react';

interface BackendComponent {
  componentId: string;
  componentType: string;
  label: string;
  props: Record<string, unknown>;
  validation: Record<string, unknown>;
  order: number;
}

interface BackendPage {
  pageId: string;
  pageNo: number;
  title: string;
  description?: string;
  components: BackendComponent[];
}

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
    pages: BackendPage[];
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

const backendToFrontend: Record<string, string> = {
  heading: 'Header',
  'single-line-text': 'Input',
  radio: 'Radio',
  checkbox: 'Checkbox',
  dropdown: 'Dropdown',
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

export default function FormFill() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<PublicFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [email, setEmail] = useState('');

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

  const settings: VersionSettings =
    data?.version.settings || {
      collectEmailMode: 'none',
      submissionPolicy: 'none',
      canViewOwnSubmission: false,
    };
  const canEditSubmission =
    settings?.submissionPolicy === 'edit_only' ||
    settings?.submissionPolicy === 'edit_and_resubmit';

  const canResubmit =
    settings?.submissionPolicy === 'resubmit_only' ||
    settings?.submissionPolicy === 'edit_and_resubmit';

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

  const handleResponseChange = useCallback(
    (componentId: string, value: unknown) => {
      setResponses((prev) => ({ ...prev, [componentId]: value }));
    },
    []
  );

  const startEditingSubmission = (submission: SubmissionEntry) => {
    setEditingSubmissionId(submission.submissionId);
    setResponses(flattenResponses(submission.pages));
    setEmail(submission.email || user?.email || '');
  };

  const buildSubmissionPages = useCallback(() => {
    if (!data) return [];
    return data.version.pages.map((page) => ({
      pageNo: page.pageNo,
      responses: page.components
        .filter((c) => c.componentType !== 'heading')
        .map((c) => ({
          componentId: c.componentId,
          response: responses[c.componentId] ?? null,
        })),
    }));
  }, [data, responses]);

  const handleSubmit = useCallback(async () => {
    if (!formId || !data) return;
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        email: settings?.collectEmailMode === 'none' ? undefined : email,
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
  }, [formId, data, settings?.collectEmailMode, email, buildSubmissionPages, editingSubmissionId, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
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
            New submissions are disabled by form policy. {canEditSubmission ? 'Edit an existing submission.' : ''}
          </div>
        )}

        {data.version.pages.map((page) => (
          <div key={page.pageId} className="mb-8">
            {page.title && page.title !== `Page ${page.pageNo}` && (
              <h2 className="mb-4 text-lg font-medium">{page.title}</h2>
            )}
            <div className="space-y-6">
              {page.components.map((comp) => {
                const feId =
                  backendToFrontend[comp.componentType] || comp.componentType;
                const Renderer = getComponentRenderer(feId as ComponentID);

                if (!Renderer) {
                  return (
                    <div
                      key={comp.componentId}
                      className="rounded border border-dashed border-border p-3 text-xs text-muted-foreground"
                    >
                      Unsupported component: {comp.componentType}
                    </div>
                  );
                }

                return (
                  <div
                    key={comp.componentId}
                    className="rounded-lg border border-border bg-background p-4"
                  >
                    <Renderer
                      instanceId={comp.componentId}
                      metadata={{ label: comp.label }}
                      props={comp.props as never}
                      validation={comp.validation as never}
                    />
                    {comp.componentType !== 'heading' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Your answer..."
                          className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                          value={(responses[comp.componentId] as string) || ''}
                          onChange={(e) =>
                            handleResponseChange(comp.componentId, e.target.value)
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {settings.collectEmailMode !== 'none' && (
          <div className="mb-5 rounded-lg border border-border bg-background p-4">
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

        <div className="flex items-center justify-end gap-2 pt-4">
          {editingSubmissionId && canResubmit && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingSubmissionId(null);
                setResponses({});
                setEmail(user?.email || '');
              }}
            >
              Switch to New Submission
            </Button>
          )}
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
        </div>
      </main>
    </div>
  );
}
