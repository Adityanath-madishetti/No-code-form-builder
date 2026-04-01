import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import Login from "./pages/Login/page";
import Home from "./pages/Home";
import FormEditor from "./pages/FormEditor/FormEditor";
import FormFill from "./pages/FormFill/FormFill";
import FormPreview from "./pages/FormFill/FormPreview";
import FormSuccess from "./pages/FormFill/FormSuccess";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "form-builder/:formId",
        element: <FormEditor />,
      },
      {
        path: "forms/:formId",
        element: <FormFill />,
      },
      {
        path: "forms/:formId/preview",
        element: <FormPreview />,
      },
      {
        path: "forms/:formId/success",
        element: <FormSuccess />,
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