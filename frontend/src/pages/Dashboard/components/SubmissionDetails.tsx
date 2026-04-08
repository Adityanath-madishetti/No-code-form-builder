import { useState } from 'react';
import { API_BASE } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import type { MySubmission } from '../dashboard.types';
import { formatDate, formatResponseValue } from '../dashboard.utils';

export default function SubmissionDetails({
  submission,
}: {
  submission: MySubmission;
}) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setExporting(true);
    setError('');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(
        `${API_BASE}/api/forms/${submission.formId}/submissions/export.csv`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form-${submission.formId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="mt-6 rounded-lg border bg-neutral-50 p-4 dark:bg-neutral-900/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Submission Details</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {submission.formTitle} • {formatDate(submission.submittedAt)}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-3.5 w-3.5" />
          )}
          Export CSV
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <div className="mt-4 space-y-3">
        {(submission.pages || []).length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No responses available.
          </p>
        ) : (
          submission.pages!.map((page) => (
            <div key={page.pageNo} className="rounded border p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Page {page.pageNo}
              </p>
              <div className="space-y-2">
                {page.responses.map((item) => (
                  <div key={`${page.pageNo}-${item.componentId}`}>
                    <p className="text-xs font-medium text-muted-foreground">
                      {item.componentId}
                    </p>
                    <pre className="mt-1 overflow-auto rounded bg-muted/30 p-2 text-xs whitespace-pre-wrap">
                      {formatResponseValue(item.response)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
