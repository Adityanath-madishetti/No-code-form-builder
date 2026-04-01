// src/pages/FormEditor/FormEditor.tsx
import { useState, useEffect, useCallback } from 'react';
import { useFormStore } from '@/form/store/formStore';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { componentRenderers } from '@/form/registry/componentRegistry';
import { useFormDragHandlers } from '@/form/hooks/useFormDragHandlers';
import {
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_COMPONENT_ID,
  DRAG_CATALOG_PAGE_ID,
} from '@/form/utils/DndUtils';

import { EditorSidebar, type SidebarPanelId } from './components/EditorSidebar';
import { ComponentCatalogPanel } from './components/ComponentCatalogPanel';
import { TemplateCatalogPanel } from './components/TemplateCatalogPanel';
import { ThemePanel } from './components/ThemePanel';
import { LogicPanel } from './components/LogicPanel';
import { WorkflowPanel } from './components/WorkflowPanel';
import { AIPanel } from './components/AIPanel';
import { PreviewPublishPanel } from './components/PreviewPublishPanel';
import { FormPropertiesPanel } from './components/FormPropertiesPanel';
import { FormCanvas } from './components/FormCanvas';
import { PageNavigator } from './components/PageNavigator';
import { DebugPanel } from './components/DebugPanel';
import { Bug } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

const PANEL_TITLES: Record<SidebarPanelId, string> = {
  components: 'Components',
  form: 'Form Properties',
  templates: 'Templates',
  theme: 'Theme',
  logic: 'Logic',
  workflow: 'Workflow',
  ai: 'AI Assistant',
  preview: 'Preview & Publish',
};

function PanelContent({ panelId }: { panelId: SidebarPanelId }) {
  switch (panelId) {
    case 'components': return <ComponentCatalogPanel />;
    case 'form':       return <FormPropertiesPanel />;
    case 'templates':  return <TemplateCatalogPanel />;
    case 'theme':      return <ThemePanel />;
    case 'logic':      return <LogicPanel />;
    case 'workflow':   return <WorkflowPanel />;
    case 'ai':         return <AIPanel />;
    case 'preview':    return <PreviewPublishPanel />;
  }
}

