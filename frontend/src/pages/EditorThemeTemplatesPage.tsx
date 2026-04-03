import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Layers, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EditorThemeTemplatesPage() {
  useEffect(() => {
    document.title = 'Editor Theme & Templates — Form Builder';
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="mb-6">
          <Button asChild variant="ghost" size="sm" className="pl-0">
            <Link to="/settings">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Settings
            </Link>
          </Button>
        </div>

        <div className="border border-border bg-neutral-50 p-5 shadow-sm dark:bg-neutral-900/70">
          <h1 className="text-lg font-semibold">Editor theme & templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            How to style forms and reuse layouts inside the form builder.
          </p>

          <div className="mt-6 space-y-4 text-sm text-muted-foreground">
            <section className="border border-border bg-background p-4">
              <div className="mb-2 flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <h2 className="text-sm font-semibold text-foreground">Theme</h2>
              </div>
              <p>
                Open any form in the builder, then use the left sidebar and choose{' '}
                <span className="font-medium text-foreground">Theme</span>. You can set colors,
                typography, backgrounds, and layout options that apply to the published form.
              </p>
            </section>

            <section className="border border-border bg-background p-4">
              <div className="mb-2 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <h2 className="text-sm font-semibold text-foreground">Templates</h2>
              </div>
              <p>
                In the same sidebar, open{' '}
                <span className="font-medium text-foreground">Templates</span> to browse reusable
                component groups. Save groups you use often to speed up new forms.
              </p>
            </section>

            <div className="pt-2">
              <Button asChild>
                <Link to="/">Go to dashboard</Link>
              </Button>
              <p className="mt-3 text-xs">
                Create or open a form, then use Theme and Templates from the editor sidebar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
