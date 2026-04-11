// src/pages/FormEditor/components/FormCanvas.tsx
import { useFormStore } from '@/form/store/form.store';
import { FormModeProvider } from '@/form/context/FormModeContext';
import { FormThemeProvider } from '@/form/theme/FormThemeProvider';
import { RenderPage } from '@/form/renderer/editRenderer/RenderPage';
import { LayoutGrid } from 'lucide-react';

interface FormCanvasProps {
  currentPageIndex: number;
}

export function FormCanvas({ currentPageIndex }: FormCanvasProps) {
  const form = useFormStore((s) => s.form);

  if (!form || form.pages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-2 text-center">
          <LayoutGrid className="h-8 w-8 opacity-15" />
          <p className="text-xs">Add a page to get started</p>
        </div>
      </div>
    );
  }

  const pageId = form.pages[currentPageIndex];

  return (
    <FormThemeProvider>
      <FormModeProvider value="edit">
        <div className="mx-auto w-full max-w-3xl px-8 py-6">
          {/* Editable form title on first page */}
          <FormHeader />
          <PageHeader pageId={pageId} pageNumber={currentPageIndex + 1} />

          {/* Always render RenderPage — it handles empty state with Add Component button */}
          <RenderPage pageId={pageId} index={currentPageIndex} />
        </div>
      </FormModeProvider>
    </FormThemeProvider>
  );
}

function FormHeader() {
  const formName = useFormStore((s) => s.form?.name ?? '');
  const updateFormName = useFormStore((s) => s.updateFormName);
  const formDescription = useFormStore(
    (s) => s.form?.metadata.description ?? ''
  );
  const updateFormMetadata = useFormStore((s) => s.updateFormMetadata);
  const updateFormDescription = (description: string) => {
    updateFormMetadata({ description: description });
  };

  return (
    <div>
      <input
        value={formName}
        onChange={(e) => updateFormName(e.target.value)}
        placeholder="Untitled Form"
        className="w-full bg-transparent text-2xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/20"
      />
      <textarea
        value={formDescription}
        onChange={(e) => updateFormDescription(e.target.value)}
        placeholder="Description"
        className="text-md h-auto w-full bg-transparent tracking-tight text-foreground placeholder:text-muted-foreground/20"
      />
    </div>
  );
}

function PageHeader({
  pageId,
  pageNumber,
}: {
  pageId: string;
  pageNumber: number;
}) {
  const page = useFormStore((s) => s.pages[pageId]);
  const updatePageTitle = useFormStore((s) => s.updatePageTitle);

  return (
    <div className="mb-5">
      <input
        value={page?.title ?? ''}
        onChange={(e) => updatePageTitle(pageId, e.target.value)}
        placeholder={`Page ${pageNumber}`}
        className="w-full bg-transparent text-xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/20"
      />
    </div>
  );
}
