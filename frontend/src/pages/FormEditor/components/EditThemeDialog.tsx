import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { ThemeTemplate } from '@/form/store/themeTemplate.store';
import { EmailChipsField } from '@/components/EmailChipsField';

interface EditThemeDialogProps {
  theme: ThemeTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (
    id: string,
    updates: { name?: string; sharedWith?: string[]; isPublic?: boolean }
  ) => void;
}

export function EditThemeDialog({
  theme,
  open,
  onOpenChange,
  onSave,
}: EditThemeDialogProps) {
  const [name, setName] = useState(theme.name);
  const [isPublic, setIsPublic] = useState(theme.isPublic);
  const [sharedEmails, setSharedEmails] = useState<string[]>(
    theme.sharedWith || []
  );

  const handleSave = () => {
    onSave(theme.id, {
      name,
      isPublic,
      sharedWith: sharedEmails,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Theme Settings & Sharing</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Theme Name"
            />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-setting">Public Access</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Allow all users on this platform to use this theme
              </p>
            </div>
            <Switch
              id="public-setting"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="mt-2 grid gap-2">
            <Label>Share with specific users</Label>
            <div className={isPublic ? 'pointer-events-none opacity-50' : ''}>
              <EmailChipsField
                entries={sharedEmails.map((email) => ({ email }))}
                onChange={(entries) =>
                  setSharedEmails(entries.map((e) => e.email))
                }
              />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Enter emails of users who should have access to this theme.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
