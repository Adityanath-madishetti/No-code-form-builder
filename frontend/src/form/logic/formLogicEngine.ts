/* eslint-disable @typescript-eslint/no-explicit-any */
// src/form/logic/formLogicEngine.ts
import { Engine } from 'json-rules-engine';
import type { LogicRule } from '@/form/logic/logicTypes';

const OPERATOR_MAP: Record<string, string> = {
  equals: 'equal',
  not_equals: 'notEqual',
  greater_than: 'greaterThan',
  less_than: 'lessThan',
  contains: 'contains',
  is_empty: 'equal',
  is_not_empty: 'notEqual',
};

export class FormLogicEngine {
  private engine: Engine;
  private rulesMap: Map<string, LogicRule>;

  constructor(rules: LogicRule[]) {
    this.engine = new Engine([], { allowUndefinedFacts: true });
    // Keep a dictionary of the original rules so we can look up elseActions
    this.rulesMap = new Map(rules.map((r) => [r.ruleId, r]));
    this.initRules(rules);
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

  // Evaluates and returns a flat array of Actions to apply to the UI
  public async evaluate(formValues: Record<string, unknown>) {
    const sanitizedValues: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(formValues)) {
      sanitizedValues[key] = typeof value === 'string' ? value.trim() : value;
    }

    const { events, failureEvents } = await this.engine.run(sanitizedValues);

    const actionsToProcess: any[] = [];

    events.forEach((event) => {
      const originalRule = this.rulesMap.get(event.params?.ruleId);
      if (originalRule) {
        actionsToProcess.push(...originalRule.thenActions);
      }
    });

    failureEvents.forEach((event) => {
      const originalRule = this.rulesMap.get(event.params?.ruleId);
      if (!originalRule) return;

      if (originalRule.elseActions && originalRule.elseActions.length > 0) {
        actionsToProcess.push(...originalRule.elseActions);
      } else {
        // AUTO-REVERT (No Else actions defined, do the opposite)
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

    return actionsToProcess;
  }
}
