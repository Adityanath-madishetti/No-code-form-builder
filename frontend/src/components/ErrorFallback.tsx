import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { FallbackProps } from 'react-error-boundary';
import { useRouteError, useNavigate } from 'react-router-dom';

// ----------------------------------------------------------------------------
// 1. Global React Error Boundary Fallback
// ----------------------------------------------------------------------------
export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // Try to get the full stack trace, fallback to stringified object
  const errorDetails =
    error instanceof Error
      ? error.stack || error.message
      : JSON.stringify(error, null, 2);

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center p-4 md:p-8">
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl">
              Unexpected Application Error!
            </CardTitle>
            <CardDescription>
              A fatal error occurred while rendering the component tree.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border bg-muted/50 p-4">
            <pre className="font-mono text-sm break-all whitespace-pre-wrap text-destructive">
              {errorDetails || 'No stack trace available.'}
            </pre>
          </ScrollArea>
        </CardContent>

        <CardFooter className="justify-end">
          <Button
            onClick={resetErrorBoundary}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Try again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// ----------------------------------------------------------------------------
// 2. React Router Error Fallback
// ----------------------------------------------------------------------------
export function RouteErrorFallback() {
  const error = useRouteError();
  const navigate = useNavigate();

  // Extract the full stack trace or HTTP response data
  let errorDetails = '';
  if (error instanceof Error) {
    errorDetails = error.stack || error.message;
  } else if (typeof error === 'object' && error !== null) {
    // Stringify the whole thing so you can see status, data, etc.
    errorDetails = JSON.stringify(error, null, 2);
  } else {
    errorDetails = String(error);
  }

  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center p-4 md:p-8">
      <Card className="mx-auto w-full max-w-4xl">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-xl">Unexpected Route Error!</CardTitle>
            <CardDescription>
              A fatal error occurred while loading this section.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border bg-muted/50 p-4">
            <pre className="font-mono text-sm break-all whitespace-pre-wrap text-destructive">
              {errorDetails || 'No additional error details available.'}
            </pre>
          </ScrollArea>
        </CardContent>

        <CardFooter className="justify-end">
          <Button
            onClick={() => navigate(0)}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh Page
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
