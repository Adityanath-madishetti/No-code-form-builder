/* eslint-disable @typescript-eslint/no-unused-vars */
import {
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
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useLogicStore,
  getRuleDiagnostics,
  type RuleWarning,
} from '@/form/logic/logic.store';

import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

import { executeAIActionStream } from '@/form/ai/actionStream';

import { Sparkles, X } from 'lucide-react';
import { generateAiFormDraft } from '@/lib/formApi';
import { api } from '@/lib/api';
import type { FormHeader } from '@/pages/Dashboard/dashboard.types';
import { DeleteFormDialog } from '@/components/DeleteFormDialog';

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
  const [hasCopiedLink, setHasCopiedLink] = useState(false);
  const [hasCopiedEmbed, setHasCopiedEmbed] = useState(false);
  const rules = useLogicStore((s) => s.rules);
  const formulas = useLogicStore((s) => s.formulas);
  const [isOverlapDialogOpen, setIsOverlapDialogOpen] = useState(false);
  const [ruleWarningData, setRuleWarningData] = useState<RuleWarning[]>([]);

  const shareLink = formId ? `${window.location.origin}/forms/${formId}` : '';
  const embedLink = formId
    ? `${window.location.origin}/embed/forms/${formId}`
    : '';

  const expectedOrigin = new URL(embedLink).origin;
  const embedCode = `
<iframe 
  id="form-iframe-${formId}"
  src="${embedLink}" 
  style="width: 1px; min-width: 100%; border: none;"
  scrolling="no"
></iframe>
<script>
  window.addEventListener('message', function(e) {
    // 1. SECURITY: Only accept messages from YOUR application's domain
    if (e.origin !== '${expectedOrigin}') return;

    const iframe = document.getElementById('form-iframe-${formId}');
    
    // 2. SECURITY: Validate the payload type and ensure height is a safe number
    if (iframe && e.data && e.data.type === 'FRAME_RESIZE') {
      const newHeight = parseInt(e.data.height, 10);
      
      // Prevent malicious negative heights or absurdly large numbers
      if (!isNaN(newHeight) && newHeight > 0 && newHeight < 20000) {
        iframe.style.height = newHeight + 'px';
      }
    }
  });
</script>
`;

  const handleCopyLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setHasCopiedLink(true);
    setTimeout(() => setHasCopiedLink(false), 2000);
  };

  const handleCopyEmbed = async () => {
    await navigator.clipboard.writeText(embedCode);
    setHasCopiedEmbed(true);
    setTimeout(() => setHasCopiedEmbed(false), 2000);
    toast.success('Embed code copied to clipboard');
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
        <DialogContent className="min-w-xl gap-0 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Form published successfully</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Share Link Section */}
            <div className="space-y-2">
              <Label
                htmlFor="link"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Public Link
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="link"
                  defaultValue={shareLink}
                  readOnly
                  className="h-9 flex-1 bg-muted/50 text-sm text-muted-foreground"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 px-3"
                  onClick={handleCopyLink}
                >
                  {hasCopiedLink ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Embed Code Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="embed"
                  className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Embed Code (Iframe)
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] font-bold uppercase"
                  onClick={handleCopyEmbed}
                >
                  {hasCopiedEmbed ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
              <div className="group relative">
                <Textarea
                  id="embed"
                  value={embedCode}
                  readOnly
                  className="h-24 resize-none bg-muted/30 font-mono text-sm text-[11px] leading-relaxed text-muted-foreground"
                />
                <div className="pointer-events-none absolute inset-0 rounded-md border border-transparent transition-colors group-hover:border-primary/20" />
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                This includes a script to automatically adjust the height of the
                form.
              </p>
            </div>
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

type MenuItemType = 'item' | 'separator' | 'sub' | 'checkbox' | 'radio';

interface MenuItem {
  type: MenuItemType;
  text?: string;
  shortcut?: string;
  disabled?: boolean;
  inset?: boolean;
  checked?: boolean; // For Checkbox items
  value?: string; // For Radio items
  onClick?: () => void;
  items?: MenuItem[]; // For Submenus
  className?: string;
}

interface MenuSection {
  trigger: string;
  content: MenuItem[];
}

export function DynamicMenubar({
  handleSave,
  saving,
  formId,
}: {
  handleSave: () => Promise<boolean>;
  saving: boolean;
  formId?: string;
}) {
  const navigate = useNavigate();
  const undo = useFormStore((s) => s.undo);
  const redo = useFormStore((s) => s.redo);
  const form = useFormStore((s) => s.form);
  const formName = form?.name || 'Untitled Form';

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleOpenDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const [creating, setCreating] = useState(false);
  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await api.post<{ form: FormHeader }>('/api/forms', {
        title: 'Untitled Form',
      });
      navigate(`/form-builder/${res.form.formId}`);
    } catch {
      setCreating(false);
    }
  };

  const formBuilderMenuConfig: MenuSection[] = [
    {
      trigger: 'Form',
      content: [
        {
          type: 'item',
          text: 'New Blank Form',
          shortcut: '⌘N',
          onClick: () => {
            if (confirm('Create a new form? Unsaved changes will be lost.')) {
              handleCreate();
            }
          },
        },
        {
          type: 'item',
          text: 'New from Template...',
          inset: true,
        },
        { type: 'separator' },
        {
          type: 'item',
          text: 'Open Form...',
          shortcut: '⌘O',
        },
        // {
        //   type: 'item',
        //   text: 'Save',
        //   shortcut: '⌘S',
        //   disabled: saving,
        //   onClick: () => handleSave(),
        // },
        {
          type: 'item',
          text: 'Duplicate Form',
          shortcut: '⌘D',
        },
        { type: 'separator' },
        {
          type: 'sub',
          text: 'Export As...',
          items: [
            { type: 'item', text: 'JSON Schema (.json)' },
            { type: 'item', text: 'PDF Document (.pdf)', disabled: true },
            // { type: 'item', text: 'React Component (.tsx)' },
            // { type: 'item', text: 'HTML/CSS Bundle (.zip)' },
          ],
        },
        // {
        //   type: 'sub',
        //   text: 'Share',
        //   items: [
        //     { type: 'item', text: 'Copy Public Link', disabled: true },
        //     { type: 'item', text: 'Embed in Website', disabled: true },
        //     { type: 'item', text: 'Email to Collaborators', disabled: true },
        //     { type: 'item', text: 'Publish as Template', disabled: true },
        //   ],
        // },
        { type: 'separator' },
        // {
        //   type: 'item',
        //   text: 'Form Settings',
        //   shortcut: '⌘,',
        // },
        {
          type: 'item',
          text: 'Print Preview',
          shortcut: '⌘P',
        },
        { type: 'separator' },
        {
          type: 'item',
          text: 'Delete Form',
          className: 'text-red-500',
          onClick: handleOpenDeleteDialog,
        },
      ],
    },
    // {
    //   trigger: 'Edit',
    //   content: [
    //     { type: 'item', text: 'Undo', shortcut: '⌘Z', onClick: () => undo() },
    //     { type: 'item', text: 'Redo', shortcut: '⇧⌘Z', onClick: () => redo() },
    //     { type: 'separator' },
    //     { type: 'item', text: 'Cut', shortcut: '⌘X' },
    //     { type: 'item', text: 'Copy', shortcut: '⌘C' },
    //     { type: 'item', text: 'Paste', shortcut: '⌘V' },
    //   ],
    // },
    {
      trigger: 'Help',
      content: [
        { type: 'item', text: 'Documentation' },
        { type: 'item', text: 'Keyboard Shortcuts', shortcut: '?' },
      ],
    },
  ];

  const renderMenuItems = (items: MenuItem[]) => {
    return items.map((item, index) => {
      if (item.type === 'separator') return <MenubarSeparator key={index} />;

      if (item.type === 'sub') {
        return (
          <MenubarSub key={item.text}>
            <MenubarSubTrigger className={item.className}>
              {item.text}
            </MenubarSubTrigger>
            <MenubarSubContent className="shadow-none">
              {item.items && renderMenuItems(item.items)}
            </MenubarSubContent>
          </MenubarSub>
        );
      }

      if (item.type === 'checkbox') {
        return (
          <MenubarCheckboxItem
            key={item.text}
            checked={item.checked}
            onClick={item.onClick}
          >
            {item.text}
          </MenubarCheckboxItem>
        );
      }

      if (item.type === 'radio') {
        return (
          <MenubarRadioItem key={item.value} value={item.value!}>
            {item.text}
          </MenubarRadioItem>
        );
      }

      return (
        <MenubarItem
          key={item.text}
          disabled={item.disabled}
          inset={item.inset}
          onClick={item.onClick}
        >
          {item.text}
          {item.shortcut && <MenubarShortcut>{item.shortcut}</MenubarShortcut>}
        </MenubarItem>
      );
    });
  };

  return (
    <Menubar className="w-72 border-none">
      {formBuilderMenuConfig.map((menu) => (
        <MenubarMenu key={menu.trigger}>
          <MenubarTrigger>{menu.trigger}</MenubarTrigger>
          <MenubarContent className="shadow-none">
            {/* Wrap in RadioGroup if it contains radio items */}
            {menu.content.some((i) => i.type === 'radio') ? (
              <MenubarRadioGroup value="benoit">
                {renderMenuItems(menu.content)}
              </MenubarRadioGroup>
            ) : (
              <MenubarGroup>{renderMenuItems(menu.content)}</MenubarGroup>
            )}
          </MenubarContent>
        </MenubarMenu>
      ))}

      {formId && (
        <DeleteFormDialog
          formId={formId}
          formName={formName}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onSuccess={() => navigate('/dashboard')}
        />
      )}
    </Menubar>
  );
}

