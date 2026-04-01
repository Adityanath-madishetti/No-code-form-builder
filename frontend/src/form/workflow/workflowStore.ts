// src/form/workflow/workflowStore.ts
/**
 * Workflow Store (Zustand + Immer)
 * ────────────────────────────────────────────────────────────────────
 * Manages the workflow state machine definition for the current form.
 * ────────────────────────────────────────────────────────────────────
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Workflow, WorkflowTransition } from './workflowTypes';
import { createTransition } from './workflowTypes';

interface WorkflowState {
  workflow: Workflow;
  dirty: boolean;
}

interface WorkflowActions {
  // Bulk
  loadWorkflow: (workflow: Workflow) => void;
  resetWorkflow: () => void;

  // Enabled
  setEnabled: (enabled: boolean) => void;

  // States
  addState: (state: string) => void;
  removeState: (state: string) => void;
  renameState: (oldName: string, newName: string) => void;
  setInitialState: (state: string) => void;

  // Transitions
  addTransition: (from?: string, to?: string) => string;
  updateTransition: (id: string, updates: Partial<Omit<WorkflowTransition, 'id'>>) => void;
  removeTransition: (id: string) => void;

  // State
  markClean: () => void;
}

export type WorkflowStore = WorkflowState & WorkflowActions;

const DEFAULT_WORKFLOW: Workflow = {
  enabled: false,
  states: [],
  initialState: '',
  transitions: [],
};

export const useWorkflowStore = create<WorkflowStore>()(
  immer((set) => ({
    workflow: { ...DEFAULT_WORKFLOW },
    dirty: false,

    loadWorkflow: (workflow) =>
      set((state) => {
        state.workflow = workflow;
        state.dirty = false;
      }),

    resetWorkflow: () =>
      set((state) => {
        state.workflow = { ...DEFAULT_WORKFLOW };
        state.dirty = false;
      }),

    setEnabled: (enabled) =>
      set((state) => {
        state.workflow.enabled = enabled;
        state.dirty = true;
      }),

    addState: (stateName) =>
      set((state) => {
        const name = stateName.trim().toLowerCase().replace(/\s+/g, '_');
        if (!name || state.workflow.states.includes(name)) return;
        state.workflow.states.push(name);
        if (!state.workflow.initialState) {
          state.workflow.initialState = name;
        }
        state.dirty = true;
      }),

    removeState: (stateName) =>
      set((state) => {
        state.workflow.states = state.workflow.states.filter((s) => s !== stateName);
        // Remove transitions referencing this state
        state.workflow.transitions = state.workflow.transitions.filter(
          (t) => t.from !== stateName && t.to !== stateName
        );
        // Update initialState if needed
        if (state.workflow.initialState === stateName) {
          state.workflow.initialState = state.workflow.states[0] || '';
        }
        state.dirty = true;
      }),

    renameState: (oldName, newName) =>
      set((state) => {
        const name = newName.trim().toLowerCase().replace(/\s+/g, '_');
        if (!name || state.workflow.states.includes(name)) return;

        state.workflow.states = state.workflow.states.map((s) =>
          s === oldName ? name : s
        );
        state.workflow.transitions = state.workflow.transitions.map((t) => ({
          ...t,
          from: t.from === oldName ? name : t.from,
          to: t.to === oldName ? name : t.to,
        }));
        if (state.workflow.initialState === oldName) {
          state.workflow.initialState = name;
        }
        state.dirty = true;
      }),

    setInitialState: (stateName) =>
      set((state) => {
        state.workflow.initialState = stateName;
        state.dirty = true;
      }),

    addTransition: (from, to) => {
      const t = createTransition(from, to);
      set((state) => {
        state.workflow.transitions.push(t);
        state.dirty = true;
      });
      return t.id;
    },

    updateTransition: (id, updates) =>
      set((state) => {
        const t = state.workflow.transitions.find((tr) => tr.id === id);
        if (t) Object.assign(t, updates);
        state.dirty = true;
      }),

    removeTransition: (id) =>
      set((state) => {
        state.workflow.transitions = state.workflow.transitions.filter(
          (t) => t.id !== id
        );
        state.dirty = true;
      }),

    markClean: () =>
      set((state) => {
        state.dirty = false;
      }),
  }))
);
