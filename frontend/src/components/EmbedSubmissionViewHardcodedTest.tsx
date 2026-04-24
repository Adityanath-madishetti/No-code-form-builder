import EmbedSubmissionView from '@/components/EmbedSubmissionView';
import type { PublicFormData } from '@/form/renderer/viewRenderer/runtimeForm.types';
import { DEFAULT_FORM_THEME } from '@/form/theme/formTheme';

const hardcodedFormSchema: PublicFormData = {
  form: {
    formId: 'hardcoded-embed-form',
    title: 'Q2 Customer Feedback Snapshot',
  },
  version: {
    formId: 'hardcoded-embed-form',
    version: 1,
    meta: {
      name: 'Q2 Customer Feedback Snapshot',
      description:
        '<p>This is a hardcoded submission-view test schema. It should render as a static, disabled response snapshot with page separators.</p>',
    },
    theme: DEFAULT_FORM_THEME,
    settings: {
      collectEmailMode: 'none',
      submissionPolicy: 'none',
      canViewOwnSubmission: false,
    },
    pages: [
      {
        pageId: 'page-1',
        pageNo: 1,
        title: 'Page 1 - Respondent Details',
        description:
          'This section verifies basic identity/contact field rendering in disabled mode.',
        isTerminal: false,
        components: [
          {
            componentId: 'full-name',
            componentType: 'single-line-input',
            label: 'Full Name',
            props: {
              questionText: 'Full Name',
              placeholder: 'Enter your name',
              defaultValue: '',
              hiddenByDefault: false,
            },
            validation: { required: true },
          },
          {
            componentId: 'email-address',
            componentType: 'email',
            label: 'Email',
            props: {
              questionText: 'Work Email',
              placeholder: 'you@company.com',
              defaultValue: '',
              hiddenByDefault: false,
            },
            validation: { required: true },
          },
        ],
      },
      {
        pageId: 'page-2',
        pageNo: 2,
        title: 'Page 2 - Experience Feedback',
        description:
          'This section verifies choice + multiline response rendering with prefilled values.',
        isTerminal: true,
        components: [
          {
            componentId: 'rating',
            componentType: 'radio',
            label: 'Experience Rating',
            props: {
              questionText: 'How would you rate your experience?',
              options: [
                { id: 'r1', value: 'Excellent' },
                { id: 'r2', value: 'Good' },
                { id: 'r3', value: 'Average' },
                { id: 'r4', value: 'Poor' },
              ],
              defaultValue: '',
              layout: 'vertical',
              shuffleOptions: false,
              hiddenByDefault: false,
            },
            validation: { required: true },
          },
          {
            componentId: 'comments',
            componentType: 'multi-line-input',
            label: 'Comments',
            props: {
              questionText: 'Additional comments',
              placeholder: 'Share your thoughts',
              defaultValue: '',
              rows: 4,
              hiddenByDefault: false,
            },
            validation: { required: false },
          },
        ],
      },
    ],
  },
};

const hardcodedResponseData = [
  {
    pageNo: 1,
    responses: [
      { componentId: 'full-name', response: 'Alex Johnson' },
      { componentId: 'email-address', response: 'alex.johnson@sample.com' },
    ],
  },
  {
    pageNo: 2,
    responses: [
      { componentId: 'rating', response: 'Good' },
      {
        componentId: 'comments',
        response:
          'The workflow was smooth and the form experience felt intuitive.',
      },
    ],
  },
];

export default function EmbedSubmissionViewHardcodedTest() {
  return (
    <EmbedSubmissionView
      formSchema={hardcodedFormSchema}
      responseData={hardcodedResponseData}
    />
  );
}
