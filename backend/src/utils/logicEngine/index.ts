// backend/src/utils/logicEngine/index.ts

import { normalizeLogicPayload } from './normalizer.js';
import { evaluateConditionTree } from './conditionTree.js';
import { evaluateFormulaExpression } from './formulaParser.js';
import { isEmpty } from './helpers.js';

// Re-export normalizer in case it's needed externally
export { normalizeLogicPayload } from './normalizer.js';
export { evaluateConditionTree } from './conditionTree.js';
export { evaluateFormulaExpression } from './formulaParser.js';

export interface LogicAction {
  id?: string;
  type: 'SHOW' | 'HIDE' | 'ENABLE' | 'DISABLE' | 'SET_VALUE' | 'SKIP_PAGE' | 'CONDITIONAL';
  targetId: string;
  toPageId?: string;
  value?: any;
  condition?: any;
  thenActions?: LogicAction[];
  elseActions?: LogicAction[];
}

export interface LogicRule {
  ruleId: string;
  name?: string;
  ruleType: 'field' | 'validation' | 'navigation';
  enabled: boolean;
  updatedAt?: string;
  condition: any;
  thenActions: LogicAction[];
  elseActions: LogicAction[];
}

export interface LogicFormula {
  ruleId: string;
  name?: string;
  enabled: boolean;
  targetId: string;
  expression: string;
  referencedFields?: string[];
  updatedAt?: string;
}

export interface LogicShuffleStack {
  stackId: string;
  name: string;
  pageId: string;
  componentIds: string[];
  enabled: boolean;
}

export interface LogicPayload {
  rules: LogicRule[];
  formulas: LogicFormula[];
  componentShuffleStacks?: LogicShuffleStack[];
}

