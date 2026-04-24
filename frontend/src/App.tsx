import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { router } from './config/routes';
import { ErrorBoundary } from 'react-error-boundary';

import './styles/index.css';
import { ThemeProvider } from '@/components/theme-provider.tsx';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { ErrorFallback } from '@/components/ErrorFallback';

export default function App() {
  return (
    <>
      <ThemeProvider>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <TooltipProvider delayDuration={100}>
            <AuthProvider>
              <RouterProvider router={router} />
            </AuthProvider>
          </TooltipProvider>
        </ErrorBoundary>
      </ThemeProvider>
      <Toaster />
    </>
  );
}
