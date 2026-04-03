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
