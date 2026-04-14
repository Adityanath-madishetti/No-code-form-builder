// src/form/renderer/SelectableWrapper.tsx
import { useState } from 'react';
import { formSelectors, useFormStore } from '@/form/store/form.store';
import { useGroupStore } from '@/form/store/group.store';
import type { PageID } from '@/form/components/base';
// import { TEMP_PAGE_PLACEHOLDER_ID } from '@/form/utils/DndUtils';

import {
  ArrowDown,
  ArrowUp,
  Copy,
  SquareCheck,
  Move,
  Settings,
  Trash2,
} from 'lucide-react';
import { useSortable } from '@dnd-kit/react/sortable';
import type { AnyFormComponent } from '../registry/componentRegistry';

import {
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_CATALOG_PAGE_ID,
  DRAG_COMPONENT_ID,
  DRAG_PAGE_ID,
  DRAG_PAGE_GROUP_ID,
  DRAG_CATALOG_GROUP_ID,
} from '@/form/utils/DndUtils';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  // ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Layers } from 'lucide-react';
// import { Layers, CopyX, Files } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

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
  const activeId = useFormStore((s) => s.activeComponentId);
  const setActiveComponent = useFormStore((s) => s.setActiveComponent);
  const removeComponent = useFormStore((s) => s.removeComponent);
  const moveComponent = useFormStore((s) => s.moveComponent);
  const updateLabel = useFormStore((s) => s.updateComponentMetadata);
  const setActivePage = useFormStore((s) => s.setActivePage);
  const duplicateComponent = useFormStore((s) => s.duplicateComponent);
  const toggleComponentCollapsed = useFormStore(
    (s) => s.toggleComponentCollapsed
  );
  const showPropertiesPanel = useFormStore((s) => s.showPropertiesPanel);
  const togglePropertiesPanel = useFormStore((s) => s.togglePropertiesPanel);
  const isCollapsed = useFormStore(
    (s) => !!s.collapsedComponents[component.instanceId]
  );

  const isActive = activeId === component.instanceId;

  const [copiedId, setCopiedId] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteDoNotAskAgain, setDeleteDoNotAskAgain] = useState(false);
  const [skipDeleteConfirm, setSkipDeleteConfirm] = useState(() => {
    try {
      if (typeof window === 'undefined') return false;
      return (
        window.localStorage.getItem('form-builder:skipDeleteConfirm') === '1'
      );
    } catch {
      return false;
    }
  });

  const isHiddenByDefault = component.props.hiddenByDefault === true;

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const formPageIds = useFormStore((s) => s.form?.pages ?? []);
  const pagesById = useFormStore((s) => s.pages);

  const [moveTargetPageId, setMoveTargetPageId] = useState<PageID>(pageId);
  const [moveTargetPosition, setMoveTargetPosition] = useState(index + 1); // 1-based UI position

  const moveTargetChildrenCount =
    pagesById[moveTargetPageId]?.children?.length ?? 0;
  const moveTargetMaxPosition = moveTargetChildrenCount + 1; // insert position: 0..len => 1..(len+1)

  const addSelectedComponent = useFormStore((s) => s.addSelectedComponent);
  const removeSelectedComponent = useFormStore(
    (s) => s.removeSelectedComponent
  );
  const clearSelectedComponents = useFormStore(
    (s) => s.clearSelectedComponents
  );

  const selectedComponents = useFormStore(
    useShallow(formSelectors.selectedComponents)
  );
  const isSelected = selectedComponents.some(
    (c) => c.instanceId === component.instanceId
  );

  const { ref, isDragging } = useSortable({
    id: component.instanceId,
    index: index,
    group: pageId,
    type: DRAG_COMPONENT_ID,
    accept: [
      DRAG_COMPONENT_ID,
      DRAG_CATALOG_COMPONENT_ID,
      DRAG_CATALOG_GROUP_ID,
    ],
    data: {
      type: DRAG_COMPONENT_ID,
      pageId: pageId,
      instanceId: component.instanceId,
    },
  });
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={ref}
          data-component-instance-id={component.instanceId}
          onClick={(e) => {
            e.stopPropagation();

            // if a left click with ctrl or meta key is pressed, toggle selection for multi-select
            if ((e.ctrlKey || e.metaKey) && e.button === 0) {
              setActiveComponent(null);
              if (
                selectedComponents.some(
                  (c) => c.instanceId === component.instanceId
                )
              ) {
                removeSelectedComponent(component.instanceId);
                console.log('Component deselected:', {
                  instanceId: component.instanceId,
                  pageId,
                  index,
                });
              } else {
                addSelectedComponent(component.instanceId);
                console.log('Component selected:', {
                  instanceId: component.instanceId,
                  pageId,
                  index,
                });
              }
              return;
            }

            // Note: Right click handling is now managed by ContextMenu inherently
            if ((e.ctrlKey || e.metaKey) && e.button === 2) {
              e.preventDefault();
              return;
            }

            clearSelectedComponents();

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
              activeComponentId: activeId,
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
          className={`form-component group relative transition-all duration-100 ${
            isDragging ? 'opacity-40' : ''
          } ${
            isActive
              ? 'ring-2 ring-primary/50 ring-offset-1 ring-offset-background'
              : 'hover:ring-1 hover:ring-border'
          } ${
            isHiddenByDefault ? 'opacity-40' : ''
          } border border-border/50 bg-background ${isSelected ? 'border-foreground opacity-50' : ''} `}
        >
          {/* Slide/Drag Handle - Left Middle (Half In, Half Out) */}
          <div
            className={`absolute top-1/2 -left-2 z-30 flex -translate-y-1/2 transition-opacity ${
              isActive ? 'opacity-100' : 'opacity-100'
            }`}
          >
            <div
              className="relative flex h-6 w-4 cursor-grab items-center justify-center border border-border/50 bg-background/95 text-muted-foreground/60 backdrop-blur-sm hover:text-muted-foreground/80"
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
                className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-background text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-foreground"
                aria-label={
                  isCollapsed ? 'Expand component' : 'Collapse component'
                }
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? (
                  <ArrowDown className="h-3 w-3" />
                ) : (
                  <ArrowUp className="h-3 w-3" />
                )}
              </button>

              {/* Heading (instanceId only) */}
              <div className="flex min-w-0 flex-1 items-center gap-1">
                {/* <span
                  title={component.metadata.label}
                  className="inline-block truncate rounded-none border border-border/50 bg-background px-1 font-mono text-[11px] font-semibold text-foreground/80"
                >
                  {component.metadata.label}
                </span> */}

                <input
                  value={component.metadata.label}
                  onChange={(e) =>
                    updateLabel(component.instanceId, { label: e.target.value })
                  }
                  className="h-5 flex-1 truncate rounded-none border border-border/50 bg-background px-1 font-mono text-[11px] font-semibold text-foreground/80"
                />

                {/* Copy instanceId */}
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await navigator.clipboard.writeText(
                        component.metadata.label
                      );
                      setCopiedId(true);
                      window.setTimeout(() => setCopiedId(false), 900);
                    } catch {
                      // ignore clipboard errors; user can still select/copy manually
                    }
                  }}
                  className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-background text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-foreground"
                  aria-label="Copy component id"
                  title="Copy component id"
                >
                  {copiedId ? (
                    <SquareCheck className="h-3 w-3 text-primary" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
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
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-background text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
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
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-background text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-foreground"
                    aria-label="Duplicate component"
                    title="Duplicate component"
                  >
                    <Copy className="h-3 w-3" />
                  </button>

                  {/* Move */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const count = pagesById[pageId]?.children?.length ?? 0;
                      const maxPos = count + 1;
                      setMoveTargetPageId(pageId);
                      setMoveTargetPosition(Math.min(index + 1, maxPos));
                      setMoveModalOpen(true);
                    }}
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-background text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-foreground"
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
                    className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-background text-muted-foreground/60 transition-colors hover:bg-muted/50 hover:text-foreground"
                    aria-label="Component properties"
                    title="Component properties"
                  >
                    <Settings className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Collapsible content */}
            {!isCollapsed && <div className="p-1 pr-1 pl-6">{children}</div>}
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
                    <div className="text-sm font-semibold text-foreground">
                      Delete component?
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      This will remove{' '}
                      <span className="font-medium">
                        {component.metadata.label}
                      </span>{' '}
                      from the form.
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteConfirmOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-none border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
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
                    className="flex h-8 items-center justify-center rounded-none border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (deleteDoNotAskAgain) {
                        try {
                          window.localStorage.setItem(
                            'form-builder:skipDeleteConfirm',
                            '1'
                          );
                          setSkipDeleteConfirm(true);
                        } catch {
                          // ignore persistence errors
                        }
                      }
                      removeComponent(component.instanceId);
                      setDeleteConfirmOpen(false);
                    }}
                    className="flex h-8 items-center justify-center rounded-none border border-destructive/50 bg-destructive/10 px-3 text-sm text-destructive transition-colors hover:bg-destructive/15"
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
                    <div className="text-sm font-semibold text-foreground">
                      Move component
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Choose which page and position to move this component to.
                    </div>
                  </div>
                  <button
                    onClick={() => setMoveModalOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-none border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
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
                      onChange={(e) => {
                        const nextPageId = e.target.value;
                        const count =
                          pagesById[nextPageId]?.children?.length ?? 0;
                        const maxPos = count + 1;
                        setMoveTargetPageId(nextPageId);
                        setMoveTargetPosition((p) => Math.min(p, maxPos));
                      }}
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
                      onChange={(e) =>
                        setMoveTargetPosition(Number(e.target.value))
                      }
                      className="h-9 w-full rounded-none border border-border bg-background px-2 text-sm text-foreground outline-none focus:border-primary"
                    >
                      {Array.from(
                        { length: moveTargetMaxPosition },
                        (_, i) => i + 1
                      ).map((pos) => (
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
                    className="flex h-8 items-center justify-center rounded-none border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      moveComponent(
                        pageId,
                        index,
                        moveTargetPageId,
                        moveTargetPosition - 1
                      );
                      setMoveModalOpen(false);
                    }}
                    className="flex h-8 items-center justify-center rounded-none border border-primary/60 bg-primary px-3 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    Move
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56 rounded-none shadow-none">
        <ContextMenuItem
          className="rounded-none"
          onClick={(e) => {
            e.stopPropagation();
            let componentsToGroup = [];
            if (isSelected) {
              componentsToGroup = selectedComponents;
            } else {
              componentsToGroup = [component];
            }
            if (componentsToGroup.length > 0) {
              const groupName = window.prompt(
                `Enter a name for the new group containing ${componentsToGroup.length} component(s):`,
                'New Group'
              );
              if (groupName) {
                const { addGroup } = useGroupStore.getState();
                addGroup(groupName, componentsToGroup);
                clearSelectedComponents();
              }
            }
          }}
        >
          <Layers className="mr-2 h-4 w-4" />
          <span>Save as Group</span>
          {isSelected && selectedComponents.length > 1 && (
            <ContextMenuShortcut>
              {selectedComponents.length} items
            </ContextMenuShortcut>
          )}
        </ContextMenuItem>

        {/* <ContextMenuSeparator /> */}

        {/* <ContextMenuItem
          onClick={(e) => {
            e.stopPropagation();
            if (isSelected) {
              const sorted = [...selectedComponents].reverse(); // Duplicate order optionally? Since duplicate is linear.
              sorted.forEach((c) => duplicateComponent(c.instanceId));
            } else {
              duplicateComponent(component.instanceId);
            }
          }}
        >
          <Files className="mr-2 h-4 w-4" />
          <span>Duplicate</span>
        </ContextMenuItem>

        <ContextMenuItem
          variant="destructive"
          onClick={(e) => {
            e.stopPropagation();
            if (skipDeleteConfirm || deleteDoNotAskAgain) {
              if (isSelected) {
                selectedComponents.forEach((c) =>
                  removeComponent(c.instanceId)
                );
                clearSelectedComponents();
              } else {
                removeComponent(component.instanceId);
              }
            } else {
              setDeleteConfirmOpen(true);
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </ContextMenuItem> */}
      </ContextMenuContent>
    </ContextMenu>
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
      <div className="absolute top-1 -right-9 z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            removePage(pageId);
          }}
          className="flex h-5 w-5 cursor-pointer items-center justify-center border border-border/50 bg-background/95 text-muted-foreground/60 shadow-lg backdrop-blur-sm transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Remove page"
          title="Remove page"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>

      {children}
    </div>
  );
};
