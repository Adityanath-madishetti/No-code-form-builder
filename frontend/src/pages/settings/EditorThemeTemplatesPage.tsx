import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Layers, Palette } from 'lucide-react';

// shadcn components
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function EditorThemeTemplatesPage() {
  useEffect(() => {
    document.title = 'Editor Theme & Templates — Form Builder';
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="mb-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="pl-0 text-muted-foreground hover:text-foreground"
          >
            <Link to="/settings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Editor theme & templates
            </CardTitle>
            <CardDescription className="text-base">
              How to style forms and reuse layouts inside the form builder.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Theme Section */}
            <div className="flex items-start gap-4 rounded-lg border bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Palette className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-foreground">Theme</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Open any form in the builder, then use the left sidebar and choose{' '}
                  <span className="font-medium text-foreground">Theme</span>. You can set colors,
                  typography, backgrounds, and layout options that apply to the published form.
                </p>
              </div>
            </div>

            {/* Templates Section */}
            <div className="flex items-start gap-4 rounded-lg border bg-card p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <Layers className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-foreground">Templates</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  In the same sidebar, open{' '}
                  <span className="font-medium text-foreground">Templates</span> to browse reusable
                  component groups. Save groups you use often to speed up new forms.
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-start gap-3 border-t bg-muted/20 px-4 py-4">
            <Button asChild>
              <Link to="/">Go to dashboard</Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              Create or open a form, then use Theme and Templates from the editor sidebar.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}