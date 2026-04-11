// src/pages/FormEditor/components/LogicPlayground.tsx
/**
 * Logic Playground — Rule/Formula editor that replaces the form canvas.
 * Renders the full IF → THEN → ELSE builder for the active rule,
 * or the formula editor for the active formula.
 */
import { useMemo, useCallback } from 'react';
import { ArrowLeft, Plus, Calculator, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogicStore } from '@/form/logic/logic.store';
import { useFormStore } from '@/form/store/form.store';

import {
  createRuleAction,
  createConditionGroup,
  ACTION_TYPES,
  ACTION_TYPE_LABELS,
  ACTION_TYPE_COLORS,
} from '@/form/logic/logicTypes';

import type {
  Condition,
  RuleAction,
  RuleType,
  ActionType,
} from '@/form/logic/logicTypes';

import { RULE_TYPES } from '@/form/logic/logicTypes';
import { ConditionBuilder } from './ConditionBuilder';
import { ActionRow } from '../builder/ActionRow';
import { FormulaEditor } from './FormulaEditor';

// ── Recursive Action List Component ──
// This handles infinite nesting of IF/THEN/ELSE blocks when ActionType is CONDITIONAL
// ── Recursive Action List Component ──
interface RecursiveActionListProps {
  actions: RuleAction[];
  onChange: (actions: RuleAction[]) => void;
  fields: { id: string; label: string }[];
  targets: { id: string; label: string; type: 'component' | 'page' }[];
  ruleType: RuleType;
}

