import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import Login from "./pages/Login/page";
import Home from "./pages/Home";
import FormEditor from "./pages/FormEditor/FormEditor";
import FormTest from "./pages/FormTest";

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
        index: false,
        path: "form-builder",
        element: <FormEditor />,
      },
      {
        index: false,
        path: "form-test",
        element: <FormTest />,
      }
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