import Login from "../pages/auth/LoginPage";
import FormFill from "../pages/forms/fill/FormFill";
import FormSuccess from "../pages/forms/fill/FormSuccess";
import FormSubmit from "../pages/forms/submit/FormSubmit";

export const publicRoutes = [
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
];