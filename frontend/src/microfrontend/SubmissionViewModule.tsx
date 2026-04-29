// frontend/src/microfrontend/SubmissionViewModule.tsx
import root from 'react-shadow';
import tailwindStyles from '@/styles/index.css?inline';
import { MemoryRouter } from 'react-router-dom';
import EmbedSubmissionView from '@/components/EmbedSubmissionView';
import type {
  PublicFormData,
  SubmissionEntry,
} from '@/form/renderer/viewRenderer/runtimeForm.types';

/**
 * Data format for the response data passed to the Submission View.
 * Can be a full SubmissionEntry.pages array or a flat key-value object of component responses.
 */
export type SubmissionViewResponseData =
  | SubmissionEntry['pages']
  | Record<string, unknown>;

export type SubmissionViewModuleProps = {
  /** The full form schema (definitions + version) */
  formSchema: PublicFormData;
  /** Optional response data to pre-populate the view */
  responseData?: SubmissionViewResponseData;
};

export default function SubmissionViewModule({
  formSchema,
  responseData,
}: SubmissionViewModuleProps) {
  return (
    <root.div>
      <style>{tailwindStyles}</style>
      <MemoryRouter>
        <div style={{ all: 'initial', display: 'block', width: '100%' }}>
          <div className="submission-view-mf h-full w-full bg-background font-sans text-foreground">
            <EmbedSubmissionView
              formSchema={formSchema}
              responseData={responseData}
            />
          </div>
        </div>
      </MemoryRouter>
    </root.div>
  );
}
