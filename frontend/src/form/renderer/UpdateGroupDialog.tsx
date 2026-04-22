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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useGroupStore } from '@/form/store/group.store';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (groupId: string) => void;
}

export const UpdateGroupDialog = ({ open, onOpenChange, onSave }: Props) => {
  const { user } = useAuth();
  const groups = useGroupStore((s) => s.groups);
  const personalGroups = groups.filter((g) => g.createdBy === user?.uid);

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Update Existing Group
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select one of your existing personal groups to overwrite with the
            current selection. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger className="h-9 w-full text-sm">
              <SelectValue placeholder="Select a personal group" />
            </SelectTrigger>
            <SelectContent>
              {personalGroups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!selectedGroupId}
            onClick={() => {
              if (selectedGroupId) {
                onSave(selectedGroupId);
              }
            }}
          >
            Overwrite Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
