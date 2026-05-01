import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useEffect } from 'react';
import {
  fetchFormTemplates,
  createFormFromTemplate,
  type FormTemplateData,
} from '@/lib/formTemplateApi';
import { toast } from 'sonner';

// shadcn components
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

// Icons
import { Plus, Loader2, MoreHorizontal, Search, X } from 'lucide-react';
import type { FormHeader } from '../dashboard.types';

// ─── Main Section ─────────────────────────────────────────────────────────────

export default function TemplatesSection() {
  const navigate = useNavigate();
  const [creatingBlank, setCreatingBlank] = useState(false);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(
    null
  );
  const [templates, setTemplates] = useState<FormTemplateData[]>([]);
  const [allTemplatesOpen, setAllTemplatesOpen] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const handleCreate = async () => {
    if (creatingBlank || creatingTemplateId) return;
    setCreatingBlank(true);
    try {
      const res = await api.post<{ form: FormHeader }>('/api/forms', {
        title: 'Untitled Form',
      });
      navigate(`/form-builder/${res.form.formId}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create a blank form');
    } finally {
      setCreatingBlank(false);
    }
  };

  const handleCreateFromTemplate = async (templateId: string) => {
    if (creatingBlank || creatingTemplateId) return;
    setCreatingTemplateId(templateId);
    try {
      const { formId } = await createFormFromTemplate(templateId);
      navigate(`/form-builder/${formId}`);
      return formId;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.message || 'Failed to open template');
      return null;
    } finally {
      setCreatingTemplateId(null);
    }
  };

  const loadTemplates = () => {
    setLoadingTemplates(true);
    setFetchError(false);
    fetchFormTemplates()
      .then((rows) => setTemplates(rows))
      .catch((err) => {
        console.error('Error fetching templates:', err);
        toast.error('Failed to load templates');
        setFetchError(true);
        setTemplates([]);
      })
      .finally(() => setLoadingTemplates(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTemplates();
  }, []);

  const quickTemplates = templates.slice(0, 1);

  return (
    <div className="space-y-4">
      <div className="pl-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Create From Template
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Start quickly using available templates or a blank slate.
        </p>
      </div>

      <div className="grid gap-4 pl-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Blank Form */}
        <Card
          className="group relative flex flex-col overflow-hidden transition-all hover:border-primary/50"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleCreate();
            }
          }}
        >
          <CardHeader className="px-4">
            <div>
              <CardTitle className="text-base font-semibold">
                Blank Form
              </CardTitle>
              <CardDescription className="mt-0 text-xs">
                Start from scratch.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex-1 px-4 text-xs text-muted-foreground">
            <div className="rounded-md bg-muted/30 italic">
              Preview: Opens an empty workspace with one untitled page, ready
              for your custom components.
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 p-3">
            <div className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground transition-colors">
              <span>
                {creatingBlank ? 'Initializing builder...' : 'Use Template'}
              </span>
              {creatingBlank ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Plus
                  className="h-4 w-4 cursor-pointer hover:text-foreground"
                  onClick={handleCreate}
                />
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Quick templates (first one) */}
        {loadingTemplates ? (
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="px-4">
              <Skeleton className="mb-1 h-5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent className="flex-1 px-4">
              <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-muted/20 p-3">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-4" />
            </CardFooter>
          </Card>
        ) : fetchError ? (
          <Card className="flex h-full flex-col items-center justify-center border-dashed p-4 text-center text-muted-foreground">
            <span className="text-sm">Could not load templates.</span>
            <Button variant="link" size="sm" onClick={loadTemplates}>
              Retry
            </Button>
          </Card>
        ) : (
          quickTemplates.map((template) => {
            const isCreatingThis = creatingTemplateId === template.templateId;
            return (
              <Card
                key={template.templateId}
                className="group relative flex flex-col overflow-hidden transition-all hover:border-primary/50"
                role="button"
                tabIndex={0}
                onClick={() => handleCreateFromTemplate(template.templateId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    void handleCreateFromTemplate(template.templateId);
                  }
                }}
              >
                <CardHeader className="px-4">
                  <div>
                    <CardTitle className="text-base font-semibold">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="mt-0 text-xs">
                      {template.description || 'Saved template'}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 px-4 text-xs text-muted-foreground">
                  <div className="rounded-md bg-muted/30 italic">
                    {template.snapshot?.pages?.length || 0} page template ready
                    to use.
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/20 p-3">
                  <div className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground transition-colors">
                    <span>
                      {isCreatingThis ? 'Opening template...' : 'Use Template'}
                    </span>
                    {isCreatingThis ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Plus className="h-4 w-4 cursor-pointer hover:text-foreground" />
                    )}
                  </div>
                </CardFooter>
              </Card>
            );
          })
        )}

        {/* More Templates card */}
        <Card
          className="group relative flex flex-col overflow-hidden transition-all hover:cursor-pointer hover:border-primary/50"
          role="button"
          tabIndex={0}
          onClick={() => setAllTemplatesOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setAllTemplatesOpen(true);
            }
          }}
        >
          <CardHeader className="px-4">
            <div>
              <CardTitle className="text-base font-semibold">
                More Templates
              </CardTitle>
              <CardDescription className="mt-0 text-xs">
                Browse all available templates.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 items-center justify-center px-4 text-muted-foreground" />
          <CardFooter className="border-t bg-muted/20 p-3">
            <div className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground transition-colors">
              <span>View all templates</span>
              <MoreHorizontal className="h-4 w-4" />
            </div>
          </CardFooter>
        </Card>
      </div>

      <AllTemplatesDialog
        open={allTemplatesOpen}
        onOpenChange={setAllTemplatesOpen}
        templates={templates}
        loading={loadingTemplates}
        error={fetchError}
        creatingTemplateId={creatingTemplateId}
        onUse={async (templateId) => {
          const formId = await handleCreateFromTemplate(templateId);
          if (formId) setAllTemplatesOpen(false);
        }}
      />
    </div>
  );
}

// ─── All Templates Dialog ─────────────────────────────────────────────────────

type FilterTab = 'all' | 'mine' | 'shared';
type SortKey = 'newest' | 'oldest' | 'name-asc' | 'name-desc';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mine', label: 'Mine' },
  { value: 'shared', label: 'Shared' },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
];

export interface AllTemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: FormTemplateData[];
  loading?: boolean;
  error?: boolean;
  creatingTemplateId: string | null;
  onUse: (templateId: string) => void;
}

export function AllTemplatesDialog({
  open,
  onOpenChange,
  templates,
  loading,
  error,
  creatingTemplateId,
  onUse,
}: AllTemplatesDialogProps) {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sortKey, setSortKey] = useState<SortKey>('newest');

  const currentUid =
    typeof window !== 'undefined' ? (localStorage.getItem('uid') ?? '') : '';

  const filtered = templates
    .filter((t) => {
      const q = search.trim().toLowerCase();
      if (
        q &&
        !t.name.toLowerCase().includes(q) &&
        !(t.description ?? '').toLowerCase().includes(q)
      )
        return false;
      if (filterTab === 'mine')
        return !!(currentUid && t.createdBy === currentUid);
      if (filterTab === 'shared')
        return t.isPublic || (!!currentUid && t.createdBy !== currentUid);
      return true;
    })
    .sort((a, b) => {
      if (sortKey === 'name-asc') return a.name.localeCompare(b.name);
      if (sortKey === 'name-desc') return b.name.localeCompare(a.name);
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortKey === 'newest' ? db - da : da - db;
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] flex-col gap-0 p-0 sm:max-w-4xl">
        {/* ── Header ── */}
        <DialogHeader className="border-b px-6 pt-6 pb-4">
          <DialogTitle>All Templates</DialogTitle>
          <DialogDescription className="sr-only">
            Browse, search, and filter your form templates.
          </DialogDescription>
        </DialogHeader>

        {/* ── Toolbar ── */}
        <div className="flex flex-col gap-3 border-b bg-muted/20 px-6 py-3">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pr-8 pl-8 text-sm"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Filter tabs + Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter tabs */}
            {/* Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs whitespace-nowrap text-muted-foreground">
                Filter:
              </span>
              <Select
                value={filterTab}
                onValueChange={(v) => setFilterTab(v as FilterTab)}
              >
                <SelectTrigger className="h-7 w-[100px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_TABS.map((tab) => (
                    <SelectItem
                      key={tab.value}
                      value={tab.value}
                      className="text-xs"
                    >
                      {tab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs whitespace-nowrap text-muted-foreground">
                Sort:
              </span>
              <Select
                value={sortKey}
                onValueChange={(v) => setSortKey(v as SortKey)}
              >
                <SelectTrigger className="h-7 w-[110px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Result count */}
          <p className="text-xs text-muted-foreground">
            {filtered.length === 0
              ? 'No templates match your filters'
              : `${filtered.length} template${filtered.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* ── Template list ── */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="grid grid-cols-1 gap-3 px-6 py-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-[120px] flex-col justify-between rounded-md border p-4"
                >
                  <div>
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                  <div className="flex items-end justify-between">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="col-span-full rounded-md border border-dashed py-10 text-center text-sm text-destructive">
                Failed to load templates. Please try again later.
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                {search
                  ? `No templates found for "${search}"`
                  : filterTab === 'mine'
                    ? 'You have no personal templates yet.'
                    : filterTab === 'shared'
                      ? 'No shared templates available.'
                      : 'No templates available yet.'}
              </div>
            ) : (
              filtered.map((template) => {
                const isCreatingThis =
                  creatingTemplateId === template.templateId;
                const pageCount = template.snapshot?.pages?.length ?? 0;
                return (
                  <Button
                    key={template.templateId}
                    variant="outline"
                    disabled={!!creatingTemplateId}
                    onClick={() => onUse(template.templateId)}
                    className="h-auto flex-col items-start justify-between gap-2 p-4 text-left font-normal hover:border-primary/50 hover:bg-muted/30"
                  >
                    {/* Top: name + badge */}
                    <div className="w-full">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-medium">
                          {template.name}
                        </span>
                        {template.isPublic && (
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 text-[10px] font-medium"
                          >
                            shared
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {template.description || 'No description'}
                      </p>
                    </div>
                    {/* Bottom: meta + action icon */}
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
                        {pageCount > 0 && (
                          <span>
                            {pageCount} page{pageCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {template.createdAt && (
                          <>
                            {pageCount > 0 && <span>·</span>}
                            <span>
                              {new Date(
                                template.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                      {isCreatingThis ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                  </Button>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* ── Footer ── */}
        <div className="flex justify-end border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
