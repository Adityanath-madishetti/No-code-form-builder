import FormEditor from '../pages/FormEditor/FormEditor';
import FormPreview from '@/form/renderer/viewRenderer/FormPreview';
import FormReview from '../pages/FormReview/FormReview';

export const formRoutes = [
  {
    path: 'form-builder/:formId',
    element: <FormEditor />,
  },
  {
    path: 'forms/:formId/preview',
    element: <FormPreview />,
  },
  {
    path: 'reviews/:formId',
    element: <FormReview />,
  },
];
