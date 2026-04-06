import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import Login from "./pages/Login/page";
import Dashboard from "./pages/Dashboard";
import FormEditor from "./pages/FormEditor/FormEditor";
import FormFill from "./pages/FormFill/FormFill";
import FormPreview from "./pages/FormFill/FormPreview";
import FormSuccess from "./pages/FormFill/FormSuccess";
import FormReview from "./pages/FormReview/FormReview";
import KeyboardShortcutsPage from "./pages/KeyboardShortcutsPage";
import UserSettingsPage from "./pages/UserSettingsPage";
import ActivityPage from "./pages/ActivityPage";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import AccountPage from "./pages/AccountPage";
import EditorThemeTemplatesPage from "./pages/EditorThemeTemplatesPage";

import FormSubmit from "./pages/FormSubmit/FormSubmit";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forms/:formId",
    element: <FormFill />,
  },
  {
    path: "forms/s/:formId",
    element: <FormSubmit />,
  },
  {
    path: "/forms/:formId/success",
    element: <FormSuccess />,
  },
  {
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
      {
        path: "settings",
        element: <UserSettingsPage />,
      },
      {
        path: "settings/account",
        element: <AccountPage />,
      },
      {
        path: "settings/editor-theme-templates",
        element: <EditorThemeTemplatesPage />,
      },
      {
        path: "settings/activity",
        element: <ActivityPage />,
      },
      {
        path: "settings/notifications",
        element: <NotificationSettingsPage />,
      },
      {
        path: "form-builder/:formId",
        element: <FormEditor />,
      },
      {
        path: "forms/:formId/preview",
        element: <FormPreview />,
      },
      {
        path: "reviews/:formId",
        element: <FormReview />,
      },
    ],
  },
]);

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
