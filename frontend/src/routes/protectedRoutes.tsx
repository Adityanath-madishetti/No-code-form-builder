// frontend/src/routes/protectedRoutes.tsx
import ProtectedLayout from '../components/layout/ProtectedLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import KeyboardShortcutsPage from '../pages/KeyboardShortcutsPage';
import FluxorisMfeDryRunPage from '../pages/FluxorisMfeDryRunPage';
import FluxorisRunDetailsPage from '../pages/FluxorisRunDetailsPage';
import { Navigate } from 'react-router-dom';
import { RouteErrorFallback } from '@/components/ErrorFallback';

import { settingsRoutes } from './settingsRoutes';
import { formRoutes } from './formRoutes';

export const protectedRoutes = {
  element: <ProtectedLayout />,
  errorElement: <RouteErrorFallback />,
  children: [
    {
      index: true,
      element: <Navigate to="/dashboard" replace />,
    },
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
