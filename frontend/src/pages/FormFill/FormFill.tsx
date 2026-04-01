// src/pages/FormFill/FormFill.tsx
/**
 * Public form-filling page. Fetches the published version, renders components
 * in fill mode, collects responses, and submits to the backend.
 */
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getComponentRenderer } from '@/form/registry/componentRegistry';
import type { ComponentID } from '@/form/components/base';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';

// ── Types matching the backend response ──

interface BackendComponent {
  componentId: string;
  componentType: string;
  label: string;
  props: Record<string, unknown>;
  validation: Record<string, unknown>;
  order: number;
}

interface BackendPage {
  pageId: string;
  pageNo: number;
  title: string;
  description?: string;
  components: BackendComponent[];
}

interface PublicFormData {
  form: { formId: string; title: string };
  version: {
    formId: string;
    version: number;
    meta: { name: string; description: string };
    pages: BackendPage[];
  };
}

// Backend componentType → frontend ComponentID
const backendToFrontend: Record<string, string> = {
  heading: 'Header',
  'single-line-text': 'Input',
  radio: 'Radio',
  checkbox: 'Checkbox',
  dropdown: 'Dropdown',
};

export default function FormFill() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PublicFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!formId) return;
    api
      .get<PublicFormData>(`/forms/${formId}/public`)
      .then(setData)
      .catch((err) => setError(err.message || 'Form not found'))
      .finally(() => setLoading(false));
  }, [formId]);

  const handleResponseChange = useCallback(
    (componentId: string, value: unknown) => {
      setResponses((prev) => ({ ...prev, [componentId]: value }));
    },
    []
  );

  const handleSubmit = useCallback(async () => {
    if (!formId || !data) return;
    setSubmitting(true);
    try {
      const pages = data.version.pages.map((page) => ({
        pageNo: page.pageNo,
        responses: page.components
          .filter((c) => c.componentType !== 'heading')
          .map((c) => ({
            componentId: c.componentId,
            response: responses[c.componentId] ?? null,
          })),
      }));

      await api.post(`/forms/${formId}/submissions`, { pages });
      navigate(`/forms/${formId}/success`);
    } catch (err) {
      setError((err as Error).message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }, [formId, data, responses, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">{error || 'Form not found'}</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-4">
        <h1 className="text-xl font-semibold">{data.version.meta.name}</h1>
        {data.version.meta.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {data.version.meta.description}
          </p>
        )}
      </header>

      {/* Form body */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        {data.version.pages.map((page) => (
          <div key={page.pageId} className="mb-8">
            {page.title && page.title !== `Page ${page.pageNo}` && (
              <h2 className="mb-4 text-lg font-medium">{page.title}</h2>
            )}
            <div className="space-y-6">
              {page.components.map((comp) => {
                const feId = backendToFrontend[comp.componentType] || comp.componentType;
                const Renderer = getComponentRenderer(feId as ComponentID);

                if (!Renderer) {
                  return (
                    <div
                      key={comp.componentId}
                      className="rounded border border-dashed border-border p-3 text-xs text-muted-foreground"
                    >
                      Unsupported component: {comp.componentType}
                    </div>
                  );
                }

                return (
                  <div key={comp.componentId} className="rounded-lg border border-border bg-background p-4">
                    <Renderer
                      instanceId={comp.componentId}
                      metadata={{ label: comp.label }}
                      props={comp.props as never}
                      validation={comp.validation as never}
                    />
                    {/* For input-type components, show a simple input to collect response */}
                    {comp.componentType !== 'heading' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Your answer..."
                          className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                          value={(responses[comp.componentId] as string) || ''}
                          onChange={(e) =>
                            handleResponseChange(comp.componentId, e.target.value)
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-4 w-4" />
            )}
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </main>
    </div>
  );
}
