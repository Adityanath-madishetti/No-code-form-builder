import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  FormListGrid,
  type FormItemData,
} from '@/pages/Dashboard/components/FormListGrid';
import type {
  FormHeader,
  SharedFormHeader,
  LayoutMode,
} from '@/pages/Dashboard/dashboard.types';
import {
  getCreatorLabel,
  formatDate,
  matchesDateFilter,
} from '@/pages/Dashboard/dashboard.utils';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FormFilters } from '@/pages/Dashboard/components/FormFilters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function OpenFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Data state
  const [loading, setLoading] = useState(false);
  const [personalForms, setPersonalForms] = useState<FormHeader[]>([]);
  const [sharedForms, setSharedForms] = useState<SharedFormHeader[]>([]);

  // Filter & Layout state
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<LayoutMode>('grid');
  const [typeFilter, setTypeFilter] = useState<'all' | 'personal' | 'shared'>(
    'all'
  );
  const [editedFilter, setEditedFilter] = useState<
    'all' | 'last7' | 'last30' | 'older'
  >('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'published' | 'draft'
  >('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'editor' | 'reviewer'>(
    'all'
  );

  useEffect(() => {
    let isMounted = true;

    async function loadForms() {
      setLoading(true);
      try {
        const [res1, res2] = await Promise.all([
          api.get<{ forms: FormHeader[] }>('/api/forms'),
          api.get<{ forms: SharedFormHeader[] }>('/api/forms/shared'),
        ]);
        if (isMounted) {
          setPersonalForms(res1.forms || []);
          setSharedForms(res2.forms || []);
        }
      } catch (err) {
        if (isMounted) console.error('Failed to load forms', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (open) {
      loadForms();
    }

    return () => {
      isMounted = false;
    };
  }, [open]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredPersonal = personalForms.filter((f) => {
    if (typeFilter === 'shared') return false;
    const matchesSearch =
      !normalizedQuery ||
      f.title.toLowerCase().includes(normalizedQuery) ||
      getCreatorLabel(f, user?.uid).toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'published' && f.isActive) ||
      (statusFilter === 'draft' && !f.isActive);
    const matchesDate = matchesDateFilter(f.updatedAt, editedFilter);
    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredShared = sharedForms.filter((f) => {
    if (typeFilter === 'personal') return false;
    const matchesSearch =
      !normalizedQuery ||
      f.title.toLowerCase().includes(normalizedQuery) ||
      getCreatorLabel(f).toLowerCase().includes(normalizedQuery);
    const roles = f.sharedRoles?.length ? f.sharedRoles : [f.sharedRole];
    const matchesRole = roleFilter === 'all' || roles.includes(roleFilter);
    const matchesDate = matchesDateFilter(f.updatedAt, editedFilter);
    return matchesSearch && matchesRole && matchesDate;
  });

  // Transform into FormItemData
  const pItems: FormItemData[] = filteredPersonal.map((f) => ({
    id: f.formId,
    title: f.title,
    creatorLabel: getCreatorLabel(f, user?.uid),
    updatedAtString: formatDate(f.updatedAt),
    badgeNode: (
      <Badge
        variant={f.isActive ? 'default' : 'secondary'}
        className={`pointer-events-none shrink-0 ${f.isActive ? 'bg-green-600 text-white dark:bg-green-700' : ''}`}
      >
        {f.isActive ? 'Published' : 'Draft'}
      </Badge>
    ),
    canEdit: true,
    canDelete: false,
    onClickTitle: () => {
      onOpenChange(false);
      navigate(`/form-builder/${f.formId}`);
    },
    onClickEdit: () => {
      onOpenChange(false);
      navigate(`/form-builder/${f.formId}`);
    },
  }));

  const sItems: FormItemData[] = filteredShared.map((f) => {
    const roles = f.sharedRoles?.length ? f.sharedRoles : [f.sharedRole];
    const canEdit = roles.includes('editor');
    return {
      id: f.formId,
      title: f.title,
      creatorLabel: getCreatorLabel(f),
      updatedAtString: formatDate(f.updatedAt),
      badgeNode: (
        <Badge
          variant={canEdit ? 'default' : 'secondary'}
          className="pointer-events-none whitespace-nowrap"
        >
          {roles.includes('editor') && roles.includes('reviewer')
            ? 'Editor + Reviewer'
            : roles.includes('editor')
              ? 'Editor'
              : 'Reviewer'}
        </Badge>
      ),
      canEdit,
      canDelete: false,
      onClickTitle: () => {
        onOpenChange(false);
        navigate(
          canEdit ? `/form-builder/${f.formId}` : `/reviews/${f.formId}`
        );
      },
      onClickEdit: () => {
        onOpenChange(false);
        navigate(
          canEdit ? `/form-builder/${f.formId}` : `/reviews/${f.formId}`
        );
      },
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] flex-col gap-0 p-0 sm:max-w-5xl">
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle>Open Form</DialogTitle>
          <DialogDescription>
            Search and select a personal or shared form to open.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b bg-muted/20 px-6 py-4">
          <FormFilters
            query={query}
            onQueryChange={setQuery}
            placeholder="Search forms..."
            layout={layout}
            onLayoutChange={setLayout}
            filterDropdowns={
              <>
                <Select
                  value={typeFilter}
                  onValueChange={(val) =>
                    setTypeFilter(val as 'all' | 'personal' | 'shared')
                  }
                >
                  <SelectTrigger className="w-[130px] bg-background">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="personal">My Forms</SelectItem>
                    <SelectItem value="shared">Shared</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={editedFilter}
                  onValueChange={(val) =>
                    setEditedFilter(val as 'all' | 'last7' | 'last30' | 'older')
                  }
                >
                  <SelectTrigger className="w-[140px] bg-background">
                    <SelectValue placeholder="Edited Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Time</SelectItem>
                    <SelectItem value="last7">Last 7 days</SelectItem>
                    <SelectItem value="last30">Last 30 days</SelectItem>
                    <SelectItem value="older">Older</SelectItem>
                  </SelectContent>
                </Select>

                {typeFilter === 'personal' && (
                  <Select
                    value={statusFilter}
                    onValueChange={(val) =>
                      setStatusFilter(val as 'all' | 'published' | 'draft')
                    }
                  >
                    <SelectTrigger className="w-[130px] bg-background">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                {typeFilter === 'shared' && (
                  <Select
                    value={roleFilter}
                    onValueChange={(val) =>
                      setRoleFilter(val as 'all' | 'editor' | 'reviewer')
                    }
                  >
                    <SelectTrigger className="w-[130px] bg-background">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="reviewer">Reviewer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </>
            }
          />
        </div>

        <ScrollArea className="flex-1 overflow-hidden bg-muted/10">
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-8">
                {typeFilter !== 'shared' && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold tracking-tight">
                      My Forms
                    </h3>
                    <FormListGrid
                      items={pItems}
                      layout={layout}
                      emptyTitle="No forms found"
                      emptyDescription={
                        query
                          ? 'No personal forms match your search.'
                          : 'You have not created any forms.'
                      }
                      listBadgeHeader="Status"
                    />
                  </div>
                )}
                {typeFilter !== 'personal' && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold tracking-tight">
                      Shared with me
                    </h3>
                    <FormListGrid
                      items={sItems}
                      layout={layout}
                      emptyTitle="No shared forms"
                      emptyDescription={
                        query
                          ? 'No shared forms match your search.'
                          : 'No forms are shared with you.'
                      }
                      listBadgeHeader="Role"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
