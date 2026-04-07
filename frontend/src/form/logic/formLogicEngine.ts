/* eslint-disable @typescript-eslint/no-explicit-any */
// src/form/logic/formLogicEngine.ts
import { Engine } from 'json-rules-engine';
import { Parser } from 'expr-eval';
import type { LogicRule, FormulaRule } from '@/form/logic/logicTypes';

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
// We map instance-uuid to instance_uuid
const makeSafeVarName = (id: string) => id.replace(/-/g, '_');

export class FormLogicEngine {
  private engine: Engine;
  private rulesMap: Map<string, LogicRule>;

  // Store compiled expr-eval formulas
  private compiledFormulas: {
    targetId: string;
    evaluate: (context: any) => any;
  }[] = [];

  constructor(rules: LogicRule[], formulas: FormulaRule[]) {
    this.engine = new Engine([], { allowUndefinedFacts: true });
    // Keep a dictionary of the original rules so we can look up elseActions
    this.rulesMap = new Map(rules.map((r) => [r.ruleId, r]));
    this.initRules(rules);
    this.initFormulas(formulas);
  }

  private initFormulas(formulas: FormulaRule[]) {
    const parser = new Parser();

    formulas.forEach((formula) => {
      if (!formula.enabled) return;

      // 1. Replace all {instance-123} with safe instance_123
      const safeExpression = formula.expression.replace(
        /\{([^}]+)\}/g,
        (_, id) => makeSafeVarName(id)
      );

      try {
        const parsedExpression = parser.parse(safeExpression);

        this.compiledFormulas.push({
          targetId: formula.targetId,
          evaluate: (context: any) => parsedExpression.evaluate(context),
        });
      } catch (err) {
        console.warn(`Failed to parse formula rule ${formula.name}:`, err);
      }
    });

    this.printFormulas();
  }

  private printFormulas() {
    console.log('Compiled Formulas:');
    this.compiledFormulas.forEach((f) => {
      console.log(`- Target: ${f.targetId}, Function:`, f.evaluate);
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
        name: rule.ruleId, // Attach the ruleId so we can find it in the results
        conditions: this.buildConditions(rule.condition),
        event: { type: 'EVALUATED', params: { ruleId: rule.ruleId } }, // Generic event, we will process manually
      });
    });
  }

  // // Evaluates and returns a flat array of Actions to apply to the UI
  // public async evaluate(formValues: Record<string, unknown>) {
  //   const sanitizedValues: Record<string, unknown> = {};
  //   for (const [key, value] of Object.entries(formValues)) {
  //     sanitizedValues[key] = typeof value === 'string' ? value.trim() : value;
  //   }

  //   const { events, failureEvents } = await this.engine.run(sanitizedValues);

  //   const actionsToProcess: any[] = [];

  //   events.forEach((event) => {
  //     const originalRule = this.rulesMap.get(event.params?.ruleId);
  //     if (originalRule) {
  //       actionsToProcess.push(...originalRule.thenActions);
  //     }
  //   });

  //   failureEvents.forEach((event) => {
  //     const originalRule = this.rulesMap.get(event.params?.ruleId);
  //     if (!originalRule) return;

  //     if (originalRule.elseActions && originalRule.elseActions.length > 0) {
  //       actionsToProcess.push(...originalRule.elseActions);
  //     } else {
  //       // AUTO-REVERT (No Else actions defined, do the opposite)
  //       originalRule.thenActions.forEach((action) => {
  //         const inverseAction = { ...action };
  //         if (action.type === 'SHOW') inverseAction.type = 'HIDE';
  //         else if (action.type === 'HIDE') inverseAction.type = 'SHOW';
  //         else if (action.type === 'ENABLE') inverseAction.type = 'DISABLE';
  //         else if (action.type === 'DISABLE') inverseAction.type = 'ENABLE';
  //         actionsToProcess.push(inverseAction);
  //       });
  //     }
  //   });

  //   return actionsToProcess;
  // }

  // Returns both UI Actions (SHOW/HIDE) and Computed Formula Values
  public async evaluate(formValues: Record<string, unknown>) {
    const sanitizedValues: Record<string, unknown> = {};
    const formulaContext: Record<string, number> = {};

    // 1. Prepare values
    for (const [key, value] of Object.entries(formValues)) {
      sanitizedValues[key] = typeof value === 'string' ? value.trim() : value;

      // expr-eval needs numbers. Convert empty strings/undefined to 0.
      const numValue = Number(value);
      formulaContext[makeSafeVarName(key)] = isNaN(numValue) ? 0 : numValue;
    }

    // 2. Run Formulas First
    const computedValues: Record<string, unknown> = {};

    this.compiledFormulas.forEach((formula) => {
      try {
        const result = formula.evaluate(formulaContext);
        computedValues[formula.targetId] = result;

        // Feed the result back into our engine states so chained logic/math works
        sanitizedValues[formula.targetId] = result;
        formulaContext[makeSafeVarName(formula.targetId)] = Number(result) || 0;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        // Silently ignore execution errors (usually caused by missing fields during typing)
        
      }
    });

    // 3. Run Logic Rules with the newly computed values included
    const { events, failureEvents } = await this.engine.run(sanitizedValues);

    const actionsToProcess: any[] = [];

    events.forEach((event) => {
      const originalRule = this.rulesMap.get(event.params?.ruleId);
      if (originalRule) actionsToProcess.push(...originalRule.thenActions);
    });

    failureEvents.forEach((event) => {
      const originalRule = this.rulesMap.get(event.params?.ruleId);
      if (!originalRule) return;

      if (originalRule.elseActions && originalRule.elseActions.length > 0) {
        actionsToProcess.push(...originalRule.elseActions);
      } else {
        originalRule.thenActions.forEach((action) => {
          const inverseAction = { ...action };
          if (action.type === 'SHOW') inverseAction.type = 'HIDE';
          else if (action.type === 'HIDE') inverseAction.type = 'SHOW';
          else if (action.type === 'ENABLE') inverseAction.type = 'DISABLE';
          else if (action.type === 'DISABLE') inverseAction.type = 'ENABLE';
          actionsToProcess.push(inverseAction);
        });
      }
    });

    return {
      actions: actionsToProcess,
      computedValues,
    };
  }
}
