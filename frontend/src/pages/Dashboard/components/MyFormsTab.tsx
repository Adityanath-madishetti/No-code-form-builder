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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Icons
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  FileText,
  Inbox,
  ExternalLink,
  Pencil,
  Trash2,
} from 'lucide-react';

import type { FormHeader, LayoutMode } from '../dashboard.types';
import {
  formatDate,
  getCreatorLabel,
  matchesDateFilter,
} from '../dashboard.utils';
import { DeleteFormDialog } from '@/components/DeleteFormDialog';

const LIST_COLUMNS =
  'grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)_minmax(0,1fr)_120px]';

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
  const submitRename = async (e?: React.FormEvent) => {
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

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search my forms..."
            className="bg-background pl-9"
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
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

          <div className="ml-auto flex items-center rounded-md border bg-background p-0.5 sm:ml-2">
            <Button
              variant={layout === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setLayout('grid')}
              className="h-[26px] w-[26px]"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={layout === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setLayout('list')}
              className="h-[26px] w-[26px]"
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-background/50 py-24 text-center">
          <div className="mb-4 rounded-full bg-muted p-3">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">
            No forms found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {forms.length === 0
              ? 'You have not created any forms yet.'
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <>
          {layout === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((form) => (
                <Card
                  key={form.formId}
                  className="group flex flex-col transition-colors hover:border-primary/50"
                >
                  <CardHeader className="px-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-base font-semibold">
                          <button
                            onClick={() =>
                              navigate(`/form-builder/${form.formId}`)
                            }
                            className="hover:underline focus:outline-none"
                          >
                            {form.title}
                          </button>
                        </CardTitle>
                        <CardDescription className="mt-1.5 truncate text-xs">
                          {getCreatorLabel(form, user?.uid)}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={form.isActive ? 'default' : 'secondary'}
                        className={`pointer-events-none ${
                          form.isActive
                            ? 'bg-green-600 text-white hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-700'
                            : ''
                        }`}
                      >
                        {form.isActive ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="mt-auto px-4 pt-0 text-xs text-muted-foreground">
                    Edited {formatDate(form.updatedAt)}
                  </CardContent>
                  <CardFooter className="flex justify-end gap-1 border-t bg-muted/20 p-1">
                    <div className="flex items-center justify-end gap-1">
                      {/* Reviews / Inbox Tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              window.open(
                                `/reviews/${form.formId}`,
                                '_blank',
                                'noopener,noreferrer'
                              )
                            }
                          >
                            <Inbox className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Submissions</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Preview Tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              window.open(
                                `/forms/${form.formId}/preview`,
                                '_blank',
                                'noopener,noreferrer'
                              )
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Preview Form</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Rename Tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              openRenameDialog(form.formId, form.title)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Rename Form</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Delete Tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() =>
                              setDeleteDialog({
                                isOpen: true,
                                formId: form.formId,
                                formTitle: form.title,
                              })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Form</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden p-0">
              <div
                className={`grid ${LIST_COLUMNS} border-b bg-muted/50 px-4 py-3 text-xs font-medium tracking-wider text-muted-foreground uppercase`}
              >
                <span>Form Name</span>
                <span>Creator</span>
                <span>Last Edited</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>
              <div className="divide-y">
                {filtered.map((form) => (
                  <div
                    key={form.formId}
                    className={`grid ${LIST_COLUMNS} items-center px-4 py-2 transition-colors hover:bg-muted/30`}
                  >
                    <button
                      onClick={() => navigate(`/form-builder/${form.formId}`)}
                      className="truncate text-left text-sm font-medium hover:underline"
                    >
                      {form.title}
                    </button>
                    <span className="truncate text-sm text-muted-foreground">
                      {getCreatorLabel(form, user?.uid)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(form.updatedAt)}
                    </span>
                    <div>
                      <Badge
                        variant={form.isActive ? 'default' : 'secondary'}
                        className={`pointer-events-none ${
                          form.isActive
                            ? 'bg-green-600 text-white hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-700'
                            : ''
                        }`}
                      >
                        {form.isActive ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/reviews/${form.formId}`)}
                      >
                        <Inbox className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          navigate(`/forms/${form.formId}/preview`)
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() =>
                          openRenameDialog(form.formId, form.title)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

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
