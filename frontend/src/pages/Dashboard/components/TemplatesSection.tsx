import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Eye, Plus, Loader2 } from 'lucide-react';
import type { FormHeader } from '../dashboard.types';

export default function TemplatesSection() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleCreate = async () => {
    if (creating) return;
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

  return (
    <>
      <div className="mb-4 pt-2 pl-3">
        <h2 className="text-xl font-semibold">Create From Template</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start quickly using available templates.
        </p>
      </div>
      <div className="grid gap-10 pl-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          role="button"
          tabIndex={0}
          onClick={handleCreate}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCreate();
            }
          }}
          className="group w-full cursor-pointer border border-border bg-neutral-50 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:bg-neutral-900/70"
          style={{ aspectRatio: '1.6 / 1' }}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-medium">Blank</h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowPreview(!showPreview);
              }}
              className="inline-flex items-center text-muted-foreground hover:text-foreground"
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
                <Loader2 className="h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Click to use blank template
              </>
            )}
          </div>
          {showPreview && (
            <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              Blank template preview: one untitled page with no components,
              ready for customization.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
