// src/pages/FormFill/FormPreview.tsx
/**
 * Preview mode — same rendering as FormFill but with a banner and no submit.
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { getComponentRenderer } from '@/form/registry/componentRegistry';
import type { ComponentID } from '@/form/components/base';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Eye } from 'lucide-react';

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

interface VersionData {
  formId: string;
  version: number;
  meta: { name: string; description: string };
  pages: BackendPage[];
}

const backendToFrontend: Record<string, string> = {
  heading: 'Header',
  'single-line-text': 'Input',
  radio: 'Radio',
  checkbox: 'Checkbox',
  dropdown: 'Dropdown',
};

export default function FormPreview() {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [version, setVersion] = useState<VersionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!formId) return;
    // Preview loads the latest version (could be draft) via the owner endpoint
    api
      .get<{ version: VersionData }>(`/forms/${formId}/versions/latest`)
      .then((res) => setVersion(res.version))
      .catch((err) => setError(err.message || 'Form not found'))
      .finally(() => setLoading(false));
  }, [formId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !version) {
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
      {/* Preview banner */}
      <div className="flex items-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
        <Eye className="h-4 w-4" />
        Preview Mode — This is how your form will look to respondents.
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

      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-4">
        <h1 className="text-xl font-semibold">{version.meta.name}</h1>
        {version.meta.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {version.meta.description}
          </p>
        )}
      </header>

      {/* Form body (read-only) */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        {version.pages.map((page) => (
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
                      Unsupported: {comp.componentType}
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
                    {comp.componentType !== 'heading' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="Your answer..."
                          className="w-full rounded border border-input bg-muted/30 px-3 py-2 text-sm"
                          disabled
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Disabled submit (preview only) */}
        <div className="flex justify-end pt-4">
          <Button disabled>
            Submit (disabled in preview)
          </Button>
        </div>
      </main>
    </div>
  );
}
