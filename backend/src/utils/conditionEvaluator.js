/**
 * Condition Evaluator
 * ────────────────────────────────────────────────────────────────────
 * Safe condition parser that evaluates string expressions against
 * submission data WITHOUT using eval().
 *
 * Supported operators: ==, !=, <, >, <=, >=, contains
 *
 * Examples:
 *   "leave_days <= 3"
 *   "status == approved"
 *   "department contains engineering"
 * ────────────────────────────────────────────────────────────────────
 */

const OPERATORS = {
    "==": (a, b) => String(a) === String(b),
    "!=": (a, b) => String(a) !== String(b),
    "<": (a, b) => Number(a) < Number(b),
    ">": (a, b) => Number(a) > Number(b),
    "<=": (a, b) => Number(a) <= Number(b),
    ">=": (a, b) => Number(a) >= Number(b),
    contains: (a, b) => String(a).toLowerCase().includes(String(b).toLowerCase()),
};

// Ordered longest-first so "<=" is matched before "<"
const OPERATOR_KEYS = ["<=", ">=", "!=", "==", "<", ">", "contains"];

/**
 * Parse a string condition into { field, operator, value }.
 *
 * @param {string} condition - e.g. "leave_days <= 3"
 * @returns {{ field: string, operator: string, value: string }}
 */
export function parseCondition(condition) {
    if (!condition || typeof condition !== "string") {
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
 *
 * @param {string|null} condition - condition string or null/empty
 * @param {Object} data - flat key-value data from submission
 * @returns {boolean}
 */
export function evaluateCondition(condition, data = {}) {
    // No condition = always true
    if (!condition || typeof condition !== "string" || condition.trim() === "") {
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
    // Support dot notation: "address.city"
    const fieldValue = resolveField(data, field);

    return fn(fieldValue, value);
}

/**
 * Resolve a field from data, supporting dot notation.
 */
function resolveField(data, field) {
    if (!data || !field) return undefined;

    const parts = field.split(".");
    let current = data;

    for (const part of parts) {
        if (current == null || typeof current !== "object") return undefined;
        current = current[part];
    }

    return current;
}
