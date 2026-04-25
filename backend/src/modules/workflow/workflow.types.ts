// backend/src/modules/workflow/workflow.types.ts

export interface ITransition {
  id: string;
  from: string;
  to: string;
  condition?: string;
  roles?: string[];
  label?: string;
}

export interface IWorkflow {
  enabled: boolean;
  states: string[];
  initialState: string;
  transitions: ITransition[];
}

export interface IHistoryEntry {
  from: string;
  to: string;
  transitionId: string;
  timestamp: Date;
  user: string;
  note: string;
}

export interface ITransitionResult {
  submissionId: string;
  currentState: string;
  status: string;
  historyEntry: IHistoryEntry;
}

export interface IAvailableTransitions {
  currentState: string | null;
  transitions: {
    id: string;
    from: string;
    to: string;
    label: string;
    roles?: string[];
  }[];
}
