import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock3, FileText, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface FormHeader {
  formId: string;
  title: string;
  updatedAt: string;
}

interface MySubmission {
  submissionId: string;
  formTitle: string;
  submittedAt: string;
  status: string;
}

export default function ActivityPage() {
  const [forms, setForms] = useState<FormHeader[]>([]);
  const [submissions, setSubmissions] = useState<MySubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Activity — Form Builder';
    Promise.all([
      api
        .get<{ forms: FormHeader[] }>('/api/forms')
        .then((res) => setForms(res.forms || []))
        .catch(() => {}),
      api
        .get<{ submissions: MySubmission[] }>('/api/submissions/mine')
        .then((res) => setSubmissions(res.submissions || []))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const recentForms = useMemo(
    () =>
      [...forms]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 8),
    [forms]
  );

  const recentSubmissions = useMemo(
    () =>
      [...submissions]
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 8),
    [submissions]
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="pl-0">
            <Link to="/settings">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Settings
            </Link>
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-lg font-semibold">Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quick view of recently edited forms and submissions.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading activity...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <section className="border border-border bg-neutral-50 p-4 shadow-sm dark:bg-neutral-900/70">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Recent Forms</h2>
              </div>
              {recentForms.length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent form updates.</p>
              ) : (
                <ul className="space-y-2">
                  {recentForms.map((form) => (
                    <li key={form.formId} className="border border-border bg-background p-3">
                      <p className="truncate text-sm font-medium">{form.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Updated {formatDate(form.updatedAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="border border-border bg-neutral-50 p-4 shadow-sm dark:bg-neutral-900/70">
              <div className="mb-3 flex items-center gap-2">
                <Inbox className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Recent Submissions</h2>
              </div>
              {recentSubmissions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No submissions yet.</p>
              ) : (
                <ul className="space-y-2">
                  {recentSubmissions.map((submission) => (
                    <li
                      key={submission.submissionId}
                      className="border border-border bg-background p-3"
                    >
                      <p className="truncate text-sm font-medium">{submission.formTitle}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock3 className="h-3 w-3" />
                        {formatDate(submission.submittedAt)}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground capitalize">
                        {submission.status.replace('_', ' ')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
