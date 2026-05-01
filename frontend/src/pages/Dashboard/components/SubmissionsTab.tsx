import { useState, useEffect, useRef } from 'react';
import { Search, Inbox } from 'lucide-react';

// shadcn components
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { MySubmission } from '../dashboard.types';
import { formatDate, matchesDateFilter } from '../dashboard.utils';

const LIST_COLUMNS = 'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1fr)]';

interface Props {
  submissions: MySubmission[];
  selectedId: string | null;
  onSelect: (id: string) => void;
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

  const [visibleCount, setVisibleCount] = useState(12);
  const observerTarget = useRef<HTMLDivElement>(null);

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

  // useEffect(() => {
  //   setVisibleCount(12);
  // }, [submissions, query, statusFilter, dateFilter]);
  const [prevCriteria, setPrevCriteria] = useState({
    query,
    statusFilter,
    dateFilter,
    submissions,
  });
  if (
    query !== prevCriteria.query ||
    statusFilter !== prevCriteria.statusFilter ||
    dateFilter !== prevCriteria.dateFilter ||
    submissions !== prevCriteria.submissions
  ) {
    setPrevCriteria({ query, statusFilter, dateFilter, submissions });
    setVisibleCount(12);
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 12, filtered.length));
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [filtered]);

  const visibleFiltered = filtered.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search submissions..."
            className="bg-background pl-9"
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val)}
          >
            <SelectTrigger className="w-[150px] bg-background capitalize">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {submissionStatuses.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={dateFilter}
            onValueChange={(val) =>
              setDateFilter(val as 'all' | 'last7' | 'last30' | 'older')
            }
          >
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="Submitted Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="last7">Last 7 days</SelectItem>
              <SelectItem value="last30">Last 30 days</SelectItem>
              <SelectItem value="older">Older than 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content Area */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-background/50 py-24 text-center">
          <div className="mb-4 rounded-full bg-muted p-3">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            No submissions found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {submissions.length === 0
              ? 'You have not submitted any forms yet.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <>
          <Card className="gap-0 overflow-hidden p-0">
            <div
              className={`grid ${LIST_COLUMNS} border-b bg-muted/50 px-4 py-3 text-xs font-medium tracking-wider text-muted-foreground uppercase`}
            >
              <span>Form Name</span>
              <span>Submitted</span>
              <span>Status</span>
            </div>
            <div className="divide-y">
              {visibleFiltered.map((sub) => {
                const badgeProps = getStatusBadge(sub.status);
                const isSelected = selectedId === sub.submissionId;

                return (
                  <div
                    key={sub.submissionId}
                    onClick={() => onSelect(sub.submissionId)}
                    className={`grid ${LIST_COLUMNS} cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/30 ${
                      isSelected ? 'bg-muted/30 dark:bg-muted/20' : ''
                    }`}
                  >
                    <span className="truncate text-sm font-medium">
                      {sub.formTitle}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(sub.submittedAt)}
                    </span>
                    <div>
                      <Badge
                        variant={badgeProps.variant}
                        className={`pointer-events-none capitalize ${badgeProps.className}`}
                      >
                        {sub.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          {visibleCount < filtered.length && (
            <div ref={observerTarget} className="mt-4 h-4 w-full" />
          )}
        </>
      )}
    </div>
  );
}
