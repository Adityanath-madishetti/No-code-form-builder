// src/form/renderer/SelectableWrapper.tsx
import { useFormStore } from '@/form/store/formStore';
import type { PageID } from '@/form/components/base';
import { TEMP_PAGE_PLACEHOLDER_ID } from '@/form/utils/DndUtils';

import { GripHorizontal, Trash2, Ellipsis } from 'lucide-react';
import { useSortable } from '@dnd-kit/react/sortable';
import type { AnyFormComponent } from '../registry/componentRegistry';

import {
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_CATALOG_PAGE_ID,
  DRAG_COMPONENT_ID,
  DRAG_PAGE_ID,
  DRAG_PAGE_GROUP_ID,
} from '@/form/utils/DndUtils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  component: AnyFormComponent;
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
  const selectedId = useFormStore((s) => s.activeComponentId);
  const setActiveComponent = useFormStore((s) => s.setActiveComponent);
  const removeComponent = useFormStore((s) => s.removeComponent);
  const setActivePage = useFormStore((s) => s.setActivePage);

  const isSelected = selectedId === component.instanceId;

  const duplicateComponent = useFormStore((s) => s.duplicateComponent);

  const { ref, isDragging } = useSortable({
    id: component.instanceId,
    index: index,
    group: pageId,
    type: DRAG_COMPONENT_ID,
    accept: [DRAG_COMPONENT_ID, DRAG_CATALOG_COMPONENT_ID],
    data: {
      type: DRAG_COMPONENT_ID,
      pageId: pageId,
      instanceId: component.instanceId,
    },
  });

  return (
    <div
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();

        console.groupCollapsed(
          `%c[Component Select] ${component.instanceId}`,
          'color: #fff787; font-weight: bold;'
        );

        console.log('Event:', {
          type: e.type,
          target: e.target,
          currentTarget: e.currentTarget,
        });

        console.log('Component:', {
          instanceId: component.instanceId,
          pageId,
          index,
        });

        console.log('Before State:', {
          activeComponentId: selectedId,
        });

        setActiveComponent(component.instanceId);
        setActivePage(null);

        setTimeout(() => {
          const state = useFormStore.getState();

          console.log('After State:', {
            activeComponentId: state.activeComponentId,
            activePageId: state.activePageId,
            activeSidePanelTab: state.activeSidePanelTab,
          });

          if (state.activeComponentId !== component.instanceId) {
            console.warn('[ FAILURE ] Selection FAILED: state mismatch');
          } else {
            console.log('[ SUCCESS ] Selection SUCCESS');
          }

          console.groupEnd();
        }, 0);
      }}
      className={`form-component group relative cursor-pointer rounded-xl ${
        isDragging ? 'opacity-50' : 'opacity-100'
      } ${isSelected ? '' : ''} `}
    >
      <div className="pointer-events-none h-full w-full transition-all duration-200">
        {children}
      </div>

      <div className="absolute top-[1px] -right-12 bottom-[1px] z-10 flex h-0 w-12 flex-col items-center justify-start">
        <button
          onClick={(e) => {
            e.stopPropagation();
            removeComponent(component.instanceId);
          }}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground/60 transition-all hover:text-destructive"
          aria-label="Remove component"
        >
          <Trash2 className="h-5 w-5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="mt-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground/60 transition-all hover:text-foreground"
              aria-label="More options"
            >
              <Ellipsis className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                const newId = duplicateComponent(component.instanceId);
                if (newId) {
                  setActiveComponent(newId);
                }
                console.log('Component duplicated:', {
                  originalId: component.instanceId,
                  newId: newId,
                  pageId,
                });
              }}
            >
              Duplicate
            </DropdownMenuItem>
            {/* <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                console.log('Hide clicked');
              }}
            >
              Hide
            </DropdownMenuItem> */}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
  const setActivePage = useFormStore((s) => s.setActivePage);
  const setActiveComponent = useFormStore((s) => s.setActiveComponent);
  const removePage = useFormStore((s) => s.removePage);

  const { ref, isDragging } = useSortable({
    id: pageId,
    index: index,
    group: DRAG_PAGE_GROUP_ID,
    type: DRAG_PAGE_ID,
    accept: [DRAG_PAGE_ID, DRAG_CATALOG_PAGE_ID],
    data: {
      type: DRAG_PAGE_ID,
      pageId: pageId,
    },
  });

  return (
    <div
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();

        console.groupCollapsed(
          `%c[Page Select] ${pageId}`,
          'color: #fff787; font-weight: bold;'
        );

        console.log('Event:', {
          type: e.type,
          target: e.target,
          currentTarget: e.currentTarget,
        });

        console.log('Page:', {
          pageId,
          index,
        });

        const beforeState = useFormStore.getState();

        console.log('Before State:', {
          activePageId: beforeState.activePageId,
          activeComponentId: beforeState.activeComponentId,
        });

        setActivePage(pageId);
        setActiveComponent(null);

        setTimeout(() => {
          const state = useFormStore.getState();

          console.log('After State:', {
            activePageId: state.activePageId,
            activeComponentId: state.activeComponentId,
            activeSidePanelTab: state.activeSidePanelTab,
          });

          if (state.activePageId !== pageId) {
            console.warn('❌ Page selection FAILED');
          } else {
            console.log('✅ Page selection SUCCESS');
          }

          console.groupEnd();
        }, 0);
      }}
      className={`group relative cursor-pointer !overflow-visible transition-all duration-200 ease-in-out ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div
        className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 cursor-grab rounded-full border bg-background p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:opacity-100 [&:has(.form-component:group-hover)]:opacity-0 [&:has(.form-component:hover)]:opacity-0"
        data-dnd-kit-drag-handle
      >
        <GripHorizontal className="h-4 w-4 text-gray-400" />
      </div>

      {pageId !== TEMP_PAGE_PLACEHOLDER_ID && (
        <div className="absolute top-2 -right-9.5 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              removePage(pageId);
            }}
            className="rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:text-destructive"
            aria-label="Remove page"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      )}

      {children}
    </div>
  );
};
