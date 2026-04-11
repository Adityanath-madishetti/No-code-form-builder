import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE, api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Inbox, RefreshCw, Download } from 'lucide-react';

interface SubmissionResponse {
  componentId: string;
  response: unknown;
}

interface SubmissionPage {
  pageNo: number;
  responses: SubmissionResponse[];
}

interface SubmissionRecord {
  submissionId: string;
  formId: string;
  version: number;
  submittedBy: string | null;
  email: string | null;
  status: string;
  createdAt: string;
  pages: SubmissionPage[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ListSubmissionsResponse {
  form: {
    formId: string;
    title: string;
  };
  submissions: SubmissionRecord[];
  pagination: Pagination;
}

interface SubmissionDetailResponse {
  submission: SubmissionRecord;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatResponse(value: unknown): string {
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
}

function mapErrorMessage(errorMessage: string): string {
  if (/no token|invalid or expired token|authentication required/i.test(errorMessage)) {
    return 'Please log in to review submissions.';
  }
  if (/access denied/i.test(errorMessage)) {
    return 'You do not have access to review submissions for this form.';
  }
  if (/form not found|submission not found/i.test(errorMessage)) {
    return 'This form or submission no longer exists.';
  }
  return errorMessage || 'Failed to load submissions.';
}

export default function FormReview() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const [formTitle, setFormTitle] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionRecord | null>(
    null
  );
  const [detailError, setDetailError] = useState('');
  const [exporting, setExporting] = useState(false);

  const loadSubmissions = useCallback(
    async (page: number, keepSelection = false) => {
      if (!formId) return;
      setLoading(true);
      setError('');
      setDetailError('');
      if (!keepSelection) {
        setSelectedSubmission(null);
      }

      try {
        const res = await api.get<ListSubmissionsResponse>(
          `/api/forms/${formId}/submissions?page=${page}&limit=20`
        );

        setFormTitle(res.form?.title || 'Shared Form');
        setSubmissions(res.submissions || []);
        setPagination(
          res.pagination || {
            page,
            limit: 20,
            total: 0,
            totalPages: 0,
          }
        );
      } catch (err) {
        setError(mapErrorMessage((err as Error).message || ''));
      } finally {
        setLoading(false);
      }
    },
    [formId]
  );

  useEffect(() => {
    loadSubmissions(1);
  }, [loadSubmissions]);

  useEffect(() => {
    document.title = formTitle
      ? `${formTitle} Submissions — Form Builder`
      : 'Review Submissions — Form Builder';
  }, [formTitle]);

  const openSubmissionDetail = useCallback(
    async (submissionId: string) => {
      if (!formId) return;
      setDetailLoading(true);
      setDetailError('');

      try {
        const res = await api.get<SubmissionDetailResponse>(
          `/api/forms/${formId}/submissions/${submissionId}`
        );
        setSelectedSubmission(res.submission);
      } catch (err) {
        setDetailError(mapErrorMessage((err as Error).message || ''));
      } finally {
        setDetailLoading(false);
      }
    },
    [formId]
  );

  const selectedSubmissionId = selectedSubmission?.submissionId;
  const canGoPrev = pagination.page > 1;
  const canGoNext = pagination.page < pagination.totalPages;

  const submissionCountLabel = useMemo(() => {
    if (pagination.total === 1) return '1 submission';
    return `${pagination.total} submissions`;
  }, [pagination.total]);

  const handleExportCsv = useCallback(async () => {
    if (!formId) return;
    setExporting(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE}/api/forms/${formId}/submissions/export.csv`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

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
      anchor.download = `form-${formId}-submissions.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(mapErrorMessage((err as Error).message || ''));
    } finally {
      setExporting(false);
    }
  }, [formId]);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Submission Review</h1>
          <p className="text-sm text-muted-foreground">{formTitle || 'Shared form'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Dashboard
        </Button>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{submissionCountLabel}</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={exporting || loading}
            >
              {exporting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 h-4 w-4" />
              )}
              Export CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadSubmissions(pagination.page, true)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16 text-center">
            <Inbox className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Submission ID</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Submitted</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">Email / UID</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr
                    key={submission.submissionId}
                    className={`cursor-pointer border-b border-border last:border-0 hover:bg-muted/20 ${
                      selectedSubmissionId === submission.submissionId ? 'bg-muted/30' : ''
                    }`}
                    onClick={() => openSubmissionDetail(submission.submissionId)}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{submission.submissionId}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(submission.createdAt)}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {submission.status.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {submission.email || submission.submittedBy || 'Anonymous'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && submissions.length > 0 && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSubmissions(pagination.page - 1)}
              disabled={!canGoPrev}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {pagination.page} / {Math.max(1, pagination.totalPages)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadSubmissions(pagination.page + 1)}
              disabled={!canGoNext}
            >
              Next
            </Button>
          </div>
        )}

        {(selectedSubmission || detailLoading || detailError) && (
          <section className="mt-8 rounded-lg border border-border bg-background p-5">
            <h2 className="text-base font-semibold">Submission Details</h2>

            {detailLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading submission...
              </div>
            ) : detailError ? (
              <p className="mt-4 text-sm text-destructive">{detailError}</p>
            ) : selectedSubmission ? (
              <div className="mt-4 space-y-5">
                <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  <p>
                    <span className="font-medium text-foreground">Submission ID:</span>{' '}
                    <span className="font-mono text-xs">{selectedSubmission.submissionId}</span>
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Submitted:</span>{' '}
                    {formatDate(selectedSubmission.createdAt)}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Status:</span>{' '}
                    {selectedSubmission.status.replace('_', ' ')}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Identity:</span>{' '}
                    {selectedSubmission.email || selectedSubmission.submittedBy || 'Anonymous'}
                  </p>
                </div>

                <div className="space-y-4">
                  {selectedSubmission.pages.map((page) => (
                    <div key={page.pageNo} className="rounded border border-border p-3">
                      <h3 className="mb-3 text-sm font-medium">Page {page.pageNo}</h3>
                      {page.responses.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No responses.</p>
                      ) : (
                        <div className="space-y-3">
                          {page.responses.map((response) => (
                            <div key={`${page.pageNo}-${response.componentId}`}>
                              <p className="text-xs font-medium text-muted-foreground">
                                {response.componentId}
                              </p>
                              <pre className="mt-1 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/40 p-2 text-xs">
                                {formatResponse(response.response)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
}
