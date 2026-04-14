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
  ComponentShuffleStack,
  RuleType,
} from './logicTypes';
import {
  createLogicRule,
  createFormulaRule,
  createComponentShuffleStack,
} from './logicTypes';

// ── State ──

interface LogicState {
  rules: LogicRule[];
  formulas: FormulaRule[];
  componentShuffleStacks: ComponentShuffleStack[];
  activeRuleId: string | null;
  activeFormulaId: string | null;
  showDependencyGraph: boolean;
  popoutRuleIds: string[];
}

// ── Actions ──

interface LogicActions {
  // Rules
  addRule: (
    name?: string,
    ruleType?: RuleType,
    initialFieldId?: string
  ) => string;
  updateRule: (
    ruleId: string,
    updates: Partial<Omit<LogicRule, 'ruleId'>>
  ) => void;
  removeRule: (ruleId: string) => void;
  duplicateRule: (ruleId: string) => string | undefined;
  toggleRule: (ruleId: string) => void;

  // Rule condition/action mutations
  updateRuleCondition: (ruleId: string, condition: Condition) => void;
  updateRuleThenActions: (ruleId: string, actions: RuleAction[]) => void;
  updateRuleElseActions: (ruleId: string, actions: RuleAction[]) => void;

  // Formulas
  addFormula: (name?: string, initialFieldId?: string) => string;
  updateFormula: (
    ruleId: string,
    updates: Partial<Omit<FormulaRule, 'ruleId'>>
  ) => void;
  removeFormula: (ruleId: string) => void;

  // Shuffle stacks
  addComponentShuffleStack: (name?: string) => string;
  updateComponentShuffleStack: (
    stackId: string,
    updates: Partial<Omit<ComponentShuffleStack, 'stackId'>>
  ) => void;
  removeComponentShuffleStack: (stackId: string) => void;

  // UI
  setActiveRule: (ruleId: string | null) => void;
  setActiveFormula: (formulaId: string | null) => void;
  toggleDependencyGraph: () => void;

  // New actions for window management
  openPopoutRule: (ruleId: string) => void;
  closePopoutRule: (ruleId: string) => void;

  // Bulk
  loadRules: (
    rules: LogicRule[],
    formulas: FormulaRule[],
    stacks?: ComponentShuffleStack[]
  ) => void;
  clearAll: () => void;
}

export type LogicStore = LogicState & LogicActions;

// ── Store ──

