// src/form/logic/logicStore.ts
/**
 * Logic Store (Zustand + Immer)
 * ────────────────────────────────────────────────────────────────────
 * Manages all logic rules and formula rules for the form builder.
 * Separated from formStore to keep concerns clean.
 * ────────────────────────────────────────────────────────────────────
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type {
  LogicRule,
  FormulaRule,
  Condition,
  RuleAction,
  DependencyEdge,
} from './logicTypes';
import {
  createLogicRule,
  createFormulaRule,
} from './logicTypes';

// ── State ──

interface LogicState {
  rules: LogicRule[];
  formulas: FormulaRule[];
  activeRuleId: string | null;
  activeFormulaId: string | null;
  showDependencyGraph: boolean;
}

// ── Actions ──

interface LogicActions {
  // Rules
  addRule: (name?: string) => string;
  updateRule: (ruleId: string, updates: Partial<Omit<LogicRule, 'ruleId'>>) => void;
  removeRule: (ruleId: string) => void;
  duplicateRule: (ruleId: string) => string | undefined;
  toggleRule: (ruleId: string) => void;

  // Rule condition/action mutations
  updateRuleCondition: (ruleId: string, condition: Condition) => void;
  updateRuleThenActions: (ruleId: string, actions: RuleAction[]) => void;
  updateRuleElseActions: (ruleId: string, actions: RuleAction[]) => void;

  // Formulas
  addFormula: (name?: string) => string;
  updateFormula: (ruleId: string, updates: Partial<Omit<FormulaRule, 'ruleId'>>) => void;
  removeFormula: (ruleId: string) => void;

  // UI
  setActiveRule: (ruleId: string | null) => void;
  setActiveFormula: (formulaId: string | null) => void;
  toggleDependencyGraph: () => void;

  // Bulk
  loadRules: (rules: LogicRule[], formulas: FormulaRule[]) => void;
  clearAll: () => void;
}

export type LogicStore = LogicState & LogicActions;

// ── Store ──

export const useLogicStore = create<LogicStore>()(
  immer((set) => ({
    rules: [],
    formulas: [],
    activeRuleId: null,
    activeFormulaId: null,
    showDependencyGraph: false,

    // ── Rules ──

    addRule: (name) => {
      const rule = createLogicRule(name);
      set((state) => {
        state.rules.push(rule);
        state.activeRuleId = rule.ruleId;
        state.activeFormulaId = null;
      });
      return rule.ruleId;
    },

    updateRule: (ruleId, updates) =>
      set((state) => {
        const rule = state.rules.find((r) => r.ruleId === ruleId);
        if (rule) Object.assign(rule, updates);
      }),

    removeRule: (ruleId) =>
      set((state) => {
        state.rules = state.rules.filter((r) => r.ruleId !== ruleId);
        if (state.activeRuleId === ruleId) state.activeRuleId = null;
      }),

    duplicateRule: (ruleId) => {
      let newId: string | undefined;
      set((state) => {
        const rule = state.rules.find((r) => r.ruleId === ruleId);
        if (!rule) return;
        const clone: LogicRule = JSON.parse(JSON.stringify(rule));
        clone.ruleId = crypto.randomUUID();
        clone.name = `${rule.name} (copy)`;
        newId = clone.ruleId;
        state.rules.push(clone);
        state.activeRuleId = clone.ruleId;
      });
      return newId;
    },

    toggleRule: (ruleId) =>
      set((state) => {
        const rule = state.rules.find((r) => r.ruleId === ruleId);
        if (rule) rule.enabled = !rule.enabled;
      }),

    updateRuleCondition: (ruleId, condition) =>
      set((state) => {
        const rule = state.rules.find((r) => r.ruleId === ruleId);
        if (rule) rule.condition = condition;
      }),

    updateRuleThenActions: (ruleId, actions) =>
      set((state) => {
        const rule = state.rules.find((r) => r.ruleId === ruleId);
        if (rule) rule.thenActions = actions;
      }),

    updateRuleElseActions: (ruleId, actions) =>
      set((state) => {
        const rule = state.rules.find((r) => r.ruleId === ruleId);
        if (rule) rule.elseActions = actions;
      }),

    // ── Formulas ──

    addFormula: (name) => {
      const formula = createFormulaRule(name);
      set((state) => {
        state.formulas.push(formula);
        state.activeFormulaId = formula.ruleId;
        state.activeRuleId = null;
      });
      return formula.ruleId;
    },

    updateFormula: (ruleId, updates) =>
      set((state) => {
        const formula = state.formulas.find((f) => f.ruleId === ruleId);
        if (formula) Object.assign(formula, updates);
      }),

    removeFormula: (ruleId) =>
      set((state) => {
        state.formulas = state.formulas.filter((f) => f.ruleId !== ruleId);
        if (state.activeFormulaId === ruleId) state.activeFormulaId = null;
      }),

    // ── UI ──

    setActiveRule: (ruleId) =>
      set((state) => {
        state.activeRuleId = ruleId;
        if (ruleId) state.activeFormulaId = null;
      }),

    setActiveFormula: (formulaId) =>
      set((state) => {
        state.activeFormulaId = formulaId;
        if (formulaId) state.activeRuleId = null;
      }),

    toggleDependencyGraph: () =>
      set((state) => {
        state.showDependencyGraph = !state.showDependencyGraph;
      }),

    // ── Bulk ──

    loadRules: (rules, formulas) =>
      set((state) => {
        state.rules = rules;
        state.formulas = formulas;
        state.activeRuleId = null;
        state.activeFormulaId = null;
      }),

    clearAll: () =>
      set((state) => {
        state.rules = [];
        state.formulas = [];
        state.activeRuleId = null;
        state.activeFormulaId = null;
      }),
  }))
);

// ── Selectors ──

/** Compute dependency edges from all rules */
export function getDependencyEdges(rules: LogicRule[]): DependencyEdge[] {
  const edges: DependencyEdge[] = [];

  function extractFieldIds(condition: Condition): string[] {
    if (condition.type === 'leaf') {
      return condition.fieldId ? [condition.fieldId] : [];
    }
    return condition.conditions.flatMap(extractFieldIds);
  }

  for (const rule of rules) {
    if (!rule.enabled) continue;
    const sourceFields = extractFieldIds(rule.condition);
    const allActions = [...rule.thenActions, ...rule.elseActions];

    for (const action of allActions) {
      if (!action.targetId) continue;
      for (const sourceFieldId of sourceFields) {
        edges.push({
          sourceFieldId,
          targetId: action.targetId,
          ruleId: rule.ruleId,
          actionType: action.type,
        });
      }
    }
  }

  return edges;
}
