// src/form/logic/logicTypes.ts
/**
 * Logic System — Type Definitions
 * ────────────────────────────────────────────────────────────────────
 * Defines the type system for conditional rules, formula computations,
 * and actions that drive dynamic form behavior.
 *
 * Key Concepts:
 * - Condition: A tree of comparisons (leaf) grouped by AND/OR (group)
 * - Action: What happens when a condition is met (SHOW, HIDE, etc.)
 * - LogicRule: IF condition THEN actions ELSE actions
 * - FormulaRule: Computes a value from referenced fields
 * ────────────────────────────────────────────────────────────────────
 */

// ── Comparison Operators ──

export const COMPARISON_OPS = [
  'equals',
  'not_equals',
  'contains',
  'not_contains',
  'greater_than',
  'less_than',
  'is_empty',
  'is_not_empty',
] as const;

export type ComparisonOp = (typeof COMPARISON_OPS)[number];

export const COMPARISON_OP_LABELS: Record<ComparisonOp, string> = {
  equals: 'equals',
  not_equals: 'does not equal',
  contains: 'contains',
  not_contains: 'does not contain',
  greater_than: 'is greater than',
  less_than: 'is less than',
  is_empty: 'is empty',
  is_not_empty: 'is not empty',
};

// ── Logical Grouping ──

export type LogicalOp = 'AND' | 'OR';

// ── Condition Tree ──

export interface ConditionLeaf {
  type: 'leaf';
  id: string;
  fieldId: string;            // instanceId of the source component
  operator: ComparisonOp;
  value: unknown;
}

export interface ConditionGroup {
  type: 'group';
  id: string;
  operator: LogicalOp;
  conditions: Condition[];
}

export type Condition = ConditionLeaf | ConditionGroup;

// ── Actions ──

export const ACTION_TYPES = [
  'SHOW',
  'HIDE',
  'ENABLE',
  'DISABLE',
  'SET_VALUE',
  'SKIP_PAGE',
] as const;

export type ActionType = (typeof ACTION_TYPES)[number];

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  SHOW: 'Show',
  HIDE: 'Hide',
  ENABLE: 'Enable',
  DISABLE: 'Disable',
  SET_VALUE: 'Set value',
  SKIP_PAGE: 'Skip page',
};

export const ACTION_TYPE_COLORS: Record<ActionType, string> = {
  SHOW: 'text-green-600',
  HIDE: 'text-red-500',
  ENABLE: 'text-blue-500',
  DISABLE: 'text-orange-500',
  SET_VALUE: 'text-violet-500',
  SKIP_PAGE: 'text-amber-600',
};

export interface RuleAction {
  id: string;
  type: ActionType;
  targetId: string;           // componentId or pageId
  value?: unknown;            // for SET_VALUE
}

// ── Logic Rule ──

export interface LogicRule {
  ruleId: string;
  name: string;
  enabled: boolean;
  condition: Condition;
  thenActions: RuleAction[];
  elseActions: RuleAction[];
}

// ── Formula Rule ──

export interface FormulaRule {
  ruleId: string;
  name: string;
  enabled: boolean;
  targetId: string;           // component to set computed value on
  expression: string;         // e.g. "{field1} + {field2} * 2"
  referencedFields: string[];
}

// ── Dependency Graph ──

export interface DependencyEdge {
  sourceFieldId: string;
  targetId: string;
  ruleId: string;
  actionType: ActionType;
}

export interface DependencyNode {
  id: string;
  label: string;
  type: 'component' | 'page';
}

// ── Helpers ──

export function createConditionLeaf(fieldId = ''): ConditionLeaf {
  return {
    type: 'leaf',
    id: crypto.randomUUID(),
    fieldId,
    operator: 'equals',
    value: '',
  };
}

export function createConditionGroup(operator: LogicalOp = 'AND'): ConditionGroup {
  return {
    type: 'group',
    id: crypto.randomUUID(),
    operator,
    conditions: [createConditionLeaf()],
  };
}

export function createRuleAction(type: ActionType = 'SHOW'): RuleAction {
  return {
    id: crypto.randomUUID(),
    type,
    targetId: '',
  };
}

export function createLogicRule(name = 'New Rule'): LogicRule {
  return {
    ruleId: crypto.randomUUID(),
    name,
    enabled: true,
    condition: createConditionGroup('AND'),
    thenActions: [createRuleAction('SHOW')],
    elseActions: [],
  };
}

export function createFormulaRule(name = 'New Formula'): FormulaRule {
  return {
    ruleId: crypto.randomUUID(),
    name,
    enabled: true,
    targetId: '',
    expression: '',
    referencedFields: [],
  };
}
