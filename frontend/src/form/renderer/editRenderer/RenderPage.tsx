// src/form/renderer/editRenderer/RenderPage.tsx
import { useFormMode } from '@/form/context/FormModeContext';
import { SelectablePage } from '@/form/renderer/SelectableWrapper';
import type { PageID } from '@/form/components/base';
import { useShallow } from 'zustand/react/shallow';
import { useFormStore } from '@/form/store/form.store';
import { useDroppable } from '@dnd-kit/react';
import {
  DRAG_CATALOG_PAGE_ID,
  TEMP_PAGE_PLACEHOLDER_ID,
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_COMPONENT_ID,
  DRAG_PAGE_ID,
  DRAG_CATALOG_GROUP_ID,
} from '@/form/utils/DndUtils';
import { RenderComponent } from './RenderComponent';
import { ComponentAdderButton } from '@/pages/editor/builder/ComponentAdderButton';

export const RenderPage = ({
  pageId,
  index,
}: {
  pageId: PageID;
  index: number;
}) => {
  const mode = useFormMode();
  const componentIds = useFormStore(
    useShallow((s) => s.pages[pageId]?.children ?? [])
  );
  const components = useFormStore(
    useShallow((s) =>
      componentIds.map((id) => s.components[id]).filter(Boolean)
    )
  );

  const { ref: contentDropRef } = useDroppable({
    id: `content-drop-${pageId}`,
    accept: [
      DRAG_COMPONENT_ID,
      DRAG_CATALOG_COMPONENT_ID,
      DRAG_CATALOG_GROUP_ID,
    ],
    data: { type: DRAG_PAGE_ID, pageId: pageId },
  });

  const { ref: pagePlaceholderRef } = useDroppable({
    id: `page-placeholder-drop`,
    accept: [DRAG_CATALOG_PAGE_ID],
    data: { type: DRAG_PAGE_ID, pageId: TEMP_PAGE_PLACEHOLDER_ID },
  });

  if (pageId === TEMP_PAGE_PLACEHOLDER_ID) {
    return (
      <div
        ref={mode === 'edit' ? pagePlaceholderRef : undefined}
        className="m-4 flex h-6 items-center justify-center"
      >
        <span className="text-sm text-primary">Drop New Page Here</span>
      </div>
    );
  }

  const rendered = (
    <div ref={mode === 'edit' ? contentDropRef : undefined}>
      <div
        className={`relative flex flex-col gap-2 bg-transparent ${
          mode === 'edit' ? 'border border-border/30 p-6' : ''
        }`}
      >
        {componentIds.length === 0 && mode === 'edit' && (
          <ComponentAdderButton pageId={pageId} insertIndex={0} />
        )}

        {componentIds.length === 0 && mode !== 'edit' && (
          <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground/40">
            No components
          </div>
        )}

        <div className="flex w-full flex-col gap-0">
          {components.map((component, idx) => (
            <div key={component.instanceId}>
              {/* Adder button BEFORE this component */}
              {mode === 'edit' && (
                <ComponentAdderButton pageId={pageId} insertIndex={idx} />
              )}
              <RenderComponent
                component={component}
                pageId={pageId}
                index={idx}
              />
            </div>
          ))}
          {/* Adder button AFTER last component */}
          {mode === 'edit' && components.length > 0 && (
            <ComponentAdderButton
              pageId={pageId}
              insertIndex={components.length}
            />
          )}
        </div>
      </div>
    </div>
  );

  return mode === 'edit' ? (
    <SelectablePage pageId={pageId} index={index}>
      {rendered}
    </SelectablePage>
  ) : (
    rendered
  );
};
