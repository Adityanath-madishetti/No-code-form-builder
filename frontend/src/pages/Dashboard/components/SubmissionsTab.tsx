import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Funnel, Inbox } from 'lucide-react';
import type { MySubmission } from '../dashboard.types';
import { formatDate, matchesDateFilter } from '../dashboard.utils';

interface Props {
  submissions: MySubmission[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const statusColor: Record<string, string> = {
  submitted: 'bg-blue-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  under_review: 'bg-amber-500',
  draft: 'bg-neutral-400',
};

export default function SubmissionsTab({
  submissions,
  selectedId,
  onSelect,
}: Props) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all');
  const [dateFilter, setDateFilter] = useState<
    'all' | 'last7' | 'last30' | 'older'
  >('all');

  const submissionStatuses = Array.from(
    new Set(submissions.map((s) => s.status))
  ).sort();
  const normalizedQuery = query.trim().toLowerCase();

  const filtered = submissions.filter((sub) => {
    const matchesSearch =
      !normalizedQuery ||
      sub.formTitle.toLowerCase().includes(normalizedQuery) ||
      sub.status.toLowerCase().replace('_', ' ').includes(normalizedQuery);

    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    const matchesDate = matchesDateFilter(sub.submittedAt, dateFilter);

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <>
      <div className="mb-5 flex min-h-[1.75rem] items-center gap-1.5">
        <div className="relative max-w-xl min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 text-muted-foreground/70" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search submissions..."
            className="h-7 w-full rounded-full border border-border/70 bg-muted/20 py-0 pr-3 pl-8 text-xs outline-none focus:border-primary/60 focus:bg-background"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 rounded-full p-0"
            >
              <Funnel className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-3">
            <div className="space-y-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 w-full border bg-background px-2 text-sm"
              >
                <option value="all">All statuses</option>
                {submissionStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
              <select
                value={dateFilter}
                onChange={(e) =>
                  setDateFilter(
                    e.target.value as React.SetStateAction<
                      'all' | 'last7' | 'last30' | 'older'
                    >
                  )
                }
                className="h-9 w-full border bg-background px-2 text-sm"
              >
                <option value="all">All dates</option>
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
                <option value="older">Older than 30 days</option>
              </select>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 text-center">
          <Inbox className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {submissions.length === 0
              ? 'No submissions yet.'
              : 'No submissions match your search.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-neutral-50 dark:bg-neutral-900/70">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  Form
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  Submitted
                </th>
                <th className="px-4 py-2.5 font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => (
                <tr
                  key={sub.submissionId}
                  className={`cursor-pointer border-b last:border-0 hover:bg-muted/20 ${selectedId === sub.submissionId ? 'bg-muted/30' : ''}`}
                  onClick={() => onSelect(sub.submissionId)}
                >
                  <td className="px-4 py-3 font-medium">{sub.formTitle}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(sub.submittedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${statusColor[sub.status] || 'bg-neutral-400'}`}
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
  );
}
