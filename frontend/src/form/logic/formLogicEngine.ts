/* eslint-disable @typescript-eslint/no-explicit-any */
// src/form/logic/formLogicEngine.ts
import { Engine } from 'json-rules-engine';
import { Parser } from 'expr-eval';
import type {
  LogicRule,
  FormulaRule,
  RuleAction,
} from '@/form/logic/logicTypes';

const OPERATOR_MAP: Record<string, string> = {
  equals: 'equal',
  not_equals: 'notEqual',
  greater_than: 'greaterThan',
  less_than: 'lessThan',
  contains: 'contains',
  is_empty: 'equal',
  is_not_empty: 'notEqual',
};

// Helper: expr-eval does not allow hyphens in variable names.
const makeSafeVarName = (id: string) => id.replace(/-/g, '_');
// const makeSafeVarName = (id: string) => `field_${id.replace(/-/g, '_')}`;

export class FormLogicEngine {
  private engine: Engine;
  private rulesMap: Map<string, LogicRule>;

  private compiledFormulas: {
    targetId: string;
    referencedFields: string[];
    evaluate: (context: any) => any;
  }[] = [];

  constructor(rules: LogicRule[], formulas: FormulaRule[]) {
    this.engine = new Engine([], { allowUndefinedFacts: true });
    this.rulesMap = new Map(rules.map((r) => [r.ruleId, r]));
    this.initRules(rules);
    this.initFormulas(formulas);
  }

