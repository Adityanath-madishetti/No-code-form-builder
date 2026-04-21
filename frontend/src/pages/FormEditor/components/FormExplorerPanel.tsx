// frontend/src/pages/FormEditor/components/FormExplorerPanel.tsx
import React, { useCallback, useState, useContext } from 'react';
import {
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  Component as ComponentIcon,
  Zap,
  Settings2,
  ListTree,
  FilePlus,
  Trash2,
} from 'lucide-react';
import { useFormStore } from '@/form/store/form.store';
import { cn } from '@/lib/utils';
import {
  DeletePageDialog,
  DONT_ASK_DELETE_PAGE_KEY,
} from '@/components/DeletePageDialog';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ComponentPropertiesPanel } from './ComponentPropertiesPanel';
import { ComponentLogicPanel } from './ComponentsLogicPanel';
import { DeletePageContext } from './DeletePageContext';
import { useShallow } from 'zustand/react/shallow';

import { useMemo } from 'react';

import { type CursorProps } from 'react-arborist';

function CustomCursor({ top, left }: CursorProps) {
  return (
    <div
      className="pointer-events-none absolute z-50 flex items-center"
      style={{
        top,
        left,
        right: 0, // Stretch to the right edge
      }}
    >
      {/* The little circle on the left */}
      {/* <div className="absolute -left-1.5 h-3 w-3 rounded-full border-[2.5px] border-primary bg-background" /> */}

      {/* The main line */}
      <div className="h-[2px] w-full bg-primary" />
    </div>
  );
}

// This is the shape Arborist expects.
// We add `isFolder` to distinguish Pages from Components.
export type TreeNodeData = {
  id: string;
  name: string;
  isFolder: boolean;
  children?: TreeNodeData[];
};

function useTreeData(): TreeNodeData[] {
  const form = useFormStore((s) => s.form);
  const pages = useFormStore((s) => s.pages);
  const components = useFormStore((s) => s.components);

  return useMemo(() => {
    if (!form) return [];

    return form.pages.map((pageId) => {
      const page = pages[pageId];
      if (!page) return { id: pageId, name: 'Unknown Page', isFolder: true };

      return {
        id: pageId,
        name: page.title || '[UNNAMED PAGE]',
        isFolder: true,
        // Map the component IDs into nested objects
        children: page.children.map((compId) => {
          const comp = components[compId];
          return {
            id: compId,
            name: comp?.metadata?.label || 'Unknown Component',
            isFolder: false,
          };
        }),
      };
    });
  }, [form, pages, components]);
}

import { Tree, type NodeRendererProps, type MoveHandler } from 'react-arborist';

// --- 1. The Individual Row Renderer ---
function Node({ node, style, dragHandle }: NodeRendererProps<TreeNodeData>) {
  const { data } = node;
  const isPage = data.isFolder;

  // Access UI state from your store
  const activePageId = useFormStore((s) => s.activePageId);
  const activeComponentId = useFormStore((s) => s.activeComponentId);
  const setActivePage = useFormStore((s) => s.setActivePage);
  const setActiveComponent = useFormStore((s) => s.setActiveComponent);
  const setCurrentPageIndex = useFormStore((s) => s.setCurrentPageIndex);
  const requestDelete = useContext(DeletePageContext);
  const form = useFormStore((s) => s.form);

  const isActive = isPage
    ? activePageId === data.id
    : activeComponentId === data.id;

  const handleClick = () => {
    if (isPage) {
      setActivePage(data.id);
      setActiveComponent(null);
      if (form) {
        const pageIndex = form.pages.indexOf(data.id);
        if (pageIndex !== -1) {
          setCurrentPageIndex(pageIndex);
        }
      }
      node.toggle();
    } else {
      setActiveComponent(data.id);
      setActivePage(null);
      const parentNode = node.parent;
      if (form && parentNode && parentNode.data) {
        const pageIndex = form.pages.indexOf(parentNode.data.id);
        if (pageIndex !== -1) {
          setCurrentPageIndex(pageIndex);
        }
      }
    }
  };

  return (
    <div
      ref={dragHandle} // Arborist handles the drag attributes here!
      style={style}
      onClick={handleClick}
      className={cn(
        'group flex cursor-pointer items-center pr-2 outline-none hover:bg-accent/50',
        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
        node.state.isDragging && 'opacity-50', // Dim while dragging
        node.state.willReceiveDrop && 'bg-primary/20 ring-1 ring-primary' // Highlight when hovering over a folder
      )}
    >
      {/* Indentation based on tree depth */}
      <div style={{ width: node.level * 13 }} className="shrink-0" />

      {isPage ? (
        // PAGE (FOLDER) UI
        <div className="flex w-full items-center py-1.5 pr-2 pl-2">
          <div
            onClick={(e) => {
              e.stopPropagation();
              node.toggle(); // Built-in open/close method!
            }}
            className="mr-1 flex h-4 w-4 items-center justify-center hover:bg-muted/50"
          >
            {node.isOpen ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </div>
          <span className="mr-2 shrink-0">
            {node.isOpen ? <FolderOpen size={14} /> : <Folder size={14} />}
          </span>
          <span className="flex-1 truncate font-medium">{data.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              requestDelete(data.id, data.name);
            }}
            className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove page"
            title="Remove page"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ) : (
        // COMPONENT (FILE) UI
        <div className="flex w-full items-center py-1.5">
          <ComponentIcon size={13} className="mr-2 shrink-0 opacity-70" />
          <span className="truncate">{data.name}</span>
        </div>
      )}
    </div>
  );
}

