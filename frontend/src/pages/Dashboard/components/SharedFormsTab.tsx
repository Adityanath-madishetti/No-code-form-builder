import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

// shadcn components
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { SharedFormHeader, LayoutMode } from '../dashboard.types';
import {
  formatDate,
  getCreatorLabel,
  matchesDateFilter,
} from '../dashboard.utils';

import { FormFilters } from './FormFilters';
import { FormListGrid, type FormItemData } from './FormListGrid';

interface Props {
  sharedForms: SharedFormHeader[];
  onReload: () => Promise<void>;
}

export default function SharedFormsTab({ sharedForms, onReload }: Props) {
  const navigate = useNavigate();
  const [layout, setLayout] = useState<LayoutMode>('grid');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'editor' | 'reviewer'>(
    'all'
  );
  const [editedFilter, setEditedFilter] = useState<
    'all' | 'last7' | 'last30' | 'older'
  >('all');

  const getSharedRoleLabel = (form: SharedFormHeader) => {
    const roles = form.sharedRoles?.length
      ? form.sharedRoles
      : [form.sharedRole];
    if (roles.includes('editor') && roles.includes('reviewer'))
      return 'Editor + Reviewer';
    if (roles.includes('editor')) return 'Editor';
    return 'Reviewer';
  };

  const canEdit = (form: SharedFormHeader) => {
    const roles = form.sharedRoles?.length
      ? form.sharedRoles
      : [form.sharedRole];
    return roles.includes('editor');
  };

  const handleRename = async (formId: string, currentTitle: string) => {
    const nextTitle = window.prompt('Rename form', currentTitle);
    if (!nextTitle) return;
    try {
      await api.patch(`/api/forms/${formId}`, { title: nextTitle });
      await onReload();
    } catch (err) {
      window.alert((err as Error).message || 'Failed to rename form');
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = sharedForms.filter((form) => {
    const matchesSearch =
      !normalizedQuery ||
      form.title.toLowerCase().includes(normalizedQuery) ||
      getCreatorLabel(form).toLowerCase().includes(normalizedQuery);

    const roles = form.sharedRoles?.length
      ? form.sharedRoles
      : [form.sharedRole];
    const matchesRole = roleFilter === 'all' || roles.includes(roleFilter);
    const matchesEdited = matchesDateFilter(form.updatedAt, editedFilter);

    return matchesSearch && matchesRole && matchesEdited;
  });

  const listItems: FormItemData[] = filtered.map((form) => ({
    id: form.formId,
    title: form.title,
    creatorLabel: getCreatorLabel(form),
    updatedAtString: formatDate(form.updatedAt),
    submissionCount: form.submissionCount,
    badgeNode: (
      <Badge
        variant={canEdit(form) ? 'default' : 'secondary'}
        className="pointer-events-none whitespace-nowrap"
      >
        {getSharedRoleLabel(form)}
      </Badge>
    ),
    canEdit: canEdit(form),
    canDelete: false, // User is not allowed to delete shared forms
    onClickTitle: () => navigate(
      canEdit(form) ? `/form-builder/${form.formId}` : `/reviews/${form.formId}`
    ),
    onClickEdit: () => navigate(`/form-builder/${form.formId}`),
    onClickInbox: () => navigate(`/reviews/${form.formId}`),
    onClickPreview: () => navigate(`/forms/${form.formId}/preview`),
    onClickRename: () => handleRename(form.formId, form.title),
  }));

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <FormFilters
        query={query}
        onQueryChange={setQuery}
        placeholder="Search shared forms..."
        layout={layout}
        onLayoutChange={setLayout}
        filterDropdowns={
          <>
            <Select
              value={roleFilter}
              onValueChange={(val) =>
                setRoleFilter(val as 'all' | 'editor' | 'reviewer')
              }
            >
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
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
        emptyTitle="No shared forms found"
        emptyDescription={
          sharedForms.length === 0
            ? 'No one has shared forms with you yet.'
            : 'Try adjusting your search or filters.'
        }
        listBadgeHeader="Role"
      />
    </div>
  );
}
