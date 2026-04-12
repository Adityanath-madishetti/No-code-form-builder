/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Settings2,
  LayoutGrid,
  Zap,
  Sun,
  Moon,
  Save,
  Loader2,
  Eye,
  Globe,
  Copy,
  Check,
} from 'lucide-react';
import { useFormStore } from '@/form/store/form.store';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WorkspacesProps {
  editorView: 'formProperties' | 'builder' | 'logic' | 'workflow' | 'theming';
  setEditorView: (
    view: 'formProperties' | 'builder' | 'logic' | 'workflow' | 'theming'
  ) => void;
  logicActiveRuleId: string | null;
  logicActiveFormulaId: string | null;
  editorTheme: 'dark' | 'light' | 'system' | string;
  setEditorTheme: (theme: 'dark' | 'light' | 'system') => void;
  saving: boolean;
  handleSave: () => Promise<boolean>;
  formId?: string;
}

interface ThemeToggleButtonProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ThemeToggleButton({
  isDark,
  onToggle,
}: ThemeToggleButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onToggle}
          className="flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
        >
          {isDark ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Switch to {isDark ? 'Light' : 'Dark'} Mode</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface SaveButtonProps {
  handleSave: () => Promise<boolean>;
  saving: boolean;
}

export function SaveButton({ handleSave, saving }: SaveButtonProps) {
  const onSaveClick = async () => {
    const isSuccess = await handleSave();

    if (isSuccess) {
      toast.success('Form saved successfully', {
        position: 'top-center',
        style: {
          '--normal-bg':
            'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
          '--normal-text':
            'light-dark(var(--color-green-600), var(--color-green-400))',
          '--normal-border':
            'light-dark(var(--color-green-600), var(--color-green-400))',
        } as React.CSSProperties,
      });
    } else {
      // TODO: use the message from the handleSave()
      toast.error('Failed to save form', {
        description: 'Please check your connection and try again.',
        position: 'top-center',
        style: {
          '--normal-bg':
            'color-mix(in oklab, var(--destructive) 10%, var(--background))',
          '--normal-text': 'var(--destructive)',
          '--normal-border': 'var(--destructive)',
        } as React.CSSProperties,
      });
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onSaveClick}
          disabled={saving}
          className={`flex h-7 w-7 items-center justify-center rounded-sm border shadow-sm transition-colors ${
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
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Save form</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface PreviewButtonProps {
  formId: string | undefined;
}

export function PreviewButton({ formId }: PreviewButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => {
            if (formId) window.open(`/forms/${formId}/preview`, '_blank');
          }}
          disabled={!formId}
          className="flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Eye className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Preview form</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface PublishButtonProps {
  formId: string | undefined;
  handleSave: () => Promise<boolean>;
  saving: boolean;
}

export function PublishButton({
  formId,
  handleSave,
  saving,
}: PublishButtonProps) {
  const [publishing, setPublishing] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const shareLink = formId ? `${window.location.origin}/forms/s/${formId}` : '';

  const handleCopy = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000); // Reset icon after 2s
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={async () => {
                if (!formId) return;
                setPublishing(true);
                try {
                  await handleSave();
                  const { api: apiClient } = await import('@/lib/api');
                  await apiClient.post(`/api/forms/${formId}/publish`);

                  setIsPublishDialogOpen(true);
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } catch (err: any) {
                  console.error('Publish failed:', err);

                  const errorMessage =
                    err?.response?.data?.message ||
                    err?.message ||
                    'Please check your connection and try again.';

                  toast.error('Failed to publish form', {
                    description: errorMessage,
                    position: 'top-center',
                    style: {
                      '--normal-bg':
                        'color-mix(in oklab, var(--destructive) 10%, var(--background))',
                      '--normal-text': 'var(--destructive)',
                      '--normal-border': 'var(--destructive)',
                    } as React.CSSProperties,
                  });
                } finally {
                  setPublishing(false);
                }
              }}
              disabled={publishing || saving}
              className={`flex h-7 w-7 items-center justify-center rounded-sm border shadow-sm transition-colors ${
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
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Publish form</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isPublishDialogOpen} onOpenChange={setIsPublishDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Form published successfully</DialogTitle>
          </DialogHeader>

          <div className="flex items-center space-x-2 pt-4">
            <div className="grid flex-1 gap-2">
              <label htmlFor="link" className="sr-only">
                Link
              </label>
              <Input
                id="link"
                defaultValue={shareLink}
                readOnly
                className="w-full text-sm text-muted-foreground"
              />
            </div>
            <Button size="sm" className="px-3" onClick={handleCopy}>
              <span className="sr-only">Copy</span>
              {hasCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function Workspaces({
  editorView,
  setEditorView,
  logicActiveRuleId,
  logicActiveFormulaId,
  editorTheme,
  setEditorTheme,
  saving,
  handleSave,
  formId,
}: WorkspacesProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 py-[5.5px]">
      <div className="flex items-center gap-1">
        <button
          onClick={() => setEditorView('builder')}
          className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
            editorView === 'builder'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <LayoutGrid className="h-3 w-3" />
          Canvas
        </button>
        {/* <button
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
        </button> */}
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
        {/* <button
          onClick={() => setEditorView('workflow')}
          className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
            editorView === 'workflow'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <GitBranch className="h-3 w-3" />
          Workflow
        </button> */}
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

      <div className="flex items-center gap-1">
        <ThemeToggleButton
          isDark={editorTheme === 'dark'}
          onToggle={() => {
            const isDark = document.documentElement.classList.contains('dark');
            const next = isDark ? 'light' : 'dark';

            setEditorTheme(next);
            useFormStore.getState().updateFormTheme({ mode: next });
            if (next === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }}
        />

        <SaveButton handleSave={handleSave} saving={saving} />
        <PreviewButton formId={formId} />
        <PublishButton
          formId={formId}
          handleSave={handleSave}
          saving={saving}
        />
      </div>
    </div>
  );
}