// --- 2. The Main Tree Component ---
export function ExplorerPanel() {
  const data = useTreeData();
  const pages = useFormStore((s) => s.pages);
  const form = useFormStore((s) => s.form);
  const reorderPages = useFormStore((s) => s.reorderPages);
  const moveComponent = useFormStore((s) => s.moveComponent);

  if (!form)
    return (
      <div className="p-4 text-sm text-muted-foreground">No active schema</div>
    );

  // Map Arborist drop events to your Zustand actions
  const handleMove: MoveHandler<TreeNodeData> = ({
    dragIds,
    parentId,
    parentNode,
    index,
  }) => {
    const draggedId = dragIds[0];

    // Scenario A: Dragged to the root level (parentId is null)
    // FIX: Safely check if we are dropping at the root level using parentNode.isRoot
    if (parentNode?.isRoot || parentId === null) {
      const oldIndex = form.pages.indexOf(draggedId);
      if (oldIndex !== -1 && index !== -1) {
        // Adjust the destination index when moving an item further down the array
        let targetIndex = index;
        if (oldIndex < targetIndex) {
          targetIndex -= 1;
        }
        reorderPages(oldIndex, targetIndex);
      }
      return;
    }

    // Scenario B: Dragged into a folder (parentId is a pageId)
    // First, we need to find out where the component currently is
    let sourcePageId: string | null = null;
    let sourceIndex = -1;

    for (const [pId, pageData] of Object.entries(pages)) {
      const compIndex = pageData.children.indexOf(draggedId);
      if (compIndex !== -1) {
        sourcePageId = pId;
        sourceIndex = compIndex;
        break;
      }
    }

    if (sourcePageId && sourceIndex !== -1 && index !== -1) {
      // Same adjustment needed if moving a component down within the SAME page
      let targetIndex = index;
      if (sourcePageId === parentId && sourceIndex < targetIndex) {
        targetIndex -= 1;
      }
      moveComponent(sourcePageId, sourceIndex, parentId, targetIndex);
    }
  };

  return (
    <div className="flex h-full w-full flex-col py-1">
      <Tree
        data={data}
        onMove={handleMove}
        width="100%"
        rowHeight={32}
        indent={16}
        openByDefault={false}
        disableMultiSelection={true}
        renderCursor={CustomCursor}
        disableDrag={() => false}
        disableDrop={({ dragNodes, parentNode }) => {
          const draggedNode = dragNodes[0];
          if (!draggedNode) return false;

          const isPage = draggedNode.data.isFolder;

          // FIX: Use isRoot instead of checking parent data IDs
          // 1. Pages can ONLY be dropped at the root level
          if (isPage && !parentNode.isRoot) return true;

          // 2. Components can ONLY be dropped inside a page (not at root)
          if (!isPage && parentNode.isRoot) return true;

          return false;
        }}
      >
        {Node}
      </Tree>
    </div>
  );
}

