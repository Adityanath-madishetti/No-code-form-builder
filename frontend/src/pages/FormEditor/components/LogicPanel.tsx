// src/pages/FormEditor/components/LogicPanel
import {
  Zap,
  Calculator,
  Trash2,
  Copy,
  Power,
  GitBranch,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { nanoid } from 'nanoid';

// --- shadcn/ui imports ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// --- Store & Type imports ---
import { useLogicStore } from '@/form/logic/logic.store';
import {
  ACTION_TYPE_LABELS,
  ACTION_TYPE_COLORS,
} from '@/form/logic/logicTypes';
import { useFormStore } from '@/form/store/form.store';
import { DependencyGraph } from './DependencyGraph';

type RuleSort = 'updated_desc' | 'updated_asc' | 'name_asc' | 'name_desc';

export function LogicPanel() {
  const rules = useLogicStore((s) => s.rules);
  const formulas = useLogicStore((s) => s.formulas);
  const stacks = useLogicStore((s) => s.componentShuffleStacks);

  const addRule = useLogicStore((s) => s.addRule);
  const removeRule = useLogicStore((s) => s.removeRule);
  const duplicateRule = useLogicStore((s) => s.duplicateRule);
  const toggleRule = useLogicStore((s) => s.toggleRule);
  const updateRule = useLogicStore((s) => s.updateRule);

  const addFormula = useLogicStore((s) => s.addFormula);
  const removeFormula = useLogicStore((s) => s.removeFormula);
  const updateFormula = useLogicStore((s) => s.updateFormula);

  const openPopoutRule = useLogicStore((s) => s.openPopoutRule);

  const addStack = useLogicStore((s) => s.addComponentShuffleStack);
  const updateStack = useLogicStore((s) => s.updateComponentShuffleStack);
  const removeStack = useLogicStore((s) => s.removeComponentShuffleStack);

  const pages = useFormStore((s) => s.pages);
  const formPageIds = useFormStore((s) => s.form?.pages ?? []);
  const components = useFormStore((s) => s.components);

  const [showGraph, setShowGraph] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<RuleSort>('updated_desc');

  const filteredRules = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = [...rules];

    if (q) {
      out = out.filter((rule) => rule.name.toLowerCase().includes(q));
    }

    out.sort((a, b) => {
      switch (sort) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'updated_asc':
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );
        case 'updated_desc':
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });

    return out;
  }, [rules, search, sort]);

  const filteredFormulas = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = [...formulas];

    if (q) {
      out = out.filter((formula) => formula.name.toLowerCase().includes(q));
    }

    out.sort((a, b) => {
      switch (sort) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'updated_asc':
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          );
        case 'updated_desc':
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });
    return out;
  }, [formulas, search, sort]);

  const hasContent = rules.length > 0 || formulas.length > 0;
  const pageOptions = formPageIds.map((pageId, idx) => ({
    pageId,
    label: pages[pageId]?.title || `Page ${idx + 1}`,
  }));

  const handleRename = (
    id: string,
    currentName: string,
    type: 'rule' | 'formula'
  ) => {
    const next = window.prompt('Rename', currentName);
    if (!next?.trim()) return;
    if (type === 'rule') {
      updateRule(id, { name: next.trim() });
    } else {
      updateFormula(id, { name: next.trim() });
    }
  };

  return (
    <div className="relative flex h-full flex-col gap-3 p-4">
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => addRule(`New Rule ${nanoid(12)}`, 'field')}
        >
          <Zap className="mr-1 h-3.5 w-3.5" />
          Add Rule
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => addFormula()}
        >
          <Calculator className="mr-1 h-3.5 w-3.5" />
          Add Formula
        </Button>
      </div>

      {/* Search and Sort */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-2 left-2 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules..."
            className="h-7 pl-6 text-[10px]"
          />
        </div>

        <Select value={sort} onValueChange={(v) => setSort(v as RuleSort)}>
          <SelectTrigger className="h-7 w-[140px] text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_desc" className="text-[10px]">
              Updated (Newest)
            </SelectItem>
            <SelectItem value="updated_asc" className="text-[10px]">
              Updated (Oldest)
            </SelectItem>
            <SelectItem value="name_asc" className="text-[10px]">
              Name (A-Z)
            </SelectItem>
            <SelectItem value="name_desc" className="text-[10px]">
              Name (Z-A)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!hasContent && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
          <Zap className="h-8 w-8 opacity-20" />
          <p className="text-xs font-medium">No logic rules yet</p>
          <p className="text-[10px] opacity-70">
            Create rules, formulas, and shuffle stacks.
          </p>
        </div>
      )}

      {/* Rules List */}
      {filteredRules.length > 0 && (
        <div>
          <h4 className="mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Rules ({filteredRules.length})
          </h4>
          <div className="space-y-1.5">
            {filteredRules.map((rule) => {
              const ActionMenu = (
                <>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(rule.ruleId, rule.name, 'rule');
                    }}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRule(rule.ruleId);
                    }}
                  >
                    <Power className="mr-2 h-3.5 w-3.5" /> Toggle
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateRule(rule.ruleId);
                    }}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRule(rule.ruleId);
                    }}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </>
              );

              return (
                <ContextMenu key={rule.ruleId}>
                  <ContextMenuTrigger asChild>
                    <div
                      onClick={() => {
                        window.open(
                          '',
                          `logic_portal_${rule.ruleId}`,
                          'width=800,height=600,left=200,top=200'
                        );
                        openPopoutRule(rule.ruleId);
                      }}
                      className={`group cursor-pointer rounded-md border px-2.5 py-2 transition-all ${!rule.enabled ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <Zap
                          className={`h-3.5 w-3.5 shrink-0 text-amber-500`}
                        />
                        <span className="min-w-0 flex-1 truncate text-xs font-medium">
                          {rule.name}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 shrink-0"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            {ActionMenu}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {rule.thenActions.slice(0, 3).map((action) => (
                          <Badge
                            key={action.id}
                            variant="outline"
                            className={`bg-transparent px-1 py-0 text-[9px] font-semibold ${ACTION_TYPE_COLORS[action.type]}`}
                          >
                            {ACTION_TYPE_LABELS[action.type]}
                          </Badge>
                        ))}
                        {rule.thenActions.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">
                            +{rule.thenActions.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-36">
                    <ContextMenuItem
                      onClick={() => {
                        window.open(
                          '',
                          `logic_portal_${rule.ruleId}`,
                          'width=800,height=600,left=200,top=200'
                        );
                        openPopoutRule(rule.ruleId);
                      }}
                    >
                      <Search className="mr-2 h-3.5 w-3.5" /> Open
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() =>
                        handleRename(rule.ruleId, rule.name, 'rule')
                      }
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" /> Rename
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => toggleRule(rule.ruleId)}>
                      <Power className="mr-2 h-3.5 w-3.5" /> Toggle
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => duplicateRule(rule.ruleId)}>
                      <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => removeRule(rule.ruleId)}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        </div>
      )}

      {/* Formulas List */}
      {filteredFormulas.length > 0 && (
        <div>
          <h4 className="mt-2 mb-2 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Formulas ({filteredFormulas.length})
          </h4>
          <div className="space-y-1.5">
            {filteredFormulas.map((formula) => {
              const ActionMenu = (
                <>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        '',
                        `logic_portal_${formula.ruleId}`,
                        'width=800,height=600,left=200,top=200'
                      );
                      openPopoutRule(formula.ruleId);
                    }}
                  >
                    <Search className="mr-2 h-3.5 w-3.5" /> Open
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRename(formula.ruleId, formula.name, 'formula');
                    }}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" /> Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFormula(formula.ruleId);
                    }}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </>
              );

              return (
                <ContextMenu key={formula.ruleId}>
                  <ContextMenuTrigger asChild>
                    <div
                      onClick={() => {
                        window.open(
                          '',
                          `logic_portal_${formula.ruleId}`,
                          'width=800,height=600,left=200,top=200'
                        );
                        openPopoutRule(formula.ruleId);
                      }}
                      className={`group cursor-pointer rounded-md border px-2.5 py-2 transition-all ${!formula.enabled ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <Calculator
                          className={`h-3.5 w-3.5 shrink-0 text-violet-500`}
                        />
                        <span className="min-w-0 flex-1 truncate text-xs font-medium">
                          {formula.name}
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 shrink-0"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            {ActionMenu}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {formula.expression && (
                        <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                          {formula.expression}
                        </p>
                      )}
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-36">
                    <ContextMenuItem
                      onClick={() =>
                        handleRename(formula.ruleId, formula.name, 'formula')
                      }
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" /> Rename
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => removeFormula(formula.ruleId)}
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              );
            })}
          </div>
        </div>
      )}

      {/* Component Shuffle Stacks */}
      <div className="pt-2">
        <Separator className="mb-3" />
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
            Shuffle Stacks ({stacks.length})
          </h4>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px]"
            onClick={() => addStack()}
          >
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        </div>
        <div className="space-y-3">
          {stacks.map((stack) => {
            const pageComponentIds = stack.pageId
              ? pages[stack.pageId]?.children || []
              : [];
            return (
              <div
                key={stack.stackId}
                className="rounded-md border bg-card p-2"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Input
                    value={stack.name}
                    onChange={(e) =>
                      updateStack(stack.stackId, { name: e.target.value })
                    }
                    className="h-6 flex-1 text-[11px]"
                  />
                  <div className="flex items-center space-x-1.5">
                    <Checkbox
                      id={`stack-${stack.stackId}`}
                      checked={stack.enabled}
                      onCheckedChange={(checked) =>
                        updateStack(stack.stackId, { enabled: !!checked })
                      }
                    />
                    <label
                      htmlFor={`stack-${stack.stackId}`}
                      className="text-[10px] leading-none font-medium"
                    >
                      On
                    </label>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeStack(stack.stackId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <Select
                  value={stack.pageId}
                  onValueChange={(v) =>
                    updateStack(stack.stackId, { pageId: v, componentIds: [] })
                  }
                >
                  <SelectTrigger className="mb-2 h-6 text-[10px]">
                    <SelectValue placeholder="Select page..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pageOptions.map((page) => (
                      <SelectItem
                        key={page.pageId}
                        value={page.pageId}
                        className="text-[10px]"
                      >
                        {page.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {stack.pageId && (
                  <div className="max-h-24 space-y-1.5 overflow-auto rounded-md border border-input bg-background p-2">
                    {pageComponentIds.map((componentId) => (
                      <div
                        key={componentId}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`comp-${stack.stackId}-${componentId}`}
                          checked={stack.componentIds.includes(componentId)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...stack.componentIds, componentId]
                              : stack.componentIds.filter(
                                  (id) => id !== componentId
                                );
                            updateStack(stack.stackId, { componentIds: next });
                          }}
                        />
                        <label
                          htmlFor={`comp-${stack.stackId}-${componentId}`}
                          className="text-[10px] font-medium"
                        >
                          {components[componentId]?.metadata.label ||
                            componentId}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {stacks.length === 0 && (
            <p className="text-[10px] text-muted-foreground">
              Create stacks to shuffle component order within a page.
            </p>
          )}
        </div>
      </div>

      {/* Dependency Graph */}
      {hasContent && (
        <div className="pt-2">
          <Separator className="mb-2" />
          <Collapsible
            open={showGraph}
            onOpenChange={setShowGraph}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-7 w-full items-center justify-between px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <div className="flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5" />
                  Dependency Graph
                </div>
                {showGraph ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-md border bg-card p-2">
              <DependencyGraph />
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}
