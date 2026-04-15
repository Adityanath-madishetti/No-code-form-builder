// src/pages/FormEditor/ComponentsLogicPanel
import {
  Zap,
  Calculator,
  Trash2,
  Search,
  MoreHorizontal,
  ArrowRightCircle,
  PlayCircle,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { nanoid } from 'nanoid';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Store & Types
import { useLogicStore } from '@/form/logic/logic.store';
import type { Condition, RuleAction } from '@/form/logic/logicTypes';
import { useFormStore } from '@/form/store/form.store';

type LogicFilter = 'all' | 'rule' | 'formula';
type LogicSort = 'updated_desc' | 'updated_asc' | 'name_asc' | 'name_desc';

export function ComponentLogicPanel() {
  // ── Store State ──
  const activeComponentId = useFormStore((s) => s.activeComponentId);
  const rules = useLogicStore((s) => s.rules);
  const formulas = useLogicStore((s) => s.formulas);

  // ── Store Actions ──
  const addRule = useLogicStore((s) => s.addRule);
  const addFormula = useLogicStore((s) => s.addFormula);
  const removeRule = useLogicStore((s) => s.removeRule);
  const removeFormula = useLogicStore((s) => s.removeFormula);
  const openPopoutRule = useLogicStore((s) => s.openPopoutRule);

  // ── Local State ──
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LogicFilter>('all');
  const [sort, setSort] = useState<LogicSort>('updated_desc');

  // ── Helpers ──
  const {
    sourceRules,
    targetRules,
    sourceFormulas,
    targetFormulas,
    hasAnyConnectedLogic,
  } = useMemo(() => {
    if (!activeComponentId) {
      return {
        sourceRules: [],
        targetRules: [],
        sourceFormulas: [],
        targetFormulas: [],
        hasAnyConnectedLogic: false,
      };
    }

    /** Recursive check if component is used in conditions */
    const isInCondition = (condition: Condition): boolean => {
      if (condition.type === 'leaf') {
        return condition.instanceId === activeComponentId;
      }
      return condition.conditions.some(isInCondition);
    };

    /** Recursive check if component is a target in standard or nested actions */
    const isTargetInActions = (actions: RuleAction[]): boolean => {
      return actions.some((action) => {
        if (action.type === 'CONDITIONAL') {
          return (
            (action.thenActions && isTargetInActions(action.thenActions)) ||
            (action.elseActions && isTargetInActions(action.elseActions))
          );
        }
        return action.targetId === activeComponentId;
      });
    };

    // ── Base Filtering (Connected to active component) ──
    const connectedSourceRules = rules.filter((r) =>
      isInCondition(r.condition)
    );
    const connectedTargetRules = rules.filter(
      (r) =>
        isTargetInActions(r.thenActions) || isTargetInActions(r.elseActions)
    );
    const connectedSourceFormulas = formulas.filter((f) =>
      f.referencedFields.includes(activeComponentId)
    );
    const connectedTargetFormulas = formulas.filter(
      (f) => f.targetId === activeComponentId
    );

    const hasAnyConnectedLogic =
      connectedSourceRules.length > 0 ||
      connectedTargetRules.length > 0 ||
      connectedSourceFormulas.length > 0 ||
      connectedTargetFormulas.length > 0;

    // ── Search & Type Filtering ──
    const q = search.trim().toLowerCase();
    const filterByName = (item: { name: string }) =>
      !q || item.name.toLowerCase().includes(q);

    const finalSourceRules =
      filter === 'formula' ? [] : connectedSourceRules.filter(filterByName);
    const finalTargetRules =
      filter === 'formula' ? [] : connectedTargetRules.filter(filterByName);
    const finalSourceFormulas =
      filter === 'rule' ? [] : connectedSourceFormulas.filter(filterByName);
    const finalTargetFormulas =
      filter === 'rule' ? [] : connectedTargetFormulas.filter(filterByName);

    // ── Sorting ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortFn = (a: any, b: any) => {
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
    };

    finalSourceRules.sort(sortFn);
    finalTargetRules.sort(sortFn);
    finalSourceFormulas.sort(sortFn);
    finalTargetFormulas.sort(sortFn);

    return {
      sourceRules: finalSourceRules,
      targetRules: finalTargetRules,
      sourceFormulas: finalSourceFormulas,
      targetFormulas: finalTargetFormulas,
      hasAnyConnectedLogic,
    };
  }, [activeComponentId, rules, formulas, search, filter, sort]);

  const hasVisibleLogic =
    sourceRules.length > 0 ||
    targetRules.length > 0 ||
    sourceFormulas.length > 0 ||
    targetFormulas.length > 0;

  // ── Render Helpers ──

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderRuleItem = (rule: any) => (
    <div
      key={rule.ruleId}
      onClick={() => {
        window.open(
          '',
          `logic_portal_${rule.ruleId}`,
          'width=800,height=600,left=200,top=200'
        );
        openPopoutRule(rule.ruleId);
      }}
      className={`group mb-1 cursor-pointer rounded-md border px-2.5 py-1.5 transition-all hover:bg-muted/50 ${!rule.enabled ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-1.5">
        <Zap className={`h-3 w-3 shrink-0 text-amber-500`} />
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
          {rule.name}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded p-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                window.open(
                  '',
                  `logic_portal_${rule.ruleId}`,
                  'width=800,height=600,left=200,top=200'
                );
                openPopoutRule(rule.ruleId);
              }}
            >
              <Search className="mr-2 h-3 w-3" /> Open
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                removeRule(rule.ruleId);
              }}
            >
              <Trash2 className="mr-2 h-3 w-3" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderFormulaItem = (formula: any) => (
    <div
      key={formula.ruleId}
      onClick={() => {
        window.open(
          '',
          `logic_portal_${formula.ruleId}`,
          'width=800,height=600,left=200,top=200'
        );
        openPopoutRule(formula.ruleId);
      }}
      className={`group mb-1 cursor-pointer rounded-md border px-2.5 py-1.5 transition-all hover:bg-muted/50 ${!formula.enabled ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center gap-1.5">
        <Calculator className={`h-3 w-3 shrink-0 text-violet-500`} />
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
          {formula.name}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded p-0 text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
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
              <Search className="mr-2 h-3 w-3" /> Open
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                removeFormula(formula.ruleId);
              }}
            >
              <Trash2 className="mr-2 h-3 w-3" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  if (!activeComponentId) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
        <AlertCircle className="h-6 w-6 opacity-20" />
        <p className="text-[10px]">Select a component to see its logic.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {/* ADD RULES & FORMULAS BLOCK */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => {
                addRule(`New Rule ${nanoid(12)}`, 'field', activeComponentId);
              }}
            >
              <Zap className="mr-1.5 h-3 w-3" />
              Add Rule
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() =>
                addFormula(`New Formula ${nanoid(12)}`, activeComponentId)
              }
            >
              <Calculator className="mr-1.5 h-3 w-3" />
              Add Formula
            </Button>
          </div>

          {/* SEARCH BAR */}
          <div className="relative">
            <Search className="absolute top-1.5 left-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search connected logic..."
              className="h-7 pl-7 text-[11px]"
            />
          </div>

          {/* FILTER & SORT CONTROLS */}
          <div className="flex items-center gap-2">
            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as LogicFilter)}
            >
              <SelectTrigger className="h-7 w-[130px] text-[11px]">
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3 w-3 text-muted-foreground" />
                  <SelectValue placeholder="All Types" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-[11px]">
                  All Types
                </SelectItem>
                <SelectItem value="rule" className="text-[11px]">
                  Rules Only
                </SelectItem>
                <SelectItem value="formula" className="text-[11px]">
                  Formulas Only
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => setSort(v as LogicSort)}>
              <SelectTrigger className="h-7 flex-1 text-[11px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_desc" className="text-[11px]">
                  Newest First
                </SelectItem>
                <SelectItem value="updated_asc" className="text-[11px]">
                  Oldest First
                </SelectItem>
                <SelectItem value="name_asc" className="text-[11px]">
                  Name (A-Z)
                </SelectItem>
                <SelectItem value="name_desc" className="text-[11px]">
                  Name (Z-A)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!hasAnyConnectedLogic ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            <Zap className="h-8 w-8 opacity-10" />
            <p className="text-[10px]">No logic connected to this field.</p>
          </div>
        ) : !hasVisibleLogic ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
            <Search className="h-6 w-6 opacity-10" />
            <p className="text-[10px]">No results found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* SECTION: TRIGGER / SOURCE */}
            {(sourceRules.length > 0 || sourceFormulas.length > 0) && (
              <section>
                <div className="mb-2 flex items-center gap-1.5 px-1">
                  <PlayCircle className="h-3 w-3 text-blue-500" />
                  <h4 className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                    Used as Trigger
                  </h4>
                </div>
                {sourceRules.map((r) => renderRuleItem(r))}
                {sourceFormulas.map((f) => renderFormulaItem(f))}
              </section>
            )}

            {/* SECTION: TARGET / AFFECTED */}
            {(targetRules.length > 0 || targetFormulas.length > 0) && (
              <section>
                <div className="mb-2 flex items-center gap-1.5 px-1">
                  <ArrowRightCircle className="h-3 w-3 text-green-500" />
                  <h4 className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                    Affected by Logic
                  </h4>
                </div>
                {targetRules.map((r) => renderRuleItem(r))}
                {targetFormulas.map((f) => renderFormulaItem(f))}
              </section>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
