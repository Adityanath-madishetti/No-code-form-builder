import React, { useCallback } from 'react';
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
} from 'lucide-react';
import { useFormStore } from '@/form/store/form.store';
import { cn } from '@/lib/utils';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';

import { ComponentPropertiesPanel } from './components/ComponentPropertiesPanel';
import { ComponentLogicPanel } from './ComponentsLogicPanel';
import { useShallow } from 'zustand/react/shallow';

function ExplorerPanel() {
  const form = useFormStore((s) => s.form);
  const pages = useFormStore((s) => s.pages);
  const components = useFormStore((s) => s.components);

  const setCurrentPageIndex = useFormStore((s) => s.setCurrentPageIndex);

  const activePageId = useFormStore((s) => s.activePageId);
  const activeComponentId = useFormStore((s) => s.activeComponentId);
  const setActivePage = useFormStore((s) => s.setActivePage);
  const setActiveComponent = useFormStore((s) => s.setActiveComponent);

  const expandedPages = useFormStore((s) => s.expandedPages);
  const setPageExpanded = useFormStore((s) => s.setPageExpanded);

  const handlePageClick = useCallback(
    (pageId: string, pageIndex: number, isCurrentlyExpanded: boolean) => {
      setActivePage(pageId);
      setActiveComponent(null);
      setCurrentPageIndex(pageIndex);
if (!isCurrentlyExpanded) setPageExpanded(pageId, true);    },
    [setActivePage, setActiveComponent, setCurrentPageIndex, setPageExpanded]
  );

  const handleComponentClick = useCallback(
    (id: string, index: number) => {
      setActiveComponent(id);
      setActivePage(null);
      setCurrentPageIndex(index);
    },
    [setActiveComponent, setActivePage, setCurrentPageIndex]
  );

  if (!form) {
    return (
      <div className="p-4 text-sm text-muted-foreground">No active schema</div>
    );
  }

  return (
    <div className="flex flex-col py-1">
      {form.pages.map((pageId, index) => {
        const page = pages[pageId];
        if (!page) return null;
        const isExpanded = !!expandedPages[pageId];
        return (
          <Collapsible
            key={pageId}
            open={isExpanded}
            onOpenChange={(open) => setPageExpanded(pageId, open)}
          >
            <CollapsibleTrigger
              onClick={() => handlePageClick(pageId, index, isExpanded)}
              className={cn(
                'flex w-full cursor-pointer items-center px-2 py-1.5 outline-none hover:bg-accent/50',
                activePageId === pageId && 'bg-accent text-accent-foreground'
              )}
            >
              <div className="mr-1 flex h-4 w-4 items-center justify-center">
                {isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </div>
              <span className="mr-2 text-muted-foreground">
                {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
              </span>
              <span className="truncate">{page.title || '[UNNAMED PAGE]'}</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="relative flex flex-col before:absolute before:top-0 before:bottom-0 before:left-[15px] before:w-px before:bg-border/50">
                {page.children.map((id) => (
                  <div
                    key={id}
                    onClick={() => handleComponentClick(id, index)}
                    className={cn(
                      'flex cursor-pointer items-center py-1.5 pr-2 pl-7 hover:bg-accent/50',
                      activeComponentId === id
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    <ComponentIcon
                      size={13}
                      className="mr-2 shrink-0 opacity-70"
                    />
                    <span className="truncate">
                      {components[id]?.metadata.label}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

export function FormFileExplorer() {
  const addPage = useFormStore((s) => s.addPage);

  const setCurrentPageIndex = useFormStore((s) => s.setCurrentPageIndex);
  const pageIds = useFormStore(useShallow((s) => s.form?.pages ?? []));
  const totalPages = pageIds.length;

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
        onMouseDown={createResizeHandler(propertiesHeight, setPropertiesHeight)}
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
    </div>
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
      className="z-10 h-[1px] w-full shrink-0 cursor-row-resize bg-border/40 transition-colors hover:bg-primary/50 active:bg-primary/80"
      onMouseDown={onMouseDown}
    />
  );
}