function RecursiveActionList({
  actions,
  onChange,
  fields,
  targets,
  ruleType,
}: RecursiveActionListProps) {
  const handleActionChange = (index: number, updated: RuleAction) => {
    const newActions = [...actions];

    // Intercept: If the user just switched the type to CONDITIONAL
    if (
      updated.type === 'CONDITIONAL' &&
      newActions[index].type !== 'CONDITIONAL'
    ) {
      updated.condition = updated.condition || createConditionGroup('AND');
      updated.thenActions = updated.thenActions || [];
      updated.elseActions = updated.elseActions || [];
      // Fix: Populate the targetId to bypass Mongoose validation
      updated.targetId = 'NESTED_LOGIC_BLOCK';
    }
    // Intercept: If the user switched FROM Conditional back to a standard action
    else if (
      updated.type !== 'CONDITIONAL' &&
      newActions[index].type === 'CONDITIONAL'
    ) {
      // Clear the dummy ID so they are forced to pick a real component target
      updated.targetId = '';
    }

    newActions[index] = updated;
    onChange(newActions);
  };

  const handleRemove = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  const handleAddAction = () => {
    onChange([
      ...actions,
      createRuleAction(ruleType === 'navigation' ? 'SKIP_PAGE' : 'SHOW'),
    ]);
  };

  return (
    <div className="space-y-3">
      {actions.map((action, index) => (
        <div key={action.id}>
          {action.type === 'CONDITIONAL' ? (
            /* ── NESTED BLOCK (Replaces ActionRow entirely) ── */
            <div className="space-y-4 rounded-md border bg-muted/30 p-2">
              {/* Header with integrated Type Selector and Trash Button */}
              <div className="flex items-center justify-between border-b pb-3">
                <select
                  value={action.type}
                  onChange={(e) =>
                    handleActionChange(index, {
                      ...action,
                      type: e.target.value as ActionType,
                    })
                  }
                  className={`h-7 min-w-0 rounded border border-input bg-background px-1.5 text-xs font-medium ${ACTION_TYPE_COLORS[action.type]}`}
                >
                  {ACTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {ACTION_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleRemove(index)}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Nested IF */}
              <section>
                <h4 className="mb-2 text-[10px] font-bold tracking-widest text-purple-600 uppercase">
                  IF
                </h4>
                {action.condition && (
                  <ConditionBuilder
                    condition={action.condition}
                    fields={fields}
                    onChange={(cond) =>
                      handleActionChange(index, { ...action, condition: cond })
                    }
                  />
                )}
              </section>

              {/* Nested THEN */}
              <section>
                <h4 className="mb-2 text-[10px] font-bold tracking-widest text-green-600 uppercase">
                  THEN
                </h4>
                <RecursiveActionList
                  actions={action.thenActions || []}
                  onChange={(thenActs) =>
                    handleActionChange(index, {
                      ...action,
                      thenActions: thenActs,
                    })
                  }
                  fields={fields}
                  targets={targets}
                  ruleType={ruleType}
                />
              </section>

              {/* Nested ELSE */}
              <section>
                <h4 className="mb-2 text-[10px] font-bold tracking-widest text-red-500 uppercase">
                  ELSE
                </h4>
                <RecursiveActionList
                  actions={action.elseActions || []}
                  onChange={(elseActs) =>
                    handleActionChange(index, {
                      ...action,
                      elseActions: elseActs,
                    })
                  }
                  fields={fields}
                  targets={targets}
                  ruleType={ruleType}
                />
              </section>
            </div>
          ) : (
            /* ── STANDARD BLOCK (Normal Action Row) ── */
            <ActionRow
              action={action}
              targets={targets}
              onChange={(updated) => handleActionChange(index, updated)}
              onRemove={() => handleRemove(index)}
            />
          )}
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-[10px]"
        onClick={handleAddAction}
      >
        <Plus className="mr-0.5 h-2.5 w-2.5" />
        Add action
      </Button>
    </div>
  );
}

// ── Main Logic Playground Component ──
interface LogicPlaygroundProps {
  onClose: () => void;
}

export function LogicPlayground({ onClose }: LogicPlaygroundProps) {
  const activeRuleId = useLogicStore((s) => s.activeRuleId);
  const rule = useLogicStore((s) =>
    s.rules.find((r) => r.ruleId === s.activeRuleId)
  );
  const formula = useLogicStore((s) =>
    s.formulas.find((f) => f.ruleId === s.activeFormulaId)
  );

  const updateRule = useLogicStore((s) => s.updateRule);
  const updateRuleCondition = useLogicStore((s) => s.updateRuleCondition);
  const updateRuleThenActions = useLogicStore((s) => s.updateRuleThenActions);
  const updateRuleElseActions = useLogicStore((s) => s.updateRuleElseActions);
  const updateFormula = useLogicStore((s) => s.updateFormula);

  const components = useFormStore((s) => s.components);
  const pages = useFormStore((s) => s.pages);
  const formPages = useFormStore((s) => s.form?.pages ?? []);

  const fieldOptions = useMemo(
    () =>
      Object.values(components)
        .filter((c) => c.id !== 'Header' && c.id !== 'LineDivider')
        .map((c) => ({
          id: c.instanceId,
          label:
            c.metadata.label && c.metadata.label !== c.id
              ? `${c.metadata.label} (${c.id})`
              : c.id,
        })),
    [components]
  );

  const targetOptions = useMemo(() => {
    const compTargets = Object.values(components).map((c) => ({
      id: c.instanceId,
      label:
        c.metadata.label && c.metadata.label !== c.id
          ? `${c.metadata.label} (${c.id})`
          : c.id,
      type: 'component' as const,
    }));
    const pageTargets = formPages.map((pageId, idx) => ({
      id: pageId,
      label: pages[pageId]?.title || `Page ${idx + 1}`,
      type: 'page' as const,
    }));
    return [...compTargets, ...pageTargets];
  }, [components, pages, formPages]);

  const handleConditionChange = useCallback(
    (condition: Condition) => {
      if (activeRuleId) updateRuleCondition(activeRuleId, condition);
    },
    [activeRuleId, updateRuleCondition]
  );

  if (!rule && !formula) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        {/* <Zap className="h-12 w-12 text-muted-foreground/20" /> */}
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            No rule selected
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Select a rule from the Logic panel or create a new one.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Form
        </Button>
      </div>
    );
  }

  if (formula) {
    return (
      <div className="flex h-full flex-col">
        {/* Formula Header & Body */}
        <div className="flex items-center gap-2 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Calculator className="h-4 w-4 text-violet-500" />
          <input
            type="text"
            value={formula.name}
            onChange={(e) =>
              updateFormula(formula.ruleId, { name: e.target.value })
            }
            className="flex-1 bg-transparent text-sm font-medium outline-none"
            placeholder="Formula name…"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-xl">
            <FormulaEditor
              expression={formula.expression}
              targetId={formula.targetId}
              fields={fieldOptions}
              targets={fieldOptions}
              onExpressionChange={(expr) => {
                const refs = (expr.match(/\{([^}]+)\}/g) || []).map((m) =>
                  m.slice(1, -1)
                );
                updateFormula(formula.ruleId, {
                  expression: expr,
                  referencedFields: refs,
                });
              }}
              onTargetChange={(targetId) =>
                updateFormula(formula.ruleId, { targetId })
              }
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur-sm">
        <button
          onClick={onClose}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        {/* <Zap className="h-4 w-4 text-amber-500" /> */}
        <input
          type="text"
          value={rule!.name}
          onChange={(e) => updateRule(rule!.ruleId, { name: e.target.value })}
          className="flex-1 bg-transparent text-sm font-medium outline-none"
          placeholder="Rule name…"
        />
        <select
          value={rule!.ruleType}
          onChange={(e) =>
            updateRule(rule!.ruleId, {
              ruleType: e.target.value as (typeof RULE_TYPES)[number],
            })
          }
          className="h-7 rounded border border-input bg-background px-2 text-[11px]"
        >
          <option value="field">Field</option>
          <option value="validation">Validation</option>
          <option value="navigation">Navigation</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-xl space-y-6">
          <section>
            <h3 className="mb-2 text-xs font-bold tracking-widest text-primary uppercase">
              IF
            </h3>
            <ConditionBuilder
              condition={rule!.condition}
              fields={fieldOptions}
              onChange={handleConditionChange}
            />
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold tracking-widest text-green-600 uppercase">
              THEN
            </h3>
            {/* Replaced manual map with RecursiveActionList */}
            <RecursiveActionList
              actions={rule!.thenActions}
              onChange={(actions) =>
                updateRuleThenActions(rule!.ruleId, actions)
              }
              fields={fieldOptions}
              targets={targetOptions}
              ruleType={rule!.ruleType}
            />
          </section>

          <section>
            <h3 className="mb-2 text-xs font-bold tracking-widest text-red-500 uppercase">
              ELSE{' '}
              <span className="font-normal text-muted-foreground normal-case">
                (optional)
              </span>
            </h3>
            {rule!.elseActions.length > 0 ? (
              <RecursiveActionList
                actions={rule!.elseActions}
                onChange={(actions) =>
                  updateRuleElseActions(rule!.ruleId, actions)
                }
                fields={fieldOptions}
                targets={targetOptions}
                ruleType={rule!.ruleType}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  updateRuleElseActions(rule!.ruleId, [
                    createRuleAction(
                      rule!.ruleType === 'navigation' ? 'SKIP_PAGE' : 'HIDE'
                    ),
                  ])
                }
              >
                <Plus className="mr-1 h-3 w-3" />
                Add ELSE branch
              </Button>
            )}
          </section>
          <p className="text-[10px] leading-tight font-medium text-red-500/90">
            * Important: If you use skip page, add an else action also.
          </p>
        </div>
      </div>
    </div>
  );
}
