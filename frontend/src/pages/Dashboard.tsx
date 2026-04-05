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
  LayoutGrid,
  List,
  Funnel,
  Search,
  User,
  Settings,
  Sun,
  Moon,
  Pencil,
  ExternalLink,
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
  createdBy?: string;
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

type LayoutMode = 'grid' | 'list';
const MY_FORMS_LIST_COLUMNS =
  'grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.8fr)_100px]';
const SHARED_FORMS_LIST_COLUMNS =
  'grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.8fr)]';

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
  const [showBlankTemplatePreview, setShowBlankTemplatePreview] = useState(false);
  const [myFormsLayout, setMyFormsLayout] = useState<LayoutMode>('grid');
  const [sharedFormsLayout, setSharedFormsLayout] = useState<LayoutMode>('grid');
  const [myFormsQuery, setMyFormsQuery] = useState('');
  const [sharedFormsQuery, setSharedFormsQuery] = useState('');
  const [submissionsQuery, setSubmissionsQuery] = useState('');
  const [myFormsStatusFilter, setMyFormsStatusFilter] = useState<'all' | 'published' | 'draft'>(
    'all'
  );
  const [myFormsEditedFilter, setMyFormsEditedFilter] = useState<
    'all' | 'last7' | 'last30' | 'older'
  >('all');
  const [sharedRoleFilter, setSharedRoleFilter] = useState<'all' | 'editor' | 'reviewer'>('all');
  const [sharedEditedFilter, setSharedEditedFilter] = useState<
    'all' | 'last7' | 'last30' | 'older'
  >('all');
  const [submissionsStatusFilter, setSubmissionsStatusFilter] = useState<'all' | string>('all');
  const [submissionsDateFilter, setSubmissionsDateFilter] = useState<
    'all' | 'last7' | 'last30' | 'older'
  >('all');
  const [bottomView, setBottomView] = useState<'myForms' | 'sharedForms' | 'mySubmissions'>(
    'myForms'
  );

  useEffect(() => {
    Promise.all([
      api
        .get<{ forms: FormHeader[] }>('/api/forms')
        .then((res) => setForms(res.forms))
        .catch(() => { }),
      api
        .get<{ forms: SharedFormHeader[] }>('/api/forms/shared')
        .then((res) => setSharedForms(res.forms))
        .catch(() => { }),
      api
        .get<{ submissions: MySubmission[] }>('/api/submissions/mine')
        .then((res) => setSubmissions(res.submissions))
        .catch(() => { }),
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

  const getCreatorLabel = (form: { createdBy?: string }, fallback = 'You') => {
    if (form.createdBy && user?.uid && form.createdBy === user.uid) return 'You';
    if (form.createdBy) return form.createdBy;
    return fallback;
  };

  const normalizedMyFormsQuery = myFormsQuery.trim().toLowerCase();
  const normalizedSharedFormsQuery = sharedFormsQuery.trim().toLowerCase();
  const normalizedSubmissionsQuery = submissionsQuery.trim().toLowerCase();
  const nowMs = Date.now();
  const isWithinDays = (iso: string, days: number) => {
    const parsed = new Date(iso).getTime();
    if (!Number.isFinite(parsed)) return false;
    return nowMs - parsed <= days * 24 * 60 * 60 * 1000;
  };
  const matchesDateFilter = (
    iso: string,
    filter: 'all' | 'last7' | 'last30' | 'older'
  ) => {
    if (filter === 'all') return true;
    if (filter === 'last7') return isWithinDays(iso, 7);
    if (filter === 'last30') return isWithinDays(iso, 30);
    return !isWithinDays(iso, 30);
  };

  const submissionStatuses = Array.from(new Set(submissions.map((s) => s.status))).sort();

  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      !normalizedMyFormsQuery ||
      form.title.toLowerCase().includes(normalizedMyFormsQuery) ||
      getCreatorLabel(form, 'Unknown').toLowerCase().includes(normalizedMyFormsQuery);
    const matchesStatus =
      myFormsStatusFilter === 'all' ||
      (myFormsStatusFilter === 'published' && form.isActive) ||
      (myFormsStatusFilter === 'draft' && !form.isActive);
    const matchesEdited = matchesDateFilter(form.updatedAt, myFormsEditedFilter);
    return matchesSearch && matchesStatus && matchesEdited;
  });

  const filteredSharedForms = sharedForms.filter((form) => {
    const matchesSearch =
      !normalizedSharedFormsQuery ||
      form.title.toLowerCase().includes(normalizedSharedFormsQuery) ||
      getCreatorLabel(form, 'Unknown').toLowerCase().includes(normalizedSharedFormsQuery);
    const roles = form.sharedRoles?.length ? form.sharedRoles : [form.sharedRole];
    const matchesRole = sharedRoleFilter === 'all' || roles.includes(sharedRoleFilter);
    const matchesEdited = matchesDateFilter(form.updatedAt, sharedEditedFilter);
    return matchesSearch && matchesRole && matchesEdited;
  });

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      !normalizedSubmissionsQuery ||
      submission.formTitle.toLowerCase().includes(normalizedSubmissionsQuery) ||
      submission.status.toLowerCase().replace('_', ' ').includes(normalizedSubmissionsQuery);
    const matchesStatus =
      submissionsStatusFilter === 'all' || submission.status === submissionsStatusFilter;
    const matchesDate = matchesDateFilter(submission.submittedAt, submissionsDateFilter);
    return matchesSearch && matchesStatus && matchesDate;
  });
  const selectedSubmission =
    filteredSubmissions.find((submission) => submission.submissionId === selectedSubmissionId) ||
    null;

  const reloadFormLists = async () => {
    try {
      const [myRes, sharedRes] = await Promise.all([
        api.get<{ forms: FormHeader[] }>('/api/forms'),
        api.get<{ forms: SharedFormHeader[] }>('/api/forms/shared'),
      ]);
      setForms(myRes.forms || []);
      setSharedForms(sharedRes.forms || []);
    } catch {
      // Keep UI responsive; failures will be handled by existing empty states.
    }
  };

  const handleRenameForm = async (formId: string, currentTitle: string) => {
    const nextTitle = window.prompt('Rename form', currentTitle);
    if (!nextTitle) return;
    try {
      await api.patch(`/api/forms/${formId}`, { title: nextTitle });
      await reloadFormLists();
    } catch (err) {
      window.alert((err as Error).message || 'Failed to rename form');
    }
  };


  return (
    <div className="flex min-h-screen flex-col bg-neutral-100 dark:bg-neutral-900">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-neutral-50 px-6 py-3 dark:bg-neutral-950/60">
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
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="h-3.5 w-3.5" />
                  User settings
                </Link>
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
      <main className="flex-1 bg-neutral-100 px-6 py-8 dark:bg-neutral-900">
        <div className="mx-auto w-full max-w-5xl">
          {/* ── Templates (top half) ── */}
          <div className="mb-4 pl-3 pt-2">
            <h2 className="text-xl font-semibold">Create From Template</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Start quickly using available templates.
            </p>
          </div>
          <div className="grid gap-10 pl-3 sm:grid-cols-2 lg:grid-cols-3">
            <div
              role="button"
              tabIndex={0}
              aria-label="Create form from blank template"
              onClick={() => {
                if (!creating) void handleCreateFromTemplate('blank');
              }}
              onKeyDown={(e) => {
                if (creating) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  void handleCreateFromTemplate('blank');
                }
              }}
              className="group w-full cursor-pointer border border-border bg-neutral-50 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-neutral-900/70"
              style={{ aspectRatio: '1.6 / 1' }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium">Blank</h3>
                <button
                  type="button"
                  title="Preview"
                  aria-label="Preview"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowBlankTemplatePreview((prev) => !prev);
                  }}
                  className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Start with an empty form and build from scratch.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating form...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Click card to use blank template
                  </>
                )}
              </div>
              {showBlankTemplatePreview && (
                <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  Blank template preview: one untitled page with no components, ready for full
                  customization.
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom half switcher ── */}
          <section className="mt-10 pl-3 pt-2">
            <div className="mb-3">
              <div className="flex flex-wrap items-end gap-5 border-b border-border pb-1">
                <button
                  type="button"
                  onClick={() => setBottomView('myForms')}
                  className={`border-b-2 pb-1 text-sm transition-colors ${bottomView === 'myForms'
                    ? 'border-foreground font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  My Forms
                </button>
                <button
                  type="button"
                  onClick={() => setBottomView('sharedForms')}
                  className={`border-b-2 pb-1 text-sm transition-colors ${bottomView === 'sharedForms'
                    ? 'border-foreground font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Shared With Me
                </button>
                <button
                  type="button"
                  onClick={() => setBottomView('mySubmissions')}
                  className={`border-b-2 pb-1 text-sm transition-colors ${bottomView === 'mySubmissions'
                    ? 'border-foreground font-medium text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                  My Submissions
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : null}

            <div>
              {!loading && bottomView === 'myForms' && (
                <div>
                  <>
                    <div className="mb-5 flex min-h-[1.75rem] items-center gap-1.5">
                      <div className="relative min-w-0 flex-1 max-w-xl">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 text-muted-foreground/70" />
                        <input
                          type="search"
                          value={myFormsQuery}
                          onChange={(e) => setMyFormsQuery(e.target.value)}
                          placeholder="Search my forms..."
                          className="h-7 w-full rounded-full border border-border/70 bg-muted/20 py-0 pr-3 pl-8 text-xs shadow-sm outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-background focus:shadow-md"
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 shrink-0 rounded-full border-border/70 bg-muted/20 p-0 shadow-sm hover:bg-muted/30"
                            aria-label="Filter my forms"
                            title="Filter"
                          >
                            <Funnel className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64 p-3">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase">
                                Status
                              </p>
                              <select
                                value={myFormsStatusFilter}
                                onChange={(e) =>
                                  setMyFormsStatusFilter(
                                    e.target.value as 'all' | 'published' | 'draft'
                                  )
                                }
                                className="h-9 w-full border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                              >
                                <option value="all">All status</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase">
                                Last Edited
                              </p>
                              <select
                                value={myFormsEditedFilter}
                                onChange={(e) =>
                                  setMyFormsEditedFilter(
                                    e.target.value as 'all' | 'last7' | 'last30' | 'older'
                                  )
                                }
                                className="h-9 w-full border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                              >
                                <option value="all">All edited dates</option>
                                <option value="last7">Edited last 7 days</option>
                                <option value="last30">Edited last 30 days</option>
                                <option value="older">Edited over 30 days ago</option>
                              </select>
                            </div>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <div className="ml-auto inline-flex h-7 shrink-0 items-center gap-0.5 rounded-none border border-border/70 bg-muted/20 p-0.5 shadow-sm">
                        <Button
                          size="sm"
                          variant={myFormsLayout === 'grid' ? 'secondary' : 'ghost'}
                          onClick={() => setMyFormsLayout('grid')}
                          className="h-6 rounded-none px-1.5"
                          aria-label="My forms grid view"
                        >
                          <LayoutGrid className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={myFormsLayout === 'list' ? 'secondary' : 'ghost'}
                          onClick={() => setMyFormsLayout('list')}
                          className="h-6 rounded-none px-1.5"
                          aria-label="My forms list view"
                        >
                          <List className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {filteredForms.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-20 text-center">
                        <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          {forms.length === 0
                            ? 'No forms yet. Create your first one from Blank template.'
                            : 'No forms match your search.'}
                        </p>
                      </div>
                    ) : (
                      <>
                        {myFormsLayout === 'list' && (
                          <div
                            className={`mb-2 grid ${MY_FORMS_LIST_COLUMNS} items-center gap-3 px-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase`}
                          >
                            <span>Form</span>
                            <span>Creator</span>
                            <span>Last Edited</span>
                            <span>Status</span>
                            <span>Actions</span>
                          </div>
                        )}
                        <div
                          className={
                            myFormsLayout === 'grid'
                              ? 'grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
                              : 'flex flex-col'
                          }
                        >
                          {filteredForms.map((form) => (
                            <div
                              key={form.formId}
                              className={`group border border-border bg-neutral-50 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg dark:bg-neutral-900/70 ${myFormsLayout === 'grid'
                                ? 'flex h-full w-full flex-col gap-1 p-2.5'
                                : `grid ${MY_FORMS_LIST_COLUMNS} items-center gap-3 p-3`
                                }`}
                              style={myFormsLayout === 'grid' ? { aspectRatio: '1.6 / 1' } : undefined}
                            >
                              <button
                                onClick={() => navigate(`/form-builder/${form.formId}`)}
                                className={`text-left ${myFormsLayout === 'grid'
                                  ? 'flex flex-col items-start gap-1'
                                  : 'truncate text-sm font-medium transition-colors group-hover:text-primary'
                                  }`}
                              >
                                {myFormsLayout === 'grid' ? (
                                  <>
                                    <h3 className="text-sm font-medium transition-colors group-hover:text-primary">
                                      {form.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                      {getCreatorLabel(form, 'Unknown')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDate(form.updatedAt)}
                                    </p>
                                  </>
                                ) : (
                                  form.title
                                )}
                              </button>

                              {myFormsLayout === 'list' ? (
                                <>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {getCreatorLabel(form, 'Unknown')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(form.updatedAt)}
                                  </p>
                                  <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    <span
                                      className={`h-1.5 w-1.5 rounded-full ${form.isActive ? 'bg-green-500' : 'bg-neutral-300'
                                        }`}
                                    />
                                    {form.isActive ? 'Published' : 'Draft'}
                                  </span>
                                </>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${form.isActive ? 'bg-green-500' : 'bg-neutral-300'
                                      }`}
                                  />
                                  <span className="text-[10px] text-muted-foreground">
                                    {form.isActive ? 'Published' : 'Draft'}
                                  </span>
                                </div>
                              )}

                              <div
                                className={
                                  myFormsLayout === 'grid'
                                    ? 'mt-auto border-t border-border pt-2'
                                    : 'justify-self-end'
                                }
                              >
                                <div className="flex items-center gap-1">
                                  <div className="group/tip relative">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => navigate(`/reviews/${form.formId}`)}
                                      aria-label="View Submissions"
                                    >
                                      <Inbox className="h-3.5 w-3.5" />
                                    </Button>
                                    <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 shadow transition-opacity group-hover/tip:opacity-100">Submissions</span>
                                  </div>
                                  <div className="group/tip relative">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => navigate(`/forms/${form.formId}/preview`)}
                                      aria-label="Preview Form"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Button>
                                    <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 shadow transition-opacity group-hover/tip:opacity-100">Preview</span>
                                  </div>
                                  <div className="group/tip relative">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() => void handleRenameForm(form.formId, form.title)}
                                      aria-label="Rename Form"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 shadow transition-opacity group-hover/tip:opacity-100">Rename</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                </div>
              )}

              {!loading && bottomView === 'sharedForms' && (
                <div>
                  <>
                    <div className="mb-5 flex min-h-[1.75rem] items-center gap-1.5">
                      <div className="relative min-w-0 flex-1 max-w-xl">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 text-muted-foreground/70" />
                        <input
                          type="search"
                          value={sharedFormsQuery}
                          onChange={(e) => setSharedFormsQuery(e.target.value)}
                          placeholder="Search shared forms..."
                          className="h-7 w-full rounded-full border border-border/70 bg-muted/20 py-0 pr-3 pl-8 text-xs shadow-sm outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-background focus:shadow-md"
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 shrink-0 rounded-full border-border/70 bg-muted/20 p-0 shadow-sm hover:bg-muted/30"
                            aria-label="Filter shared forms"
                            title="Filter"
                          >
                            <Funnel className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64 p-3">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase">
                                Role
                              </p>
                              <select
                                value={sharedRoleFilter}
                                onChange={(e) =>
                                  setSharedRoleFilter(e.target.value as 'all' | 'editor' | 'reviewer')
                                }
                                className="h-9 w-full border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                              >
                                <option value="all">All roles</option>
                                <option value="editor">Editor</option>
                                <option value="reviewer">Reviewer</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase">
                                Last Edited
                              </p>
                              <select
                                value={sharedEditedFilter}
                                onChange={(e) =>
                                  setSharedEditedFilter(
                                    e.target.value as 'all' | 'last7' | 'last30' | 'older'
                                  )
                                }
                                className="h-9 w-full border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                              >
                                <option value="all">All edited dates</option>
                                <option value="last7">Edited last 7 days</option>
                                <option value="last30">Edited last 30 days</option>
                                <option value="older">Edited over 30 days ago</option>
                              </select>
                            </div>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <div className="ml-auto inline-flex h-7 shrink-0 items-center gap-0.5 rounded-none border border-border/70 bg-muted/20 p-0.5 shadow-sm">
                        <Button
                          size="sm"
                          variant={sharedFormsLayout === 'grid' ? 'secondary' : 'ghost'}
                          onClick={() => setSharedFormsLayout('grid')}
                          className="h-6 rounded-none px-1.5"
                          aria-label="Shared forms grid view"
                        >
                          <LayoutGrid className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant={sharedFormsLayout === 'list' ? 'secondary' : 'ghost'}
                          onClick={() => setSharedFormsLayout('list')}
                          className="h-6 rounded-none px-1.5"
                          aria-label="Shared forms list view"
                        >
                          <List className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {filteredSharedForms.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12 text-center">
                        <FileText className="mb-3 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          {sharedForms.length === 0
                            ? 'No forms shared with you yet.'
                            : 'No shared forms match your search.'}
                        </p>
                      </div>
                    ) : (
                      <>
                        {sharedFormsLayout === 'list' && (
                          <div
                            className={`mb-2 grid ${SHARED_FORMS_LIST_COLUMNS} items-center gap-3 px-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase`}
                          >
                            <span>Form</span>
                            <span>Creator</span>
                            <span>Last Edited</span>
                            <span>Role</span>
                          </div>
                        )}
                        <div
                          className={
                            sharedFormsLayout === 'grid'
                              ? 'grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
                              : 'flex flex-col'
                          }
                        >
                          {filteredSharedForms.map((form) => (
                            <div
                              key={form.formId}
                              className={`border border-border bg-neutral-50 shadow-sm dark:bg-neutral-900/70 ${sharedFormsLayout === 'grid'
                                ? 'h-full w-full p-2.5'
                                : `grid ${SHARED_FORMS_LIST_COLUMNS} items-center gap-3 p-3`
                                }`}
                              style={
                                sharedFormsLayout === 'grid'
                                  ? { aspectRatio: '1.6 / 1' }
                                  : undefined
                              }
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
                                className={sharedFormsLayout === 'grid' ? 'cursor-pointer' : 'cursor-pointer truncate text-sm font-medium'}
                              >
                                {sharedFormsLayout === 'grid' ? (
                                  <>
                                    <div className="flex w-full items-start justify-between">
                                      <h3 className="text-sm font-medium">{form.title}</h3>
                                      <span className="ml-2 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                        {getSharedRoleLabel(form)}
                                      </span>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">
                                      {getCreatorLabel(form)}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {formatDate(form.updatedAt)}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {form.submissionCount} submission
                                      {form.submissionCount === 1 ? '' : 's'}
                                    </p>
                                    <p className="mt-2 text-[11px] text-muted-foreground">
                                      Click to view actions
                                    </p>
                                  </>
                                ) : (
                                  form.title
                                )}
                              </div>

                              {sharedFormsLayout === 'list' && (
                                <>
                                  <p className="truncate text-xs text-muted-foreground">
                                    {getCreatorLabel(form)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(form.updatedAt)}
                                  </p>
                                  <span className="text-[10px] text-muted-foreground">
                                    {getSharedRoleLabel(form)}
                                  </span>
                                </>
                              )}

                              {activeSharedFormId === form.formId && (
                                <div
                                  className={`space-y-2 border-t border-border pt-3 ${sharedFormsLayout === 'grid'
                                    ? 'mt-3'
                                    : 'col-span-full mt-1'
                                    }`}
                                >
                                  {canSharedUserEditForm(form) && (
                                    <Button
                                      className="w-full rounded-none"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => navigate(`/form-builder/${form.formId}`)}
                                    >
                                      Edit Form
                                    </Button>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <div className="group/tip relative">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={() => navigate(`/reviews/${form.formId}`)}
                                        aria-label="View Submissions"
                                      >
                                        <Inbox className="h-3.5 w-3.5" />
                                      </Button>
                                      <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 shadow transition-opacity group-hover/tip:opacity-100">Submissions</span>
                                    </div>
                                    <div className="group/tip relative">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={() => navigate(`/forms/${form.formId}/preview`)}
                                        aria-label="Preview Form"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </Button>
                                      <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 shadow transition-opacity group-hover/tip:opacity-100">Preview</span>
                                    </div>
                                    {canSharedUserEditForm(form) && (
                                      <div className="group/tip relative">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 w-7 p-0"
                                          onClick={() => void handleRenameForm(form.formId, form.title)}
                                          aria-label="Rename Form"
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 shadow transition-opacity group-hover/tip:opacity-100">Rename</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                </div>
              )}

              {!loading && bottomView === 'mySubmissions' && (
                <div>
                  <>
                    <div className="mb-5 flex min-h-[1.75rem] items-center gap-1.5">
                      <div className="relative min-w-0 flex-1 max-w-xl">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 text-muted-foreground/70" />
                        <input
                          type="search"
                          value={submissionsQuery}
                          onChange={(e) => setSubmissionsQuery(e.target.value)}
                          placeholder="Search submissions..."
                          className="h-7 w-full rounded-full border border-border/70 bg-muted/20 py-0 pr-3 pl-8 text-xs shadow-sm outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-background focus:shadow-md"
                        />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 shrink-0 rounded-full border-border/70 bg-muted/20 p-0 shadow-sm hover:bg-muted/30"
                            aria-label="Filter submissions"
                            title="Filter"
                          >
                            <Funnel className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-64 p-3">
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase">
                                Status
                              </p>
                              <select
                                value={submissionsStatusFilter}
                                onChange={(e) => setSubmissionsStatusFilter(e.target.value)}
                                className="h-9 w-full border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                              >
                                <option value="all">All statuses</option>
                                {submissionStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {status.replace('_', ' ')}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[11px] font-medium text-muted-foreground uppercase">
                                Submitted Date
                              </p>
                              <select
                                value={submissionsDateFilter}
                                onChange={(e) =>
                                  setSubmissionsDateFilter(
                                    e.target.value as 'all' | 'last7' | 'last30' | 'older'
                                  )
                                }
                                className="h-9 w-full border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                              >
                                <option value="all">All submitted dates</option>
                                <option value="last7">Submitted last 7 days</option>
                                <option value="last30">Submitted last 30 days</option>
                                <option value="older">Submitted over 30 days ago</option>
                              </select>
                            </div>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {filteredSubmissions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12 text-center">
                        <Inbox className="mb-3 h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          {submissions.length === 0
                            ? 'No submissions yet.'
                            : 'No submissions match your search.'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-border bg-neutral-50 dark:bg-neutral-900/70">
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
                            {filteredSubmissions.map((sub) => (
                              <tr
                                key={sub.submissionId}
                                className={`cursor-pointer border-b border-border last:border-0 hover:bg-muted/20 ${selectedSubmissionId === sub.submissionId ? 'bg-muted/30' : ''
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
                                      className={`h-1.5 w-1.5 rounded-full ${statusColor[sub.status] || 'bg-neutral-400'
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
                </div>
              )}
            </div>
          </section>

          {bottomView === 'mySubmissions' && selectedSubmission && (
            <section className="mt-6 rounded-lg border border-border bg-neutral-50 p-4 dark:bg-neutral-900/70">
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
        </div>
      </main>
    </div>
  );
}