export function FormFileExplorer() {
  const addPage = useFormStore((s) => s.addPage);
  const removePage = useFormStore((s) => s.removePage);

  const setCurrentPageIndex = useFormStore((s) => s.setCurrentPageIndex);
  const pageIds = useFormStore(useShallow((s) => s.form?.pages ?? []));
  const totalPages = pageIds.length;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const requestDelete = useCallback(
    (id: string, name: string) => {
      const dontAsk = localStorage.getItem(DONT_ASK_DELETE_PAGE_KEY) === 'true';
      if (dontAsk) {
        removePage(id);
      } else {
        setPageToDelete({ id, name });
        setDeleteDialogOpen(true);
      }
    },
    [removePage]
  );

  // --- UI STATE: EXPLORER ---
  const isExplorerOpen = useFormStore((s) => s.isFormExplorerRightPanelOpen);
  const setIsExplorerOpen = useFormStore(
    (s) => s.setIsFormExplorerRightPanelOpen
  );

  // --- UI STATE: PROPERTIES ---
  const isPropertiesOpen = useFormStore((s) => s.isPropertyRightPanelOpen);
  const setIsPropertiesOpen = useFormStore(
    (s) => s.setIsPropertyRightPanelOpen
  );
  const propertiesHeight = useFormStore((s) => s.propertyRightPanelHeight);
  const setPropertiesHeight = useFormStore((s) => s.setPropertyHeight);

  // --- UI STATE: LOGIC ---
  const isLogicOpen = useFormStore((s) => s.isLogicRightPanelOpen);
  const setIsLogicOpen = useFormStore((s) => s.setIsLogicRightPanelOpen);
  const logicHeight = useFormStore((s) => s.logicRightPanelHeight);
  const setLogicHeight = useFormStore((s) => s.setLogicHeight);

  // --- HANDLERS ---
  const handleAddPage = useCallback(() => {
    addPage();
    setCurrentPageIndex(totalPages);
  }, [addPage, setCurrentPageIndex, totalPages]);

  const onAddPageClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleAddPage();
    },
    [handleAddPage]
  );

  // Generic Resize Handler
  const createResizeHandler = useCallback(
    (currentHeight: number, setter: (h: number) => void) =>
      (e: React.MouseEvent) => {
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = currentHeight;

        const handleMouseMove = (moveEvent: MouseEvent) => {
          const delta = startY - moveEvent.clientY;
          setter(Math.max(80, startHeight + delta));
        };

        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
          document.body.style.removeProperty('cursor');
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'row-resize';
      },
    []
  );

  return (
    <DeletePageContext.Provider value={requestDelete}>
      <div className="flex h-full w-full flex-col border-r bg-background text-sm select-none">
        {/* 1. EXPLORER PANEL */}
        <Collapsible
          open={isExplorerOpen}
          onOpenChange={setIsExplorerOpen}
          className={cn(
            'flex flex-col',
            isExplorerOpen ? 'min-h-0 flex-1' : 'shrink-0'
          )}
        >
          <PanelHeader isOpen={isExplorerOpen}>
            <div className="flex flex-1 items-center justify-between">
              <div className="flex items-center">
                <ListTree size={12} className="mr-1" />
                Explorer
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={onAddPageClick}
                className="flex items-center justify-center rounded p-0.5 text-muted-foreground transition-colors hover:bg-border/50 hover:text-foreground"
              >
                <FilePlus size={14} />
              </div>
            </div>
          </PanelHeader>
          <CollapsibleContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <ExplorerPanel />
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

        {/* 2. PROPERTIES PANEL */}
        <ResizeHandle
          isVisible={isExplorerOpen && isPropertiesOpen}
          onMouseDown={createResizeHandler(
            propertiesHeight,
            setPropertiesHeight
          )}
        />
        <Collapsible
          open={isPropertiesOpen}
          onOpenChange={setIsPropertiesOpen}
          className={cn(
            'flex flex-col border-t bg-background/50',
            isPropertiesOpen && !isExplorerOpen ? 'min-h-0 flex-1' : 'shrink-0'
          )}
          style={
            isPropertiesOpen && isExplorerOpen
              ? { height: `${propertiesHeight}px` }
              : undefined
          }
        >
          <PanelHeader isOpen={isPropertiesOpen}>
            <Settings2 size={12} className="mr-1" />
            Properties
          </PanelHeader>
          <CollapsibleContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <ComponentPropertiesPanel />
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

        {/* 3. LOGIC PANEL */}
        <ResizeHandle
          isVisible={(isExplorerOpen || isPropertiesOpen) && isLogicOpen}
          onMouseDown={createResizeHandler(logicHeight, setLogicHeight)}
        />
        <Collapsible
          open={isLogicOpen}
          onOpenChange={setIsLogicOpen}
          className={cn(
            'flex flex-col border-t bg-background/50',
            isLogicOpen && !isExplorerOpen && !isPropertiesOpen
              ? 'min-h-0 flex-1'
              : 'shrink-0'
          )}
          style={
            isLogicOpen && (isExplorerOpen || isPropertiesOpen)
              ? { height: `${logicHeight}px` }
              : undefined
          }
        >
          <PanelHeader isOpen={isLogicOpen}>
            <Zap size={12} className="mr-1" />
            Logic
          </PanelHeader>
          <CollapsibleContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <ComponentLogicPanel />
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
        {pageToDelete && (
          <DeletePageDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            pageName={pageToDelete.name}
            onConfirm={() => {
              if (pageToDelete) removePage(pageToDelete.id);
            }}
          />
        )}
      </div>
    </DeletePageContext.Provider>
  );
}

function PanelHeader({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <CollapsibleTrigger className="group flex w-full shrink-0 items-center bg-muted px-2 py-1.5 text-[10px] font-bold tracking-widest text-muted-foreground uppercase outline-none hover:bg-accent hover:text-accent-foreground">
      {isOpen ? (
        <ChevronDown className="mr-1 h-3.5 w-3.5" />
      ) : (
        <ChevronRight className="mr-1 h-3.5 w-3.5" />
      )}
      {children}
    </CollapsibleTrigger>
  );
}

function ResizeHandle({
  isVisible,
  onMouseDown,
}: {
  isVisible: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  if (!isVisible) return null;
  return (
    <div
      className="z-10 h-[1px] w-full shrink-0 cursor-row-resize bg-border/40 transition-colors hover:h-[5px] hover:bg-primary/50 active:bg-primary/80"
      onMouseDown={onMouseDown}
    />
  );
}
