import React, { useEffect, useState } from 'react';
import { deleteForm } from '@/lib/formApi';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export const DONT_ASK_DELETE_FORM_KEY = 'dontAskAgainDeleteForm';

interface DeleteFormDialogProps {
  formId: string;
  formName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // Optional callback for routing or state updates after deletion
}

export function DeleteFormDialog({
  formId,
  formName,
  open,
  onOpenChange,
  onSuccess,
}: DeleteFormDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  // Clear the input field whenever the dialog closes
  useEffect(() => {
    if (!open) {
      setConfirmText('');
      setDontAskAgain(false);
    }
  }, [open]);

  const isMatch = confirmText === formName;

  const handleDelete = async () => {
    if (!isMatch) return;

    if (dontAskAgain) {
      localStorage.setItem(DONT_ASK_DELETE_FORM_KEY, 'true');
    }

    setIsDeleting(true);
    try {
      await deleteForm(formId);
      toast.success('Form deleted successfully', {
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
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete form:', error);
      toast.error('Failed to delete form. Please try again.');
      toast.error('Failed to delete form. Please try again.', {
        position: 'top-center',
        style: {
          '--normal-bg':
            'color-mix(in oklab, var(--destructive) 10%, var(--background))',
          '--normal-text': 'var(--destructive)',
          '--normal-border': 'var(--destructive)',
        } as React.CSSProperties,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Form</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the form,
            all its configuration, and remove its data from our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          <div className="space-y-2">
            <Label>
              Please type{' '}
              <span className="rounded bg-muted px-1 py-0.5 font-mono font-bold text-foreground select-none">
                {formName}
              </span>{' '}
              to confirm.
            </Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Enter form Name"
              disabled={isDeleting}
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="dont-ask-delete-form" 
              checked={dontAskAgain} 
              onCheckedChange={(checked) => setDontAskAgain(checked === true)} 
              disabled={isDeleting}
            />
            <label
              htmlFor="dont-ask-delete-form"
              className="text-sm font-medium leading-none cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Don't ask again
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isMatch || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Form'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
