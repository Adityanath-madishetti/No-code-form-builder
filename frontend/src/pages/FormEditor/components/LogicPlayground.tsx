// src/pages/FormEditor/components/LogicPlayground.tsx
/**
 * Logic Playground — Rule/Formula editor that replaces the form canvas.
 * Renders the full IF → THEN → ELSE builder for the active rule,
 * or the formula editor for the active formula.
 */
import { useMemo, useCallback } from 'react';
import { ArrowLeft, Plus, Zap, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogicStore } from '@/form/logic/logicStore';
import { useFormStore } from '@/form/store/formStore';
import { createRuleAction } from '@/form/logic/logicTypes';
import type { Condition, RuleAction } from '@/form/logic/logicTypes';
import { ConditionBuilder } from './ConditionBuilder';
import { ActionRow } from './ActionRow';
import { FormulaEditor } from './FormulaEditor';

interface LogicPlaygroundProps {
  onClose: () => void;
}

export function LogicPlayground({ onClose }: LogicPlaygroundProps) {
  const activeRuleId = useLogicStore((s) => s.activeRuleId);
  const rule = useLogicStore((s) => s.rules.find((r) => r.ruleId === s.activeRuleId));
  const formula = useLogicStore((s) => s.formulas.find((f) => f.ruleId === s.activeFormulaId));
  const updateRule = useLogicStore((s) => s.updateRule);
  const updateRuleCondition = useLogicStore((s) => s.updateRuleCondition);
  const updateRuleThenActions = useLogicStore((s) => s.updateRuleThenActions);
  const updateRuleElseActions = useLogicStore((s) => s.updateRuleElseActions);
  const updateFormula = useLogicStore((s) => s.updateFormula);

  // Get form fields and pages for selectors
  const components = useFormStore((s) => s.components);
  const pages = useFormStore((s) => s.pages);
  const formPages = useFormStore((s) => s.form?.pages ?? []);

  const fieldOptions = useMemo(
    () =>
      Object.values(components)
        .filter((c) => c.id !== 'Header' && c.id !== 'LineDivider')
        .map((c) => ({
          id: c.instanceId,
          label: c.metadata.label || c.id,
        })),
    [components]
  );

  const targetOptions = useMemo(() => {
    const compTargets = Object.values(components).map((c) => ({
      id: c.instanceId,
      label: c.metadata.label || c.id,
      type: 'component' as const,
    }));
    const pageTargets = formPages.map((pageId, idx) => ({
      id: pageId,
      label: pages[pageId]?.title || `Page ${idx + 1}`,
      type: 'page' as const,
    }));
    return [...compTargets, ...pageTargets];
  }, [components, pages, formPages]);

  // ── Rule editing callbacks ──

  const handleConditionChange = useCallback(
    (condition: Condition) => {
      if (activeRuleId) updateRuleCondition(activeRuleId, condition);
    },
    [activeRuleId, updateRuleCondition]
  );

  const handleThenChange = useCallback(
    (index: number, updated: RuleAction) => {
      if (!rule) return;
      const newActions = [...rule.thenActions];
      newActions[index] = updated;
      updateRuleThenActions(rule.ruleId, newActions);
    },
    [rule, updateRuleThenActions]
  );

  const handleElseChange = useCallback(
    (index: number, updated: RuleAction) => {
      if (!rule) return;
      const newActions = [...rule.elseActions];
      newActions[index] = updated;
      updateRuleElseActions(rule.ruleId, newActions);
    },
    [rule, updateRuleElseActions]
  );

  const removeThenAction = useCallback(
    (index: number) => {
      if (!rule) return;
      updateRuleThenActions(
        rule.ruleId,
        rule.thenActions.filter((_, i) => i !== index)
      );
    },
    [rule, updateRuleThenActions]
  );

  const removeElseAction = useCallback(
    (index: number) => {
      if (!rule) return;
      updateRuleElseActions(
        rule.ruleId,
        rule.elseActions.filter((_, i) => i !== index)
      );
    },
    [rule, updateRuleElseActions]
  );

  // ── No active rule/formula ──

  if (!rule && !formula) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <Zap className="h-12 w-12 text-muted-foreground/20" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">No rule selected</p>
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

  // ── Formula editor ──

  if (formula) {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur-sm">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <Calculator className="h-4 w-4 text-violet-500" />
          <input
            type="text"
            value={formula.name}
            onChange={(e) => updateFormula(formula.ruleId, { name: e.target.value })}
            className="flex-1 bg-transparent text-sm font-medium outline-none"
            placeholder="Formula name…"
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-xl">
            <FormulaEditor
              expression={formula.expression}
              targetId={formula.targetId}
              fields={fieldOptions}
              targets={fieldOptions}
              onExpressionChange={(expr) => {
                const refs = (expr.match(/\{([^}]+)\}/g) || []).map((m) => m.slice(1, -1));
                updateFormula(formula.ruleId, { expression: expr, referencedFields: refs });
              }}
              onTargetChange={(targetId) => updateFormula(formula.ruleId, { targetId })}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Rule editor ──

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur-sm">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Zap className="h-4 w-4 text-amber-500" />
        <input
          type="text"
          value={rule!.name}
          onChange={(e) => updateRule(rule!.ruleId, { name: e.target.value })}
          className="flex-1 bg-transparent text-sm font-medium outline-none"
          placeholder="Rule name…"
        />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-xl space-y-6">
          {/* IF section */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
              IF
            </h3>
            <ConditionBuilder
              condition={rule!.condition}
              fields={fieldOptions}
              onChange={handleConditionChange}
            />
          </section>

          {/* THEN section */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-green-600">
              THEN
            </h3>
            <div className="space-y-1.5">
              {rule!.thenActions.map((action, index) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  targets={targetOptions}
                  onChange={(updated) => handleThenChange(index, updated)}
                  onRemove={rule!.thenActions.length > 1 ? () => removeThenAction(index) : undefined}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1.5 h-6 px-2 text-[10px]"
              onClick={() =>
                updateRuleThenActions(rule!.ruleId, [
                  ...rule!.thenActions,
                  createRuleAction('SHOW'),
                ])
              }
            >
              <Plus className="mr-0.5 h-2.5 w-2.5" />
              Add action
            </Button>
          </section>

          {/* ELSE section */}
          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-red-500">
              ELSE <span className="font-normal normal-case text-muted-foreground">(optional)</span>
            </h3>
            {rule!.elseActions.length > 0 ? (
              <>
                <div className="space-y-1.5">
                  {rule!.elseActions.map((action, index) => (
                    <ActionRow
                      key={action.id}
                      action={action}
                      targets={targetOptions}
                      onChange={(updated) => handleElseChange(index, updated)}
                      onRemove={() => removeElseAction(index)}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1.5 h-6 px-2 text-[10px]"
                  onClick={() =>
                    updateRuleElseActions(rule!.ruleId, [
                      ...rule!.elseActions,
                      createRuleAction('HIDE'),
                    ])
                  }
                >
                  <Plus className="mr-0.5 h-2.5 w-2.5" />
                  Add action
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  updateRuleElseActions(rule!.ruleId, [createRuleAction('HIDE')])
                }
              >
                <Plus className="mr-1 h-3 w-3" />
                Add ELSE branch
              </Button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
