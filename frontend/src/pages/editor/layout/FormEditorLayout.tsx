import { useState } from 'react';
import {
  Bug,
  ArrowLeft,
  Hammer,
  Zap,
  Settings2,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

import { RightFloatingPanel } from './RightFloatingPanel';
import { SaveButton, PreviewButton, PublishButton } from './WorkspaceBar';

import { FormCanvas } from '../builder/FormCanvas';
import { PageNavigator } from '../builder/PageNavigator';
import { FormPropertiesPanel } from '../form-settings/FormSettingsPage';

// Left Panel content
import { ComponentPropertiesPanel } from '../builder/panel/ComponentProperties';
import { ComponentListPanel } from '../builder/panel/ComponentList';
import { LogicPanel } from '../logic/LogicPanel';
import { DebugPanel } from '../debug/DebugPanel';
import { KeyboardShortcutsHelp } from '../KeyboardShortcutsHelp';

import { useFormStore } from '@/form/store/form.store';

/* ─────────────────────────────
   Left Panel — Builder view (split sections)
───────────────────────────── */
function BuilderLeftPanel({ currentPageIndex }: { currentPageIndex: number }) {
  const form = useFormStore((s) => s.form);
  const currentPageId = form?.pages[currentPageIndex] ?? null;

  return (
    <div className="flex h-full flex-col">
      {/* Top section: Component List */}
      <div
        className="flex shrink-0 flex-col border-b border-border"
        style={{ height: '33%' }}
      >
        <div className="flex h-8 shrink-0 items-center px-3">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
            Components
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ComponentListPanel pageId={currentPageId} />
        </div>
      </div>

      {/* Bottom section: Component Properties */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-8 shrink-0 items-center px-3">
          <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
            Properties
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ComponentPropertiesPanel />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────
   Left Panel — Logic view
───────────────────────────── */
function LogicLeftPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-3">
        <LogicPanel />
      </div>
    </div>
  );
}

/* ─────────────────────────────
   Left Panel — Form Settings view
───────────────────────────── */
function SettingsLeftPanel({
  activeTab,
  setActiveTab,
}: {
  activeTab: 'form' | 'access' | 'submission';
  setActiveTab: (tab: 'form' | 'access' | 'submission') => void;
}) {
  const tabs = [
    { id: 'form' as const, label: 'Form Settings' },
    { id: 'access' as const, label: 'Access Control' },
    { id: 'submission' as const, label: 'Submission Options' },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-8 shrink-0 items-center px-3 mt-2">
        <span className="text-[10px] font-semibold tracking-wider text-muted-foreground/50 uppercase">
          Settings
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
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

  // Panel visibility
  const showLeftPanel = editorView === 'builder' || editorView === 'logic' || editorView === 'formProperties';
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);

  // Settings tab state
  const [settingsTab, setSettingsTab] = useState<'form' | 'access' | 'submission'>('form');

  return (
    <div className="isolate flex h-screen w-full flex-col overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      {/* WORKSPACE BAR — full width, always on top */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-3 py-[5.5px]">
        {/* Left: panel toggle + workspace tabs */}
        <div className="flex items-center gap-1">
          {/* Panel toggle button */}
          {showLeftPanel && (
            <button
              onClick={() => setLeftPanelOpen((prev: boolean) => !prev)}
              className="mr-1 flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title={leftPanelOpen ? 'Close panel' : 'Open panel'}
            >
              {leftPanelOpen ? (
                <PanelLeftClose className="h-3.5 w-3.5" />
              ) : (
                <PanelLeft className="h-3.5 w-3.5" />
              )}
            </button>
          )}

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

      {/* BODY — panels below workspace bar */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* LEFT PANEL — contextual, collapsible */}
        {showLeftPanel && leftPanelOpen && (
          <div
            className="h-full shrink-0 overflow-hidden border-r border-border bg-background"
            style={{ width: state.rightWidth }}
          >
            {editorView === 'builder' && (
              <BuilderLeftPanel currentPageIndex={currentPageIndex} />
            )}
            {editorView === 'logic' && <LogicLeftPanel />}
            {editorView === 'formProperties' && (
              <SettingsLeftPanel
                activeTab={settingsTab}
                setActiveTab={setSettingsTab}
              />
            )}
          </div>
        )}

        {/* CENTER: canvas area */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-900">
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

          {/* FORM PROPERTIES (full width, no left panel) */}
          {editorView === 'formProperties' && (
            <div className="flex-1 overflow-y-auto p-3">
              <FormPropertiesPanel activeTab={settingsTab} />
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
      <div className="fixed right-4 bottom-4 z-40 flex items-center gap-1.5">
        <button
          onClick={actions.navigateHome}
          title="Back to Dashboard"
          className="flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft className="h-3 w-3" />
        </button>

        <button
          onClick={() => setShowDebug((p: boolean) => !p)}
          title={showDebug ? 'Hide Debug Panel' : 'Show Debug Panel'}
          className={`flex h-7 w-7 items-center justify-center rounded-sm border shadow-sm transition-colors ${
            showDebug
              ? 'border-primary/60 bg-primary/10 text-primary hover:bg-primary/15'
              : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
          aria-label="Toggle debug panel"
        >
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