export const useLogicStore = create<LogicStore>()(
  immer((set) => ({
    rules: [],
    formulas: [],
    componentShuffleStacks: [],
    activeRuleId: null,
    activeFormulaId: null,
    showDependencyGraph: false,
    popoutRuleIds: [],

    // ── Rules ──

    addRule: (name, ruleType = 'field', initialFieldId) => {
      const rule = createLogicRule(name, ruleType, initialFieldId);
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
        if (rule) {
          Object.assign(rule, updates, { updatedAt: new Date().toISOString() });
        }
      }),

    removeRule: (ruleId) =>
      set((state) => {
        state.rules = state.rules.filter((r) => r.ruleId !== ruleId);
        if (state.activeRuleId === ruleId) state.activeRuleId = null;
        state.popoutRuleIds = state.popoutRuleIds.filter((id) => id !== ruleId);
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
        if (rule) {
          rule.enabled = !rule.enabled;
          rule.updatedAt = new Date().toISOString();
        }
      }),

    updateRuleCondition: (ruleId, condition) =>
      set((state) => {
        const rule = state.rules.find((r) => r.ruleId === ruleId);
        if (rule) {
          rule.condition = condition;
          rule.updatedAt = new Date().toISOString();
        }
      }),

    updateRuleThenActions: (ruleId, actions) =>
      set((state) => {
        const rule = state.rules.find((r) => r.ruleId === ruleId);
        if (rule) {
          rule.thenActions = actions;
          rule.updatedAt = new Date().toISOString();
        }
      }),

    updateRuleElseActions: (ruleId, actions) =>
      set((state) => {
        const rule = state.rules.find((r) => r.ruleId === ruleId);
        if (rule) {
          rule.elseActions = actions;
          rule.updatedAt = new Date().toISOString();
        }
      }),

    // ── Formulas ──

    addFormula: (name, initialFieldId) => {
      const formula = createFormulaRule(name, initialFieldId);
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
        if (formula) {
          Object.assign(formula, updates, {
            updatedAt: new Date().toISOString(),
          });
        }
      }),

    removeFormula: (ruleId) =>
      set((state) => {
        state.formulas = state.formulas.filter((f) => f.ruleId !== ruleId);
        if (state.activeFormulaId === ruleId) state.activeFormulaId = null;
        state.popoutRuleIds = state.popoutRuleIds.filter((id) => id !== ruleId);
      }),

    // ── Shuffle stacks ──

    addComponentShuffleStack: (name) => {
      const stack = createComponentShuffleStack();
      if (name && name.trim()) stack.name = name.trim();
      set((state) => {
        state.componentShuffleStacks.push(stack);
      });
      return stack.stackId;
    },

    updateComponentShuffleStack: (stackId, updates) =>
      set((state) => {
        const stack = state.componentShuffleStacks.find(
          (s) => s.stackId === stackId
        );
        if (stack) Object.assign(stack, updates);
      }),

    removeComponentShuffleStack: (stackId) =>
      set((state) => {
        state.componentShuffleStacks = state.componentShuffleStacks.filter(
          (stack) => stack.stackId !== stackId
        );
      }),

    // ── UI ──

    setActiveRule: (ruleId) =>
      set((state) => {
        if (ruleId === state.activeRuleId) {
          state.activeRuleId = null;
        } else {
          state.activeRuleId = ruleId;
        }
        if (ruleId) state.activeFormulaId = null;
      }),

    setActiveFormula: (formulaId) =>
      set((state) => {
        if (formulaId === state.activeFormulaId) {
          state.activeFormulaId = null;
        } else {
          state.activeFormulaId = formulaId;
        }
        state.activeFormulaId = formulaId;
        if (formulaId) state.activeRuleId = null;
      }),

    toggleDependencyGraph: () =>
      set((state) => {
        state.showDependencyGraph = !state.showDependencyGraph;
      }),

    openPopoutRule: (ruleId) =>
      set((state) => ({
        // Prevent duplicates
        popoutRuleIds: state.popoutRuleIds.includes(ruleId)
          ? state.popoutRuleIds
          : [...state.popoutRuleIds, ruleId],
      })),

    closePopoutRule: (ruleId) =>
      set((state) => ({
        popoutRuleIds: state.popoutRuleIds.filter((id) => id !== ruleId),
      })),

    // ── Bulk ──

    loadRules: (rules, formulas, stacks = []) =>
      set((state) => {
        state.rules = (rules || []).map((rule) => ({
          ...rule,
          ruleType: rule.ruleType || 'field',
          updatedAt: rule.updatedAt || new Date().toISOString(),
        }));
        state.formulas = (formulas || []).map((formula) => ({
          ...formula,
          updatedAt: formula.updatedAt || new Date().toISOString(),
        }));
        state.componentShuffleStacks = stacks || [];
        state.activeRuleId = null;
        state.activeFormulaId = null;
      }),

    clearAll: () =>
      set((state) => {
        state.rules = [];
        state.formulas = [];
        state.componentShuffleStacks = [];
        state.activeRuleId = null;
        state.activeFormulaId = null;
      }),
  }))
);

// ── Selectors ──

/** Compute dependency edges from all rules/formulas */
export function getDependencyEdges(
  rules: LogicRule[],
  formulas: FormulaRule[] = []
): DependencyEdge[] {
  const edges: DependencyEdge[] = [];

  // Helper to extract component IDs from a condition tree
  function extractFieldIds(condition: Condition): string[] {
    if (condition.type === 'leaf') {
      return condition.instanceId ? [condition.instanceId] : [];
    }
    return condition.conditions.flatMap(extractFieldIds);
  }

  // Recursive helper to process nested actions and inherited dependencies
  function processActions(
    actions: RuleAction[],
    inheritedSourceFields: string[],
    ruleId: string
  ) {
    for (const action of actions) {
      if (action.type === 'CONDITIONAL') {
        // 1. Extract sources from this specific nested condition
        const nestedSources = action.condition
          ? extractFieldIds(action.condition)
          : [];

        // 2. Combine parent condition sources with nested condition sources
        const combinedSources = [...inheritedSourceFields, ...nestedSources];

        // 3. Recursively process children
        if (action.thenActions)
          processActions(action.thenActions, combinedSources, ruleId);
        if (action.elseActions)
          processActions(action.elseActions, combinedSources, ruleId);
      } else {
        // Standard Action: Create edges linking all inherited sources to this target
        if (!action.targetId) continue;
        for (const sourceFieldId of inheritedSourceFields) {
          edges.push({
            sourceFieldId,
            targetId: action.targetId,
            ruleId,
            actionType: action.type,
          });
        }
      }
    }
  }

  // Process Logic Rules
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const rootSourceFields = extractFieldIds(rule.condition);

    // Kick off the recursive trace
    processActions(rule.thenActions, rootSourceFields, rule.ruleId);
    processActions(rule.elseActions, rootSourceFields, rule.ruleId);
  }

  // Process Formulas
  for (const formula of formulas) {
    if (!formula.enabled || !formula.targetId) continue;
    for (const sourceFieldId of formula.referencedFields || []) {
      if (!sourceFieldId) continue;
      edges.push({
        sourceFieldId,
        targetId: formula.targetId,
        ruleId: formula.ruleId,
        actionType: 'SET_VALUE',
      });
    }
  }

  return edges;
}

export type RuleWarningType = 'SAME_TARGET' | 'CASCADING';

