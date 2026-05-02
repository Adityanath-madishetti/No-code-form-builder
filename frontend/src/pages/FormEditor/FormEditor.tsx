// src/pages/FormEditor/FormEditor.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormStore } from '@/form/store/form.store';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import {
  componentRenderers,
  type AnyFormComponent,
} from '@/form/registry/componentRegistry';
import { useFormDragHandlers } from '@/form/hooks/useFormDragHandlers';
import {
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_COMPONENT_ID,
  DRAG_CATALOG_PAGE_ID,
  DRAG_CATALOG_GROUP_ID,
} from '@/form/utils/DndUtils';

import { type SidebarPanelId } from './components/EditorSidebar';
import { FormCanvas } from './components/FormCanvas';
import { DebugPanel } from './components/DebugPanel';
import { RightFloatingPanel } from './components/RightFloatingPanel';
import { useLogicStore } from '@/form/logic/logic.store';
import { Bug, PanelRightClose, ArrowLeft } from 'lucide-react';
import { Workspaces } from './components/Workspaces';
import { useFormEditorShortcuts } from './useFormEditorShortcuts';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { useShallow } from 'zustand/react/shallow';
import SidebarLayout from './components/CanvasRightSidePanel';
import { useLoadFormVersion } from './hooks/useLoadFormVersion';
import { useSaveForm } from './hooks/useSaveForm';
import {
  FloatingLogicPlayground,
  LogicWindowPortal,
} from './components/FloatingLogicPlayground';