/**
 * 
Create a 3-page Tech Conference Registration form.

Page 1 is 'Basic Info' and should ask for Full Name, Email Address, and Attendee Type.

If the Attendee Type is exactly 'Student', skip to Page 3.

Page 2 is 'Professional Details'. Ask for Company Name and Job Title.

Page 3 is 'Student Details'. Ask for University Name and Graduation Year (as a number)." 

===

Create a 4-page Software Engineer Assessment form.

Page 1 is 'Candidate Profile'. Ask for Full Name (text) and Email Address (email). Also add a Radio question asking 'Primary Role' with a vertical layout and two options: 'Frontend', 'Backend'.
If Primary Role equals 'Frontend', skip to Page 2.
If Primary Role equals 'Backend', skip to Page 3.

Page 2 is 'Frontend Skills'. Ask for 'Years of React Experience' (as a number).
If Years of React Experience is greater than 5, skip to Page 4.
Make Page 2 a submit page.

Page 3 is 'Backend Skills'. Ask for 'Preferred Database' (text).
make Page 3 a submit page (terminal page).

Page 4 is 'Senior Assessment'. Ask for 'Architecture Portfolio URL' (text).
make Page 4 a submit page.

===


Create a 3-page Software Engineer Assessment form.

Page 1 is 'Candidate Profile'. Ask for Full Name (text) and Email Address (email). Also add a Radio question asking 'Primary Role' with a vertical layout and two options: 'Frontend', 'Backend'.
If Primary Role equals 'Frontend', skip to Page 2.
If Primary Role equals 'Backend', skip to Page 3.

Page 2 is 'Frontend Skills'. Ask for 'Years of React Experience' (as a number).
Make Page 2 a submit page.

Page 3 is 'Backend Skills'. Ask for 'Preferred Database' (text).
make Page 3 a submit page (terminal page).

===

Create a 3-page Software Engineer Assessment form.

Page 1 is 'Candidate Profile'. Ask for Full Name (text) and Email Address (email). Also add a Radio question asking 'Primary Role' with a vertical layout and two options: 'Frontend', 'Backend'.
If Primary Role equals 'Frontend', skip to Page 2.
If Primary Role equals 'Backend', skip to Page 3.

Page 2 is 'Frontend Skills'. Ask for 'Years of React Experience' (as a number) and Ask for 'Architecture Portfolio URL' (text)(hidden by default).
If Years of React Experience is greater than 5, show Architecture Portfolio URL.
Make Page 2 a submit page.

Page 3 is 'Backend Skills'. Ask for 'Preferred Database' (text).
make Page 3 a submit page (terminal page).

 */
