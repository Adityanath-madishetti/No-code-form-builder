import ProtectedLayout from "../components/layout/ProtectedLayout";
import Dashboard from "../pages/Dashboard/Dashboard";
import KeyboardShortcutsPage from "../pages/KeyboardShortcutsPage";

import { settingsRoutes } from "./settingsRoutes";
import { formRoutes } from "./formRoutes";

export const protectedRoutes = {
  path: "/",
  element: <ProtectedLayout />,
  children: [
    {
      index: true,
      element: <Dashboard />,
    },
    {
      path: "keyboard-shortcuts",
      element: <KeyboardShortcutsPage />,
    },
    ...settingsRoutes,
    ...formRoutes,
  ],
};