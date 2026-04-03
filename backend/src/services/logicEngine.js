import crypto from "crypto";

const RULE_TYPES = new Set(["field", "validation", "navigation"]);
const ACTION_TYPES = new Set([
    "SHOW",
    "HIDE",
    "ENABLE",
    "DISABLE",
    "SET_VALUE",
    "SKIP_PAGE",
]);

function asIso(value) {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime())) {
        return new Date().toISOString();
    }
    return d.toISOString();
}

function normalizeConditionNode(node) {
    if (!node || typeof node !== "object") {
        return {
            type: "group",
            id: crypto.randomUUID(),
            operator: "AND",
            conditions: [],
        };
    }

    if (node.type === "leaf") {
        const instanceId =
            typeof node.instanceId === "string"
                ? node.instanceId
                : typeof node.fieldId === "string"
                    ? node.fieldId
                    : "";

        return {
            type: "leaf",
            id: typeof node.id === "string" ? node.id : crypto.randomUUID(),
            instanceId,
            operator: typeof node.operator === "string" ? node.operator : "equals",
            value: node.value,
        };
    }

    const children = Array.isArray(node.conditions)
        ? node.conditions.map(normalizeConditionNode)
        : [];

    return {
        type: "group",
        id: typeof node.id === "string" ? node.id : crypto.randomUUID(),
        operator: node.operator === "OR" ? "OR" : "AND",
        conditions: children,
    };
}

function normalizeAction(action) {
    const type = ACTION_TYPES.has(action?.type) ? action.type : "SHOW";
    return {
        id: typeof action?.id === "string" ? action.id : crypto.randomUUID(),
        type,
        targetId: typeof action?.targetId === "string" ? action.targetId : "",
        value: action?.value,
    };
}

function extractReferencedFields(expression = "") {
    const refs = new Set();
    const matches = String(expression).match(/\{([^}]+)\}/g) || [];
    for (const match of matches) {
        const id = match.slice(1, -1).trim();
        if (id) refs.add(id);
    }
    return [...refs];
}

function normalizeRule(rule = {}) {
    return {
        ruleId: typeof rule.ruleId === "string" ? rule.ruleId : crypto.randomUUID(),
        name: typeof rule.name === "string" ? rule.name : "New Rule",
        enabled: rule.enabled !== false,
        ruleType: RULE_TYPES.has(rule.ruleType) ? rule.ruleType : "field",
        updatedAt: asIso(rule.updatedAt),
        condition: normalizeConditionNode(rule.condition),
        thenActions: Array.isArray(rule.thenActions)
            ? rule.thenActions.map(normalizeAction)
            : [],
        elseActions: Array.isArray(rule.elseActions)
            ? rule.elseActions.map(normalizeAction)
            : [],
    };
}

function normalizeFormula(formula = {}) {
    const expression =
        typeof formula.expression === "string" ? formula.expression : "";

    const referencedFields = Array.isArray(formula.referencedFields)
        ? formula.referencedFields
            .filter((id) => typeof id === "string" && id.trim())
            .map((id) => id.trim())
        : extractReferencedFields(expression);

    return {
        ruleId:
            typeof formula.ruleId === "string"
                ? formula.ruleId
                : crypto.randomUUID(),
        name: typeof formula.name === "string" ? formula.name : "New Formula",
        enabled: formula.enabled !== false,
        targetId: typeof formula.targetId === "string" ? formula.targetId : "",
        expression,
        referencedFields,
        updatedAt: asIso(formula.updatedAt),
    };
}

function normalizeShuffleStack(stack = {}) {
    const componentIds = Array.isArray(stack.componentIds)
        ? stack.componentIds.filter((id) => typeof id === "string" && id.trim())
        : [];

    return {
        stackId: typeof stack.stackId === "string" ? stack.stackId : crypto.randomUUID(),
        name: typeof stack.name === "string" ? stack.name : "New Stack",
        pageId: typeof stack.pageId === "string" ? stack.pageId : "",
        componentIds: [...new Set(componentIds)],
        enabled: stack.enabled !== false,
    };
}

