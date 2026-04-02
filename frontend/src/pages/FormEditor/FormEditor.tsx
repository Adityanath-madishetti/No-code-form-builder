// src/pages/FormEditor/FormEditor.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFormStore } from '@/form/store/formStore';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { componentRenderers } from '@/form/registry/componentRegistry';
import { useFormDragHandlers } from '@/form/hooks/useFormDragHandlers';
import {
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_COMPONENT_ID,
  DRAG_CATALOG_PAGE_ID,
} from '@/form/utils/DndUtils';

import { Rnd } from 'react-rnd';

import { EditorSidebar, type SidebarPanelId } from './components/EditorSidebar';
import { ComponentCatalogPanel } from './components/ComponentCatalogPanel';
import { TemplateCatalogPanel } from './components/TemplateCatalogPanel';
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
import { useLogicStore } from '@/form/logic/logicStore';
import { Bug, PanelLeftClose, PanelRightClose, Save, ArrowLeft, Loader2, Eye, Globe, Zap, LayoutGrid, GitBranch, Settings2 } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { loadFormVersion, saveFormVersion, createNewVersion, loadWorkflow } from '@/lib/formApi';
import { useWorkflowStore } from '@/form/workflow/workflowStore';

const PANEL_TITLES: Record<SidebarPanelId, string> = {
  components: 'Components',
  templates: 'Templates',
  theme: 'Theme',
  logic: 'Logic',
  workflow: 'Workflow',
  ai: 'AI Assistant',
};

function PanelContent({ panelId }: { panelId: SidebarPanelId }) {
  switch (panelId) {
    case 'components': return <ComponentCatalogPanel />;
    case 'templates': return <TemplateCatalogPanel />;
    case 'theme': return <ThemePanel />;
    case 'logic': return <LogicPanel />;
    case 'workflow': return <WorkflowListPanel />;
    case 'ai': return <AIPanel />;
  }
}

