// src/pages/Home.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Plus, FileText, LogOut, Loader2, Inbox, Eye } from 'lucide-react';

interface FormHeader {
  formId: string;
  title: string;
  currentVersion: number;
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
}

interface SharedFormHeader extends FormHeader {
  sharedRole: 'reviewer';
  submissionCount: number;
}

interface MySubmission {
  submissionId: string;
  formId: string;
  formTitle: string;
  version: number;
  status: string;
  submittedAt: string;
}

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormHeader[]>([]);
  const [sharedForms, setSharedForms] = useState<SharedFormHeader[]>([]);
  const [submissions, setSubmissions] = useState<MySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

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

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border bg-background px-6 py-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <img src="/logo.png" alt="Form Builder" className="h-6 w-6" />
          Form Builder
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-1.5 h-3.5 w-3.5" />
            Logout
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {/* ── My Forms ── */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">My Forms</h2>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-1.5 h-4 w-4" />
            )}
            Create Form
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-20 text-center">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              No forms yet. Create your first one!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <button
                key={form.formId}
                onClick={() => navigate(`/form-builder/${form.formId}`)}
                className="group flex flex-col items-start gap-2 rounded-lg border border-border bg-background p-4 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex w-full items-start justify-between">
                  <h3 className="text-sm font-medium group-hover:text-primary transition-colors">
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
            ))}
          </div>
        )}

        {/* ── Forms Shared With You ── */}
        <div className="mt-12 mb-6">
          <h2 className="text-xl font-semibold">
            Forms Shared With You ({sharedForms.length})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Forms assigned to you as reviewer.
          </p>
        </div>

        {loading ? null : sharedForms.length === 0 ? (
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
                <div className="flex w-full items-start justify-between">
                  <h3 className="text-sm font-medium">{form.title}</h3>
                  <span className="ml-2 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Reviewer
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Updated {formatDate(form.updatedAt)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {form.submissionCount} submission
                  {form.submissionCount === 1 ? '' : 's'}
                </p>
                <Button
                  className="mt-3 w-full"
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/reviews/${form.formId}`)}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  View Submissions
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* ── My Submissions ── */}
        <div className="mt-12 mb-6">
          <h2 className="text-xl font-semibold">My Submissions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Forms you have filled and submitted.
          </p>
        </div>

        {loading ? null : submissions.length === 0 ? (
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
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Submitted</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.submissionId} className="border-b border-border last:border-0">
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
      </main>
    </div>
  );
}
