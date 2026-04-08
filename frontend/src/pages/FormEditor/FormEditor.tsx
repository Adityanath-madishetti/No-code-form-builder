// src/pages/FormEditor/FormEditor.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

import { Rnd } from 'react-rnd';
import { EditorSidebar, type SidebarPanelId } from './components/EditorSidebar';
import { ComponentCatalogPanel } from './components/ComponentCatalogPanel';
import { TemplateCatalogPanel } from './components/TemplateCatalogPanel';
import { GroupCatalogPanel } from './components/GroupCatalogPanel';
import { ThemePanel } from './components/ThemePanel';
import { LogicPanel } from './components/LogicPanel';
import { WorkflowPanel } from './components/WorkflowPanel';
import { AIPanel } from './components/AIPanel';
import { FormPropertiesPanel } from './components/FormPropertiesPanel';
import { WorkflowListPanel } from './components/WorkflowListPanel';
import { FormCanvas } from './components/FormCanvas';
import { PageNavigator } from './components/PageNavigator';
import { DebugPanel } from './components/DebugPanel';
import { ComponentPropertiesPanel } from './components/ComponentPropertiesPanel';
import { RightFloatingPanel } from './components/RightFloatingPanel';
import { LogicPlayground } from './components/LogicPlayground';
import { ThemingPage } from './components/ThemingPage';
import { useTheme } from '@/components/theme-provider';
import { useLogicStore } from '@/form/logic/logic.store';
import { Bug, PanelLeftClose, PanelRightClose, ArrowLeft } from 'lucide-react';
import { Workspaces } from './components/Workspaces';
import { useFormEditorShortcuts } from './useFormEditorShortcuts';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { useShallow } from 'zustand/react/shallow';
import {
  loadFormVersion,
  saveFormVersion,
  createNewVersion,
  loadWorkflow,
} from '@/lib/formApi';
import { useWorkflowStore } from '@/form/workflow/workflowStore';

const PANEL_TITLES: Record<SidebarPanelId, string> = {
  components: 'Components',
  templates: 'Templates',
  theme: 'Theme',
  logic: 'Logic',
  workflow: 'Workflow',
  ai: 'AI Assistant',
  groups: 'Groups',
};

function PanelContent({ panelId }: { panelId: SidebarPanelId }) {
  switch (panelId) {
    case 'components':
      return <ComponentCatalogPanel />;
    case 'templates':
      return <TemplateCatalogPanel />;
    case 'groups':
      return <GroupCatalogPanel />;
    case 'theme':
      return <ThemePanel />;
    case 'logic':
      return <LogicPanel />;
    case 'workflow':
      return <WorkflowListPanel />;
    case 'ai':
      return <AIPanel />;
  }
}

