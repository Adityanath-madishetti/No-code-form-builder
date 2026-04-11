import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock3, FileText, Inbox, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

// shadcn components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'submitted':
      return {
        variant: 'default' as const,
        className:
          'bg-blue-600 text-white hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-700',
      };
    case 'approved':
      return {
        variant: 'default' as const,
        className:
          'bg-green-600 text-white hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-700',
      };
    case 'rejected':
      return {
        variant: 'destructive' as const,
        className: '',
      };
    case 'under_review':
      return {
        variant: 'default' as const,
        className:
          'bg-amber-600 text-white hover:bg-amber-600 dark:bg-amber-700 dark:hover:bg-amber-700',
      };
    case 'draft':
    default:
      return {
        variant: 'secondary' as const,
        className: '',
      };
  }
};

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
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 8),
    [forms]
  );

  const recentSubmissions = useMemo(
    () =>
      [...submissions]
        .sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime()
        )
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
    <div className="min-h-screen h-auto bg-neutral-100 dark:bg-neutral-900">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="mb-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="pl-0 text-muted-foreground hover:text-foreground"
          >
            <Link to="/settings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Link>
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Activity
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Quick view of recently edited forms and submissions.
          </p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-3 text-sm font-medium text-muted-foreground">
              Loading activity...
            </span>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Recent Forms Card */}
            <Card className="flex h-full flex-col shadow-sm">
              <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    Recent Forms
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-4">
                {recentForms.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-background/50 py-12 text-center">
                    <div className="mb-3 rounded-full bg-muted p-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      No recent form updates.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {recentForms.map((form) => (
                      <li
                        key={form.formId}
                        className="group flex flex-col justify-between rounded-lg border bg-card p-3 transition-colors hover:border-primary/40"
                      >
                        <p className="truncate text-sm font-medium text-foreground">
                          {form.title}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          Updated {formatDate(form.updatedAt)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Recent Submissions Card */}
            <Card className="flex h-full flex-col shadow-sm">
              <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                    <Inbox className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    Recent Submissions
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-4">
                {recentSubmissions.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-background/50 py-12 text-center">
                    <div className="mb-3 rounded-full bg-muted p-3">
                      <Inbox className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      No submissions yet.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {recentSubmissions.map((submission) => {
                      const badgeProps = getStatusBadge(submission.status);

                      return (
                        <li
                          key={submission.submissionId}
                          className="group flex flex-col rounded-lg border bg-card p-3 transition-colors hover:border-primary/40"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-medium text-foreground">
                              {submission.formTitle}
                            </p>
                            <Badge
                              variant={badgeProps.variant}
                              className={`pointer-events-none h-5 shrink-0 px-1.5 text-[10px] capitalize ${badgeProps.className}`}
                            >
                              {submission.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock3 className="h-3.5 w-3.5" />
                            {formatDate(submission.submittedAt)}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
