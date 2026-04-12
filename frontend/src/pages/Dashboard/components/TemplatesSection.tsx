import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

// shadcn components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Icons
import { Plus, Loader2 } from 'lucide-react';
import type { FormHeader } from '../dashboard.types';

export default function TemplatesSection() {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await api.post<{ form: FormHeader }>('/api/forms', {
        title: 'Untitled Form',
      });
      navigate(`/form-builder/${res.form.formId}`);
    } catch (err) {
      console.error('Failed to create form:', err);
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="pl-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Create From Template
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start quickly using available templates or a blank slate.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pl-3">
        <Card
          className="group relative flex cursor-pointer flex-col overflow-hidden transition-all hover:border-primary/50"
          role="button"
          tabIndex={0}
          onClick={handleCreate}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCreate();
            }
          }}
        >
          <CardHeader className="px-4">
            <div>
              <CardTitle className="text-base font-semibold">
                Blank Form
              </CardTitle>
              <CardDescription className="mt-0 text-xs">
                Start from scratch.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="flex-1 text-xs px-4 text-muted-foreground">
            {/* Dashed rectangle removed and description permanently displayed */}
            <div className="rounded-md bg-muted/30 italic">
              Preview: Opens an empty workspace with one untitled page, ready
              for your custom components.
            </div>
          </CardContent>

          <CardFooter className="border-t bg-muted/20 p-3">
            <div className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground transition-colors">
              <span>
                {creating ? 'Initializing builder...' : 'Use Template'}
              </span>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Plus
                  className="h-4 w-4 cursor-pointer hover:text-foreground"
                  onClick={handleCreate}
                />
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
