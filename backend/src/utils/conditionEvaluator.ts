// backend/src/utils/conditionEvaluator.ts

/**
 * Condition Evaluator
 * ────────────────────────────────────────────────────────────────────
 * Safe condition parser that evaluates string expressions against
 * submission data WITHOUT using eval().
 */

type OperatorFn = (a: any, b: any) => boolean;

const OPERATORS: Record<string, OperatorFn> = {
  '==': (a, b) => String(a) === String(b),
  '!=': (a, b) => String(a) !== String(b),
  '<': (a, b) => Number(a) < Number(b),
  '>': (a, b) => Number(a) > Number(b),
  '<=': (a, b) => Number(a) <= Number(b),
  '>=': (a, b) => Number(a) >= Number(b),
  contains: (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
};

const OPERATOR_KEYS = ['<=', '>=', '!=', '==', '<', '>', 'contains'];

/**
 * Parse a string condition into { field, operator, value }.
 */
export function parseCondition(condition: string): {
  field: string;
  operator: string;
  value: string;
} | null {
  if (!condition || typeof condition !== 'string') {
    return null;
  }

  const trimmed = condition.trim();

  for (const op of OPERATOR_KEYS) {
    const idx = trimmed.indexOf(` ${op} `);
    if (idx !== -1) {
      const field = trimmed.substring(0, idx).trim();
      const value = trimmed.substring(idx + op.length + 2).trim();
      return { field, operator: op, value };
    }
  }

  throw new Error(`Cannot parse condition: "${condition}". Use format: "field operator value"`);
}

/**
 * Evaluate a condition string against submission data.
 */
export function evaluateCondition(condition: string | null | undefined, data: any = {}): boolean {
  // No condition = always true
  if (!condition || typeof condition !== 'string' || condition.trim() === '') {
    return true;
  }

  const parsed = parseCondition(condition);
  if (!parsed) return true;

  const { field, operator, value } = parsed;
  const fn = OPERATORS[operator];

  if (!fn) {
    throw new Error(`Unknown operator: "${operator}"`);
  }

  // Resolve the field value from data
  const fieldValue = resolveField(data, field);

  return fn(fieldValue, value);
}

/**
 * Resolve a field from data, supporting dot notation.
 */
function resolveField(data: any, field: string): any {
  if (!data || !field) return undefined;

  const parts = field.split('.');
  let current = data;

  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }

  return current;
}