export default function FormEditor() {
  const form = useFormStore((s) => s.form);
  const pages = useFormStore((s) => s.pages);
  const components = useFormStore((s) => s.components);

  const loadForm = useFormStore((s) => s.loadForm);
  const initForm = useFormStore((s) => s.initForm);
  const setCurrentVersionInStore = useFormStore((s) => s.setCurrentVersion);
  const addPage = useFormStore((s) => s.addPage);
  const setActiveComponent = useFormStore((s) => s.setActiveComponent);
  const { user } = useAuth();

  const clearSelectedComponents = useFormStore(
    (s) => s.clearSelectedComponents
  );

  const { onDragStart, onDragOver, onDragEnd } = useFormDragHandlers();
  const activeDragData = useFormStore((s) => s.activeDragData);
  const activeComponentId = useFormStore((s) => s.activeComponentId);
  const activePageId = useFormStore((s) => s.activePageId);

  const pageIds = useFormStore(useShallow((s) => s.form?.pages ?? []));
  const totalPages = pageIds.length;

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activePanel, setActivePanel] = useState<SidebarPanelId | null>(
    'components'
  );
  const [showDebug, setShowDebug] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const showPropertiesPanel = useFormStore((s) => s.showPropertiesPanel);
  const togglePropertiesPanel = useFormStore((s) => s.togglePropertiesPanel);
  const [editorView, setEditorView] = useState<
    'canvas' | 'logic' | 'workflow' | 'formProperties' | 'theming'
  >('canvas');

  const { theme: editorTheme, setTheme: setEditorTheme } = useTheme();

  const [leftWidth, setLeftWidth] = useState<number | string>('20%');
  const [rightWidth, setRightWidth] = useState(340);
  const [debugWidth, setDebugWidth] = useState(400);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const logicActiveRuleId = useLogicStore((s) => s.activeRuleId);
  const logicActiveFormulaId = useLogicStore((s) => s.activeFormulaId);

  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();

  // Load form from backend — reset store immediately to avoid stale flash
  useEffect(() => {
    if (!formId) return;
    let cancelled = false;

    // Clear the old form immediately so stale data doesn't flash
    setFormLoaded(false);
    loadForm(
      {
        id: formId,
        name: '',
        metadata: { createdAt: '', updatedAt: '' },
        theme: null,
        access: {
          visibility: 'private',
          editors: [],
          reviewers: [],
          viewers: [],
        },
        settings: {
          submissionLimit: null,
          closeDate: null,
          collectEmailMode: 'none',
          submissionPolicy: 'none',
          canViewOwnSubmission: false,
          confirmationMessage: 'Thank you for your response!',
        },
        pages: [],
      },
      [],
      [],
      1
    );

    loadFormVersion(formId)
      .then(
        ({
          form,
          pages,
          components,
          version,
          logicRules,
          logicFormulas,
          logicShuffleStacks,
        }) => {
          if (cancelled) return;
          loadForm(form, pages, components, version);
          // Hydrate logic store
          useLogicStore
            .getState()
            .loadRules(logicRules, logicFormulas, logicShuffleStacks);
          setFormLoaded(true);
        }
      )
      .catch(() => {
        if (cancelled) return;
        // Form just created — init locally
        initForm(formId, 'Untitled Form');
        setCurrentVersionInStore(1);
        setFormLoaded(true);
      });

    // Load workflow separately (it's on the Form model, not FormVersion)
    loadWorkflow(formId)
      .then((wf) => {
        if (cancelled) return;
        useWorkflowStore.getState().loadWorkflow(wf);
      })
      .catch(() => {
        // No workflow yet — store stays at defaults
      });

    return () => {
      cancelled = true;
    };
  }, [formId, initForm, loadForm, setCurrentVersionInStore]);

  // Ensure at least one page exists after load
  useEffect(() => {
    if (formLoaded && form && form.pages.length === 0) {
      addPage();
    }
  }, [addPage, form, formLoaded]);

  // Clamp page index
  useEffect(() => {
    if (totalPages > 0 && currentPageIndex >= totalPages) {
      setCurrentPageIndex(totalPages - 1);
    }
  }, [currentPageIndex, totalPages]);

  // Update tab title with form name
  useEffect(() => {
    document.title = form?.name
      ? `${form.name} — Form Builder`
      : 'Editor — Form Builder';
  }, [form?.name]);

  // Auto-show/hide properties based on selection
  useEffect(() => {
    if (activeComponentId || activePageId) {
      setShowProperties(true);
    } else {
      setShowProperties(false);
    }
  }, [activeComponentId, activePageId]);

  // Sync local state with store state for properties panel
  useEffect(() => {
    setShowProperties(showPropertiesPanel);
  }, [showPropertiesPanel]);

  // Auto-switch to logic view when a rule/formula is activated
  useEffect(() => {
    if (logicActiveRuleId || logicActiveFormulaId) {
      setEditorView('logic');
    }
  }, [logicActiveRuleId, logicActiveFormulaId]);

  const handleAddPage = useCallback(() => {
    addPage();
    setCurrentPageIndex(totalPages);
  }, [addPage, totalPages]);

  const handleNavigate = (page: number) => {
    setCurrentPageIndex(page - 1);
  };

  const handleCanvasClick = () => {
    setActiveComponent(null);
    clearSelectedComponents();
  };

  const hasSelection = !!activeComponentId || !!activePageId;

  const currentVersion = useFormStore((s) => s.currentVersion);

  const handleSave = useCallback(async () => {
    if (!formId || !form) return;
    setSaving(true);
    try {
      // Always create a new version on save
      const newVersionNum = await createNewVersion(formId);
      setCurrentVersionInStore(newVersionNum);

      // Save current editor state to the new version
      const logicState = useLogicStore.getState();

      console.log({
        formId,
        newVersionNum,
        form,
        pages,
        components,
        uid: user?.uid || 'unknown',
        rules: logicState.rules,
        formulas: logicState.formulas,
      });

      await saveFormVersion(
        formId,
        newVersionNum,
        form,
        pages,
        components,
        user?.uid || 'unknown',
        logicState.rules,
        logicState.formulas,
        logicState.componentShuffleStacks
      );
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [components, form, formId, pages, setCurrentVersionInStore, user?.uid]);

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
        {/* ── Left icon rail ── */}
        <EditorSidebar
          activePanel={activePanel}
          onPanelChange={(panel) => {
            if (panel === 'theme') {
              setActivePanel(null);
              setEditorView('theming');
              return;
            }
            setActivePanel(panel);
          }}
        />

        {/* ── Main area with react-rnd custom resizable panels ── */}
        <div className="relative flex h-full flex-1 overflow-hidden">
          {/* ── Left fly-out panel ── */}
          {activePanel && (
            <Rnd
              disableDragging
              enableResizing={{ right: true }}
              size={{ width: leftWidth, height: '100%' }}
              minWidth="20%"
              maxWidth="35%"
              onResize={(_e, _dir, ref) => setLeftWidth(ref.style.width)}
              style={{ position: 'relative', transform: 'none' }}
              className="z-10 shrink-0 border-r border-border bg-background"
            >
              <div className="flex h-full flex-col">
                <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3">
                  <span className="flex-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    {PANEL_TITLES[activePanel]}
                  </span>
                  <button
                    onClick={() => setActivePanel(null)}
                    title="Collapse Sidebar"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
                  <PanelContent panelId={activePanel} />
                </div>
              </div>
            </Rnd>
          )}

          {/* ── Centre area: Form canvas OR Logic playground ── */}
          <div className="relative flex h-full min-w-[400px] flex-1 flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-900">
            {/* Workspaces navbar */}
            <Workspaces
              editorView={editorView}
              setEditorView={setEditorView}
              setActivePanel={setActivePanel}
              logicActiveRuleId={logicActiveRuleId}
              logicActiveFormulaId={logicActiveFormulaId}
              showProperties={showProperties}
              showDebug={showDebug}
              rightWidth={rightWidth}
              debugWidth={debugWidth}
              editorTheme={editorTheme}
              setEditorTheme={setEditorTheme}
              saving={saving}
              handleSave={handleSave}
              formId={formId}
              publishing={publishing}
              setPublishing={setPublishing}
            />

            {/* Form canvas view */}
            {editorView === 'canvas' && (
              <div
                className="flex-1 overflow-y-auto"
                onClick={handleCanvasClick}
              >
                <FormCanvas currentPageIndex={currentPageIndex} />

                {totalPages > 0 && (
                  <PageNavigator
                    currentPage={currentPageIndex + 1}
                    totalPages={totalPages}
                    onNavigate={handleNavigate}
                    onAddPage={handleAddPage}
                  />
                )}

                {totalPages === 0 && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <button
                      className="pointer-events-auto border border-dashed border-border bg-background px-5 py-2.5 text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/50 hover:text-primary"
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

            {/* Logic playground view */}
            {editorView === 'logic' && (
              <div className="flex-1 overflow-hidden">
                <LogicPlayground onClose={() => setEditorView('canvas')} />
              </div>
            )}

            {/* Workflow editor view */}
            {editorView === 'workflow' && (
              <div className="flex-1 overflow-y-auto">
                <WorkflowPanel />
              </div>
            )}

            {/* Theming editor view */}
            {editorView === 'theming' && (
              <div className="flex-1 overflow-hidden">
                <ThemingPage />
              </div>
            )}

            {/* Form properties view */}
            {editorView === 'formProperties' && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-3">
                  <FormPropertiesPanel />
                </div>
              </div>
            )}
          </div>

          {/* ── Right properties panel (custom resizable, anchored right) ── */}
          {showProperties && hasSelection && (
            <RightFloatingPanel
              width={rightWidth as number}
              onWidthChange={(w) => setRightWidth(w)}
              minWidth={280}
              maxWidth={500}
              zIndex={40}
              rightOffset={showDebug ? debugWidth : 0}
            >
              <div className="flex h-full w-full flex-col">
                <div className="flex h-10 shrink-0 items-center border-b border-border px-3">
                  <span className="flex-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                    Properties
                  </span>
                  <button
                    onClick={togglePropertiesPanel}
                    title="Collapse Properties"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <PanelRightClose className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
                  <ComponentPropertiesPanel />
                </div>
              </div>
            </RightFloatingPanel>
          )}

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
        </div>

        {/* ── Bottom-right utility buttons ── */}
        <div
          className="fixed right-4 bottom-4 z-[60] flex gap-1 will-change-transform"
          style={{
            transform: `translateX(-${(showProperties ? rightWidth : 0) + (showDebug ? debugWidth : 0)}px)`,
            transition: 'transform 100ms ease-out',
          }}
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
    </DragDropProvider>
  );
}
