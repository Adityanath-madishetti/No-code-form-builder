// import Home from "./pages/Home"

// export function App() {
//   return (
//     <Home />
//   )
// }

// export default App



import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import Login from "./pages/Login/Login";
import Home from "./pages/Home"; // Your protected home page
// import Dashboard from "./pages/Dashboard"; // Another protected page

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
        index: true, // Matches the "/" path
        element: <Home />,
      },
      // {
      //   path: "dashboard",
      //   element: <Dashboard />,
      // },
      // ... add all other protected routes here
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