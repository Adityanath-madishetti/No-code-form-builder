import {
  Settings2,
  LayoutGrid,
  Palette,
  Zap,
  GitBranch,
  Sun,
  Moon,
  Save,
  Loader2,
  Eye,
  Globe,
} from 'lucide-react';
import { useFormStore } from '@/form/store/formStore';

interface WorkspacesProps {
  editorView: 'canvas' | 'logic' | 'workflow' | 'formProperties' | 'theming';
  setEditorView: (view: 'canvas' | 'logic' | 'workflow' | 'formProperties' | 'theming') => void;
  setActivePanel: (panel: null) => void;
  logicActiveRuleId: string | null;
  logicActiveFormulaId: string | null;
  showProperties: boolean;
  showDebug: boolean;
  rightWidth: number | string;
  debugWidth: number | string;
  editorTheme: 'dark' | 'light' | 'system' | string;
  setEditorTheme: (theme: 'dark' | 'light' | 'system') => void;
  saving: boolean;
  handleSave: () => Promise<void>;
  formId?: string;
  publishing: boolean;
  setPublishing: (pub: boolean) => void;
}

export function Workspaces({
  editorView,
  setEditorView,
  setActivePanel,
  logicActiveRuleId,
  logicActiveFormulaId,
  showProperties,
  showDebug,
  rightWidth,
  debugWidth,
  editorTheme,
  setEditorTheme,
  saving,
  handleSave,
  formId,
  publishing,
  setPublishing,
}: WorkspacesProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 py-1">
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
          onClick={() => {
            setActivePanel(null);
            setEditorView('theming');
          }}
          className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
            editorView === 'theming'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Palette className="h-3 w-3" />
          Themes
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
          {(logicActiveRuleId || logicActiveFormulaId) && (
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          )}
        </button>
        <button
          onClick={() => setEditorView('workflow')}
          className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
            editorView === 'workflow'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <GitBranch className="h-3 w-3" />
          Workflow
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

      <div
        className="flex items-center gap-1 will-change-transform"
        style={{
          transform: `translateX(-${
            (showProperties ? (rightWidth as number) : 0) +
            (showDebug ? (debugWidth as number) : 0)
          }px)`,
          transition: 'transform 100ms ease-out',
        }}
      >
        {/* Dark / Light toggle */}
        <button
          onClick={() => {
            const isDark = document.documentElement.classList.contains('dark');
            const next = isDark ? 'light' : 'dark';
            setEditorTheme(next);
            useFormStore.getState().updateFormTheme({ mode: next });
          }}
          title={
            document.documentElement.classList.contains('dark')
              ? 'Switch to Light Mode'
              : 'Switch to Dark Mode'
          }
          className="group flex h-7 items-center gap-0 rounded-sm border border-border bg-background px-1.5 text-muted-foreground shadow-sm transition-all duration-300 hover:gap-1 hover:bg-muted hover:px-2 hover:text-foreground"
        >
          {document.documentElement.classList.contains('dark') ? (
            <Sun className="h-3 w-3" />
          ) : (
            <Moon className="h-3 w-3" />
          )}
          <span className="max-w-0 overflow-hidden text-[11px] font-medium whitespace-nowrap transition-all duration-300 group-hover:max-w-[60px]">
            {editorTheme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          title="Save form"
          className={`group flex h-7 items-center gap-0 rounded-sm border px-1.5 shadow-sm transition-all duration-300 hover:gap-1 hover:px-2 ${
            saving
              ? 'cursor-wait border-primary/40 bg-primary/10 text-primary'
              : 'border-primary/60 bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {saving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Save className="h-3 w-3" />
          )}
          <span className="max-w-0 overflow-hidden text-[11px] font-medium whitespace-nowrap transition-all duration-300 group-hover:max-w-[60px]">
            {saving ? 'Saving...' : 'Save'}
          </span>
        </button>
        <button
          onClick={() => window.open(`/forms/${formId}/preview`, '_blank')}
          title="Preview form"
          className="group flex h-7 items-center gap-0 rounded-sm border border-border bg-background px-1.5 text-muted-foreground shadow-sm transition-all duration-300 hover:gap-1 hover:bg-muted hover:px-2 hover:text-foreground"
        >
          <Eye className="h-3 w-3" />
          <span className="max-w-0 overflow-hidden text-[11px] font-medium whitespace-nowrap transition-all duration-300 group-hover:max-w-[60px]">
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
              await apiClient.post(`/api/forms/${formId}/publish`);
              alert(
                'Form published! Share this link:\n' +
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
              ? 'cursor-wait border-green-400/40 bg-green-400/10 text-green-600'
              : 'border-green-600/60 bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {publishing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Globe className="h-3 w-3" />
          )}
          <span className="max-w-0 overflow-hidden text-[11px] font-medium whitespace-nowrap transition-all duration-300 group-hover:max-w-[70px]">
            {publishing ? 'Publishing...' : 'Publish'}
          </span>
        </button>
      </div>
    </div>
  );
}
