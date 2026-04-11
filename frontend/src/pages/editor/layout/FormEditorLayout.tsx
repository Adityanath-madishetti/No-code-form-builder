import { Bug, ArrowLeft, Hammer, Zap, Settings2 } from 'lucide-react';

import { RightFloatingPanel } from './RightFloatingPanel';
import { SaveButton, PreviewButton, PublishButton } from './Workspaces';

import { FormCanvas } from '../canvas/FormCanvas';
import { PageNavigator } from '../canvas/PageNavigator';
import { FormPropertiesPanel } from '../properties/FormPropertiesPanel';

// Right Panel content
import { ComponentPropertiesPanel } from '../properties/ComponentPropertiesPanel';
import { LogicPanel } from '../logic/LogicPanel';
import { DebugPanel } from '../debug/DebugPanel';
import { KeyboardShortcutsHelp } from '../KeyboardShortcutsHelp';

/* ─────────────────────────────
   Right Panel — contextual content
───────────────────────────── */
function RightPanelContent({
  editorView,
}: {
  editorView: string;
}) {
  if (editorView === 'logic') {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Logic
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <LogicPanel />
        </div>
      </div>
    );
  }

  // Default: Builder workspace → Properties
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Properties
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ComponentPropertiesPanel />
      </div>
    </div>
  );
}

/* ─────────────────────────────
   Main Layout
───────────────────────────── */
export function FormEditorLayout({ controller }: any) {
  const { state, actions } = controller;

  const { currentPageIndex, editorView, showDebug, totalPages } = state;

  const {
    setCurrentPageIndex,
    setEditorView,
    setShowDebug,
    handleAddPage,
    handleCanvasClick,
    handleSave,
  } = actions;

  // Show the right panel for builder and logic views (not for formProperties)
  const showRightPanel = editorView === 'builder' || editorView === 'logic';

  return (
    <div className="isolate flex h-screen w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950">

      <div className="relative flex h-full flex-1 overflow-hidden">

        {/* LEFT PANEL — contextual */}
        {showRightPanel && (
          <div
            className="h-full shrink-0 border-r border-border bg-background overflow-hidden"
            style={{ width: state.rightWidth }}
          >
            <RightPanelContent editorView={editorView} />
          </div>
        )}

        {/* CENTER: Top bar + canvas */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-900">

          {/* TOP BAR */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-3 py-[5.5px]">
            {/* Left: workspace tabs — ordered: Settings, Builder, Logic */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEditorView('formProperties')}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  editorView === 'formProperties'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Settings2 className="h-3 w-3" />
                Settings
              </button>

              <button
                onClick={() => setEditorView('builder')}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  editorView === 'builder'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Hammer className="h-3 w-3" />
                Builder
              </button>

              <button
                onClick={() => setEditorView('logic')}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  editorView === 'logic'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Zap className="h-3 w-3" />
                Logic
              </button>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-1">
              <SaveButton handleSave={handleSave} saving={state.saving} />
              <PreviewButton formId={state.formId} />
              <PublishButton
                formId={state.formId}
                handleSave={handleSave}
                saving={state.saving}
              />
            </div>
          </div>

          {/* CANVAS — visible for builder and logic views */}
          {(editorView === 'builder' || editorView === 'logic') && (
            <div className="flex-1 overflow-y-auto" onClick={handleCanvasClick}>
              <FormCanvas currentPageIndex={currentPageIndex} />

              {totalPages > 0 && (
                <PageNavigator
                  currentPage={currentPageIndex + 1}
                  totalPages={totalPages}
                  onNavigate={(p) => setCurrentPageIndex(p - 1)}
                  onAddPage={handleAddPage}
                />
              )}

              {totalPages === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    className="border border-dashed px-5 py-2.5 text-sm"
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
          )}

          {/* FORM PROPERTIES (full width, no right panel) */}
          {editorView === 'formProperties' && (
            <div className="flex-1 overflow-y-auto p-3">
              <FormPropertiesPanel />
            </div>
          )}
        </div>


        {/* DEBUG PANEL */}
        {showDebug && (
          <RightFloatingPanel
            width={state.debugWidth}
            onWidthChange={actions.setDebugWidth}
            minWidth={300}
            maxWidth={600}
          >
            <DebugPanel />
          </RightFloatingPanel>
        )}
      </div>

      {/* FLOATING BUTTONS */}
      <div className="fixed right-4 bottom-4 flex gap-1">
        
        <button onClick={actions.navigateHome}>
          <ArrowLeft className="h-3 w-3" />
        </button>

        <button onClick={() => setShowDebug((p: boolean) => !p)}>
          <Bug className="h-3 w-3" />
        </button>

        <KeyboardShortcutsHelp
          open={state.shortcutsOpen}
          onOpenChange={actions.setShortcutsOpen}
        />
      </div>
    </div>
  );
}