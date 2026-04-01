// src/form/workflow/workflowTypes.ts
/**
 * Workflow Types
 * ────────────────────────────────────────────────────────────────────
 * Type definitions for the workflow state machine.
 * ────────────────────────────────────────────────────────────────────
 */

export interface WorkflowTransition {
  id: string;
  from: string;
  to: string;
  condition: string;
  roles: string[];
  label: string;
}

export interface Workflow {
  enabled: boolean;
  states: string[];
  initialState: string;
  transitions: WorkflowTransition[];
}

// State node colors for the visual diagram
export const STATE_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-orange-500',
] as const;

// ── Factory Helpers ──

export function createEmptyWorkflow(): Workflow {
  return {
    enabled: false,
    states: ['submitted', 'approved', 'rejected'],
    initialState: 'submitted',
    transitions: [
      {
        id: crypto.randomUUID(),
        from: 'submitted',
        to: 'approved',
        condition: '',
        roles: [],
        label: 'Approve',
      },
      {
        id: crypto.randomUUID(),
        from: 'submitted',
        to: 'rejected',
        condition: '',
        roles: [],
        label: 'Reject',
      },
    ],
  };
}

export function createTransition(from = '', to = ''): WorkflowTransition {
  return {
    id: crypto.randomUUID(),
    from,
    to,
    condition: '',
    roles: [],
    label: '',
  };
}
