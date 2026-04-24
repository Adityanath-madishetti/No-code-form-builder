import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { API_BASE, api } from '@/lib/api';
import { cn } from '@/lib/utils';
import EmbedSubmissionView from '@/components/EmbedSubmissionView';
import type {
  PublicFormData,
  PublicLogicData,
  PublicPageData,
  VersionSettings,
} from '@/form/renderer/viewRenderer/runtimeForm.types';

// Shadcn UI & Icons
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  ArrowLeft,
  Inbox,
  RefreshCw,
  Download,
  Search,
  Calendar as CalendarIcon,
} from 'lucide-react';

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

interface VersionData {
  formId: string;
  version: number;
  meta: { name: string; description: string };
  settings: VersionSettings;
  pages: PublicPageData[];
  logic?: PublicLogicData;
  theme: PublicFormData['version']['theme'];
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

function mapErrorMessage(errorMessage: string): string {
  if (
    /no token|invalid or expired token|authentication required/i.test(
      errorMessage
    )
  ) {
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

  // Backend Data States
  const [formTitle, setFormTitle] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Frontend Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Frontend Pagination States
  const [localPage, setLocalPage] = useState(1);
  const itemsPerPage = 20;

  // Detail View States
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionRecord | null>(null);
  const [detailError, setDetailError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [reviewFormSchema, setReviewFormSchema] =
    useState<PublicFormData | null>(null);
  const [reviewFormSchemaError, setReviewFormSchemaError] = useState('');

  // Load submissions (Using a larger limit to enable full frontend filtering)
  const loadSubmissions = useCallback(
    async (keepSelection = false) => {
      if (!formId) return;
      setLoading(true);
      setError('');
      setDetailError('');
      if (!keepSelection) {
        setSelectedSubmission(null);
      }

      try {
        const res = await api.get<ListSubmissionsResponse>(
          `/api/forms/${formId}/submissions?page=1&limit=1000` // Increased limit for frontend logic
        );

        setFormTitle(res.form?.title || 'Shared Form');
        setSubmissions(res.submissions || []);
      } catch (err) {
        setError(mapErrorMessage((err as Error).message || ''));
      } finally {
        setLoading(false);
      }
    },
    [formId]
  );

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    if (!formId) return;

    setReviewFormSchema(null);
    setReviewFormSchemaError('');

    api
      .get<{ version: VersionData }>(`/api/forms/${formId}/versions/latest`)
      .then((res) => {
        const versionData = res.version;
        const normalizedSchema: PublicFormData = {
          form: {
            formId: versionData.formId || formId,
            title: versionData.meta?.name || 'Submission Review',
          },
          version: {
            ...versionData,
            settings: versionData.settings || {
              submissionPolicy: 'none',
              collectEmailMode: 'none',
              canViewOwnSubmission: false,
            },
          },
        };
        setReviewFormSchema(normalizedSchema);
      })
      .catch((err) => {
        setReviewFormSchemaError(
          mapErrorMessage(
            (err as Error).message || 'Failed to load form schema.'
          )
        );
      });
  }, [formId]);

  useEffect(() => {
    document.title = formTitle
      ? `${formTitle} Submissions — Form Builder`
      : 'Review Submissions — Form Builder';
  }, [formTitle]);

  // Frontend filtering logic
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Search filter
      const matchesSearch =
        !searchQuery ||
        sub.submissionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sub.email &&
          sub.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sub.submittedBy &&
          sub.submittedBy.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Status filter
      const matchesStatus =
        statusFilter === 'all' || sub.status === statusFilter;

      // 3. Date Range filter
      let matchesDate = true;
      if (dateRange?.from) {
        const subDate = new Date(sub.createdAt);
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0); // Start of day

        if (subDate < fromDate) matchesDate = false;

        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999); // End of day
          if (subDate > toDate) matchesDate = false;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [submissions, searchQuery, statusFilter, dateRange]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setLocalPage(1);
  }, [searchQuery, statusFilter, dateRange]);

  // Frontend pagination logic
  const paginatedSubmissions = useMemo(() => {
    const start = (localPage - 1) * itemsPerPage;
    return filteredSubmissions.slice(start, start + itemsPerPage);
  }, [filteredSubmissions, localPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubmissions.length / itemsPerPage)
  );
  const canGoPrev = localPage > 1;
  const canGoNext = localPage < totalPages;

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

  const submissionCountLabel = useMemo(() => {
    if (filteredSubmissions.length === 1) return '1 submission';
    return `${filteredSubmissions.length} submissions`;
  }, [filteredSubmissions.length]);

  const handleExportCsv = useCallback(async () => {
    if (!formId) return;
    setExporting(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(
        `${API_BASE}/api/forms/${formId}/submissions/export.csv`,
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

  // Dynamically extract unique statuses from submissions for the filter dropdown
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(submissions.map((s) => s.status));
    return Array.from(statuses);
  }, [submissions]);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Submission Review</h1>
          <p className="text-sm text-muted-foreground">
            {formTitle || 'Shared form'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Dashboard
        </Button>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        {/* TOP ACTIONS */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {submissionCountLabel}
          </p>
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
              onClick={() => loadSubmissions(true)}
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

        {/* FILTERS BAR */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, email, or user..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            disabled={loading}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {uniqueStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status
                    .replace('_', ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal sm:w-[260px]',
                  !dateRange && 'text-muted-foreground'
                )}
                disabled={loading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} -{' '}
                      {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* SUBMISSIONS TABLE */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-16 text-center">
            <Inbox className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {submissions.length > 0
                ? 'No submissions match your filters.'
                : 'No submissions yet.'}
            </p>
            {submissions.length > 0 && (
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setDateRange(undefined);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">
                    Submission ID
                  </th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">
                    Submitted
                  </th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-2.5 font-medium text-muted-foreground">
                    Email / UID
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubmissions.map((submission) => (
                  <tr
                    key={submission.submissionId}
                    className={`cursor-pointer border-b border-border last:border-0 hover:bg-muted/20 ${
                      selectedSubmissionId === submission.submissionId
                        ? 'bg-muted/30'
                        : ''
                    }`}
                    onClick={() =>
                      openSubmissionDetail(submission.submissionId)
                    }
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {submission.submissionId}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(submission.createdAt)}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {submission.status.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {submission.email ||
                        submission.submittedBy ||
                        'Anonymous'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION CONTROLS */}
        {!loading && !error && filteredSubmissions.length > 0 && (
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocalPage((p) => Math.max(1, p - 1))}
              disabled={!canGoPrev}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {localPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocalPage((p) => Math.min(totalPages, p + 1))}
              disabled={!canGoNext}
            >
              Next
            </Button>
          </div>
        )}

        {/* DETAIL VIEW */}
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
                    <span className="font-medium text-foreground">
                      Submission ID:
                    </span>{' '}
                    <span className="font-mono text-xs">
                      {selectedSubmission.submissionId}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Submitted:
                    </span>{' '}
                    {formatDate(selectedSubmission.createdAt)}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Status:</span>{' '}
                    {selectedSubmission.status.replace('_', ' ')}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">
                      Identity:
                    </span>{' '}
                    {selectedSubmission.email ||
                      selectedSubmission.submittedBy ||
                      'Anonymous'}
                  </p>
                </div>
                {reviewFormSchemaError ? (
                  <p className="text-sm text-destructive">
                    {reviewFormSchemaError}
                  </p>
                ) : reviewFormSchema ? (
                  <div className="overflow-hidden rounded-md border border-border">
                    <EmbedSubmissionView
                      formSchema={reviewFormSchema}
                      responseData={selectedSubmission.pages}
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading form schema...
                  </div>
                )}
              </div>
            ) : null}
          </section>
        )}
      </main>
    </div>
  );
}
