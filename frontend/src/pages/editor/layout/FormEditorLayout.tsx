import { Rnd } from 'react-rnd';
import { Bug, PanelLeftClose, PanelRightClose, ArrowLeft, LayoutGrid, Zap, Settings2 } from 'lucide-react';

import { EditorSidebar, type SidebarPanelId } from '../sidebar/EditorSidebar';
import { RightFloatingPanel } from './RightFloatingPanel';
import { SaveButton, PreviewButton, PublishButton } from './Workspaces';

// Left Side Panels 
import { ComponentCatalogPanel } from '../sidebar/ComponentCatalogPanel';
import { LogicPanel } from '../logic/LogicPanel';

import { FormCanvas } from '../canvas/FormCanvas';
import { PageNavigator } from '../canvas/PageNavigator';
import { LogicPlayground } from '../logic/LogicPlayground';
import { FormPropertiesPanel } from '../properties/FormPropertiesPanel';

// Right Side Panels
import { ComponentPropertiesPanel } from '../properties/ComponentPropertiesPanel';
import { DebugPanel } from '../debug/DebugPanel';
import { KeyboardShortcutsHelp } from '../KeyboardShortcutsHelp';

const PANEL_TITLES: Record<SidebarPanelId, string> = {
  components: 'Components',
  logic: 'Logic',
};

function PanelContent({ panelId }: { panelId: SidebarPanelId }) {
  switch (panelId) {
    case 'components':
      return <ComponentCatalogPanel />;

    case 'logic':
      return <LogicPanel />;

    default:
      return null;
  }
}

export function FormEditorLayout({ controller }: any) {
  const { state, actions } = controller;

  const { currentPageIndex, editorView, showDebug, totalPages, hasSelection } =
    state;

  const {
    setCurrentPageIndex,
    setEditorView,
    setShowDebug,
    handleAddPage,
    handleCanvasClick,
    handleSave,
  } = actions;

  return (
    <div className="isolate flex h-screen w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      
      {/* LEFT SIDEBAR */}
      <EditorSidebar
        activePanel={state.activePanel}
        onPanelChange={(panel: SidebarPanelId | null) => {
          // allow only components + logic
          if (panel === 'components' || panel === 'logic') {
            actions.setActivePanel(panel);
          } else {
            actions.setActivePanel(null);
          }
        }}
      />

      <div className="relative flex h-full flex-1 overflow-hidden">
        
        {/* LEFT PANEL */}
        {(state.activePanel === 'components' || state.activePanel === 'logic') && (
          <Rnd
            disableDragging
            enableResizing={{ right: true }}
            size={{ width: state.leftWidth, height: '100%' }}
            minWidth="20%"
            maxWidth="35%"
            onResize={(_e: any, _dir: any, ref: any) =>
              actions.setLeftWidth(ref.style.width)
            }
            style={{ position: 'relative', transform: 'none' }}
            className="z-10 shrink-0 border-r border-border bg-background"
          >
            <div className="flex h-full flex-col">
              
              {/* HEADER */}
              <div className="flex h-10 items-center border-b px-3">
                <span className="flex-1 text-xs font-semibold uppercase text-muted-foreground">
                  {PANEL_TITLES[state.activePanel as SidebarPanelId]}
                </span>
                <button
                  onClick={() => actions.setActivePanel(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <PanelLeftClose className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* CONTENT */}
              <div className="flex flex-1 overflow-y-auto p-3">
                <PanelContent panelId={state.activePanel as SidebarPanelId} />
              </div>
            </div>
          </Rnd>
        )}

        {/* CENTER AREA */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-900">

          {/* TOP BAR */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-3 py-[5.5px]">
            {/* Left: view tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setEditorView('canvas')}
                className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                  editorView === 'canvas'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <LayoutGrid className="h-3 w-3" />
                Canvas
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

          {/* CANVAS */}
          {editorView === 'canvas' && (
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

          {/* LOGIC PLAYGROUND */}
          {editorView === 'logic' && (
            <LogicPlayground onClose={() => setEditorView('canvas')} />
          )}

          {/* FORM PROPERTIES */}
          {editorView === 'formProperties' && (
            <div className="p-3">
              <FormPropertiesPanel />
            </div>
          )}
        </div>

        {/* RIGHT PROPERTIES PANEL */}
        {state.showProperties && hasSelection && (
          <RightFloatingPanel
            width={state.rightWidth}
            onWidthChange={actions.setRightWidth}
            minWidth={280}
            maxWidth={500}
          >
            <ComponentPropertiesPanel />
          </RightFloatingPanel>
        )}

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