export function normalizeLogicPayload(logic = {}) {
    const rules = Array.isArray(logic?.rules)
        ? logic.rules.map(normalizeRule)
        : [];
    const formulas = Array.isArray(logic?.formulas)
        ? logic.formulas.map(normalizeFormula)
        : [];
    const componentShuffleStacks = Array.isArray(logic?.componentShuffleStacks)
        ? logic.componentShuffleStacks.map(normalizeShuffleStack)
        : [];

    return { rules, formulas, componentShuffleStacks };
}

function toNumber(value) {
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value ? 1 : 0;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
}

function toText(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === "string") return value.trim() === "";
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
}

function evaluateLeafCondition(leaf, values) {
    const left = values[leaf.instanceId];
    const right = leaf.value;

    switch (leaf.operator) {
        case "equals":
            return toText(left) === toText(right);
        case "not_equals":
            return toText(left) !== toText(right);
        case "contains":
            if (Array.isArray(left)) {
                return left.some((entry) => toText(entry) === toText(right));
            }
            return toText(left).toLowerCase().includes(toText(right).toLowerCase());
        case "not_contains":
            if (Array.isArray(left)) {
                return !left.some((entry) => toText(entry) === toText(right));
            }
            return !toText(left).toLowerCase().includes(toText(right).toLowerCase());
        case "greater_than":
            return toNumber(left) > toNumber(right);
        case "less_than":
            return toNumber(left) < toNumber(right);
        case "is_empty":
            return isEmpty(left);
        case "is_not_empty":
            return !isEmpty(left);
        default:
            return false;
    }
}

export function evaluateConditionTree(condition, values) {
    if (!condition) return true;
    if (condition.type === "leaf") {
        return evaluateLeafCondition(condition, values);
    }

    const children = Array.isArray(condition.conditions)
        ? condition.conditions
        : [];
    if (children.length === 0) return true;

    if (condition.operator === "OR") {
        return children.some((child) => evaluateConditionTree(child, values));
    }

    return children.every((child) => evaluateConditionTree(child, values));
}

function tokenizeExpression(expression) {
    const tokens = [];
    let i = 0;
    const src = expression || "";

    while (i < src.length) {
        const c = src[i];

        if (/\s/.test(c)) {
            i += 1;
            continue;
        }

        if (c === "{" ) {
            const close = src.indexOf("}", i + 1);
            if (close === -1) {
                throw new Error("Unclosed field reference");
            }
            const fieldId = src.slice(i + 1, close).trim();
            tokens.push({ type: "field", value: fieldId });
            i = close + 1;
            continue;
        }

        if (c === "'" || c === "\"") {
            let j = i + 1;
            let out = "";
            while (j < src.length && src[j] !== c) {
                out += src[j];
                j += 1;
            }
            if (j >= src.length) {
                throw new Error("Unclosed string literal");
            }
            tokens.push({ type: "string", value: out });
            i = j + 1;
            continue;
        }

        const twoChar = src.slice(i, i + 2);
        if (["==", "!=", ">=", "<="].includes(twoChar)) {
            tokens.push({ type: "op", value: twoChar });
            i += 2;
            continue;
        }

        if (["+","-","*","/","(",")",",",">","<"].includes(c)) {
            tokens.push({ type: "op", value: c });
            i += 1;
            continue;
        }

        if (/[0-9.]/.test(c)) {
            let j = i;
            while (j < src.length && /[0-9.]/.test(src[j])) j += 1;
            tokens.push({ type: "number", value: src.slice(i, j) });
            i = j;
            continue;
        }

        if (/[A-Za-z_]/.test(c)) {
            let j = i;
            while (j < src.length && /[A-Za-z0-9_]/.test(src[j])) j += 1;
            tokens.push({ type: "ident", value: src.slice(i, j) });
            i = j;
            continue;
        }

        throw new Error(`Unexpected token "${c}"`);
    }

    return tokens;
}

