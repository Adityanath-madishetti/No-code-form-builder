import type { LogicRule, FormulaRule, ComponentShuffleStack } from '@/form/logic/logicTypes';

export interface RuntimeComponent {
  componentId: string;
  componentType: string;
  label: string;
  props: Record<string, unknown>;
  validation: Record<string, unknown>;
  required?: boolean;
}

export interface RuntimePage {
  pageId: string;
  pageNo: number;
  title: string;
  description?: string;
  components: RuntimeComponent[];
}

export interface RuntimeLogicPayload {
  rules?: LogicRule[];
  formulas?: FormulaRule[];
  componentShuffleStacks?: ComponentShuffleStack[];
}

export interface RuntimeEvaluation {
  values: Record<string, unknown>;
  visibility: Record<string, boolean>;
  enabled: Record<string, boolean>;
  validationErrors: Record<string, string>;
  nextPageId: string | null;
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length === 0;
  return false;
}

function evaluateLeaf(
  leaf: { instanceId?: string; operator?: string; value?: unknown },
  values: Record<string, unknown>
): boolean {
  const left = values[leaf.instanceId || ''];
  const right = leaf.value;
  switch (leaf.operator) {
    case 'equals':
      return toText(left) === toText(right);
    case 'not_equals':
      return toText(left) !== toText(right);
    case 'contains':
      if (Array.isArray(left)) {
        return left.some((entry) => toText(entry) === toText(right));
      }
      return toText(left).toLowerCase().includes(toText(right).toLowerCase());
    case 'not_contains':
      if (Array.isArray(left)) {
        return !left.some((entry) => toText(entry) === toText(right));
      }
      return !toText(left).toLowerCase().includes(toText(right).toLowerCase());
    case 'greater_than':
      return toNumber(left) > toNumber(right);
    case 'less_than':
      return toNumber(left) < toNumber(right);
    case 'is_empty':
      return isEmpty(left);
    case 'is_not_empty':
      return !isEmpty(left);
    default:
      return false;
  }
}

export function evaluateConditionTree(
  condition: unknown,
  values: Record<string, unknown>
): boolean {
  if (!condition || typeof condition !== 'object') return true;
  const node = condition as Record<string, unknown>;
  if (node.type === 'leaf') {
    return evaluateLeaf(
      {
        instanceId:
          (typeof node.instanceId === 'string' && node.instanceId) ||
          ((node.fieldId as string) || ''),
        operator: (node.operator as string) || 'equals',
        value: node.value,
      },
      values
    );
  }
  const children = Array.isArray(node.conditions) ? node.conditions : [];
  if (children.length === 0) return true;
  const operator = node.operator === 'OR' ? 'OR' : 'AND';
  if (operator === 'OR') {
    return children.some((child) => evaluateConditionTree(child, values));
  }
  return children.every((child) => evaluateConditionTree(child, values));
}

type ExprToken =
  | { type: 'number'; value: string }
  | { type: 'string'; value: string }
  | { type: 'field'; value: string }
  | { type: 'ident'; value: string }
  | { type: 'op'; value: string };

function tokenizeExpression(expression: string): ExprToken[] {
  const out: ExprToken[] = [];
  let i = 0;
  while (i < expression.length) {
    const c = expression[i];
    if (/\s/.test(c)) {
      i += 1;
      continue;
    }
    if (c === '{') {
      const close = expression.indexOf('}', i + 1);
      if (close === -1) throw new Error('Unclosed field reference');
      out.push({ type: 'field', value: expression.slice(i + 1, close).trim() });
      i = close + 1;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      let value = '';
      while (j < expression.length && expression[j] !== c) {
        value += expression[j];
        j += 1;
      }
      if (j >= expression.length) throw new Error('Unclosed string literal');
      out.push({ type: 'string', value });
      i = j + 1;
      continue;
    }
    const two = expression.slice(i, i + 2);
    if (['==', '!=', '>=', '<='].includes(two)) {
      out.push({ type: 'op', value: two });
      i += 2;
      continue;
    }
    if (['+', '-', '*', '/', '(', ')', ',', '<', '>'].includes(c)) {
      out.push({ type: 'op', value: c });
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < expression.length && /[0-9.]/.test(expression[j])) j += 1;
      out.push({ type: 'number', value: expression.slice(i, j) });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < expression.length && /[A-Za-z0-9_]/.test(expression[j])) j += 1;
      out.push({ type: 'ident', value: expression.slice(i, j) });
      i = j;
      continue;
    }
    throw new Error(`Unexpected token "${c}"`);
  }
  return out;
}

