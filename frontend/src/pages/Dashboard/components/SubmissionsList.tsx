import { useState } from 'react';
import { Search, Funnel, Inbox, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MySubmission } from '../types';
import { formatDate, matchesDateFilter, statusColor, formatResponseValue } from '../utils';
import { API_BASE } from '@/lib/api';

interface Props {
  submissions: MySubmission[];
}

export default function SubmissionsList({ submissions }: Props) {
  const [submissionsQuery, setSubmissionsQuery] = useState('');
  const [submissionsStatusFilter, setSubmissionsStatusFilter] = useState<'all' | string>('all');
  const [submissionsDateFilter, setSubmissionsDateFilter] = useState<'all' | 'last7' | 'last30' | 'older'>('all');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [exportingSubmissionCsv, setExportingSubmissionCsv] = useState(false);
  const [submissionDetailError, setSubmissionDetailError] = useState('');

  const normalizedSubmissionsQuery = submissionsQuery.trim().toLowerCase();
  const submissionStatuses = Array.from(new Set(submissions.map((s) => s.status))).sort();

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

  return (
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

      {selectedSubmission && (
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
    </>
  );
}