function createParser(tokens, values) {
    let idx = 0;

    function peek() {
        return tokens[idx] || null;
    }

    function consume(expectedValue) {
        const token = tokens[idx];
        if (!token) {
            throw new Error("Unexpected end of expression");
        }
        if (expectedValue && token.value !== expectedValue) {
            throw new Error(`Expected "${expectedValue}" but found "${token.value}"`);
        }
        idx += 1;
        return token;
    }

    function parsePrimary() {
        const token = peek();
        if (!token) throw new Error("Unexpected end of expression");

        if (token.type === "number") {
            consume();
            return Number(token.value);
        }
        if (token.type === "string") {
            consume();
            return token.value;
        }
        if (token.type === "field") {
            consume();
            return values[token.value];
        }
        if (token.type === "ident") {
            consume();
            const ident = token.value;
            const next = peek();
            if (next && next.value === "(") {
                consume("(");
                const args = [];
                if (!(peek() && peek().value === ")")) {
                    args.push(parseComparison());
                    while (peek() && peek().value === ",") {
                        consume(",");
                        args.push(parseComparison());
                    }
                }
                consume(")");
                return runFormulaFunction(ident, args);
            }
            return values[ident];
        }
        if (token.value === "(") {
            consume("(");
            const expr = parseComparison();
            consume(")");
            return expr;
        }
        if (token.value === "-") {
            consume("-");
            return -toNumber(parsePrimary());
        }
        throw new Error(`Unexpected token "${token.value}"`);
    }

    function parseMulDiv() {
        let left = parsePrimary();
        while (peek() && ["*", "/"].includes(peek().value)) {
            const op = consume().value;
            const right = parsePrimary();
            if (op === "*") left = toNumber(left) * toNumber(right);
            if (op === "/") left = toNumber(left) / (toNumber(right) || 1);
        }
        return left;
    }

    function parseAddSub() {
        let left = parseMulDiv();
        while (peek() && ["+", "-"].includes(peek().value)) {
            const op = consume().value;
            const right = parseMulDiv();
            if (op === "+") {
                if (typeof left === "string" || typeof right === "string") {
                    left = `${toText(left)}${toText(right)}`;
                } else {
                    left = toNumber(left) + toNumber(right);
                }
            } else {
                left = toNumber(left) - toNumber(right);
            }
        }
        return left;
    }

    function parseComparison() {
        let left = parseAddSub();
        while (
            peek() &&
            ["==", "!=", ">", "<", ">=", "<="].includes(peek().value)
        ) {
            const op = consume().value;
            const right = parseAddSub();
            switch (op) {
                case "==":
                    left = toText(left) === toText(right);
                    break;
                case "!=":
                    left = toText(left) !== toText(right);
                    break;
                case ">":
                    left = toNumber(left) > toNumber(right);
                    break;
                case "<":
                    left = toNumber(left) < toNumber(right);
                    break;
                case ">=":
                    left = toNumber(left) >= toNumber(right);
                    break;
                case "<=":
                    left = toNumber(left) <= toNumber(right);
                    break;
                default:
                    break;
            }
        }
        return left;
    }

    function parseExpression() {
        const out = parseComparison();
        if (idx < tokens.length) {
            throw new Error(`Unexpected token "${tokens[idx].value}"`);
        }
        return out;
    }

    return { parseExpression };
}

function runFormulaFunction(name, args) {
    const fn = String(name || "").toUpperCase();
    switch (fn) {
        case "IF":
            return args[0] ? args[1] : args[2];
        case "MIN":
            return Math.min(...args.map((v) => toNumber(v)));
        case "MAX":
            return Math.max(...args.map((v) => toNumber(v)));
        case "ROUND": {
            const value = toNumber(args[0]);
            const precision = Math.max(0, Math.floor(toNumber(args[1] ?? 0)));
            const factor = 10 ** precision;
            return Math.round(value * factor) / factor;
        }
        case "CONCAT":
            return args.map((v) => toText(v)).join("");
        case "LEN": {
            const value = args[0];
            if (value === null || value === undefined) return 0;
            if (Array.isArray(value)) return value.length;
            if (typeof value === "object") return Object.keys(value).length;
            return String(value).length;
        }
        default:
            throw new Error(`Unsupported function "${name}"`);
    }
}

export function evaluateFormulaExpression(expression, values) {
    const tokens = tokenizeExpression(expression || "");
    const parser = createParser(tokens, values);
    return parser.parseExpression();
}

function flattenSubmissionPages(pages = []) {
    const values = {};
    for (const page of pages) {
        for (const response of page?.responses || []) {
            values[response.componentId] = response.response;
        }
    }
    return values;
}

