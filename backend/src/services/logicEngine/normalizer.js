import crypto from "crypto";

const RULE_TYPES = new Set(["field", "validation", "navigation"]);
const ACTION_TYPES = new Set([
    "SHOW",
    "HIDE",
    "ENABLE",
    "DISABLE",
    "SET_VALUE",
    "SKIP_PAGE",
    "CONDITIONAL",
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

    let targetId = typeof action?.targetId === "string" ? action.targetId : "";
    if (targetId.trim() === "") targetId = "UNASSIGNED";

    const normalized = {
        id: typeof action?.id === "string" ? action.id : crypto.randomUUID(),
        type,
        targetId,
        value: action?.value,
    };

    if (type === "CONDITIONAL") {
        normalized.targetId = "NESTED_LOGIC_BLOCK"; 
        
        normalized.condition = normalizeConditionNode(action.condition);
        
        normalized.thenActions = Array.isArray(action.thenActions)
            ? action.thenActions.map(normalizeAction) // <-- Recursive call
            : [];
            
        normalized.elseActions = Array.isArray(action.elseActions)
            ? action.elseActions.map(normalizeAction) // <-- Recursive call
            : [];
    }

    return normalized;
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

    let targetId = typeof formula.targetId === "string" ? formula.targetId : "";
    if (targetId.trim() === "") targetId = "UNASSIGNED";

    return {
        ruleId:
            typeof formula.ruleId === "string"
                ? formula.ruleId
                : crypto.randomUUID(),
        name: typeof formula.name === "string" ? formula.name : "New Formula",
        enabled: formula.enabled !== false,
        targetId,
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
