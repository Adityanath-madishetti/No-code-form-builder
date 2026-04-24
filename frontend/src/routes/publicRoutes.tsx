// frontend/src/routes/publicRoutes.tsx
import Login from '../pages/Login/page';
import FormSuccess from '../pages/FormFill/FormSuccess';
import { FormRunner } from '@/form/renderer/viewRenderer/FormRunner';
import EmbedForm from '@/components/EmbedForm';
import EmbedSubmissionView from '@/components/EmbedSubmissionView';
import EmbedSubmissionViewHardcodedTest from '@/components/EmbedSubmissionViewHardcodedTest';
import { RouteErrorFallback } from '@/components/ErrorFallback';

export const publicRoutes = [
  {
    errorElement: <RouteErrorFallback />,
    children: [
      // {
      //   path: '/',
      //   element: <HomePage />,
      // },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/forms/:formId',
        element: <FormRunner />,
      },
      {
        path: '/embed/forms/:formId',
        element: <EmbedForm />,
      },
      {
        path: '/embed/submission-view',
        element: <EmbedSubmissionView />,
      },
      {
        path: '/embed/submission-view/test',
        element: <EmbedSubmissionViewHardcodedTest />,
      },
      {
        path: '/forms/:formId/success',
        element: <FormSuccess />,
      },
    ],
  },
];
