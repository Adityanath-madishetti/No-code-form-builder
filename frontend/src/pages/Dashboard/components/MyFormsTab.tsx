import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Funnel,
  LayoutGrid,
  List,
  FileText,
  Inbox,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import type { FormHeader, LayoutMode } from '../dashboard.types';
import { formatDate, getCreatorLabel, matchesDateFilter } from '../dashboard.utils';

const LIST_COLUMNS =
  'grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.8fr)_100px]';

interface Props {
  forms: FormHeader[];
  onReload: () => Promise<void>;
}

export default function MyFormsTab({ forms, onReload }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [layout, setLayout] = useState<LayoutMode>('grid');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'published' | 'draft'
  >('all');
  const [editedFilter, setEditedFilter] = useState<
    'all' | 'last7' | 'last30' | 'older'
  >('all');

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
    <>
      <div className="mb-5 flex min-h-[1.75rem] items-center gap-1.5">
        <div className="relative max-w-xl min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 text-muted-foreground/70" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search my forms..."
            className="h-7 w-full rounded-full border border-border/70 bg-muted/20 py-0 pr-3 pl-8 text-xs outline-none focus:border-primary/60 focus:bg-background"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 rounded-full p-0"
            >
              <Funnel className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-3">
            <div className="space-y-3">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as React.SetStateAction<
                      'all' | 'published' | 'draft'
                    >
                  )
                }
                className="h-9 w-full border bg-background px-2 text-sm"
              >
                <option value="all">All status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <select
                value={editedFilter}
                onChange={(e) =>
                  setEditedFilter(
                    e.target.value as React.SetStateAction<
                      'all' | 'last7' | 'last30' | 'older'
                    >
                  )
                }
                className="h-9 w-full border bg-background px-2 text-sm"
              >
                <option value="all">All edited dates</option>
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
                <option value="older">Older than 30 days</option>
              </select>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="ml-auto inline-flex h-7 items-center border bg-muted/20 p-0.5">
          <Button
            size="sm"
            variant={layout === 'grid' ? 'secondary' : 'ghost'}
            onClick={() => setLayout('grid')}
            className="h-6 px-1.5"
          >
            <LayoutGrid className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant={layout === 'list' ? 'secondary' : 'ghost'}
            onClick={() => setLayout('list')}
            className="h-6 px-1.5"
          >
            <List className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-20 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {forms.length === 0
              ? 'No forms yet. Create one.'
              : 'No forms match your search.'}
          </p>
        </div>
      ) : (
        <div
          className={
            layout === 'grid'
              ? 'grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
              : 'flex flex-col'
          }
        >
          {layout === 'list' && (
            <div
              className={`mb-2 grid ${LIST_COLUMNS} px-3 text-[11px] font-medium text-muted-foreground uppercase`}
            >
              <span>Form</span>
              <span>Creator</span>
              <span>Last Edited</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
          )}
          {filtered.map((form) => (
            <div
              key={form.formId}
              className={`group border bg-neutral-50 hover:border-primary/40 dark:bg-neutral-900/70 ${layout === 'grid' ? 'flex aspect-[1.6/1] flex-col p-2.5' : `grid ${LIST_COLUMNS} items-center p-3`}`}
            >
              <button
                onClick={() => navigate(`/form-builder/${form.formId}`)}
                className={`text-left ${layout === 'grid' ? 'flex flex-col gap-1' : 'truncate font-medium'}`}
              >
                {layout === 'grid' ? (
                  <>
                    <h3 className="text-sm font-medium">{form.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {getCreatorLabel(form, user?.uid)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(form.updatedAt)}
                    </p>
                  </>
                ) : (
                  form.title
                )}
              </button>

              {layout === 'list' && (
                <>
                  <p className="truncate text-xs text-muted-foreground">
                    {getCreatorLabel(form, user?.uid)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(form.updatedAt)}
                  </p>
                </>
              )}

              <div className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${form.isActive ? 'bg-green-500' : 'bg-neutral-300'}`}
                />
                <span className="text-[10px] text-muted-foreground">
                  {form.isActive ? 'Published' : 'Draft'}
                </span>
              </div>

              <div
                className={
                  layout === 'grid'
                    ? 'mt-auto border-t pt-2'
                    : 'justify-self-end'
                }
              >
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => navigate(`/reviews/${form.formId}`)}
                  >
                    <Inbox className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => navigate(`/forms/${form.formId}/preview`)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => handleRename(form.formId, form.title)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