function runFormulaFunction(name: string, args: unknown[]): unknown {
  const fn = name.toUpperCase();
  switch (fn) {
    case 'IF':
      return args[0] ? args[1] : args[2];
    case 'MIN':
      return Math.min(...args.map((entry) => toNumber(entry)));
    case 'MAX':
      return Math.max(...args.map((entry) => toNumber(entry)));
    case 'ROUND': {
      const value = toNumber(args[0]);
      const precision = Math.max(0, Math.floor(toNumber(args[1] ?? 0)));
      const factor = 10 ** precision;
      return Math.round(value * factor) / factor;
    }
    case 'CONCAT':
      return args.map((entry) => toText(entry)).join('');
    case 'LEN': {
      const value = args[0];
      if (value === null || value === undefined) return 0;
      if (Array.isArray(value)) return value.length;
      if (typeof value === 'object') {
        return Object.keys(value as Record<string, unknown>).length;
      }
      return String(value).length;
    }
    default:
      throw new Error(`Unsupported function "${name}"`);
  }
}

function parseExpression(
  tokens: ExprToken[],
  values: Record<string, unknown>
): unknown {
  let index = 0;
  const peek = () => tokens[index] || null;
  const consume = (expected?: string) => {
    const token = tokens[index];
    if (!token) throw new Error('Unexpected end of expression');
    if (expected && token.value !== expected) {
      throw new Error(`Expected "${expected}" but found "${token.value}"`);
    }
    index += 1;
    return token;
  };

  const parsePrimary = (): unknown => {
    const token = peek();
    if (!token) throw new Error('Unexpected end of expression');
    if (token.type === 'number') {
      consume();
      return Number(token.value);
    }
    if (token.type === 'string') {
      consume();
      return token.value;
    }
    if (token.type === 'field') {
      consume();
      return values[token.value];
    }
    if (token.type === 'ident') {
      consume();
      const ident = token.value;
      if (peek()?.value === '(') {
        consume('(');
        const args: unknown[] = [];
        if (peek()?.value !== ')') {
          args.push(parseComparison());
          while (peek()?.value === ',') {
            consume(',');
            args.push(parseComparison());
          }
        }
        consume(')');
        return runFormulaFunction(ident, args);
      }
      return values[ident];
    }
    if (token.value === '(') {
      consume('(');
      const out = parseComparison();
      consume(')');
      return out;
    }
    if (token.value === '-') {
      consume('-');
      return -toNumber(parsePrimary());
    }
    throw new Error(`Unexpected token "${token.value}"`);
  };

  const parseMulDiv = (): unknown => {
    let left = parsePrimary();
    while (peek() && ['*', '/'].includes(peek()!.value)) {
      const op = consume().value;
      const right = parsePrimary();
      if (op === '*') left = toNumber(left) * toNumber(right);
      if (op === '/') left = toNumber(left) / (toNumber(right) || 1);
    }
    return left;
  };

  const parseAddSub = (): unknown => {
    let left = parseMulDiv();
    while (peek() && ['+', '-'].includes(peek()!.value)) {
      const op = consume().value;
      const right = parseMulDiv();
      if (op === '+') {
        if (typeof left === 'string' || typeof right === 'string') {
          left = `${toText(left)}${toText(right)}`;
        } else {
          left = toNumber(left) + toNumber(right);
        }
      } else {
        left = toNumber(left) - toNumber(right);
      }
    }
    return left;
  };

  const parseComparison = (): unknown => {
    let left = parseAddSub();
    while (peek() && ['==', '!=', '>', '<', '>=', '<='].includes(peek()!.value)) {
      const op = consume().value;
      const right = parseAddSub();
      switch (op) {
        case '==':
          left = toText(left) === toText(right);
          break;
        case '!=':
          left = toText(left) !== toText(right);
          break;
        case '>':
          left = toNumber(left) > toNumber(right);
          break;
        case '<':
          left = toNumber(left) < toNumber(right);
          break;
        case '>=':
          left = toNumber(left) >= toNumber(right);
          break;
        case '<=':
          left = toNumber(left) <= toNumber(right);
          break;
      }
    }
    return left;
  };

  const result = parseComparison();
  if (index < tokens.length) {
    throw new Error(`Unexpected token "${tokens[index].value}"`);
  }
  return result;
}