export default function FormEditor() {
  const store = useFormStore();
  const initForm = store.initForm;
  const addPage = store.addPage;
  const setActiveComponent = store.setActiveComponent;

  const { onDragStart, onDragOver, onDragEnd } = useFormDragHandlers();
  const activeDragData = store.activeDragData;

  const pageIds = useFormStore(useShallow((s) => s.form?.pages ?? []));
  const totalPages = pageIds.length;

  // 0-indexed current page state
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activePanel, setActivePanel] = useState<SidebarPanelId | null>('components');
  const [showDebug, setShowDebug] = useState(false);

  // Auto-init a form on mount (empty — no pages yet)
  useEffect(() => {
    if (!store.form) {
      // init creates one page by default; we'll clear it so canvas starts truly empty
      const id = 'form-' + crypto.randomUUID();
      initForm(id, 'Untitled Form');
    }
  }, []);

  // When we add pages and currentPageIndex is out of bounds, clamp it
  useEffect(() => {
    if (totalPages > 0 && currentPageIndex >= totalPages) {
      setCurrentPageIndex(totalPages - 1);
    }
  }, [totalPages]);

  const handleAddPage = useCallback(() => {
    addPage();
    // Navigate to the newly added last page
    setCurrentPageIndex(totalPages); // totalPages is the old value, new page will be at index totalPages
  }, [addPage, totalPages]);

  const handleNavigate = (page: number) => {
    setCurrentPageIndex(page - 1); // convert 1-indexed input to 0-indexed
  };

  const handleCanvasClick = () => {
    setActiveComponent(null);
  };

  return (
    <DragDropProvider
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-screen w-full overflow-hidden bg-muted/20">
        {/* ── Left icon rail ── */}
        <EditorSidebar activePanel={activePanel} onPanelChange={setActivePanel} />

        {/* ── Fly-out left panel ── */}
        {activePanel && (
          <div className="flex h-full w-72 shrink-0 flex-col border-r border-border bg-background shadow-sm">
            <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
              <span className="flex-1 text-sm font-semibold tracking-tight">
                {PANEL_TITLES[activePanel]}
              </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 no-scrollbar">
              <PanelContent panelId={activePanel} />
            </div>
          </div>
        )}

        {/* ── Canvas (centre) ── */}
        <div
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto"
          onClick={handleCanvasClick}
        >
          {/* Actual page content */}
          <FormCanvas currentPageIndex={currentPageIndex} />

          {/* Bottom centre page navigator */}
          {totalPages > 0 && (
            <PageNavigator
              currentPage={currentPageIndex + 1}
              totalPages={totalPages}
              onNavigate={handleNavigate}
              onAddPage={handleAddPage}
            />
          )}

          {/* "Add first page" prompt when form has no pages */}
          {totalPages === 0 && (
            <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex justify-center">
              <button
                className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-dashed border-border bg-background/80 px-5 py-2.5 text-sm text-muted-foreground shadow backdrop-blur-sm transition-colors hover:border-primary/50 hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddPage();
                }}
              >
                + Add your first page
              </button>
            </div>
          )}
        </div>

        {/* ── Debug sidebar (right) ── */}
        {showDebug && (
          <div className="flex h-full w-80 shrink-0 flex-col border-l border-border bg-background">
            <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
              <Bug className="mr-2 h-3.5 w-3.5 text-amber-500" />
              <span className="flex-1 text-sm font-semibold tracking-tight text-amber-500">
                Debug
              </span>
              <button
                onClick={() => setShowDebug(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
              <DebugPanel />
            </div>
          </div>
        )}

        {/* ── Debug toggle button (bottom right corner) ── */}
        <button
          onClick={() => setShowDebug((prev) => !prev)}
          title="Toggle debug panel"
          className={`fixed bottom-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition-colors ${
            showDebug
              ? 'border-amber-400/60 bg-amber-400/10 text-amber-500'
              : 'border-border bg-background text-muted-foreground hover:text-amber-500'
          }`}
        >
          <Bug className="h-4 w-4" />
        </button>
      </div>

      {/* ── Drag overlay ── */}
      <DragOverlay dropAnimation={null}>
        {activeDragData?.type === DRAG_CATALOG_COMPONENT_ID &&
          (() => {
            const entry = activeDragData.entry;
            const Renderer = componentRenderers[entry.id as keyof typeof componentRenderers];
            const previewData = entry.create('__preview__');
            return Renderer ? (
              <div className="opacity-90">
                <Renderer
                  instanceId={previewData.instanceId}
                  metadata={previewData.metadata}
                  // @ts-expect-error type union
                  props={previewData.props}
                  // @ts-expect-error type union
                  validation={previewData.validation}
                />
              </div>
            ) : null;
          })()}

        {activeDragData?.type === DRAG_COMPONENT_ID &&
          (() => {
            const existing = store.components[activeDragData.instanceId];
            if (!existing) return null;
            const Renderer = componentRenderers[existing.id as keyof typeof componentRenderers];
            return Renderer ? (
              <div className="opacity-90">
                <Renderer
                  instanceId={existing.instanceId}
                  metadata={existing.metadata}
                  // @ts-expect-error type union
                  props={existing.props}
                  // @ts-expect-error type union
                  validation={existing.validation}
                />
              </div>
            ) : null;
          })()}

        {activeDragData?.type === DRAG_CATALOG_PAGE_ID && (
          <div className="pointer-events-none w-64 rounded-xl border-2 border-dashed border-primary bg-card p-4 text-center text-sm text-primary opacity-90">
            New Page
          </div>
        )}
      </DragOverlay>
    </DragDropProvider>
  );
}
