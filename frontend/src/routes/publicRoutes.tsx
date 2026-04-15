import Login from "../pages/Login/page";
// import FormFill from "../pages/FormFill/FormFill";
import FormSuccess from "../pages/FormFill/FormSuccess";
import FormSubmit from "../pages/FormSubmit/FormSubmit";

export const publicRoutes = [
  {
    path: "/login",
    element: <Login />,
  },
  // {
  //   path: "/forms/:formId",
  //   element: <FormFill />,
  // },
  {
    path: "forms/:formId",
    element: <FormSubmit />,
  },
  {
    path: "/forms/:formId/success",
    element: <FormSuccess />,
  },
];