export default function FormEditor() {
  const store = useFormStore();
  const addPage = store.addPage;
  const setActiveComponent = store.setActiveComponent;
  const { user } = useAuth();

  const { onDragStart, onDragOver, onDragEnd } = useFormDragHandlers();
  const activeDragData = store.activeDragData;
  const activeComponentId = useFormStore((s) => s.activeComponentId);
  const activePageId = useFormStore((s) => s.activePageId);

  const pageIds = useFormStore(useShallow((s) => s.form?.pages ?? []));
  const totalPages = pageIds.length;

  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [activePanel, setActivePanel] = useState<SidebarPanelId | null>('components');
  const [showDebug, setShowDebug] = useState(false);
  const [showProperties, setShowProperties] = useState(true);
  const showPropertiesPanel = useFormStore((s) => s.showPropertiesPanel);
  const togglePropertiesPanel = useFormStore((s) => s.togglePropertiesPanel);
  const [editorView, setEditorView] = useState<
    'canvas' | 'logic' | 'workflow' | 'formProperties'
  >('canvas');

  const [leftWidth, setLeftWidth] = useState<number | string>('20%');
  const [rightWidth, setRightWidth] = useState(340);
  const [debugWidth, setDebugWidth] = useState(400);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [formLoaded, setFormLoaded] = useState(false);

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
    store.loadForm(
      {
        id: formId,
        name: '',
        metadata: { createdAt: '', updatedAt: '' },
        theme: null,
        access: { visibility: 'private', editors: [], reviewers: [], viewers: [] },
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
      .then(({ form, pages, components, version, logicRules, logicFormulas }) => {
        if (cancelled) return;
        store.loadForm(form, pages, components, version);
        // Hydrate logic store
        useLogicStore.getState().loadRules(logicRules, logicFormulas);
        setFormLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        // Form just created — init locally
        store.initForm(formId, 'Untitled Form');
        store.setCurrentVersion(1);
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

    return () => { cancelled = true; };
  }, [formId]);

  // Ensure at least one page exists after load
  useEffect(() => {
    if (formLoaded && store.form && store.form.pages.length === 0) {
      addPage();
    }
  }, [formLoaded]);

  // Clamp page index
  useEffect(() => {
    if (totalPages > 0 && currentPageIndex >= totalPages) {
      setCurrentPageIndex(totalPages - 1);
    }
  }, [totalPages]);

  // Update tab title with form name
  useEffect(() => {
    document.title = store.form?.name
      ? `${store.form.name} — Form Builder`
      : 'Editor — Form Builder';
  }, [store.form?.name]);

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
  };

  const hasSelection = !!activeComponentId || !!activePageId;

  const currentVersion = useFormStore((s) => s.currentVersion);

  const handleSave = useCallback(async () => {
    if (!formId || !store.form) return;
    setSaving(true);
    try {
      // Always create a new version on save
      const newVersionNum = await createNewVersion(formId);
      store.setCurrentVersion(newVersionNum);

      // Save current editor state to the new version
      const logicState = useLogicStore.getState();
      await saveFormVersion(
        formId,
        newVersionNum,
        store.form,
        store.pages,
        store.components,
        user?.uid || 'unknown',
        logicState.rules,
        logicState.formulas
      );
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [formId, store.form, store.pages, store.components, user]);

  return (
    <DragDropProvider
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex h-screen w-full overflow-hidden bg-neutral-50 dark:bg-neutral-950 isolate">
        {/* ── Left icon rail ── */}
        <EditorSidebar activePanel={activePanel} onPanelChange={setActivePanel} />

        {/* ── Main area with react-rnd custom resizable panels ── */}
        <div className="flex flex-1 overflow-hidden h-full relative">

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
              className="border-r border-border bg-background shrink-0 z-10"
            >
              <div className="flex h-full flex-col">
                <div className="flex h-10 shrink-0 items-center border-b border-border px-3 gap-2">
                  <span className="flex-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {PANEL_TITLES[activePanel]}
                  </span>
                  <button
                    onClick={() => setActivePanel(null)}
                    title="Collapse Sidebar"
                    className="text-muted-foreground hover:text-foreground transition-colors"
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
          <div className="flex-1 min-w-[400px] relative flex h-full flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-900">
            {/* Top bar: editor view + save/preview/publish */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 py-1">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditorView('formProperties')}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    editorView === 'formProperties'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Settings2 className="h-3 w-3" />
                  Form Properties
                </button>
                <button
                  onClick={() => setEditorView('canvas')}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    editorView === 'canvas'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <LayoutGrid className="h-3 w-3" />
                  Form
                </button>
                <button
                  onClick={() => setEditorView('logic')}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    editorView === 'logic'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Zap className="h-3 w-3" />
                  Logic
                  {(logicActiveRuleId || logicActiveFormulaId) && (
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  )}
                </button>
                <button
                  onClick={() => setEditorView('workflow')}
                  className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
                    editorView === 'workflow'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <GitBranch className="h-3 w-3" />
                  Workflow
                </button>
              </div>

              <div
                className="flex items-center gap-1 will-change-transform"
                style={{
                  transform: `translateX(-${(showProperties ? rightWidth : 0) + (showDebug ? debugWidth : 0)}px)`,
                  transition: 'transform 100ms ease-out',
                }}
              >
                <button
                  onClick={handleSave}
                  disabled={saving}
                  title="Save form"
                  className={`group flex h-7 items-center gap-0 border px-1.5 shadow-sm transition-all duration-300 rounded-sm hover:gap-1 hover:px-2 ${
                    saving
                      ? 'border-primary/40 bg-primary/10 text-primary cursor-wait'
                      : 'border-primary/60 bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {saving ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3" />
                  )}
                  <span className="max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-medium transition-all duration-300 group-hover:max-w-[60px]">
                    {saving ? 'Saving...' : 'Save'}
                  </span>
                </button>
                <button
                  onClick={() => window.open(`/forms/${formId}/preview`, '_blank')}
                  title="Preview form"
                  className="group flex h-7 items-center gap-0 rounded-sm border border-border bg-background px-1.5 shadow-sm transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-muted hover:gap-1 hover:px-2"
                >
                  <Eye className="h-3 w-3" />
                  <span className="max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-medium transition-all duration-300 group-hover:max-w-[60px]">
                    Preview
                  </span>
                </button>
                <button
                  onClick={async () => {
                    if (!formId) return;
                    setPublishing(true);
                    try {
                      await handleSave();
                      const { api: apiClient } = await import('@/lib/api');
                      await apiClient.post(
                        `/api/forms/${formId}/publish`
                      );
                      alert(
                        'Form published! Share this link:\\n' +
                          window.location.origin +
                          '/forms/' +
                          formId
                      );
                    } catch (err) {
                      console.error('Publish failed:', err);
                    } finally {
                      setPublishing(false);
                    }
                  }}
                  disabled={publishing || saving}
                  title="Publish form"
                  className={`group flex h-7 items-center gap-0 rounded-sm border px-1.5 shadow-sm transition-all duration-300 hover:gap-1 hover:px-2 ${
                    publishing
                      ? 'border-green-400/40 bg-green-400/10 text-green-600 cursor-wait'
                      : 'border-green-600/60 bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {publishing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Globe className="h-3 w-3" />
                  )}
                  <span className="max-w-0 overflow-hidden whitespace-nowrap text-[11px] font-medium transition-all duration-300 group-hover:max-w-[70px]">
                    {publishing ? 'Publishing...' : 'Publish'}
                  </span>
                </button>
              </div>
            </div>

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
                  <span className="flex-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Properties
                  </span>
                  <button
                    onClick={togglePropertiesPanel}
                    title="Collapse Properties"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <PanelRightClose className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex min-h-0 flex-1 w-full flex-col overflow-y-auto">
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
                  <span className="flex-1 text-xs font-semibold uppercase tracking-widest text-amber-500">
                    Debug
                  </span>
                  <button
                    onClick={() => setShowDebug(false)}
                    title="Collapse Debug Panel"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <PanelRightClose className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex min-h-0 flex-1 w-full flex-col overflow-hidden p-3">
                  <DebugPanel />
                </div>
              </div>
            </RightFloatingPanel>
          )}
        </div>

        {/* ── Bottom-right utility buttons ── */}
        <div
          className="fixed bottom-4 right-4 z-[60] flex gap-1 will-change-transform"
          style={{ transform: `translateX(-${(showProperties ? rightWidth : 0) + (showDebug ? debugWidth : 0)}px)`, transition: 'transform 100ms ease-out' }}
        >
          <button
            onClick={() => navigate('/')}
            title="Back to Dashboard"
            className="flex h-7 w-7 items-center justify-center border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground transition-colors"
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
            className={`flex h-7 w-7 items-center justify-center border shadow-sm transition-colors ${showDebug
              ? 'border-amber-400/60 bg-amber-400/10 text-amber-500'
              : 'border-border bg-background text-muted-foreground hover:text-amber-500'
              }`}
          >
            <Bug className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ── Drag overlay ── */}
      <DragOverlay dropAnimation={null}>
        {activeDragData?.type === DRAG_CATALOG_COMPONENT_ID &&
          (() => {
            const entry = activeDragData.entry;
            const Renderer = componentRenderers[entry.id as keyof typeof componentRenderers];
            const previewData = entry.create('__preview__');
            return Renderer ? (
              <div className="w-[400px] opacity-80 pointer-events-none">
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
              <div className="w-[400px] opacity-80 pointer-events-none">
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
      </DragOverlay>
    </DragDropProvider>
  );
}
