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
  Filter,
  Plus,
  MoreHorizontal,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLogicStore } from '@/form/logic/logicStore';
import {
  ACTION_TYPE_LABELS,
  ACTION_TYPE_COLORS,
  RULE_TYPES,
  type RuleType,
} from '@/form/logic/logicTypes';
import { useFormStore } from '@/form/store/formStore';
import { DependencyGraph } from './DependencyGraph';

type RuleFilter = 'all' | RuleType | 'formula';
type RuleSort = 'updated_desc' | 'updated_asc' | 'name_asc' | 'name_desc';

type ContextMenuState =
  | {
      kind: 'rule' | 'formula';
      id: string;
      x: number;
      y: number;
    }
  | null;

const RULE_LABELS: Record<RuleType, string> = {
  field: 'Field',
  validation: 'Validation',
  navigation: 'Navigation',
};

export function LogicPanel() {
  const rules = useLogicStore((s) => s.rules);
  const formulas = useLogicStore((s) => s.formulas);
  const stacks = useLogicStore((s) => s.componentShuffleStacks);

  const activeRuleId = useLogicStore((s) => s.activeRuleId);
  const activeFormulaId = useLogicStore((s) => s.activeFormulaId);

  const addRule = useLogicStore((s) => s.addRule);
  const removeRule = useLogicStore((s) => s.removeRule);
  const duplicateRule = useLogicStore((s) => s.duplicateRule);
  const toggleRule = useLogicStore((s) => s.toggleRule);
  const setActiveRule = useLogicStore((s) => s.setActiveRule);
  const updateRule = useLogicStore((s) => s.updateRule);

  const addFormula = useLogicStore((s) => s.addFormula);
  const removeFormula = useLogicStore((s) => s.removeFormula);
  const setActiveFormula = useLogicStore((s) => s.setActiveFormula);

  const addStack = useLogicStore((s) => s.addComponentShuffleStack);
  const updateStack = useLogicStore((s) => s.updateComponentShuffleStack);
  const removeStack = useLogicStore((s) => s.removeComponentShuffleStack);

  const pages = useFormStore((s) => s.pages);
  const formPageIds = useFormStore((s) => s.form?.pages ?? []);
  const components = useFormStore((s) => s.components);

  const [showGraph, setShowGraph] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RuleFilter>('all');
  const [sort, setSort] = useState<RuleSort>('updated_desc');
  const [newRuleType, setNewRuleType] = useState<RuleType>('field');
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [contextMenu]);

  const filteredRules = useMemo(() => {
    const q = search.trim().toLowerCase();

    let out = [...rules];
    if (filter !== 'all' && filter !== 'formula') {
      out = out.filter((rule) => rule.ruleType === filter);
    }
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
          return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
        case 'updated_desc':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return out;
  }, [rules, filter, search, sort]);

  const filteredFormulas = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = [...formulas];
    if (filter !== 'all' && filter !== 'formula') return [];
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
  }, [formulas, filter, search, sort]);

  const hasContent = rules.length > 0 || formulas.length > 0;

  const pageOptions = formPageIds.map((pageId, idx) => ({
    pageId,
    label: pages[pageId]?.title || `Page ${idx + 1}`,
  }));

  return (
    <div className="relative flex h-full flex-col gap-3">
      <div className="grid grid-cols-2 gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[11px]"
          onClick={() => addRule(`New ${RULE_LABELS[newRuleType]} Rule`, newRuleType)}
        >
          <Zap className="mr-1 h-3 w-3" />
          Add Rule
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[11px]"
          onClick={() => addFormula()}
        >
          <Calculator className="mr-1 h-3 w-3" />
          Add Formula
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-1">
        <select
          value={newRuleType}
          onChange={(e) => setNewRuleType(e.target.value as RuleType)}
          className="col-span-1 h-5 border border-input bg-background px-1 text-[10px]"
        >
          {RULE_TYPES.map((type) => (
            <option key={type} value={type}>
              {RULE_LABELS[type]}
            </option>
          ))}
        </select>
        <div className="col-span-3 flex items-center gap-1 border border-input bg-background px-1.5">
          <Search className="h-2.5 w-2.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rule name..."
            className="h-5 w-full bg-transparent text-[10px] outline-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-start gap-1">
        <label className="flex w-[120px] items-center gap-1 border border-input bg-background px-1">
          <Filter className="h-2.5 w-2.5 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as RuleFilter)}
            className="h-5 w-full bg-transparent text-[10px] outline-none"
          >
            <option value="all">All Types</option>
            <option value="field">Field Rules</option>
            <option value="validation">Validation Rules</option>
            <option value="navigation">Navigation Rules</option>
            <option value="formula">Formulas</option>
          </select>
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as RuleSort)}
          className="h-5 w-[128px] border border-input bg-background px-1 text-[10px]"
        >
          <option value="updated_desc">Last Updated (newest)</option>
          <option value="updated_asc">Last Updated (oldest)</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
        </select>
      </div>

      {!hasContent && (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
          <Zap className="h-8 w-8 opacity-20" />
          <p className="text-xs font-medium">No logic rules yet</p>
          <p className="text-[10px] opacity-70">
            Create typed rules, formulas, and shuffle stacks.
          </p>
        </div>
      )}

      {filteredRules.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Rules ({filteredRules.length})
          </h4>
          <div className="space-y-1">
            {filteredRules.map((rule) => {
              const isActive = activeRuleId === rule.ruleId;
              return (
                <div
                  key={rule.ruleId}
                  onClick={() => setActiveRule(rule.ruleId)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      kind: 'rule',
                      id: rule.ruleId,
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
                  className={`group cursor-pointer rounded-md border px-2.5 py-1.5 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/30 hover:bg-muted/50'
                  } ${!rule.enabled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Zap
                      className={`h-3 w-3 shrink-0 ${
                        isActive ? 'text-amber-500' : 'text-muted-foreground'
                      }`}
                    />
                    <span className="flex-1 min-w-0 truncate text-xs font-medium">
                      {rule.name}
                    </span>
                    <span className="shrink-0 rounded bg-muted px-1 py-0 text-[9px]">
                      {RULE_LABELS[rule.ruleType]}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({
                          kind: 'rule',
                          id: rule.ruleId,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                      title="Rule actions"
                    >
                      <MoreHorizontal className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  <div className="mt-1 flex flex-wrap gap-1">
                    {rule.thenActions.slice(0, 3).map((action) => (
                      <span
                        key={action.id}
                        className={`rounded px-1 py-0 text-[9px] font-semibold ${ACTION_TYPE_COLORS[action.type]} bg-current/10`}
                        style={{ backgroundColor: 'transparent' }}
                      >
                        {ACTION_TYPE_LABELS[action.type]}
                      </span>
                    ))}
                    {rule.thenActions.length > 3 && (
                      <span className="text-[9px] text-muted-foreground">
                        +{rule.thenActions.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filteredFormulas.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Formulas ({filteredFormulas.length})
          </h4>
          <div className="space-y-1">
            {filteredFormulas.map((formula) => {
              const isActive = activeFormulaId === formula.ruleId;
              return (
                <div
                  key={formula.ruleId}
                  onClick={() => setActiveFormula(formula.ruleId)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      kind: 'formula',
                      id: formula.ruleId,
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
                  className={`group cursor-pointer rounded-md border px-2.5 py-1.5 transition-all ${
                    isActive
                      ? 'border-violet-500 bg-violet-500/5 shadow-sm'
                      : 'border-border hover:border-violet-500/30 hover:bg-muted/50'
                  } ${!formula.enabled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    <Calculator
                      className={`h-3 w-3 shrink-0 ${
                        isActive ? 'text-violet-500' : 'text-muted-foreground'
                      }`}
                    />
                    <span className="flex-1 min-w-0 truncate text-xs font-medium">
                      {formula.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setContextMenu({
                          kind: 'formula',
                          id: formula.ruleId,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                      title="Formula actions"
                    >
                      <MoreHorizontal className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  {formula.expression && (
                    <p className="mt-0.5 truncate text-[10px] font-mono text-muted-foreground">
                      {formula.expression}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-t border-border pt-2">
        <div className="mb-1 flex items-center justify-between">
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Component Shuffle Stacks ({stacks.length})
          </h4>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[10px]"
            onClick={() => addStack()}
          >
            <Plus className="mr-0.5 h-2.5 w-2.5" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {stacks.map((stack) => {
            const pageComponentIds = stack.pageId
              ? pages[stack.pageId]?.children || []
              : [];
            return (
              <div key={stack.stackId} className="rounded border border-border p-2">
                <div className="mb-1 flex items-center gap-1">
                  <input
                    value={stack.name}
                    onChange={(e) =>
                      updateStack(stack.stackId, { name: e.target.value })
                    }
                    className="h-6 flex-1 rounded border border-input bg-background px-1.5 text-[11px]"
                  />
                  <label className="flex items-center gap-1 text-[10px]">
                    <input
                      type="checkbox"
                      checked={stack.enabled}
                      onChange={(e) =>
                        updateStack(stack.stackId, { enabled: e.target.checked })
                      }
                    />
                    On
                  </label>
                  <button
                    onClick={() => removeStack(stack.stackId)}
                    className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                    title="Delete stack"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <select
                  value={stack.pageId}
                  onChange={(e) =>
                    updateStack(stack.stackId, { pageId: e.target.value, componentIds: [] })
                  }
                  className="mb-1 h-6 w-full rounded border border-input bg-background px-1.5 text-[11px]"
                >
                  <option value="">Select page...</option>
                  {pageOptions.map((page) => (
                    <option key={page.pageId} value={page.pageId}>
                      {page.label}
                    </option>
                  ))}
                </select>
                {stack.pageId && (
                  <div className="max-h-24 space-y-1 overflow-auto rounded border border-border p-1">
                    {pageComponentIds.map((componentId) => (
                      <label
                        key={componentId}
                        className="flex items-center gap-1 text-[10px]"
                      >
                        <input
                          type="checkbox"
                          checked={stack.componentIds.includes(componentId)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...stack.componentIds, componentId]
                              : stack.componentIds.filter((id) => id !== componentId);
                            updateStack(stack.stackId, { componentIds: next });
                          }}
                        />
                        {components[componentId]?.metadata.label || componentId}
                      </label>
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

      {hasContent && (
        <div className="border-t border-border pt-2">
          <button
            onClick={() => setShowGraph(!showGraph)}
            className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <GitBranch className="h-3 w-3" />
            <span className="flex-1 text-left">Dependency Graph</span>
            {showGraph ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
          {showGraph && (
            <div className="mt-1.5">
              <DependencyGraph />
            </div>
          )}
        </div>
      )}

      {contextMenu && (
        <div
          className="fixed z-[9999] min-w-[140px] rounded border border-border bg-popover p-1 shadow-md"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted"
            onClick={() => {
              if (contextMenu.kind === 'rule') setActiveRule(contextMenu.id);
              else setActiveFormula(contextMenu.id);
              setContextMenu(null);
            }}
          >
            <Search className="h-3 w-3" />
            Open
          </button>
          <button
            className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted"
            onClick={() => {
              const current =
                contextMenu.kind === 'rule'
                  ? rules.find((r) => r.ruleId === contextMenu.id)?.name
                  : formulas.find((f) => f.ruleId === contextMenu.id)?.name;
              const next = window.prompt('Rename', current || '');
              if (!next?.trim()) return;
              if (contextMenu.kind === 'rule') {
                updateRule(contextMenu.id, { name: next.trim() });
              } else {
                useLogicStore
                  .getState()
                  .updateFormula(contextMenu.id, { name: next.trim() });
              }
              setContextMenu(null);
            }}
          >
            <Copy className="h-3 w-3" />
            Rename
          </button>
          {contextMenu.kind === 'rule' && (
            <>
              <button
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted"
                onClick={() => {
                  toggleRule(contextMenu.id);
                  setContextMenu(null);
                }}
              >
                <Power className="h-3 w-3" />
                Toggle
              </button>
              <button
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-muted"
                onClick={() => {
                  duplicateRule(contextMenu.id);
                  setContextMenu(null);
                }}
              >
                <Copy className="h-3 w-3" />
                Duplicate
              </button>
            </>
          )}
          <button
            className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs text-destructive hover:bg-muted"
            onClick={() => {
              if (contextMenu.kind === 'rule') removeRule(contextMenu.id);
              else removeFormula(contextMenu.id);
              setContextMenu(null);
            }}
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
