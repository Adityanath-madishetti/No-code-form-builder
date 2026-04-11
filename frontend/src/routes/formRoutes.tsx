import FormEditor from "../pages/editor/page/FormEditorPage";
import FormPreview from "../pages/forms/preview/FormPreview";
import FormReview from "../pages/forms/review/FormReview";

export const formRoutes = [
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
];