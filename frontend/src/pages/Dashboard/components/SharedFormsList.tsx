import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Funnel, LayoutGrid, List, FileText, Inbox, ExternalLink, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SharedFormHeader, LayoutMode } from '../types';
import {
  formatDate,
  getCreatorLabel,
  matchesDateFilter,
  getSharedRoleLabel,
  canSharedUserEditForm,
} from '../utils';
import { useAuth } from '@/contexts/AuthContext';

const SHARED_FORMS_LIST_COLUMNS =
  'grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.8fr)]';

interface Props {
  sharedForms: SharedFormHeader[];
  onRenameForm: (formId: string, currentTitle: string) => void;
}

export default function SharedFormsList({ sharedForms, onRenameForm }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sharedFormsLayout, setSharedFormsLayout] = useState<LayoutMode>('grid');
  const [sharedFormsQuery, setSharedFormsQuery] = useState('');
  const [sharedRoleFilter, setSharedRoleFilter] = useState<'all' | 'editor' | 'reviewer'>('all');
  const [sharedEditedFilter, setSharedEditedFilter] = useState<'all' | 'last7' | 'last30' | 'older'>('all');
  const [activeSharedFormId, setActiveSharedFormId] = useState<string | null>(null);

  const normalizedSharedFormsQuery = sharedFormsQuery.trim().toLowerCase();

  const filteredSharedForms = sharedForms.filter((form) => {
    const matchesSearch =
      !normalizedSharedFormsQuery ||
      form.title.toLowerCase().includes(normalizedSharedFormsQuery) ||
      getCreatorLabel(form, user?.uid, 'Unknown').toLowerCase().includes(normalizedSharedFormsQuery);
    const roles = form.sharedRoles?.length ? form.sharedRoles : [form.sharedRole];
    const matchesRole = sharedRoleFilter === 'all' || roles.includes(sharedRoleFilter);
    const matchesEdited = matchesDateFilter(form.updatedAt, sharedEditedFilter);
    return matchesSearch && matchesRole && matchesEdited;
  });

  return (
    <>
      <div className="mb-5 flex min-h-[1.75rem] items-center gap-1.5">
        <div className="relative min-w-0 flex-1 max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 text-muted-foreground/70" />
          <input
            type="search"
            value={sharedFormsQuery}
            onChange={(e) => setSharedFormsQuery(e.target.value)}
            placeholder="Search shared forms..."
            className="h-7 w-full rounded-full border border-border/70 bg-muted/20 py-0 pr-3 pl-8 text-xs shadow-sm outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-background focus:shadow-md"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 shrink-0 rounded-full border-border/70 bg-muted/20 p-0 shadow-sm hover:bg-muted/30"
              aria-label="Filter shared forms"
              title="Filter"
            >
              <Funnel className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-3">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase">
                  Role
                </p>
                <select
                  value={sharedRoleFilter}
                  onChange={(e) =>
                    setSharedRoleFilter(e.target.value as 'all' | 'editor' | 'reviewer')
                  }
                  className="h-9 w-full border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All roles</option>
                  <option value="editor">Editor</option>
                  <option value="reviewer">Reviewer</option>
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase">
                  Last Edited
                </p>
                <select
                  value={sharedEditedFilter}
                  onChange={(e) =>
                    setSharedEditedFilter(
                      e.target.value as 'all' | 'last7' | 'last30' | 'older'
                    )
                  }
                  className="h-9 w-full border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All edited dates</option>
                  <option value="last7">Edited last 7 days</option>
                  <option value="last30">Edited last 30 days</option>
                  <option value="older">Edited over 30 days ago</option>
                </select>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="ml-auto inline-flex h-7 shrink-0 items-center gap-0.5 rounded-none border border-border/70 bg-muted/20 p-0.5 shadow-sm">
          <Button
            size="sm"
            variant={sharedFormsLayout === 'grid' ? 'secondary' : 'ghost'}
            onClick={() => setSharedFormsLayout('grid')}
            className="h-6 rounded-none px-1.5"
            aria-label="Shared forms grid view"
          >
            <LayoutGrid className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant={sharedFormsLayout === 'list' ? 'secondary' : 'ghost'}
            onClick={() => setSharedFormsLayout('list')}
            className="h-6 rounded-none px-1.5"
            aria-label="Shared forms list view"
          >
            <List className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {filteredSharedForms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-12 text-center">
          <FileText className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {sharedForms.length === 0
              ? 'No forms shared with you yet.'
              : 'No shared forms match your search.'}
          </p>
        </div>
      ) : (
        <>
          {sharedFormsLayout === 'list' && (
            <div
              className={`mb-2 grid ${SHARED_FORMS_LIST_COLUMNS} items-center gap-3 px-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase`}
            >
              <span>Form</span>
              <span>Creator</span>
              <span>Last Edited</span>
              <span>Role</span>
            </div>
          )}
          <div
            className={
              sharedFormsLayout === 'grid'
                ? 'grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col'
            }
          >
            {filteredSharedForms.map((form) => (
              <div
                key={form.formId}
                className={`border border-border bg-neutral-50 shadow-sm dark:bg-neutral-900/70 ${
                  sharedFormsLayout === 'grid'
                    ? 'h-full w-full p-2.5'
                    : `grid ${SHARED_FORMS_LIST_COLUMNS} items-center gap-3 p-3`
                }`}
                style={
                  sharedFormsLayout === 'grid' ? { aspectRatio: '1.6 / 1' } : undefined
                }
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setActiveSharedFormId((prev) =>
                      prev === form.formId ? null : form.formId
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveSharedFormId((prev) =>
                        prev === form.formId ? null : form.formId
                      );
                    }
                  }}
                  className={
                    sharedFormsLayout === 'grid'
                      ? 'cursor-pointer'
                      : 'cursor-pointer truncate text-sm font-medium'
                  }
                >
                  {sharedFormsLayout === 'grid' ? (
                    <>
                      <div className="flex w-full items-start justify-between">
                        <h3 className="text-sm font-medium">{form.title}</h3>
                        <span className="ml-2 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {getSharedRoleLabel(form)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {getCreatorLabel(form, user?.uid, 'Unknown')}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(form.updatedAt)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {form.submissionCount} submission
                        {form.submissionCount === 1 ? '' : 's'}
                      </p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Click to view actions
                      </p>
                    </>
                  ) : (
                    form.title
                  )}
                </div>

                {sharedFormsLayout === 'list' && (
                  <>
                    <p className="truncate text-xs text-muted-foreground">
                      {getCreatorLabel(form, user?.uid, 'Unknown')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(form.updatedAt)}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {getSharedRoleLabel(form)}
                    </span>
                  </>
                )}

                {activeSharedFormId === form.formId && (
                  <div
                    className={`space-y-2 border-t border-border pt-3 ${
                      sharedFormsLayout === 'grid' ? 'mt-3' : 'col-span-full mt-1'
                    }`}
                  >
                    {canSharedUserEditForm(form) && (
                      <Button
                        className="w-full rounded-none"
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/form-builder/${form.formId}`)}
                      >
                        Edit Form
                      </Button>
                    )}
                    <div className="flex items-center gap-1">
                      <div className="group/tip relative">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => navigate(`/reviews/${form.formId}`)}
                          aria-label="View Submissions"
                        >
                          <Inbox className="h-3.5 w-3.5" />
                        </Button>
                        <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 shadow transition-opacity group-hover/tip:opacity-100">Submissions</span>
                      </div>
                      <div className="group/tip relative">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => navigate(`/forms/${form.formId}/preview`)}
                          aria-label="Preview Form"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                        <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 shadow transition-opacity group-hover/tip:opacity-100">Preview</span>
                      </div>
                      {canSharedUserEditForm(form) && (
                        <div className="group/tip relative">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => void onRenameForm(form.formId, form.title)}
                            aria-label="Rename Form"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 shadow transition-opacity group-hover/tip:opacity-100">Rename</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