export interface FormComponent {
  componentId: string;
  componentType: string;
  label?: string;
  required?: boolean;
  validation?: {
    required?: boolean;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface FormPage {
  pageId: string;
  pageNo: number;
  components: FormComponent[];
  [key: string]: any;
}

export interface FormVersion {
  formId: string;
  version: number;
  pages: FormPage[];
  logic?: LogicPayload;
  [key: string]: any;
}

export interface SubmissionResponse {
  componentId: string;
  response: any;
}

export interface SubmissionPage {
  pageNo: number;
  responses: SubmissionResponse[];
}

export interface LogicEngineResult {
  values: Record<string, any>;
  pages: SubmissionPage[];
  visibility: Record<string, boolean>;
  enabled: Record<string, boolean>;
  computedValues: Record<string, any>;
  nextPageId: string | null;
  violations: Array<{
    ruleId: string;
    targetId: string;
    message: string;
    stage: string;
  }>;
  errors: Array<{
    ruleId: string;
    targetId: string;
    message: string;
    stage: string;
  }>;
}

function flattenSubmissionPages(pages: SubmissionPage[] = []): Record<string, any> {
  const values: Record<string, any> = {};
  for (const page of pages) {
    for (const response of page?.responses || []) {
      values[response.componentId] = response.response;
    }
  }
  return values;
}

function buildComponentMap(version: FormVersion) {
  const componentIds: string[] = [];
  const componentMap: Record<string, FormComponent> = {};
  const pageByComponent: Record<string, { pageId: string; pageNo: number }> = {};

  for (const page of version?.pages || []) {
    for (const component of page?.components || []) {
      if (!component?.componentId) continue;
      componentIds.push(component.componentId);
      componentMap[component.componentId] = component;
      pageByComponent[component.componentId] = {
        pageId: page.pageId,
        pageNo: page.pageNo,
      };
    }
  }

  return { componentIds, componentMap, pageByComponent };
}

function buildSubmissionPagesFromValues(
  version: FormVersion,
  values: Record<string, any>,
  visibility: Record<string, boolean>,
  enabled: Record<string, boolean>,
): SubmissionPage[] {
  const pages: SubmissionPage[] = [];

  for (const page of version?.pages || []) {
    const responses: SubmissionResponse[] = [];
    for (const component of page?.components || []) {
      const componentId = component?.componentId;
      if (!componentId) continue;
      if (component.componentType === 'heading') continue;
      if (visibility[componentId] === false || enabled[componentId] === false) {
        continue;
      }
      if (!(componentId in values)) continue;
      responses.push({
        componentId,
        response: values[componentId],
      });
    }
    pages.push({
      pageNo: page.pageNo,
      responses,
    });
  }

  return pages;
}

function collectRequiredViolations(
  version: FormVersion,
  values: Record<string, any>,
  visibility: Record<string, boolean>,
  enabled: Record<string, boolean>,
  submittedPages: SubmissionPage[] = [],
) {
  const submittedPageNos = new Set((submittedPages || []).map((p) => p.pageNo));
  const violations = [];

  for (const page of version?.pages || []) {
    // If the payload contains pages, we assume any missing page was skipped via navigation logic
    // and therefore should not trigger 'required' violations.
    if (submittedPages.length > 0 && !submittedPageNos.has(page.pageNo)) {
      continue;
    }

    for (const component of page?.components || []) {
      if (!component?.componentId) continue;
      if (component.componentType === 'heading') continue;

      const componentId = component.componentId;
      if (visibility[componentId] === false || enabled[componentId] === false) {
        continue;
      }

      const isRequired = component.required === true || component.validation?.required === true;
      if (!isRequired) continue;

      if (isEmpty(values[componentId])) {
        violations.push({
          ruleId: 'required',
          targetId: componentId,
          message: `${component.label || componentId} is required`,
          stage: 'submit',
        });
      }
    }
  }
  return violations;
}

export function evaluateFormLogicRuntime({
  version,
  pages = [],
  stage = 'submit',
}: {
  version: FormVersion;
  pages?: SubmissionPage[];
  stage?: string;
}): LogicEngineResult {
  const logic = normalizeLogicPayload(version?.logic || {}) as LogicPayload;
  const values = flattenSubmissionPages(pages);
  const { componentIds } = buildComponentMap(version);

  const visibility: Record<string, boolean> = {};
  const enabled: Record<string, boolean> = {};
  for (const id of componentIds) {
    visibility[id] = true;
    enabled[id] = true;
  }

  const computedValues: Record<string, any> = {};
  const violations: Array<{ ruleId: string; targetId: string; message: string; stage: string }> =
    [];
  const engineErrors: Array<{ ruleId: string; targetId: string; message: string; stage: string }> =
    [];
  let nextPageId: string | null = null;

  // 1) Formula pass
  for (const formula of logic.formulas) {
    if (!formula.enabled || !formula.targetId || !formula.expression) continue;
    try {
      const result = evaluateFormulaExpression(formula.expression, values);
      values[formula.targetId] = result;
      computedValues[formula.targetId] = result;
    } catch (err: any) {
      engineErrors.push({
        ruleId: formula.ruleId,
        targetId: formula.targetId,
        message: err.message || 'Failed to evaluate formula',
        stage,
      });
    }
  }

  // 2) Non-validation rules
  for (const rule of logic.rules) {
    if (!rule.enabled) continue;
    if (rule.ruleType === 'validation') continue;

    let conditionPassed = false;
    try {
      conditionPassed = evaluateConditionTree(rule.condition, values);
    } catch (err: any) {
      engineErrors.push({
        ruleId: rule.ruleId,
        targetId: '',
        message: err.message || 'Failed to evaluate rule condition',
        stage,
      });
      continue;
    }

    const processActions = (actions: LogicAction[]) => {
      for (const action of actions) {
        if (!action?.targetId) continue;
        switch (action.type) {
          case 'SHOW':
            visibility[action.targetId] = true;
            break;
          case 'HIDE':
            visibility[action.targetId] = false;
            break;
          case 'ENABLE':
            enabled[action.targetId] = true;
            break;
          case 'DISABLE':
            enabled[action.targetId] = false;
            break;
          case 'SET_VALUE':
            values[action.targetId] = action.value;
            computedValues[action.targetId] = action.value;
            break;
          case 'SKIP_PAGE':
            if (!nextPageId && rule.ruleType === 'navigation' && conditionPassed) {
              nextPageId = action.targetId;
            }
            break;
          case 'CONDITIONAL':
            try {
              const nestedPassed = evaluateConditionTree(action.condition, values);
              processActions(nestedPassed ? action.thenActions || [] : action.elseActions || []);
            } catch (err: any) {
              engineErrors.push({
                ruleId: rule.ruleId,
                targetId: action.targetId,
                message: err.message || 'Failed to evaluate nested condition',
                stage,
              });
            }
            break;
          default:
            break;
        }
      }
    };

    processActions(conditionPassed ? rule.thenActions : rule.elseActions);
  }

  // 3) Validation rules
  for (const rule of logic.rules) {
    if (!rule.enabled || rule.ruleType !== 'validation') continue;

    let conditionPassed = false;
    try {
      conditionPassed = evaluateConditionTree(rule.condition, values);
    } catch (err: any) {
      engineErrors.push({
        ruleId: rule.ruleId,
        targetId: '',
        message: err.message || 'Failed to evaluate validation rule',
        stage,
      });
      continue;
    }

    if (!conditionPassed) continue;
    const actions = rule.thenActions || [];
    if (actions.length === 0) {
      violations.push({
        ruleId: rule.ruleId,
        targetId: '',
        message: 'Validation rule failed',
        stage,
      });
      continue;
    }

    for (const action of actions) {
      violations.push({
        ruleId: rule.ruleId,
        targetId: action?.targetId || '',
        message:
          typeof action?.value === 'string' && action.value.trim()
            ? action.value
            : 'Validation rule failed',
        stage,
      });
    }
  }

  // 4) Required-field checks after visibility/enablement resolution
  violations.push(...collectRequiredViolations(version, values, visibility, enabled, pages));

  // 5) Strip hidden/disabled values
  for (const id of componentIds) {
    if (visibility[id] === false || enabled[id] === false) {
      delete values[id];
    }
  }

  return {
    values,
    pages: buildSubmissionPagesFromValues(version, values, visibility, enabled),
    visibility,
    enabled,
    computedValues,
    nextPageId,
    violations,
    errors: engineErrors,
  };
}
