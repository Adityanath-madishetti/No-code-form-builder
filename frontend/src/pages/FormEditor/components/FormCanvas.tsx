// src/pages/FormEditor/components/FormCanvas.tsx
import { useFormStore } from '@/form/store/form.store';
import { FormModeProvider } from '@/form/context/FormModeContext';
import { FormThemeProvider } from '@/form/theme/FormThemeProvider';
import { RenderPage } from '@/form/renderer/editRenderer/RenderPage';
import { useDroppable } from '@dnd-kit/react';
import { useShallow } from 'zustand/react/shallow';
import {
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_COMPONENT_ID,
  DRAG_PAGE_ID,
  DRAG_CATALOG_GROUP_ID,
} from '@/form/utils/DndUtils';
import { LayoutGrid } from 'lucide-react';
import {
  sharedProseClasses,
} from '@/components/RichTextEditor';
import { SelectablePage } from '@/form/renderer/SelectableWrapper';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface FormCanvasProps {
  currentPageIndex: number;
}

function EmptyPageDrop({ pageId, index }: { pageId: string; index: number }) {
  const { ref, isDropTarget: isOver } = useDroppable({
    id: `content-drop-${pageId}`,
    accept: [
      DRAG_COMPONENT_ID,
      DRAG_CATALOG_COMPONENT_ID,
      DRAG_CATALOG_GROUP_ID,
    ],
    data: { type: DRAG_PAGE_ID, pageId },
  });

  return (
    <SelectablePage pageId={pageId} index={index}>
      <div
        ref={ref}
        className={`flex min-h-[200px] w-full items-center justify-center border-2 transition-colors`}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <LayoutGrid className="h-6 w-6 opacity-40" />
          <p className="text-xs font-medium">Drop components here</p>
        </div>
      </div>
    </SelectablePage>
  );
}

export function FormCanvas({ currentPageIndex }: FormCanvasProps) {
  const form = useFormStore((s) => s.form);
  const pages = useFormStore(useShallow((s) => s.pages));

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
  const page = pageId ? pages[pageId] : null;
  const hasComponents = (page?.children ?? []).length > 0;

  return (
    <FormThemeProvider>
      <FormModeProvider value="edit">
        <div className="mx-auto w-full max-w-3xl px-8 py-6">
          {/* Editable form title on first page */}
          <FormHeader />
          <Separator className="mt-5" />

          <PageHeader pageId={pageId} pageNumber={currentPageIndex + 1} />

          {/* Components or empty drop zone */}
          {!hasComponents ? (
            <EmptyPageDrop pageId={pageId} index={currentPageIndex} />
          ) : (
            <RenderPage pageId={pageId} index={currentPageIndex} />
          )}
        </div>
      </FormModeProvider>
    </FormThemeProvider>
  );
}

function FormHeader() {
  const formName = useFormStore((s) => s.form?.name ?? '');
  // const updateFormName = useFormStore((s) => s.updateFormName);
  const formDescription = useFormStore(
    (s) => s.form?.metadata.description ?? ''
  );
  // const updateFormMetadata = useFormStore((s) => s.updateFormMetadata);
  // const updateFormDescription = (description: string) => {
  //   updateFormMetadata({ description: description });
  // };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="w-full bg-transparent text-5xl font-bold tracking-tight text-foreground outline-none">
            {formName}
          </div>
        </CardHeader>
        {formDescription && (
          <CardContent>
            <div
              className={sharedProseClasses}
              dangerouslySetInnerHTML={{
                __html: formDescription,
              }}
            />
          </CardContent>
        )}
      </Card>
      {/* <input
        value={formName}
        onChange={(e) => updateFormName(e.target.value)}
        placeholder="Untitled Form"
        className="w-full bg-transparent text-2xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/20"
      />
      <RichTextEditor
        value={formDescription}
        placeholder="Description"
        onChange={(newHTML) => updateFormDescription(newHTML)}
      /> */}
      {/* <textarea
        value={formDescription}
        onChange={(e) => updateFormDescription(e.target.value)}
        placeholder="Description"
        className="text-md h-auto w-full bg-transparent tracking-tight text-foreground placeholder:text-muted-foreground/20"
      /> */}
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
  const setActivePage = useFormStore((s) => s.setActivePage);
  const setActiveComponent = useFormStore((s) => s.setActiveComponent);

  return (
    <div className="mt-5 mb-5">
      {(page?.title || page?.description) && (
        <Card
          onClick={(e) => {
            e.stopPropagation();
            setActivePage(pageId);
            setActiveComponent(null);
          }}
        >
          <CardHeader>
            <div className="text-4xl font-semibold tracking-tight">
              {page?.title}
            </div>
          </CardHeader>
          {page?.description && (
            <CardContent>
              <div className={`tracking-tight ${sharedProseClasses}`}>
                {page?.description}
              </div>
            </CardContent>
          )}
        </Card>
      )}
      {/* <input
        value={page?.title ?? ''}
        onChange={(e) => updatePageTitle(pageId, e.target.value)}
        placeholder={`Page ${pageNumber}`}
        className="w-full bg-transparent text-xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/20"
      /> */}
    </div>
  );
}