function buildComponentMap(version) {
    const componentIds = [];
    const componentMap = {};
    const pageByComponent = {};

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

function buildSubmissionPagesFromValues(version, values, visibility, enabled) {
    const pages = [];

    for (const page of version?.pages || []) {
        const responses = [];
        for (const component of page?.components || []) {
            const componentId = component?.componentId;
            if (!componentId) continue;
            if (component.componentType === "heading") continue;
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

function collectRequiredViolations(version, values, visibility, enabled) {
    const violations = [];
    for (const page of version?.pages || []) {
        for (const component of page?.components || []) {
            if (!component?.componentId) continue;
            if (component.componentType === "heading") continue;

            const componentId = component.componentId;
            if (visibility[componentId] === false || enabled[componentId] === false) {
                continue;
            }

            const isRequired =
                component.required === true ||
                component.validation?.required === true;
            if (!isRequired) continue;

            if (isEmpty(values[componentId])) {
                violations.push({
                    ruleId: "required",
                    targetId: componentId,
                    message: `${component.label || componentId} is required`,
                    stage: "submit",
                });
            }
        }
    }
    return violations;
}

export function evaluateFormLogicRuntime({
    version,
    pages = [],
    stage = "submit",
}) {
    const logic = normalizeLogicPayload(version?.logic || {});
    const values = flattenSubmissionPages(pages);
    const { componentIds } = buildComponentMap(version);

    const visibility = {};
    const enabled = {};
    for (const id of componentIds) {
        visibility[id] = true;
        enabled[id] = true;
    }

    const computedValues = {};
    const violations = [];
    const engineErrors = [];
    let nextPageId = null;

    // 1) Formula pass
    for (const formula of logic.formulas) {
        if (!formula.enabled || !formula.targetId || !formula.expression) continue;
        try {
            const result = evaluateFormulaExpression(formula.expression, values);
            values[formula.targetId] = result;
            computedValues[formula.targetId] = result;
        } catch (err) {
            engineErrors.push({
                ruleId: formula.ruleId,
                targetId: formula.targetId,
                message: err.message || "Failed to evaluate formula",
                stage,
            });
        }
    }

    // 2) Non-validation rules
    for (const rule of logic.rules) {
        if (!rule.enabled) continue;
        if (rule.ruleType === "validation") continue;

        let conditionPassed = false;
        try {
            conditionPassed = evaluateConditionTree(rule.condition, values);
        } catch (err) {
            engineErrors.push({
                ruleId: rule.ruleId,
                targetId: "",
                message: err.message || "Failed to evaluate rule condition",
                stage,
            });
            continue;
        }

        const actions = conditionPassed ? rule.thenActions : rule.elseActions;
        for (const action of actions) {
            if (!action?.targetId) continue;
            switch (action.type) {
                case "SHOW":
                    visibility[action.targetId] = true;
                    break;
                case "HIDE":
                    visibility[action.targetId] = false;
                    break;
                case "ENABLE":
                    enabled[action.targetId] = true;
                    break;
                case "DISABLE":
                    enabled[action.targetId] = false;
                    break;
                case "SET_VALUE":
                    values[action.targetId] = action.value;
                    computedValues[action.targetId] = action.value;
                    break;
                case "SKIP_PAGE":
                    if (
                        !nextPageId &&
                        rule.ruleType === "navigation" &&
                        conditionPassed
                    ) {
                        nextPageId = action.targetId;
                    }
                    break;
                default:
                    break;
            }
        }
    }

    // 3) Validation rules
    for (const rule of logic.rules) {
        if (!rule.enabled || rule.ruleType !== "validation") continue;

        let conditionPassed = false;
        try {
            conditionPassed = evaluateConditionTree(rule.condition, values);
        } catch (err) {
            engineErrors.push({
                ruleId: rule.ruleId,
                targetId: "",
                message: err.message || "Failed to evaluate validation rule",
                stage,
            });
            continue;
        }

        if (!conditionPassed) continue;
        const actions = rule.thenActions || [];
        if (actions.length === 0) {
            violations.push({
                ruleId: rule.ruleId,
                targetId: "",
                message: "Validation rule failed",
                stage,
            });
            continue;
        }

        for (const action of actions) {
            violations.push({
                ruleId: rule.ruleId,
                targetId: action?.targetId || "",
                message:
                    typeof action?.value === "string" && action.value.trim()
                        ? action.value
                        : "Validation rule failed",
                stage,
            });
        }
    }

    // 4) Required-field checks after visibility/enablement resolution
    violations.push(...collectRequiredViolations(version, values, visibility, enabled));

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
