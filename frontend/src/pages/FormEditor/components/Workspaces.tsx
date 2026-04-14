/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { useFormStore } from '@/form/store/form.store';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  useLogicStore,
  getRuleDiagnostics,
  type RuleWarning,
} from '@/form/logic/logic.store';

interface RulesWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warnings: RuleWarning[];
  onConfirm: () => void;
  isProcessing: boolean;
  actionText: string;
  loadingText: string;
  descriptionText: string;
}

export function RulesWarningDialog({
  open,
  onOpenChange,
  warnings,
  onConfirm,
  isProcessing,
  actionText,
  loadingText,
  descriptionText,
}: RulesWarningDialogProps) {
  const components = useFormStore((s) => s.components);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-xl gap-0 sm:max-w-xl">
        <DialogHeader className="mb-3">
          <DialogTitle>Overlapping Rules Detected</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto border-t px-4 pt-4">
          {warnings.map((warning, index) => {
            const isCritical = warning.warningType === 'SAME_TARGET';

            return (
              <div
                key={index}
                className={`mb-4 rounded-md border p-3 text-sm leading-normal ${
                  isCritical
                    ? 'border-red-200 bg-red-50 dark:bg-red-950/20'
                    : 'bg-muted/50'
                }`}
              >
                {/* Warning Header */}
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  {isCritical ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <span
                    className={
                      isCritical ? 'text-red-600 dark:text-red-400' : ''
                    }
                  >
                    {warning.label}
                  </span>
                </div>

                {/* Warning Description */}
                <p className="mb-2 text-muted-foreground">
                  {warning.description}
                </p>

                {/* Rule Breakdown */}
                <p>
                  <strong>{warning.ruleA.name}</strong> ↔{' '}
                  <strong>{warning.ruleB.name}</strong>
                </p>

                <ul className="mt-2 font-mono text-xs text-muted-foreground">
                  {warning.componentIds.map((id) => (
                    <li key={id} className="flex items-center gap-2 py-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                      <span>
                        {components[id]?.metadata?.label || 'Unknown Component'}
                      </span>
                      <span className="opacity-50">({id})</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingText}
              </>
            ) : (
              actionText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
  const rules = useLogicStore((s) => s.rules);
  const formulas = useLogicStore((s) => s.formulas);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [ruleWarningData, setRuleWarningData] = useState<RuleWarning[]>([]);

  const executeSave = async () => {
    setIsDialogOpen(false);
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
      toast.error('Failed to save form', {
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

  const onSaveClick = async () => {
    const ruleWarnings = getRuleDiagnostics(rules, formulas);
    if (ruleWarnings && ruleWarnings.length > 0) {
      setRuleWarningData(ruleWarnings);
      setIsDialogOpen(true);
    } else {
      await executeSave();
    }
  };

  return (
    <>
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

      <RulesWarningDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        warnings={ruleWarningData}
        onConfirm={executeSave}
        isProcessing={saving}
        actionText="Save Anyway"
        loadingText="Saving..."
        descriptionText="Some rules share the same components. Are you sure you want to save anyway?"
      />
    </>
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
  const rules = useLogicStore((s) => s.rules);
  const formulas = useLogicStore((s) => s.formulas);
  const [isOverlapDialogOpen, setIsOverlapDialogOpen] = useState(false);
  const [ruleWarningData, setRuleWarningData] = useState<RuleWarning[]>([]);

  const shareLink = formId ? `${window.location.origin}/forms/s/${formId}` : '';
  const components = useFormStore((s) => s.components);

  const handleCopy = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const executePublish = async () => {
    if (!formId) return;
    setIsOverlapDialogOpen(false);
    setPublishing(true);

    try {
      const isSaveSuccess = await handleSave();
      if (!isSaveSuccess) {
        setPublishing(false);
        return;
      }

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
  };

  const onPublishClick = async () => {
    const ruleWarnings = getRuleDiagnostics(rules, formulas);

    if (ruleWarnings && ruleWarnings.length > 0) {
      setRuleWarningData(ruleWarnings);
      setIsOverlapDialogOpen(true);
    } else {
      await executePublish();
    }
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onPublishClick}
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

      <RulesWarningDialog
        open={isOverlapDialogOpen}
        onOpenChange={setIsOverlapDialogOpen}
        warnings={ruleWarningData}
        onConfirm={executePublish}
        isProcessing={publishing || saving}
        actionText="Publish Anyway"
        loadingText="Publishing..."
        descriptionText="Some rules share the same components. Are you sure you want to publish anyway?"
      />
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
          <DialogFooter className="flex justify-end pt-4">
            <a
              href={shareLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Open Form
              <ExternalLink className="h-4 w-4" />
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface WorkspacesProps {
  editorView: 'canvas' | 'logic' | 'workflow' | 'formProperties' | 'theming';
  setEditorView: (
    view: 'canvas' | 'logic' | 'workflow' | 'formProperties' | 'theming'
  ) => void;
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
  handleSave: () => Promise<boolean>;
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
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 py-[5.5px]">
      <div className="flex items-center gap-1">
        {/* <button
          onClick={() => setEditorView('canvas')}
          className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
            editorView === 'canvas'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <LayoutGrid className="h-3 w-3" />
          Canvas
        </button> */}
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
        {/* <button
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
        </button> */}
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
        {/* <button
          onClick={() => setEditorView('formProperties')}
          className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors ${
            editorView === 'formProperties'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Settings2 className="h-3 w-3" />
          Settings
        </button> */}
      </div>

      <div className="flex items-center gap-1">
        {/* <ThemeToggleButton
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
        /> */}

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
