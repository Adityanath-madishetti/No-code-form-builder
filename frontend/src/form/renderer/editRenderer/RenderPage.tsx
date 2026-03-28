// src/form/renderer/editRenderer/RenderPage.tsx
import { useFormMode } from '@/form/context/FormModeContext';
import { SelectablePage } from '@/form/renderer/SelectableWrapper';
import type { PageID } from '@/form/components/base';
import { useShallow } from 'zustand/react/shallow';
import { useFormStore } from '@/form/store/formStore';
import { Card as HeroCard } from '@heroui/react';
import { Input as ShadInput } from '@/components/ui/input';
import { useDroppable } from '@dnd-kit/react';
import {
  DRAG_CATALOG_PAGE_ID,
  TEMP_PAGE_PLACEHOLDER_ID,
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_COMPONENT_ID,
  DRAG_PAGE_ID,
} from '@/form/utils/DndUtils';
import { RenderComponent } from './RenderComponent';
import { ComponentPropTitle } from '@/form/components/ComponentRender.Helper';
import {
  RichTextEditor,
  sharedProseClasses,
} from '@/components/RichTextEditor';

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

  const pageTitle = useFormStore(
    useShallow((s) => s.pages[pageId]?.title ?? '')
  );

  const pageDescription = useFormStore(
    useShallow((s) => s.pages[pageId]?.description ?? '')
  );

  const { ref: contentDropRef } = useDroppable({
    id: `content-drop-${pageId}`,
    accept: [DRAG_COMPONENT_ID, DRAG_CATALOG_COMPONENT_ID],
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
        className="m-6 flex h-6 items-center justify-center rounded-lg"
      >
        <span className="text-primary">Drop New Page Here</span>
      </div>
    );
  }

  const rendered = (
    <div ref={mode === 'edit' ? contentDropRef : undefined}>
      <div
        className={`relative flex flex-col gap-3 bg-transparent ${mode === 'edit' ? '-mx-12 rounded-xl border px-12 pt-12 pb-4' : ''}`}
      >
        {pageId !== TEMP_PAGE_PLACEHOLDER_ID &&
          (pageTitle || pageDescription) && (
            <HeroCard className="bg-content1 w-full border-none shadow-sm">
              {pageTitle && (
                <HeroCard.Header className="flex flex-col items-start">
                  <h3 className="text-5xl tracking-tight text-foreground">
                    {pageTitle}
                  </h3>
                </HeroCard.Header>
              )}
              {pageDescription && (
                <HeroCard.Content>
                  <div
                    className={sharedProseClasses}
                    dangerouslySetInnerHTML={{ __html: pageDescription }}
                  />
                </HeroCard.Content>
              )}
            </HeroCard>
          )}

        {componentIds.length === 0 && (
          <div
            className={`text-default-500 pointer-events-none inset-0 flex min-h-20 items-center justify-center text-sm opacity-100 transition-opacity duration-200`}
          >
            Empty Page
          </div>
        )}

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
          {components.map((component, idx) => (
            <RenderComponent
              key={component.instanceId}
              component={component}
              pageId={pageId}
              index={idx}
            />
          ))}
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

// TODO
export const RenderPageProps = ({ pageId }: { pageId: PageID }) => {
  const updatePageTitle = useFormStore((s) => s.updatePageTitle);
  const updatePageDesc = useFormStore((s) => s.updatePageDesc);

  const pageTitle = useFormStore((s) => s.pages?.[pageId].title);
  const pageDesc = useFormStore((s) => s.pages?.[pageId].description);

  return (
    <div className="w-full space-y-2">
      <ComponentPropTitle title="Page Title" />
      <ShadInput
        value={pageTitle}
        onChange={(e) => updatePageTitle(pageId, e.target.value)}
      />

      <ComponentPropTitle title="Form Description" />
      <RichTextEditor
        value={pageDesc || ''}
        onChange={(newHTML) => updatePageDesc(pageId, newHTML)}
      />
    </div>
  );
};
