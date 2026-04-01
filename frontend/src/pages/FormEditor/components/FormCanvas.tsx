// src/pages/FormEditor/components/FormCanvas.tsx
import { useFormStore } from '@/form/store/formStore';
import { FormModeProvider } from '@/form/context/FormModeContext';
import { FormThemeProvider } from '@/form/theme/FormThemeProvider';
import { RenderPage } from '@/form/renderer/editRenderer/RenderPage';
import { useDroppable } from '@dnd-kit/react';
import { useShallow } from 'zustand/react/shallow';
import {
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_COMPONENT_ID,
  DRAG_PAGE_ID,
} from '@/form/utils/DndUtils';
import { LayoutGrid } from 'lucide-react';

interface FormCanvasProps {
  currentPageIndex: number; // 0-indexed
}

function EmptyPageDrop({ pageId }: { pageId: string }) {
  const { ref, isDropTarget: isOver } = useDroppable({
    id: `content-drop-${pageId}`,
    accept: [DRAG_COMPONENT_ID, DRAG_CATALOG_COMPONENT_ID],
    data: { type: DRAG_PAGE_ID, pageId },
  });

  return (
    <div
      ref={ref}
      className={`flex min-h-[240px] w-full items-center justify-center rounded-2xl border-2 border-dashed transition-colors ${
        isOver
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border/50 text-muted-foreground/40'
      }`}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <LayoutGrid className="h-8 w-8 opacity-40" />
        <div>
          <p className="text-sm font-medium">Drop components here</p>
          <p className="mt-0.5 text-xs opacity-70">
            Drag from the Components panel on the left
          </p>
        </div>
      </div>
    </div>
  );
}

export function FormCanvas({ currentPageIndex }: FormCanvasProps) {
  const form = useFormStore((s) => s.form);
  const pages = useFormStore(useShallow((s) => s.pages));

  if (!form || form.pages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="flex flex-col items-center gap-3 text-center">
          <LayoutGrid className="h-10 w-10 opacity-20" />
          <p className="text-sm">Add a page to get started</p>
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
        <div className="mx-auto w-full max-w-3xl px-6 py-8">
          {/* Page header: title editable */}
          <PageHeader pageId={pageId} pageNumber={currentPageIndex + 1} />

          {/* Components or empty drop zone */}
          {!hasComponents ? (
            <EmptyPageDrop pageId={pageId} />
          ) : (
            <RenderPage pageId={pageId} index={currentPageIndex} />
          )}
        </div>
      </FormModeProvider>
    </FormThemeProvider>
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
  const formName = useFormStore((s) => s.form?.name ?? '');
  const updateFormName = useFormStore((s) => s.updateFormName);

  // On first page, show editable form name
  if (pageNumber === 1) {
    return (
      <div className="mb-6">
        <input
          value={formName}
          onChange={(e) => updateFormName(e.target.value)}
          placeholder="Untitled Form"
          className="w-full bg-transparent text-3xl font-bold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/30"
        />
        {page?.title !== undefined && (
          <input
            value={page.title ?? ''}
            onChange={(e) => updatePageTitle(pageId, e.target.value)}
            placeholder="Page title (optional)"
            className="mt-1 w-full bg-transparent text-base text-muted-foreground outline-none placeholder:text-muted-foreground/30"
          />
        )}
      </div>
    );
  }

  // Other pages: just the page title
  return (
    <div className="mb-6">
      <input
        value={page?.title ?? ''}
        onChange={(e) => updatePageTitle(pageId, e.target.value)}
        placeholder={`Page ${pageNumber}`}
        className="w-full bg-transparent text-2xl font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/30"
      />
    </div>
  );
}