  private initFormulas(formulas: FormulaRule[]) {
    const parser = new Parser();

    formulas.forEach((formula) => {
      if (!formula.enabled) return;

      const safeExpression = formula.expression.replace(
        /\{([^}]+)\}/g,
        (_, id) => makeSafeVarName(id)
      );

      try {
        const parsedExpression = parser.parse(safeExpression);

        this.compiledFormulas.push({
          targetId: formula.targetId,
          referencedFields: formula.referencedFields || [],
          evaluate: (context: any) => parsedExpression.evaluate(context),
        });
      } catch (err) {
        console.warn(`Failed to parse formula rule ${formula.name}:`, err);
      }
    });
  }

  private buildConditions(condition: any): any {
    if (condition.type === 'leaf') {
      return {
        fact: condition.instanceId,
        operator: OPERATOR_MAP[condition.operator] || condition.operator,
        value: condition.operator === 'is_empty' ? '' : condition.value,
      };
    }
    if (condition.type === 'group') {
      const groupType = condition.operator === 'AND' ? 'all' : 'any';
      return {
        [groupType]: condition.conditions.map((cond: any) =>
          this.buildConditions(cond)
        ),
      };
    }
  }

  private initRules(rules: LogicRule[]) {
    rules.forEach((rule) => {
      if (!rule.enabled) return;

      this.engine.addRule({
        name: rule.ruleId,
        conditions: this.buildConditions(rule.condition),
        event: { type: 'EVALUATED', params: { ruleId: rule.ruleId } },
      });
    });
  }

  /**
   * Evaluates nested AST conditions synchronously.
   */
  private evaluateConditionAST(
    condition: any,
    values: Record<string, unknown>
  ): boolean {
    if (condition.type === 'leaf') {
      const safeFact = values[condition.instanceId] ?? '';
      const safeTarget = condition.value ?? '';

      switch (condition.operator) {
        case 'equals':
          return String(safeFact) === String(safeTarget);
        case 'not_equals':
          return String(safeFact) !== String(safeTarget);
        case 'greater_than':
          if (safeFact === '') return false;
          return Number(safeFact) > Number(safeTarget);
        case 'less_than':
          if (safeFact === '') return false;
          return Number(safeFact) < Number(safeTarget);
        case 'contains':
          return String(safeFact)
            .toLowerCase()
            .includes(String(safeTarget).toLowerCase());
        case 'not_contains':
          return !String(safeFact)
            .toLowerCase()
            .includes(String(safeTarget).toLowerCase());
        case 'is_empty':
          return safeFact === '';
        case 'is_not_empty':
          return safeFact !== '';
        default:
          return false;
      }
    } else if (condition.type === 'group') {
      if (condition.operator === 'AND') {
        return condition.conditions.every((c: any) =>
          this.evaluateConditionAST(c, values)
        );
      } else {
        return condition.conditions.some((c: any) =>
          this.evaluateConditionAST(c, values)
        );
      }
    }
    return false;
  }

  public async evaluate(formValues: Record<string, unknown>) {
    const sanitizedValues: Record<string, unknown> = {};
    const formulaContext: Record<string, number | undefined> = {};

    // 1. Prepare values strictly
    for (const [key, value] of Object.entries(formValues)) {
      const trimmed = typeof value === 'string' ? value.trim() : value;
      sanitizedValues[key] = trimmed;

      if (trimmed === '' || trimmed === null || trimmed === undefined) {
        formulaContext[makeSafeVarName(key)] = undefined;
      } else {
        const numValue = Number(trimmed);
        formulaContext[makeSafeVarName(key)] = isNaN(numValue)
          ? undefined
          : numValue;
      }
    }

    // 2. Run Formulas First
    const computedValues: Record<string, unknown> = {};

    this.compiledFormulas.forEach((formula) => {
      const canExecute = formula.referencedFields.every((fieldId) => {
        return formulaContext[makeSafeVarName(fieldId)] !== undefined;
      });

      if (!canExecute) {
        computedValues[formula.targetId] = '';
        sanitizedValues[formula.targetId] = '';
        formulaContext[makeSafeVarName(formula.targetId)] = undefined;
        return;
      }

      try {
        const result = formula.evaluate(formulaContext);
        computedValues[formula.targetId] = result;
        sanitizedValues[formula.targetId] = result;
        formulaContext[makeSafeVarName(formula.targetId)] = Number(result) || 0;
      } catch (err) {
        console.warn(`Formula execution failed for ${formula.targetId}:`, err);
      }
    });

    // 3. Run Logic Rules
    const { events, failureEvents } = await this.engine.run(sanitizedValues);
    const actionsToProcess: any[] = [];

    // HELPER: Auto-reverts all actions in a branch recursively
    const gatherAutoRevertActions = (actions: RuleAction[]) => {
      if (!actions) return;
      actions.forEach((action) => {
        if (action.type === 'CONDITIONAL') {
          // If a parent dies, EVERYTHING inside it must be reverted
          gatherAutoRevertActions(action.thenActions || []);
          gatherAutoRevertActions(action.elseActions || []);
        } else {
          const inverseAction = { ...action };
          if (action.type === 'SHOW') inverseAction.type = 'HIDE';
          else if (action.type === 'HIDE') inverseAction.type = 'SHOW';
          else if (action.type === 'ENABLE') inverseAction.type = 'DISABLE';
          else if (action.type === 'DISABLE') inverseAction.type = 'ENABLE';
          actionsToProcess.push(inverseAction);
        }
      });
    };

    // HELPER: Recursively process standard and nested actions symmetrically
    const processActionList = (actions: RuleAction[]) => {
      if (!actions) return;
      actions.forEach((action) => {
        if (action.type === 'CONDITIONAL') {
          if (!action.condition) return;

          const passed = this.evaluateConditionAST(
            action.condition,
            sanitizedValues
          );

          // FIX: Absolute Symmetry applied here!
          if (passed) {
            processActionList(action.thenActions || []);
            gatherAutoRevertActions(action.elseActions || []); // Clean up the Else branch
          } else {
            processActionList(action.elseActions || []);
            gatherAutoRevertActions(action.thenActions || []); // Clean up the Then branch
          }
        } else {
          actionsToProcess.push(action);
        }
      });
    };

    // Process PASSED root rules
    events.forEach((event) => {
      const originalRule = this.rulesMap.get(event.params?.ruleId);
      if (originalRule) {
        processActionList(originalRule.thenActions);
        gatherAutoRevertActions(originalRule.elseActions); // Clean up root Else
      }
    });

    // Process FAILED root rules
    failureEvents.forEach((event) => {
      const originalRule = this.rulesMap.get(event.params?.ruleId);
      if (originalRule) {
        processActionList(originalRule.elseActions);
        gatherAutoRevertActions(originalRule.thenActions); // Clean up root Then
      }
    });

    return { actions: actionsToProcess, computedValues };
  }
}