export function AIGenerateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const aiDraft = await generateAiFormDraft(prompt);
      // Inject the JSON directly into your Zustand store using your function
      executeAIActionStream(aiDraft);
      setPrompt('');
      setIsOpen(false);
    } catch (err) {
      console.error('AI Generation failed:', err);
      setError('Failed to generate form. Is the backend running?');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-dashed border-primary/50 transition-colors hover:border-primary"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          Generate with AI
        </Button>
      </DialogTrigger>

      {/* Used max-w-3xl to match your previous w-3xl size */}
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Draft Form with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <strong>Experimental Feature:</strong> Generating an AI draft will
              discard your existing unsaved form and begin a fresh session.
              Please note that unsaved progress will be lost.
            </p>
          </div>

          <Textarea
            placeholder="Describe your form (e.g., A two-page job application asking for name, email, and Github URL...)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[400px] resize-none focus-visible:ring-primary/50"
            autoFocus
            disabled={isGenerating}
          />

          {error && (
            <p className="text-xs font-medium text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2 sm:space-x-0">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-[120px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Drafting...
              </>
            ) : (
              'Generate'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface WorkspacesProps {
  editorTheme: 'dark' | 'light' | 'system' | string;
  setEditorTheme: (theme: 'dark' | 'light' | 'system') => void;
  saving: boolean;
  handleSave: () => Promise<boolean>;
  formId?: string;
}

export function Workspaces({
  editorTheme,
  setEditorTheme,
  saving,
  handleSave,
  formId,
}: WorkspacesProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-background px-3 py-[5.5px]">
      <div className="flex items-center gap-1">
        <DynamicMenubar
          handleSave={handleSave}
          saving={saving}
          formId={formId}
        />
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
        <AIGenerateButton />

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
