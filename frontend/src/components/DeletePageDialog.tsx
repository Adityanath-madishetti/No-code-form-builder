import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
export const DONT_ASK_DELETE_PAGE_KEY = 'dontAskAgainDeletePage';

interface DeletePageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pageName: string;
}
export function DeletePageDialog({
  open,
  onOpenChange,
  onConfirm,
  pageName,
}: DeletePageDialogProps) {
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const handleConfirm = () => {
    if (dontAskAgain) {
      localStorage.setItem(DONT_ASK_DELETE_PAGE_KEY, 'true');
    }
    // We reset the state so next time (if local storage was cleared) it starts fresh
    setDontAskAgain(false);
    onConfirm();
    onOpenChange(false);
  };
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setDontAskAgain(false);
    }
    onOpenChange(newOpen);
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Page</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the page "{pageName}"? All
            components inside this page will also be removed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 py-4">
          <Checkbox
            id="dont-ask-delete-page"
            checked={dontAskAgain}
            onCheckedChange={(checked) => setDontAskAgain(checked === true)}
          />
          <label
            htmlFor="dont-ask-delete-page"
            className="cursor-pointer text-sm leading-none font-medium select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Don't ask again
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
