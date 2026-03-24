// src/form/renderer/SelectableWrapper.tsx
import { useFormStore } from '@/form/store/formStore';
import { Card } from '@/components/ui/card';
import type { BaseFormComponent, PageID } from '@/form/components/base';
import { PAGE_PLACEHOLDER_ID } from '@/pages/FormEditor/FormEditor';

import { GripHorizontal, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/react/sortable';

interface Props {
  component: BaseFormComponent;
  pageId: PageID;
  index: number;
  children: React.ReactNode;
}

export const SelectableComponent = ({
  component,
  pageId,
  index,
  children,
}: Props) => {
  const selectedId = useFormStore((s) => s.selectedInstanceId);
  const selectComponent = useFormStore((s) => s.selectComponent);
  const removeComponent = useFormStore((s) => s.removeComponent);
  const isSelected = selectedId === component.instanceId;
  const setActiveSidePanelTab = useFormStore((s) => s.setActiveSidePanelTab);

  const { ref, isDragging } = useSortable({
    id: component.instanceId,
    index: index,
    group: pageId,
    type: 'component',
    accept: ['component', 'catalog-component'],
    data: {
      type: 'component',
      pageId: pageId,
      instanceId: component.instanceId,
    },
  });

  return (
    <div
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        selectComponent(component.instanceId);
        setActiveSidePanelTab('properties');
      }}
      className={`form-component group relative cursor-pointer rounded-xl transition-all duration-200 ease-in-out ${isDragging ? 'opacity-50' : 'opacity-100'} `}
    >
      <div
        className={`pointer-events-none h-full w-full transition-all duration-200 ${isSelected ? '[&>div]:pr-5' : ''}`}
      >
        {children}
      </div>

      {/* {isSelected && ( */}
      <div className="absolute top-[1px] -right-[6px] bottom-[1px] z-10 flex w-12 flex-col items-center justify-start rounded-r-[calc(var(--radius)-1px)]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeComponent(component.instanceId);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/60 transition-all hover:text-destructive"
          aria-label="Remove component"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {/* )} */}
    </div>
  );
};

interface SelectablePageProps {
  pageId: PageID;
  index: number;
  children: React.ReactNode;
}

export const SelectablePage = ({
  pageId,
  index,
  children,
}: SelectablePageProps) => {
  const activePageId = useFormStore((s) => s.activePageId);
  const selectedInstanceId = useFormStore((s) => s.selectedInstanceId);
  const setActivePage = useFormStore((s) => s.setActivePage);
  const selectComponent = useFormStore((s) => s.selectComponent);
  const removePage = useFormStore((s) => s.removePage);

  const isSelected = activePageId === pageId && !selectedInstanceId;

  const { ref, isDragging } = useSortable({
    id: pageId,
    index: index,
    group: 'pages',
    type: 'page',
    accept: ['page', 'catalog-page'],
    data: {
      type: 'page',
      pageId: pageId,
    },
  });

  return (
    <Card
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        setActivePage(pageId);
        selectComponent(null);
      }}
      className={`group relative cursor-pointer !overflow-visible transition-all duration-200 ease-in-out ${isDragging ? 'opacity-50' : 'opacity-100'} ${
        isSelected
          ? 'border-primary'
          : 'border-transparent hover:border-border [&:has(.form-component:hover)]:border-transparent'
      } `}
    >
      <div
        className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 cursor-grab rounded-full border bg-background p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100 [&:has(.form-component:group-hover)]:opacity-0 [&:has(.form-component:hover)]:opacity-0"
        data-dnd-kit-drag-handle
      >
        <GripHorizontal className="h-4 w-4 text-gray-400" />
      </div>

      {pageId !== PAGE_PLACEHOLDER_ID && (
        <div className="pointer-events-none absolute top-4 left-6 z-20">
          <span className="text-sm text-muted-foreground/60">
            Page {index + 1}
          </span>
        </div>
      )}

      {pageId !== PAGE_PLACEHOLDER_ID && (
        <div className="absolute top-3.5 right-5 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              removePage(pageId);
            }}
            className="rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:text-destructive"
            aria-label="Remove page"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {children}
    </Card>
  );
};
