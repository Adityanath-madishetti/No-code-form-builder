import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { FormHeader, LayoutMode } from '../dashboard.types';
import {
  formatDate,
  getCreatorLabel,
  matchesDateFilter,
} from '../dashboard.utils';
import {
  DeleteFormDialog,
  DONT_ASK_DELETE_FORM_KEY,
} from '@/components/DeleteFormDialog';
import { deleteForm } from '@/lib/formApi';
import { toast } from 'sonner';

import { FormFilters } from './FormFilters';
import { FormListGrid, type FormItemData } from './FormListGrid';

interface Props {
  forms: FormHeader[];
  onReload: () => Promise<void>;
}

export default function MyFormsTab({ forms, onReload }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [layout, setLayout] = useState<LayoutMode>('grid');
  const [query, setQuery] = useState('');

  // Rename Dialog State
  const [renameDialog, setRenameDialog] = useState<{
    isOpen: boolean;
    formId: string;
    currentTitle: string;
  }>({ isOpen: false, formId: '', currentTitle: '' });

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    formId: string;
    formTitle: string;
  }>({ isOpen: false, formId: '', formTitle: '' });

  const requestDelete = async (formId: string, formTitle: string) => {
    const dontAsk = localStorage.getItem(DONT_ASK_DELETE_FORM_KEY) === 'true';
    if (dontAsk) {
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
        await onReload();
      } catch {
        toast.error('Failed to delete form. Please try again.', {
          position: 'top-center',
          style: {
            '--normal-bg':
              'color-mix(in oklab, var(--destructive) 10%, var(--background))',
            '--normal-text': 'var(--destructive)',
            '--normal-border': 'var(--destructive)',
          } as React.CSSProperties,
        });
      }
    } else {
      setDeleteDialog({ isOpen: true, formId, formTitle });
    }
  };

  const [newTitle, setNewTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const [statusFilter, setStatusFilter] = useState<
    'all' | 'published' | 'draft'
  >('all');
  const [editedFilter, setEditedFilter] = useState<
    'all' | 'last7' | 'last30' | 'older'
  >('all');

  // Triggered by the Pencil icon
  const openRenameDialog = (formId: string, currentTitle: string) => {
    setRenameDialog({ isOpen: true, formId, currentTitle });
    setNewTitle(currentTitle);
  };

  // Triggered by the Dialog "Save" button or Enter key
  const submitRename = async (e?: React.SubmitEvent) => {
    e?.preventDefault(); // Prevent default form submission

    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle || trimmedTitle === renameDialog.currentTitle) {
      setRenameDialog({ isOpen: false, formId: '', currentTitle: '' });
      return;
    }

    setIsRenaming(true);
    try {
      await api.patch(`/api/forms/${renameDialog.formId}`, {
        title: trimmedTitle,
      });
      await onReload();
      setRenameDialog({ isOpen: false, formId: '', currentTitle: '' });
    } catch (err) {
      window.alert((err as Error).message || 'Failed to rename form');
    } finally {
      setIsRenaming(false);
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = forms.filter((form) => {
    const matchesSearch =
      !normalizedQuery ||
      form.title.toLowerCase().includes(normalizedQuery) ||
      getCreatorLabel(form, user?.uid).toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && form.isActive) ||
      (statusFilter === 'draft' && !form.isActive);
    return (
      matchesSearch &&
      matchesStatus &&
      matchesDateFilter(form.updatedAt, editedFilter)
    );
  });

  const listItems: FormItemData[] = filtered.map((form) => ({
    id: form.formId,
    title: form.title,
    creatorLabel: getCreatorLabel(form, user?.uid),
    updatedAtString: formatDate(form.updatedAt),
    submissionCount: undefined,
    badgeNode: (
      <Badge
        variant={form.isActive ? 'default' : 'secondary'}
        className={`pointer-events-none shrink-0 ${
          form.isActive
            ? 'bg-green-600 text-white hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-700'
            : ''
        }`}
      >
        {form.isActive ? 'Published' : 'Draft'}
      </Badge>
    ),
    canEdit: true,
    canDelete: true,
    onClickTitle: () => navigate(`/form-builder/${form.formId}`),
    onClickInbox: () =>
      window.open(`/reviews/${form.formId}`, '_blank', 'noopener,noreferrer'),
    onClickPreview: () =>
      window.open(`/forms/${form.formId}/preview`, '_blank', 'noopener,noreferrer'),
    onClickRename: () => openRenameDialog(form.formId, form.title),
    onClickDelete: () => requestDelete(form.formId, form.title),
    onClickEdit: () => navigate(`/form-builder/${form.formId}`),
  }));

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <FormFilters
        query={query}
        onQueryChange={setQuery}
        placeholder="Search my forms..."
        layout={layout}
        onLayoutChange={setLayout}
        filterDropdowns={
          <>
            <Select
              value={statusFilter}
              onValueChange={(val) =>
                setStatusFilter(val as 'all' | 'published' | 'draft')
              }
            >
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={editedFilter}
              onValueChange={(val) =>
                setEditedFilter(val as 'all' | 'last7' | 'last30' | 'older')
              }
            >
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder="Edited Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="last30">Last 30 days</SelectItem>
                <SelectItem value="older">Older than 30 days</SelectItem>
              </SelectContent>
            </Select>
          </>
        }
      />

      {/* Content Area */}
      <FormListGrid
        items={listItems}
        layout={layout}
        emptyTitle="No forms found"
        emptyDescription={
          forms.length === 0
            ? 'You have not created any forms yet.'
            : 'Try adjusting your search or filters.'
        }
        listBadgeHeader="Status"
      />

      {/* Rename Form Dialog */}
      <Dialog
        open={renameDialog.isOpen}
        onOpenChange={(isOpen) =>
          setRenameDialog((prev) => ({ ...prev, isOpen }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitRename}>
            <DialogHeader>
              <DialogTitle>Rename form</DialogTitle>
              <DialogDescription>
                Enter a new name for your form.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Form name"
                autoFocus
                disabled={isRenaming}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setRenameDialog({
                    isOpen: false,
                    formId: '',
                    currentTitle: '',
                  })
                }
                disabled={isRenaming}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isRenaming || !newTitle.trim()}>
                {isRenaming ? 'Saving...' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Form Dialog */}
      <DeleteFormDialog
        formId={deleteDialog.formId}
        formName={deleteDialog.formTitle}
        open={deleteDialog.isOpen}
        onOpenChange={(isOpen) =>
          setDeleteDialog((prev) => ({ ...prev, isOpen }))
        }
        onSuccess={async () => {
          await onReload(); // Re-fetch forms after deletion
        }}
      />
    </div>
  );
}
