// frontend/src/routes/protectedRoutes.tsx
import ProtectedLayout from '../components/layout/ProtectedLayout';
import Dashboard from '../pages/Dashboard/Dashboard';
import KeyboardShortcutsPage from '../pages/KeyboardShortcutsPage';
import { RouteErrorFallback } from '@/components/ErrorFallback';

import { settingsRoutes } from './settingsRoutes';
import { formRoutes } from './formRoutes';

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
    ...settingsRoutes,
    ...formRoutes,
  ],
};
