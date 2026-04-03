// src/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE, api } from '@/lib/api';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  Plus,
  FileText,
  LogOut,
  Loader2,
  Inbox,
  Eye,
  Download,
  Keyboard,
  User,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FormHeader {
  formId: string;
  title: string;
  currentVersion: number;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
}

interface SharedFormHeader extends FormHeader {
  sharedRole: 'editor' | 'reviewer';
  sharedRoles: Array<'editor' | 'reviewer'>;
  submissionCount: number;
}

interface MySubmission {
  submissionId: string;
  formId: string;
  formTitle: string;
  version: number;
  status: string;
  submittedAt: string;
  pages?: Array<{
    pageNo: number;
    responses: Array<{ componentId: string; response: unknown }>;
  }>;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormHeader[]>([]);
  const [sharedForms, setSharedForms] = useState<SharedFormHeader[]>([]);
  const [activeSharedFormId, setActiveSharedFormId] = useState<string | null>(
    null
  );
  const [submissions, setSubmissions] = useState<MySubmission[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(
    null
  );
  const [exportingSubmissionCsv, setExportingSubmissionCsv] = useState(false);
  const [submissionDetailError, setSubmissionDetailError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [bottomView, setBottomView] = useState<'myForms' | 'sharedForms' | 'mySubmissions'>(
    'myForms'
  );

  useEffect(() => {
    Promise.all([
      api
        .get<{ forms: FormHeader[] }>('/api/forms')
        .then((res) => setForms(res.forms))
        .catch(() => {}),
      api
        .get<{ forms: SharedFormHeader[] }>('/api/forms/shared')
        .then((res) => setSharedForms(res.forms))
        .catch(() => {}),
      api
        .get<{ submissions: MySubmission[] }>('/api/submissions/mine')
        .then((res) => setSubmissions(res.submissions))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.title = 'Dashboard — Form Builder';
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await api.post<{ form: FormHeader }>('/api/forms', {
        title: 'Untitled Form',
      });
      navigate(`/form-builder/${res.form.formId}`);
    } catch {
      setCreating(false);
    }
  };

  const handleCreateFromTemplate = async (template: 'blank') => {
    if (template !== 'blank') return;
    await handleCreate();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusColor: Record<string, string> = {
    submitted: 'bg-blue-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    under_review: 'bg-amber-500',
    draft: 'bg-neutral-400',
  };

  const selectedSubmission =
    submissions.find((submission) => submission.submissionId === selectedSubmissionId) ||
    null;

  const formatResponseValue = (value: unknown) => {
    if (value === null || value === undefined) return 'No response';
    if (typeof value === 'string') return value || 'No response';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      return value.length ? value.map((entry) => String(entry)).join(', ') : 'No response';
    }
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const handleExportSubmissionCsv = async () => {
    if (!selectedSubmission) return;
    setExportingSubmissionCsv(true);
    setSubmissionDetailError('');

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(
        `${API_BASE}/api/forms/${selectedSubmission.formId}/submissions/export.csv`,
        {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message =
          (body as { error?: string }).error || `Export failed (${res.status})`;
        throw new Error(message);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `form-${selectedSubmission.formId}-submissions.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSubmissionDetailError((err as Error).message || 'Export failed');
    } finally {
      setExportingSubmissionCsv(false);
    }
  };

  const getSharedRoleLabel = (form: SharedFormHeader) => {
    const roles = form.sharedRoles?.length ? form.sharedRoles : [form.sharedRole];
    const hasEditor = roles.includes('editor');
    const hasReviewer = roles.includes('reviewer');

    if (hasEditor && hasReviewer) return 'Editor + Reviewer';
    if (hasEditor) return 'Editor';
    return 'Reviewer';
  };

  const canSharedUserEditForm = (form: SharedFormHeader) => {
    const roles = form.sharedRoles?.length ? form.sharedRoles : [form.sharedRole];
    return roles.includes('editor');
  };

  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' && document.documentElement.classList.contains('dark'));

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-background px-6 py-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <img src="/logo.png" alt="Form Builder" className="h-6 w-6" />
          Form Builder
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => setTheme(isDarkMode ? 'light' : 'dark')}
            className="group"
          >
            {isDarkMode ? (
              <Sun className="h-3.5 w-3.5 transition-colors group-hover:fill-current" />
            ) : (
              <Moon className="h-3.5 w-3.5 transition-colors group-hover:fill-current" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="User menu"
                title="User menu"
              >
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem disabled className="opacity-100">
                <span className="truncate text-muted-foreground">{user?.email || 'Signed in user'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/keyboard-shortcuts">
                  <Keyboard className="h-3.5 w-3.5" />
                  Keyboard shortcuts
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="h-3.5 w-3.5" />
                User settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} variant="destructive">
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {/* ── Templates (top half) ── */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Create From Template</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Start quickly using available templates.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-medium">Blank</h3>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                Template
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Start with an empty form and build from scratch.
            </p>
            <Button
              className="mt-4 w-full"
              onClick={() => handleCreateFromTemplate('blank')}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-1.5 h-4 w-4" />
              )}
              Use Blank Template
            </Button>
          </div>
        </div>

        {/* ── Bottom half switcher ── */}
        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border pb-3">
            <Button
              size="sm"
              variant={bottomView === 'myForms' ? 'default' : 'outline'}
              onClick={() => setBottomView('myForms')}
            >
              My Forms
            </Button>
            <Button
              size="sm"
              variant={bottomView === 'sharedForms' ? 'default' : 'outline'}
              onClick={() => setBottomView('sharedForms')}
            >
              Shared With Me
            </Button>
            <Button
              size="sm"
              variant={bottomView === 'mySubmissions' ? 'default' : 'outline'}
              onClick={() => setBottomView('mySubmissions')}
            >
              My Submissions
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : null}

          {!loading && bottomView === 'myForms' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold">My Forms</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Forms created and owned by you.
                </p>
              </div>
              {forms.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-20 text-center">
                  <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No forms yet. Create your first one from Blank template.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {forms.map((form) => (
                    <div
                      key={form.formId}
                      className="group flex flex-col gap-2 rounded-lg border border-border bg-background p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <button
                        onClick={() => navigate(`/form-builder/${form.formId}`)}
                        className="flex flex-col items-start gap-2 text-left"
                      >
                        <div className="flex w-full items-start justify-between">
                          <h3 className="text-sm font-medium transition-colors group-hover:text-primary">
                            {form.title}
                          </h3>
                          <span className="ml-2 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            v{form.currentVersion}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Updated {formatDate(form.updatedAt)}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              form.isActive ? 'bg-green-500' : 'bg-neutral-300'
                            }`}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {form.isActive ? 'Published' : 'Draft'}
                          </span>
                        </div>
                      </button>

                      <div className="mt-1 border-t border-border pt-3">
                        <Button
                          className="w-full"
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/reviews/${form.formId}`)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View Submissions
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!loading && bottomView === 'sharedForms' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold">
                  Forms Shared With You ({sharedForms.length})
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Forms assigned to you as editor or reviewer.
                </p>
              </div>
              {sharedForms.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12 text-center">
                  <FileText className="mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No forms shared with you yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sharedForms.map((form) => (
                    <div
                      key={form.formId}
                      className="rounded-lg border border-border bg-background p-4 shadow-sm"
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setActiveSharedFormId((prev) =>
                            prev === form.formId ? null : form.formId
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setActiveSharedFormId((prev) =>
                              prev === form.formId ? null : form.formId
                            );
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex w-full items-start justify-between">
                          <h3 className="text-sm font-medium">{form.title}</h3>
                          <span className="ml-2 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {getSharedRoleLabel(form)}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Updated {formatDate(form.updatedAt)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {form.submissionCount} submission
                          {form.submissionCount === 1 ? '' : 's'}
                        </p>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          Click to view actions
                        </p>
                      </div>

                      {activeSharedFormId === form.formId && (
                        <div className="mt-3 space-y-2 border-t border-border pt-3">
                          {canSharedUserEditForm(form) && (
                            <Button
                              className="w-full"
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/form-builder/${form.formId}`)}
                            >
                              Edit Form
                            </Button>
                          )}
                          <Button
                            className="w-full"
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/reviews/${form.formId}`)}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            View Submissions
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!loading && bottomView === 'mySubmissions' && (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold">My Submissions</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Forms you have filled and submitted.
                </p>
              </div>
              {submissions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12 text-center">
                  <Inbox className="mb-3 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No submissions yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-border bg-background">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-muted/30">
                      <tr>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Form</th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">
                          Submitted
                        </th>
                        <th className="px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <tr
                          key={sub.submissionId}
                          className={`cursor-pointer border-b border-border last:border-0 hover:bg-muted/20 ${
                            selectedSubmissionId === sub.submissionId ? 'bg-muted/30' : ''
                          }`}
                          onClick={() => setSelectedSubmissionId(sub.submissionId)}
                        >
                          <td className="px-4 py-3 font-medium">{sub.formTitle}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(sub.submittedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  statusColor[sub.status] || 'bg-neutral-400'
                                }`}
                              />
                              <span className="text-xs capitalize">
                                {sub.status.replace('_', ' ')}
                              </span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>

        {bottomView === 'mySubmissions' && selectedSubmission && (
          <section className="mt-6 rounded-lg border border-border bg-background p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Submission Details</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedSubmission.formTitle} • {formatDate(selectedSubmission.submittedAt)}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportSubmissionCsv}
                disabled={exportingSubmissionCsv}
              >
                {exportingSubmissionCsv ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                )}
                Export CSV
              </Button>
            </div>

            {submissionDetailError && (
              <p className="mt-2 text-xs text-destructive">{submissionDetailError}</p>
            )}

            <div className="mt-4 space-y-3">
              {(selectedSubmission.pages || []).length === 0 ? (
                <p className="text-xs text-muted-foreground">No detailed responses available.</p>
              ) : (
                (selectedSubmission.pages || []).map((page) => (
                  <div key={page.pageNo} className="rounded border border-border p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Page {page.pageNo}
                    </p>
                    {(page.responses || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No responses.</p>
                    ) : (
                      <div className="space-y-2">
                        {page.responses.map((item) => (
                          <div key={`${page.pageNo}-${item.componentId}`}>
                            <p className="text-xs font-medium text-muted-foreground">
                              {item.componentId}
                            </p>
                            <pre className="mt-1 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/30 p-2 text-xs">
                              {formatResponseValue(item.response)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
