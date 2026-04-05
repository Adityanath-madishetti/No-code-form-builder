import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Funnel, LayoutGrid, List, FileText, Inbox, ExternalLink, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FormHeader, LayoutMode } from '../types';
import { formatDate, getCreatorLabel, matchesDateFilter } from '../utils';
import { useAuth } from '@/contexts/AuthContext';

const MY_FORMS_LIST_COLUMNS =
  'grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.8fr)_100px]';

interface Props {
  forms: FormHeader[];
  onRenameForm: (formId: string, currentTitle: string) => void;
}

export default function MyFormsList({ forms, onRenameForm }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myFormsLayout, setMyFormsLayout] = useState<LayoutMode>('grid');
  const [myFormsQuery, setMyFormsQuery] = useState('');
  const [myFormsStatusFilter, setMyFormsStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [myFormsEditedFilter, setMyFormsEditedFilter] = useState<'all' | 'last7' | 'last30' | 'older'>('all');

  const normalizedMyFormsQuery = myFormsQuery.trim().toLowerCase();

  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      !normalizedMyFormsQuery ||
      form.title.toLowerCase().includes(normalizedMyFormsQuery) ||
      getCreatorLabel(form, user?.uid, 'Unknown').toLowerCase().includes(normalizedMyFormsQuery);
    const matchesStatus =
      myFormsStatusFilter === 'all' ||
      (myFormsStatusFilter === 'published' && form.isActive) ||
      (myFormsStatusFilter === 'draft' && !form.isActive);
    const matchesEdited = matchesDateFilter(form.updatedAt, myFormsEditedFilter);
    return matchesSearch && matchesStatus && matchesEdited;
  });

  return (
    <>
      <div className="mb-5 flex min-h-[1.75rem] items-center gap-1.5">
        <div className="relative min-w-0 flex-1 max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3 w-3 -translate-y-1/2 text-muted-foreground/70" />
          <input
            type="search"
            value={myFormsQuery}
            onChange={(e) => setMyFormsQuery(e.target.value)}
            placeholder="Search my forms..."
            className="h-7 w-full rounded-full border border-border/70 bg-muted/20 py-0 pr-3 pl-8 text-xs shadow-sm outline-none transition-all placeholder:text-muted-foreground/70 focus:border-primary/60 focus:bg-background focus:shadow-md"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 shrink-0 rounded-full border-border/70 bg-muted/20 p-0 shadow-sm hover:bg-muted/30"
              aria-label="Filter my forms"
              title="Filter"
            >
              <Funnel className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 p-3">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase">
                  Status
                </p>
                <select
                  value={myFormsStatusFilter}
                  onChange={(e) =>
                    setMyFormsStatusFilter(
                      e.target.value as 'all' | 'published' | 'draft'
                    )
                  }
                  className="h-9 w-full border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                >
                  <option value="all">All status</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground uppercase">
                  Last Edited
                </p>
                <select
                  value={myFormsEditedFilter}
                  onChange={(e) =>
                    setMyFormsEditedFilter(
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
            variant={myFormsLayout === 'grid' ? 'secondary' : 'ghost'}
            onClick={() => setMyFormsLayout('grid')}
            className="h-6 rounded-none px-1.5"
            aria-label="My forms grid view"
          >
            <LayoutGrid className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant={myFormsLayout === 'list' ? 'secondary' : 'ghost'}
            onClick={() => setMyFormsLayout('list')}
            className="h-6 rounded-none px-1.5"
            aria-label="My forms list view"
          >
            <List className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {filteredForms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-20 text-center">
          <FileText className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {forms.length === 0
              ? 'No forms yet. Create your first one from Blank template.'
              : 'No forms match your search.'}
          </p>
        </div>
      ) : (
        <>
          {myFormsLayout === 'list' && (
            <div
              className={`mb-2 grid ${MY_FORMS_LIST_COLUMNS} items-center gap-3 px-3 text-[11px] font-medium tracking-wide text-muted-foreground uppercase`}
            >
              <span>Form</span>
              <span>Creator</span>
              <span>Last Edited</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
          )}
          <div
            className={
              myFormsLayout === 'grid'
                ? 'grid gap-10 sm:grid-cols-2 lg:grid-cols-3'
                : 'flex flex-col'
            }
          >
            {filteredForms.map((form) => (
              <div
                key={form.formId}
                className={`group border border-border bg-neutral-50 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg dark:bg-neutral-900/70 ${
                  myFormsLayout === 'grid'
                    ? 'flex h-full w-full flex-col gap-1 p-2.5'
                    : `grid ${MY_FORMS_LIST_COLUMNS} items-center gap-3 p-3`
                }`}
                style={myFormsLayout === 'grid' ? { aspectRatio: '1.6 / 1' } : undefined}
              >
                <button
                  onClick={() => navigate(`/form-builder/${form.formId}`)}
                  className={`text-left ${
                    myFormsLayout === 'grid'
                      ? 'flex flex-col items-start gap-1'
                      : 'truncate text-sm font-medium transition-colors group-hover:text-primary'
                  }`}
                >
                  {myFormsLayout === 'grid' ? (
                    <>
                      <h3 className="text-sm font-medium transition-colors group-hover:text-primary">
                        {form.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {getCreatorLabel(form, user?.uid, 'Unknown')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(form.updatedAt)}
                      </p>
                    </>
                  ) : (
                    form.title
                  )}
                </button>

                {myFormsLayout === 'list' ? (
                  <>
                    <p className="truncate text-xs text-muted-foreground">
                      {getCreatorLabel(form, user?.uid, 'Unknown')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(form.updatedAt)}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          form.isActive ? 'bg-green-500' : 'bg-neutral-300'
                        }`}
                      />
                      {form.isActive ? 'Published' : 'Draft'}
                    </span>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        form.isActive ? 'bg-green-500' : 'bg-neutral-300'
                      }`}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {form.isActive ? 'Published' : 'Draft'}
                    </span>
                  </div>
                )}

                <div
                  className={
                    myFormsLayout === 'grid'
                      ? 'mt-auto border-t border-border pt-2'
                      : 'justify-self-end'
                  }
                >
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
