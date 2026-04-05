import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { FormHeader } from '../types';
import { Eye, Loader2, Plus } from 'lucide-react';

export default function TemplatesSection() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [showBlankTemplatePreview, setShowBlankTemplatePreview] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await api.post<{ form: FormHeader }>('/api/forms', {
        title: 'Untitled Form',
      });
      navigate(`/form-builder/${res.form.formId}`);
    } catch {
      setCreating(false);
    }
  };

  const handleCreateFromTemplate = async (template: 'blank') => {
    if (template !== 'blank') return;
    await handleCreate();
  };

  return (
    <>
      <div className="mb-4 pl-3 pt-2">
        <h2 className="text-xl font-semibold">Create From Template</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start quickly using available templates.
        </p>
      </div>
      <div className="grid gap-10 pl-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          role="button"
          tabIndex={0}
          aria-label="Create form from blank template"
          onClick={() => {
            if (!creating) void handleCreateFromTemplate('blank');
          }}
          onKeyDown={(e) => {
            if (creating) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              void handleCreateFromTemplate('blank');
            }
          }}
          className="group w-full cursor-pointer border border-border bg-neutral-50 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-neutral-900/70"
          style={{ aspectRatio: '1.6 / 1' }}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium">Blank</h3>
            <button
              type="button"
              title="Preview"
              aria-label="Preview"
              onClick={(e) => {
                e.stopPropagation();
                setShowBlankTemplatePreview((prev) => !prev);
              }}
              className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Start with an empty form and build from scratch.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating form...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Click card to use blank template
              </>
            )}
          </div>
          {showBlankTemplatePreview && (
            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              Blank template preview: one untitled page with no components, ready for full
              customization.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