export function evaluateFormulaExpression(
  expression: string,
  values: Record<string, unknown>
): unknown {
  return parseExpression(tokenizeExpression(expression), values);
}

export function evaluateRuntimeLogic(
  logic: RuntimeLogicPayload | undefined,
  pages: RuntimePage[],
  inputValues: Record<string, unknown>
): RuntimeEvaluation {
  const rules = logic?.rules || [];
  const formulas = logic?.formulas || [];
  const values: Record<string, unknown> = { ...inputValues };

  const componentIds = pages.flatMap((page) =>
    page.components.map((component) => component.componentId)
  );

  const visibility: Record<string, boolean> = {};
  const enabled: Record<string, boolean> = {};
  componentIds.forEach((id) => {
    visibility[id] = true;
    enabled[id] = true;
  });

  for (const formula of formulas) {
    if (!formula.enabled || !formula.targetId || !formula.expression) continue;
    try {
      values[formula.targetId] = evaluateFormulaExpression(formula.expression, values);
    } catch {
      // keep runtime resilient in UI
    }
  }

  let nextPageId: string | null = null;
  for (const rule of rules) {
    if (!rule.enabled || rule.ruleType === 'validation') continue;
    const passed = evaluateConditionTree(rule.condition, values);
    const actions = passed ? rule.thenActions : rule.elseActions;
    for (const action of actions) {
      if (!action.targetId) continue;
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
          break;
        case 'SKIP_PAGE':
          if (rule.ruleType === 'navigation' && passed && !nextPageId) {
            nextPageId = action.targetId;
          }
          break;
      }
    }
  }

  const validationErrors: Record<string, string> = {};
  for (const rule of rules) {
    if (!rule.enabled || rule.ruleType !== 'validation') continue;
    const invalid = evaluateConditionTree(rule.condition, values);
    if (!invalid) continue;
    if (rule.thenActions.length === 0) continue;
    for (const action of rule.thenActions) {
      if (!action.targetId) continue;
      validationErrors[action.targetId] =
        (typeof action.value === 'string' && action.value.trim()) ||
        'Validation failed';
    }
  }

  return {
    values,
    visibility,
    enabled,
    validationErrors,
    nextPageId,
  };
}

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: string) {
  let t = hashString(seed) + 0x6d2b79f5;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function deterministicShuffle<T>(items: T[], seed: string): T[] {
  const out = [...items];
  const rnd = seededRandom(seed);
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function getComponentOrderForPage(
  page: RuntimePage,
  stacks: ComponentShuffleStack[] | undefined,
  seed: string
): RuntimeComponent[] {
  const pageStacks = (stacks || []).filter(
    (stack) => stack.enabled && stack.pageId === page.pageId && stack.componentIds.length > 1
  );
  if (pageStacks.length === 0) return page.components;

  const byId = new Map(page.components.map((component) => [component.componentId, component]));
  const used = new Set<string>();
  const out: RuntimeComponent[] = [];

  for (const component of page.components) {
    if (used.has(component.componentId)) continue;

    const stack = pageStacks.find((entry) => entry.componentIds.includes(component.componentId));
    if (!stack) {
      out.push(component);
      used.add(component.componentId);
      continue;
    }

    const stackComponents = stack.componentIds
      .map((componentId) => byId.get(componentId))
      .filter((value): value is RuntimeComponent => Boolean(value));
    const shuffled = deterministicShuffle(
      stackComponents,
      `${seed}:stack:${stack.stackId}`
    );
    shuffled.forEach((entry) => {
      out.push(entry);
      used.add(entry.componentId);
    });
  }

  for (const component of page.components) {
    if (!used.has(component.componentId)) out.push(component);
  }
  return out;
}

export function getShuffledOptions<T extends { id?: string; value?: string }>(
  options: T[],
  shuffle: boolean,
  seed: string
): T[] {
  if (!shuffle || options.length < 2) return options;
  return deterministicShuffle(options, seed);
}

export function hasRequiredValidation(component: RuntimeComponent): boolean {
  return (
    component.required === true ||
    (component.validation as { required?: boolean })?.required === true
  );
}

export function isResponseEmpty(value: unknown): boolean {
  return isEmpty(value);
}