export interface RuleWarning {
  warningType: RuleWarningType;
  label: string;
  ruleA: { id: string; name: string; type: 'logic' | 'formula' };
  ruleB: { id: string; name: string; type: 'logic' | 'formula' };
  componentIds: string[];
  description: string;
}

/**
 * Scans all rules and formulas to find specific architectural conflicts:
 * - SAME_TARGET: Two different rules/formulas try to modify the exact same component.
 * - CASCADING: One rule modifies a component that another rule relies on for its condition.
 */
export function getRuleDiagnostics(
  rules: LogicRule[],
  formulas: FormulaRule[] = []
): RuleWarning[] {
  const footprints: Array<{
    id: string;
    name: string;
    type: 'logic' | 'formula';
    reads: Set<string>; // Components checked in conditions or formulas
    writes: Set<string>; // Components modified by actions or formula targets
  }> = [];

  // Helper to extract READS from a condition tree
  function extractReads(
    condition?: Condition,
    set = new Set<string>()
  ): Set<string> {
    if (!condition) return set;
    if (condition.type === 'leaf') {
      if (condition.instanceId) set.add(condition.instanceId);
    } else {
      condition.conditions.forEach((cond) => extractReads(cond, set));
    }
    return set;
  }

  // Helper to extract WRITES (and nested READS) from actions
  function processActions(
    actions: RuleAction[],
    reads: Set<string>,
    writes: Set<string>
  ) {
    for (const action of actions) {
      if (action.type === 'CONDITIONAL') {
        // Nested logic block: extract its condition to reads, and process inner actions
        extractReads(action.condition, reads);
        if (action.thenActions)
          processActions(action.thenActions, reads, writes);
        if (action.elseActions)
          processActions(action.elseActions, reads, writes);
      } else {
        // Standard action: extract target to writes
        if (action.targetId && action.targetId !== 'NESTED_LOGIC_BLOCK') {
          writes.add(action.targetId);
        }
      }
    }
  }

  // 1. Calculate Read/Write footprints for Logic Rules
  for (const rule of rules) {
    if (!rule.enabled) continue; // Optional: skip disabled rules
    const reads = new Set<string>();
    const writes = new Set<string>();

    extractReads(rule.condition, reads);
    processActions(rule.thenActions, reads, writes);
    processActions(rule.elseActions, reads, writes);

    footprints.push({
      id: rule.ruleId,
      name: rule.name,
      type: 'logic',
      reads,
      writes,
    });
  }

  // 2. Calculate Read/Write footprints for Formula Rules
  for (const formula of formulas) {
    if (!formula.enabled) continue;
    const reads = new Set<string>(formula.referencedFields || []);
    const writes = new Set<string>();

    if (formula.targetId) writes.add(formula.targetId);

    footprints.push({
      id: formula.ruleId,
      name: formula.name,
      type: 'formula',
      reads,
      writes,
    });
  }

  // 3. Cross-reference footprints to find exact warning types
  const warnings: RuleWarning[] = [];

  for (let i = 0; i < footprints.length; i++) {
    for (let j = i + 1; j < footprints.length; j++) {
      const a = footprints[i];
      const b = footprints[j];

      // Warning 1: SAME TARGET (Both try to write to the same component)
      const sharedWrites = [...a.writes].filter((id) => b.writes.has(id));
      if (sharedWrites.length > 0) {
        warnings.push({
          warningType: 'SAME_TARGET',
          label: 'Same Target Warning',
          ruleA: { id: a.id, name: a.name, type: a.type },
          ruleB: { id: b.id, name: b.name, type: b.type },
          componentIds: sharedWrites,
          description: `Both rules are trying to modify the same component(s). This can create race conditions.`,
        });
      }

      // Warning 2: CASCADING (A writes to a component that B reads)
      const cascadeAtoB = [...a.writes].filter((id) => b.reads.has(id));
      if (cascadeAtoB.length > 0) {
        warnings.push({
          warningType: 'CASCADING',
          label: 'Cascading Warning',
          ruleA: { id: a.id, name: a.name, type: a.type }, // A modifies
          ruleB: { id: b.id, name: b.name, type: b.type }, // B reads
          componentIds: cascadeAtoB,
          description: `'${a.name}' modifies a component that '${b.name}' relies on. Ensure this cascade is intentional.`,
        });
      }

      // Warning 3: CASCADING (B writes to a component that A reads)
      const cascadeBtoA = [...b.writes].filter((id) => a.reads.has(id));
      if (cascadeBtoA.length > 0) {
        warnings.push({
          warningType: 'CASCADING',
          label: 'Cascading Warning',
          ruleA: { id: b.id, name: b.name, type: b.type }, // B modifies
          ruleB: { id: a.id, name: a.name, type: a.type }, // A reads
          componentIds: cascadeBtoA,
          description: `'${b.name}' modifies a component that '${a.name}' relies on. Ensure this cascade is intentional.`,
        });
      }
    }
  }

  return warnings;
}
