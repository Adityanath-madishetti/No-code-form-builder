// frontend/src/routes/protectedRoutes.tsx
import ProtectedLayout from '../components/layout/ProtectedLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import KeyboardShortcutsPage from '../pages/KeyboardShortcutsPage';
import { RouteErrorFallback } from '@/components/ErrorFallback';

import { settingsRoutes } from './settingsRoutes';
import { formRoutes } from './formRoutes';

import FluxorisMfeDryRunPage from '../pages/FluxorisMfeDryRunPage';
import FluxorisRunDetailsPage from '../pages/FluxorisRunDetailsPage';

export const protectedRoutes = {
  element: <ProtectedLayout />,
  errorElement: <RouteErrorFallback />,
  children: [
    {
      path: 'dashboard',
      element: <Dashboard />,
    },
    {
      path: 'keyboard-shortcuts',
      element: <KeyboardShortcutsPage />,
    },
    {
      path: 'integrations/fluxoris-mfe-dry-run',
      element: <FluxorisMfeDryRunPage />,
    },
    {
      path: 'integrations/fluxoris-run-details',
      element: <FluxorisRunDetailsPage />,
    },
    ...settingsRoutes,
    ...formRoutes,
  ],
};
