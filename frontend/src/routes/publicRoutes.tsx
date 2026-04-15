import Login from "../pages/Login/page";
import FormSuccess from "../pages/FormFill/FormSuccess";
import { FormRunner } from "@/form/renderer/viewRenderer/FormRunner";
import EmbedForm from "@/components/EmbedForm";

export const publicRoutes = [
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forms/:formId",
    element: <FormRunner />,
  },
  {
    path: "/embed/forms/:formId",
    element: <EmbedForm />,
  },
  {
    path: "/forms/:formId/success",
    element: <FormSuccess />,
  },
];