export default function FormEditor() {
  const form = useFormStore((s) => s.form);
  const components = useFormStore((s) => s.components);

  const setActiveComponent = useFormStore((s) => s.setActiveComponent);
  const setActivePage = useFormStore((s) => s.setActivePage);
  const currentPageIndex = useFormStore((s) => s.currentPageIndex);
  const setCurrentPageIndex = useFormStore((s) => s.setCurrentPageIndex);

  const clearSelectedComponents = useFormStore(
    (s) => s.clearSelectedComponents
  );

  const { onDragStart, onDragOver, onDragEnd } = useFormDragHandlers();
  const activeDragData = useFormStore((s) => s.activeDragData);
  const activeComponentId = useFormStore((s) => s.activeComponentId);
  const activePageId = useFormStore((s) => s.activePageId);

  const pageIds = useFormStore(useShallow((s) => s.form?.pages ?? []));
  const totalPages = pageIds.length;

  // const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activePanel, setActivePanel] = useState<SidebarPanelId | null>(
    'components'
  );
  const [showDebug, setShowDebug] = useState(false);
  const [editorView, setEditorView] = useState<
    'canvas' | 'logic' | 'workflow' | 'formProperties' | 'theming'
  >('canvas');

  // const { theme: editorTheme, setTheme: setEditorTheme } = useTheme();

  const [debugWidth, setDebugWidth] = useState(400);
  const [publishing] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const popoutRuleIds = useLogicStore((s) => s.popoutRuleIds);
  const closePopoutRule = useLogicStore((s) => s.closePopoutRule);

  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  const { formLoaded } = useLoadFormVersion(formId);
  const { saving, handleSave } = useSaveForm(formId);

  // Ensure at least one page exists after load
  // useEffect(() => {
  //   if (formLoaded && form && form.pages.length === 0) {
  //     addPage();
  //   }
  // }, [addPage, form, formLoaded]);

  // Clamp page index
  useEffect(() => {
    if (totalPages > 0 && currentPageIndex >= totalPages) {
      setCurrentPageIndex(totalPages - 1);
    }
  }, [currentPageIndex, setCurrentPageIndex, totalPages]);

  // Update tab title with form name
  useEffect(() => {
    document.title = form?.name
      ? `${form.name} — Form Builder`
      : 'Editor — Form Builder';
  }, [form?.name]);

  const handleCanvasClick = () => {
    setActiveComponent(null);
    setActivePage(null);
    clearSelectedComponents();
  };

  const hasSelection = !!activeComponentId || !!activePageId;

  const currentVersion = useFormStore((s) => s.currentVersion);

  useFormEditorShortcuts({
    enabled: Boolean(formId && formLoaded),
    formLoaded,
    formId,
    saving,
    publishing,
    currentPageIndex,
    totalPages,
    setCurrentPageIndex,
    activePanel,
    setActivePanel,
    editorView,
    setEditorView,
    setShowDebug,
    hasSelection,
    onSave: handleSave,
    onPreview: () => {
      if (formId) window.open(`/forms/${formId}/preview`, '_blank');
    },
    onOpenShortcutsHelp: () => setShortcutsOpen(true),
  });

  return (
    <DragDropProvider
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="isolate flex h-screen w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950">
        <div className="relative flex h-full flex-1 overflow-hidden">
          <div className="relative flex h-full min-w-[400px] flex-1 flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-900">
            <Workspaces
              // editorTheme={editorTheme}
              // setEditorTheme={setEditorTheme}
              saving={saving}
              handleSave={handleSave}
              formId={formId}
            />
            <>
              <div className="flex h-full w-full overflow-hidden bg-muted/20">
                <div
                  className="relative flex flex-1 flex-col overflow-y-auto"
                  onClick={handleCanvasClick}
                >
                  <FormCanvas currentPageIndex={currentPageIndex} />
                </div>

                <div className="z-10 flex shrink-0">
                  <SidebarLayout />
                </div>
              </div>
            </>
          </div>

          {/* ── Debug panel (custom resizable, anchored right) ── */}
          {showDebug && (
            <RightFloatingPanel
              width={debugWidth as number}
              onWidthChange={(w) => setDebugWidth(w)}
              minWidth={300}
              maxWidth={600}
              zIndex={50}
              rightOffset={0}
            >
              <div className="flex h-full w-full flex-col">
                <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
                  <Bug className="mr-1.5 h-3 w-3 text-amber-500" />
                  <span className="flex-1 text-xs font-semibold tracking-widest text-amber-500 uppercase">
                    Debug
                  </span>
                  <button
                    onClick={() => setShowDebug(false)}
                    title="Collapse Debug Panel"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <PanelRightClose className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden p-3">
                  <DebugPanel />
                </div>
              </div>
            </RightFloatingPanel>
          )}
          <div
            className="fixed bottom-4 left-4 z-[600000] flex gap-1 will-change-transform"
            // style={{
            //   transform: `translateX(-${(showProperties ? rightWidth : 0) + (showDebug ? debugWidth : 0)}px)`,
            //   transition: 'transform 100ms ease-out',
            // }}
          >
            <button
              onClick={() => navigate('/')}
              title="Back to Dashboard"
              className="flex h-7 w-7 items-center justify-center border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3" />
            </button>
            <span
              title={`Currently editing version ${currentVersion}`}
              className="flex h-7 items-center rounded-sm border border-border bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground"
            >
              v{currentVersion}
            </span>
            <button
              onClick={() => setShowDebug((p) => !p)}
              title="Toggle debug panel"
              className={`flex h-7 w-7 items-center justify-center border shadow-sm transition-colors ${
                showDebug
                  ? 'border-amber-400/60 bg-amber-400/10 text-amber-500'
                  : 'border-border bg-background text-muted-foreground hover:text-amber-500'
              }`}
            >
              <Bug className="h-3 w-3" />
            </button>
            <KeyboardShortcutsHelp
              open={shortcutsOpen}
              onOpenChange={setShortcutsOpen}
            />
          </div>
        </div>

        {/* ── Bottom-right utility buttons ── */}
      </div>

      {/* ── Drag overlay ── */}
      <DragOverlay dropAnimation={null}>
        {activeDragData?.type === DRAG_CATALOG_COMPONENT_ID &&
          (() => {
            const entry = activeDragData.entry;
            const Renderer =
              componentRenderers[entry.id as keyof typeof componentRenderers];
            const previewData = entry.create('__preview__');
            return Renderer ? (
              <div className="pointer-events-none w-[400px] opacity-80">
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
            const existing = components[activeDragData.instanceId];
            if (!existing) return null;
            const Renderer =
              componentRenderers[
                existing.id as keyof typeof componentRenderers
              ];
            return Renderer ? (
              <div className="pointer-events-none w-[400px] opacity-80">
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
          <div className="pointer-events-none w-64 border-2 border-dashed border-primary bg-card p-4 text-center text-sm text-primary opacity-80">
            New Page
          </div>
        )}

        {activeDragData?.type === DRAG_CATALOG_GROUP_ID && (
          <div className="pointer-events-none flex w-[400px] flex-col gap-2 opacity-90 drop-shadow-2xl">
            {activeDragData.group?.components.map(
              (comp: AnyFormComponent, index: number) => {
                const Renderer =
                  componentRenderers[
                    comp.id as keyof typeof componentRenderers
                  ];
                if (!Renderer) return null;
                return (
                  <div
                    key={comp.instanceId || index}
                    className="overflow-hidden rounded-md border border-border bg-background shadow-sm ring-1 ring-primary/20"
                  >
                    <div className="pointer-events-none flex items-center justify-between border-b border-border/50 bg-muted/20 px-2 py-1">
                      <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        {comp.metadata?.label || comp.id}
                      </span>
                    </div>
                    <div className="p-3">
                      <Renderer
                        instanceId={comp.instanceId}
                        metadata={comp.metadata}
                        // @ts-expect-error type union
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        props={comp.props as any}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        validation={comp.validation as any}
                      />
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </DragOverlay>

      {popoutRuleIds.map((ruleId) => (
        <LogicWindowPortal
          key={ruleId}
          title={`Editing Rule: ${ruleId}`}
          // CRITICAL: This syncs the user manually clicking the "X"
          // on the browser window back to your Zustand store
          windowName={`logic_portal_${ruleId}`}
          onClose={() => closePopoutRule(ruleId)}
        >
          <FloatingLogicPlayground
            targetRuleId={ruleId}
            onClose={() => closePopoutRule(ruleId)}
          />
        </LogicWindowPortal>
      ))}
    </DragDropProvider>
  );
}
