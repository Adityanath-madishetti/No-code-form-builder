// src/form/renderer/SelectableWrapper.tsx
import { useEffect, useState } from 'react';
import { useFormStore } from '@/form/store/formStore';
import type { PageID } from '@/form/components/base';
import { TEMP_PAGE_PLACEHOLDER_ID } from '@/form/utils/DndUtils';

import { ArrowDown, ArrowUp, ClipboardCopy, Copy, GripVertical, Move, Settings, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/react/sortable';
import type { AnyFormComponent } from '../registry/componentRegistry';

import {
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_CATALOG_PAGE_ID,
  DRAG_COMPONENT_ID,
  DRAG_PAGE_ID,
  DRAG_PAGE_GROUP_ID,
} from '@/form/utils/DndUtils';

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
  const moveComponent = useFormStore((s) => s.moveComponent);
  const setActivePage = useFormStore((s) => s.setActivePage);
  const duplicateComponent = useFormStore((s) => s.duplicateComponent);
  const toggleComponentCollapsed = useFormStore((s) => s.toggleComponentCollapsed);
  const showPropertiesPanel = useFormStore((s) => s.showPropertiesPanel);
  const togglePropertiesPanel = useFormStore((s) => s.togglePropertiesPanel);
  const isCollapsed = useFormStore((s) => s.collapsedComponents.has(component.instanceId));

  const isSelected = selectedId === component.instanceId;

  const [copiedId, setCopiedId] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteDoNotAskAgain, setDeleteDoNotAskAgain] = useState(false);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(() => {
    try {
      if (typeof window === 'undefined') return false;
      return window.localStorage.getItem('form-builder:skipDeleteConfirm') === '1';
    } catch {
      return false;
    }
  });

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const formPageIds = useFormStore((s) => s.form?.pages ?? []);
  const pagesById = useFormStore((s) => s.pages);

  const [moveTargetPageId, setMoveTargetPageId] = useState<PageID>(pageId);
  const [moveTargetPosition, setMoveTargetPosition] = useState(index + 1); // 1-based UI position

  const moveTargetChildrenCount = pagesById[moveTargetPageId]?.children?.length ?? 0;
  const moveTargetMaxPosition = moveTargetChildrenCount + 1; // insert position: 0..len => 1..(len+1)

  useEffect(() => {
    if (!moveModalOpen) return;
    setMoveTargetPosition((p) => Math.min(p, moveTargetMaxPosition));
  }, [moveModalOpen, moveTargetMaxPosition]);

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
        setActiveComponent(component.instanceId);
        setActivePage(null);
      }}
      className={`form-component group relative transition-all duration-100 ${
        isDragging ? 'opacity-40' : 'opacity-100'
      } ${
        isSelected
          ? 'ring-2 ring-primary/50 ring-offset-1 ring-offset-background'
          : 'hover:ring-1 hover:ring-border'
      } border border-border/50 bg-background`}
    >
      {/* Slide/Drag Handle - Left Middle (Half In, Half Out) */}
      <div
        className={`absolute -left-2 top-1/2 z-30 flex -translate-y-1/2 transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-100'
        }`}
      >
        <div
          className="relative flex h-6 w-4 cursor-grab items-center justify-center border border-border/50 bg-background/95 text-muted-foreground/60 hover:text-muted-foreground/80 backdrop-blur-sm"
          data-dnd-kit-drag-handle
          title="Drag to reorder"
        >
          {/* Six dots pattern inside the rectangle */}
          <div className="grid grid-cols-2 gap-0.5">
            <div className="h-0.5 w-0.5 rounded-full bg-current"></div>
            <div className="h-0.5 w-0.5 rounded-full bg-current"></div>
            <div className="h-0.5 w-0.5 rounded-full bg-current"></div>
            <div className="h-0.5 w-0.5 rounded-full bg-current"></div>
            <div className="h-0.5 w-0.5 rounded-full bg-current"></div>
            <div className="h-0.5 w-0.5 rounded-full bg-current"></div>
          </div>
        </div>
      </div>

      {/* Header + content */}
      <div className="w-full">
        <div className="flex items-center gap-1 border-b border-border/50 bg-background px-1 py-1 pl-6">
          {/* Top-left expand/collapse */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleComponentCollapsed(component.instanceId);
            }}
            className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-background text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label={isCollapsed ? 'Expand component' : 'Collapse component'}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
          </button>

          {/* Heading (instanceId only) */}
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <span
              title={component.instanceId}
              className="inline-block w-[92px] truncate rounded-none border border-border/50 bg-background px-1 text-[11px] font-semibold font-mono text-foreground/80"
            >
              {component.instanceId}
            </span>

            {/* Copy instanceId */}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await navigator.clipboard.writeText(component.instanceId);
                  setCopiedId(true);
                  window.setTimeout(() => setCopiedId(false), 900);
                } catch {
                  // ignore clipboard errors; user can still select/copy manually
                }
              }}
              className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-background text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Copy component id"
              title="Copy component id"
            >
              {copiedId ? <Copy className="h-3 w-3 text-primary" /> : <ClipboardCopy className="h-3 w-3" />}
            </button>
          </div>

          {/* Top-right actions */}
          {!isCollapsed && (
            <div className="flex items-center gap-1">
              {/* Delete */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (skipDeleteConfirm) {
                    removeComponent(component.instanceId);
                    return;
                  }
                  setDeleteDoNotAskAgain(false);
                  setDeleteConfirmOpen(true);
                }}
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-background text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label="Delete component"
                title="Delete component"
              >
                <Trash2 className="h-3 w-3" />
              </button>

              {/* Duplicate */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const newId = duplicateComponent(component.instanceId);
                  if (newId) {
                    setActiveComponent(newId);
                    setActivePage(null);
                  }
                }}
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-background text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Duplicate component"
                title="Duplicate component"
              >
                <Copy className="h-3 w-3" />
              </button>

              {/* Move */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMoveTargetPageId(pageId);
                  setMoveTargetPosition(index + 1);
                  setMoveModalOpen(true);
                }}
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-background text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Move component"
                title="Move component"
              >
                <Move className="h-3 w-3" />
              </button>

              {/* Properties */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveComponent(component.instanceId);
                  setActivePage(null);
                  if (!showPropertiesPanel) togglePropertiesPanel();
                }}
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-background text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-colors"
                aria-label="Component properties"
                title="Component properties"
              >
                <Settings className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Collapsible content */}
        {!isCollapsed && <div className="p-1 pl-6 pr-1">{children}</div>}
      </div>

      {/* Delete confirmation modal (with "do this for every time") */}
      {deleteConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={() => setDeleteConfirmOpen(false)}
        >
          <div
            className="w-full max-w-sm border border-border bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">Delete component?</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  This will remove <span className="font-medium">{component.metadata.label}</span> from the form.
                </div>
              </div>
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-none border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close delete confirmation"
              >
                ×
              </button>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={deleteDoNotAskAgain}
                onChange={(e) => setDeleteDoNotAskAgain(e.target.checked)}
              />
              Do this for every delete (don't ask again)
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex h-8 items-center justify-center rounded-none border border-border bg-background px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteDoNotAskAgain) {
                    try {
                      window.localStorage.setItem('form-builder:skipDeleteConfirm', '1');
                      setSkipDeleteConfirm(true);
                    } catch {
                      // ignore persistence errors
                    }
                  }
                  removeComponent(component.instanceId);
                  setDeleteConfirmOpen(false);
                }}
                className="flex h-8 items-center justify-center rounded-none border border-destructive/50 bg-destructive/10 px-3 text-sm text-destructive hover:bg-destructive/15 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move component modal */}
      {moveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          onClick={() => setMoveModalOpen(false)}
        >
          <div
            className="w-full max-w-md border border-border bg-background p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">Move component</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Choose which page and position to move this component to.
                </div>
              </div>
              <button
                onClick={() => setMoveModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-none border border-border bg-background text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close move modal"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Page
                </label>
                <select
                  value={moveTargetPageId}
                  onChange={(e) => setMoveTargetPageId(e.target.value)}
                  className="h-9 w-full rounded-none border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  {formPageIds.map((pid, i) => (
                    <option key={pid} value={pid}>
                      {pagesById[pid]?.title || `Page ${i + 1}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Location in page
                </label>
                <select
                  value={moveTargetPosition}
                  onChange={(e) => setMoveTargetPosition(Number(e.target.value))}
                  className="h-9 w-full rounded-none border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  {Array.from({ length: moveTargetMaxPosition }, (_, i) => i + 1).map((pos) => (
                    <option key={pos} value={pos}>
                      Position {pos}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setMoveModalOpen(false)}
                className="flex h-8 items-center justify-center rounded-none border border-border bg-background px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  moveComponent(pageId, index, moveTargetPageId, moveTargetPosition - 1);
                  setMoveModalOpen(false);
                }}
                className="flex h-8 items-center justify-center rounded-none border border-primary/60 bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}
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
        setActivePage(pageId);
        setActiveComponent(null);
      }}
      className={`group relative !overflow-visible transition-all duration-100 ${
        isDragging ? 'opacity-40' : 'opacity-100'
      }`}
    >
      {/* Drag handle — top center */}
      <div
        className="absolute -top-4 left-1/2 z-20 -translate-x-1/2 cursor-grab border border-border/50 bg-background/95 px-1 py-0.5 shadow-lg backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100"
        data-dnd-kit-drag-handle
        title="Drag to reorder page"
      >
        <GripVertical className="h-3 w-3 rotate-90 text-muted-foreground/60" />
      </div>

      {/* Delete page */}
      {pageId !== TEMP_PAGE_PLACEHOLDER_ID && (
        <div className="absolute top-1 -right-9 z-20 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              removePage(pageId);
            }}
            className="flex h-5 w-5 cursor-pointer items-center justify-center border border-border/50 bg-background/95 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 shadow-lg backdrop-blur-sm transition-colors"
            aria-label="Remove page"
            title="Remove page"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {children}
    </div>
  );
};
