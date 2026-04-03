import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Eye, ArrowRight } from 'lucide-react';
import { FillFieldRenderer } from './FillFieldRenderer';
import {
  evaluateRuntimeLogic,
  getComponentOrderForPage,
  type RuntimeLogicPayload,
  type RuntimePage,
} from './runtimeLogic';

interface VersionData {
  formId: string;
  version: number;
  meta: { name: string; description: string };
  pages: RuntimePage[];
  logic?: RuntimeLogicPayload;
}

function getOrCreatePreviewSeed(formId: string): string {
  const key = `form-preview-seed:${formId}`;
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, next);
  return next;
}

export default function FormPreview() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [version, setVersion] = useState<VersionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    if (!formId) return;
    api
      .get<{ version: VersionData }>(`/api/forms/${formId}/versions/latest`)
      .then((res) => setVersion(res.version))
      .catch((err) => setError(err.message || 'Form not found'))
      .finally(() => setLoading(false));
  }, [formId]);

  useEffect(() => {
    document.title = version?.meta.name
      ? `Preview: ${version.meta.name} — Form Builder`
      : 'Preview — Form Builder';
  }, [version]);

  const seed = useMemo(() => (formId ? getOrCreatePreviewSeed(formId) : ''), [formId]);
  const runtime = useMemo(
    () =>
      evaluateRuntimeLogic(version?.logic, version?.pages || [], {}),
    [version]
  );
  const currentPage = version?.pages[pageIndex];
  const components = useMemo(() => {
    if (!version || !currentPage) return [];
    return getComponentOrderForPage(
      currentPage,
      version.logic?.componentShuffleStacks,
      seed
    ).filter((component) => runtime.visibility[component.componentId] !== false);
  }, [currentPage, runtime.visibility, seed, version]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !version || !currentPage) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">{error || 'Form not found'}</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      <div className="flex items-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
        <Eye className="h-4 w-4" />
        Preview Mode — read-only runtime behavior.
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto text-white hover:bg-amber-600 hover:text-white"
          onClick={() => navigate(`/form-builder/${formId}`)}
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Back to Editor
        </Button>
      </div>

      <header className="border-b border-border bg-background px-6 py-4">
        <h1 className="text-xl font-semibold">{version.meta.name}</h1>
        {version.meta.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {version.meta.description}
          </p>
        )}
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Page {pageIndex + 1} / {version.pages.length}
          </span>
          <span>{currentPage.title || `Page ${currentPage.pageNo}`}</span>
        </div>

        <section className="rounded-lg border border-border bg-background p-4">
          <div className="space-y-5">
            {components.map((component) => (
              <div key={component.componentId} className="space-y-2">
                {component.componentType !== 'heading' && (
                  <label className="text-sm font-medium">{component.label}</label>
                )}
                <FillFieldRenderer
                  component={component}
                  value={runtime.values[component.componentId]}
                  disabled
                  shuffleSeed={seed}
                  onChange={() => undefined}
                />
              </div>
            ))}
          </div>
        </section>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            disabled={pageIndex >= version.pages.length - 1}
            onClick={() =>
              setPageIndex((prev) =>
                Math.min(version.pages.length - 1, prev + 1)
              )
            }
          >
            Next
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

