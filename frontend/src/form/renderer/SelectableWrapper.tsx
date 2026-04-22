// src/form/renderer/SelectableWrapper.tsx
import { useState } from 'react';
import { formSelectors, useFormStore } from '@/form/store/form.store';
import { useGroupStore } from '@/form/store/group.store';
import type { PageID } from '@/form/components/base';

import { ArrowDown, ArrowUp, Copy, Move, Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/react/sortable';
import type { AnyFormComponent } from '../registry/componentRegistry';

import {
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_COMPONENT_ID,
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
import { Layers, RefreshCw } from 'lucide-react';
// import { Layers, CopyX, Files } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { UpdateGroupDialog } from './UpdateGroupDialog';
import { useAuth } from '@/contexts/AuthContext';

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
  const isCollapsed = useFormStore(
    (s) => !!s.collapsedComponents[component.instanceId]
  );

  const isActive = activeId === component.instanceId;

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

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('New Group');
  const [updateGroupDialogOpen, setUpdateGroupDialogOpen] = useState(false);
  const { user } = useAuth();
  const groups = useGroupStore((s) => s.groups);
  const personalGroups = groups.filter((g) => g.createdBy === user?.uid);

  const isHiddenByDefault = component.props.hiddenByDefault === true;

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const formPageIds = useFormStore((s) => s.form?.pages ?? []);
  const pagesById = useFormStore((s) => s.pages);

  const [moveTargetPageId, setMoveTargetPageId] = useState<PageID>(pageId);
  const [moveTargetPosition, setMoveTargetPosition] = useState(index + 1);

  const moveTargetChildrenCount =
    pagesById[moveTargetPageId]?.children?.length ?? 0;
  const moveTargetMaxPosition = moveTargetChildrenCount + 1;

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
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={ref}
            data-component-instance-id={component.instanceId}
            onClick={(e) => {
              e.stopPropagation();

              if ((e.ctrlKey || e.metaKey) && e.button === 0) {
                setActiveComponent(null);
                if (
                  selectedComponents.some(
                    (c) => c.instanceId === component.instanceId
                  )
                ) {
                  removeSelectedComponent(component.instanceId);
                } else {
                  addSelectedComponent(component.instanceId);
                }
                return;
              }

              if ((e.ctrlKey || e.metaKey) && e.button === 2) {
                e.preventDefault();
                return;
              }

              clearSelectedComponents();
              setActiveComponent(component.instanceId);
              setActivePage(null);
            }}
            className={`form-component group relative transition-all duration-100 ${
              isDragging ? 'opacity-40' : ''
            } ${
              isActive
                ? 'ring-2 ring-border ring-offset-1 ring-offset-background'
                : 'hover:ring-1 hover:ring-border'
            } ${
              isHiddenByDefault ? 'opacity-40' : ''
            } border border-border/50 ${isSelected ? 'border-foreground opacity-50' : ''} `}
          >
            <div className="w-full">
              <div className="flex items-center gap-1 border-b border-border/50 px-1 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComponentCollapsed(component.instanceId);
                  }}
                  className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-white text-black hover:bg-muted/50"
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

                <div className="flex min-w-0 flex-1 items-center gap-1">
                  <input
                    value={component.metadata.label}
                    onChange={(e) =>
                      updateLabel(component.instanceId, {
                        label: e.target.value,
                      })
                    }
                    className="h-5 flex-1 truncate rounded-none border border-border/50 bg-white px-1 font-mono text-[11px] font-semibold text-black outline-none focus:border-black"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {!isCollapsed && (
                  <div className="flex items-center gap-1">
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
                      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-white text-black hover:bg-muted/50"
                      aria-label="Delete component"
                      title="Delete component"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newId = duplicateComponent(component.instanceId);
                        if (newId) {
                          setActiveComponent(newId);
                          setActivePage(null);
                        }
                      }}
                      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-white text-black hover:bg-muted/50"
                      aria-label="Duplicate component"
                      title="Duplicate component"
                    >
                      <Copy className="h-3 w-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const count = pagesById[pageId]?.children?.length ?? 0;
                        const maxPos = count + 1;
                        setMoveTargetPageId(pageId);
                        setMoveTargetPosition(Math.min(index + 1, maxPos));
                        setMoveModalOpen(true);
                      }}
                      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-none border border-border/50 bg-white text-black hover:bg-muted/50"
                      aria-label="Move component"
                      title="Move component"
                    >
                      <Move className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {!isCollapsed && <div className="p-1 pr-1">{children}</div>}
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem
            disabled={selectedComponents.length === 0}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedComponents.length > 0) {
                setGroupName('New Group'); // Reset the input
                setGroupDialogOpen(true);
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
          <ContextMenuItem
            disabled={
              personalGroups.length === 0 ||
              !(isSelected && selectedComponents.length > 0)
            }
            onClick={(e) => {
              e.stopPropagation();
              if (
                isSelected &&
                selectedComponents.length > 0 &&
                personalGroups.length > 0
              ) {
                setUpdateGroupDialogOpen(true);
              }
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            <span>Update Existing Group</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* --- SHADCN DELETE DIALOG --- */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Delete component?
            </DialogTitle>
            <DialogDescription className="text-xs">
              This will remove{' '}
              <span className="font-medium text-foreground">
                {component.metadata.label}
              </span>{' '}
              from the form.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 py-2">
            <Checkbox
              id={`do-not-ask-${component.instanceId}`}
              checked={deleteDoNotAskAgain}
              onCheckedChange={(checked) =>
                setDeleteDoNotAskAgain(checked === true)
              }
            />
            <Label
              htmlFor={`do-not-ask-${component.instanceId}`}
              className="cursor-pointer text-xs font-normal text-muted-foreground"
            >
              Do this for every delete (don't ask again)
            </Label>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (deleteDoNotAskAgain) {
                  try {
                    window.localStorage.setItem(
                      'form-builder:skipDeleteConfirm',
                      '1'
                    );
                    setSkipDeleteConfirm(true);
                  } catch {
                    /* empty */
                  }
                }
                removeComponent(component.instanceId);
                setDeleteConfirmOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- SHADCN MOVE DIALOG --- */}
      <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Move component
            </DialogTitle>
            <DialogDescription className="text-xs">
              Choose which page and position to move this component to.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Page</Label>
              <Select
                value={moveTargetPageId}
                onValueChange={(nextPageId) => {
                  const count = pagesById[nextPageId]?.children?.length ?? 0;
                  const maxPos = count + 1;
                  setMoveTargetPageId(nextPageId);
                  setMoveTargetPosition((p) => Math.min(p, maxPos));
                }}
              >
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  {formPageIds.map((pid, i) => (
                    <SelectItem key={pid} value={pid}>
                      {pagesById[pid]?.title || `Page ${i + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Location in page
              </Label>
              <Select
                value={moveTargetPosition.toString()}
                onValueChange={(val) => setMoveTargetPosition(Number(val))}
              >
                <SelectTrigger className="h-9 w-full text-sm">
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: moveTargetMaxPosition },
                    (_, i) => i + 1
                  ).map((pos) => (
                    <SelectItem
                      key={pos.toString()}
                      value={pos.toString()}
                      className="rounded-none"
                    >
                      Position {pos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setMoveModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                moveComponent(
                  pageId,
                  index,
                  moveTargetPageId,
                  moveTargetPosition - 1
                );
                setMoveModalOpen(false);
              }}
            >
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- SHADCN GROUP DIALOG --- */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              Save as Group
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter a name for the new group containing{' '}
              {selectedComponents.length} component(s).
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group Name"
              className="h-9 text-sm"
              autoFocus
              onKeyDown={(e) => {
                // Allow pressing Enter to save
                if (e.key === 'Enter' && groupName.trim()) {
                  const { addGroup } = useGroupStore.getState();
                  addGroup(groupName.trim(), selectedComponents);
                  clearSelectedComponents();
                  setGroupDialogOpen(false);
                }
              }}
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGroupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!groupName.trim()}
              onClick={() => {
                if (groupName.trim()) {
                  const { addGroup } = useGroupStore.getState();
                  addGroup(groupName.trim(), selectedComponents);
                  clearSelectedComponents();
                  setGroupDialogOpen(false);
                }
              }}
            >
              Save Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpdateGroupDialog
        open={updateGroupDialogOpen}
        onOpenChange={setUpdateGroupDialogOpen}
        onSave={(groupId) => {
          const { updateGroup } = useGroupStore.getState();
          updateGroup(groupId, { components: selectedComponents });
          clearSelectedComponents();
          setUpdateGroupDialogOpen(false);
        }}
      />
    </>
  );
};
interface SelectablePageProps {
  pageId: PageID;
  children: React.ReactNode;
}

export const SelectablePage = ({ pageId, children }: SelectablePageProps) => {
  const setActivePage = useFormStore((s) => s.setActivePage);
  const setActiveComponent = useFormStore((s) => s.setActiveComponent);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setActivePage(pageId);
        setActiveComponent(null);
      }}
      className={`group relative !overflow-visible transition-all duration-100`}
    >
      {children}
    </div>
  );
};
