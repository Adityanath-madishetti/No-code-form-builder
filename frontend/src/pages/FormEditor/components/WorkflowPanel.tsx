// src/pages/FormEditor/components/WorkflowPanel.tsx
/**
 * Workflow Panel — Sidebar for managing workflow states and transitions.
 * Shows the state machine definition with visual state diagram.
 */
import { useState, useMemo } from 'react';
import {
  GitBranch,
  Plus,
  Trash2,
  ArrowRight,
  Power,
  Play,
  ChevronDown,
  ChevronRight,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkflowStore } from '@/form/workflow/workflowStore';
import { STATE_COLORS, createEmptyWorkflow } from '@/form/workflow/workflowTypes';

export function WorkflowPanel() {
  const workflow = useWorkflowStore((s) => s.workflow);
  const setEnabled = useWorkflowStore((s) => s.setEnabled);
  const addState = useWorkflowStore((s) => s.addState);
  const removeState = useWorkflowStore((s) => s.removeState);
  const setInitialState = useWorkflowStore((s) => s.setInitialState);
  const addTransition = useWorkflowStore((s) => s.addTransition);
  const updateTransition = useWorkflowStore((s) => s.updateTransition);
  const removeTransition = useWorkflowStore((s) => s.removeTransition);
  const loadWorkflow = useWorkflowStore((s) => s.loadWorkflow);

  const [newStateName, setNewStateName] = useState('');
  const [showTransitions, setShowTransitions] = useState(true);
  const [showDiagram, setShowDiagram] = useState(true);

  const stateColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    workflow.states.forEach((s, i) => {
      map[s] = STATE_COLORS[i % STATE_COLORS.length];
    });
    return map;
  }, [workflow.states]);

  const handleAddState = () => {
    if (newStateName.trim()) {
      addState(newStateName);
      setNewStateName('');
    }
  };

  const handleSetupDefault = () => {
    loadWorkflow(createEmptyWorkflow());
  };

  // Empty / disabled state
  if (!workflow.enabled && workflow.states.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
        <GitBranch className="h-8 w-8 opacity-20" />
        <div>
          <p className="text-xs font-medium">No workflow configured</p>
          <p className="mt-1 text-[10px] opacity-70">
            Add a state machine to manage submission lifecycle.
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleSetupDefault}>
          <Play className="mr-1 h-3 w-3" />
          Setup Default Workflow
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Enable toggle */}
      <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-2.5 py-1.5">
        <span className="text-xs font-medium">Workflow Active</span>
        <button
          onClick={() => setEnabled(!workflow.enabled)}
          className={`relative h-5 w-9 rounded-full transition-colors ${
            workflow.enabled ? 'bg-green-500' : 'bg-muted-foreground/30'
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              workflow.enabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* States */}
      <div>
        <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          States ({workflow.states.length})
        </h4>
        <div className="space-y-1">
          {workflow.states.map((state) => {
            const isInitial = workflow.initialState === state;
            return (
              <div
                key={state}
                className="group flex items-center gap-1.5 rounded-md border border-border px-2 py-1"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${stateColorMap[state]}`}
                />
                <span className="flex-1 min-w-0 truncate text-xs font-medium">
                  {state}
                </span>
                {isInitial && (
                  <span className="shrink-0 rounded bg-amber-500/10 px-1 py-0 text-[9px] font-semibold text-amber-600">
                    initial
                  </span>
                )}
                <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
                  {!isInitial && (
                    <button
                      onClick={() => setInitialState(state)}
                      title="Set as initial state"
                      className="rounded p-0.5 text-muted-foreground hover:text-amber-500 transition-colors"
                    >
                      <Star className="h-2.5 w-2.5" />
                    </button>
                  )}
                  <button
                    onClick={() => removeState(state)}
                    title="Remove state"
                    className="rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add state */}
        <div className="mt-1.5 flex gap-1">
          <input
            type="text"
            value={newStateName}
            onChange={(e) => setNewStateName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddState()}
            placeholder="New state name…"
            className="h-7 flex-1 min-w-0 rounded border border-input bg-background px-2 text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={handleAddState}
            disabled={!newStateName.trim()}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Transitions */}
      <div>
        <button
          onClick={() => setShowTransitions(!showTransitions)}
          className="mb-1.5 flex w-full items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
        >
          {showTransitions ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Transitions ({workflow.transitions.length})
        </button>

        {showTransitions && (
          <>
            <div className="space-y-1.5">
              {workflow.transitions.map((t) => (
                <div
                  key={t.id}
                  className="group rounded-md border border-border bg-muted/20 px-2 py-1.5"
                >
                  {/* From → To */}
                  <div className="flex items-center gap-1">
                    <select
                      value={t.from}
                      onChange={(e) => updateTransition(t.id, { from: e.target.value })}
                      className="h-6 min-w-0 flex-1 rounded border border-input bg-background px-1 text-[10px]"
                    >
                      <option value="">from…</option>
                      {workflow.states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <select
                      value={t.to}
                      onChange={(e) => updateTransition(t.id, { to: e.target.value })}
                      className="h-6 min-w-0 flex-1 rounded border border-input bg-background px-1 text-[10px]"
                    >
                      <option value="">to…</option>
                      {workflow.states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeTransition(t.id)}
                      className="hidden shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive transition-colors group-hover:block"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  {/* Label */}
                  <input
                    type="text"
                    value={t.label}
                    onChange={(e) => updateTransition(t.id, { label: e.target.value })}
                    placeholder="Label (e.g. Approve)"
                    className="mt-1 h-5 w-full rounded border border-input bg-background px-1.5 text-[10px]"
                  />

                  {/* Condition */}
                  <input
                    type="text"
                    value={t.condition}
                    onChange={(e) => updateTransition(t.id, { condition: e.target.value })}
                    placeholder="Condition (e.g. leave_days <= 3)"
                    className="mt-0.5 h-5 w-full rounded border border-input bg-background px-1.5 text-[10px] font-mono"
                  />

                  {/* Roles */}
                  <input
                    type="text"
                    value={t.roles.join(', ')}
                    onChange={(e) =>
                      updateTransition(t.id, {
                        roles: e.target.value
                          .split(',')
                          .map((r) => r.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="Roles (comma-separated, e.g. admin, manager)"
                    className="mt-0.5 h-5 w-full rounded border border-input bg-background px-1.5 text-[10px]"
                  />
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="mt-1.5 h-6 w-full text-[10px]"
              onClick={() => addTransition()}
            >
              <Plus className="mr-0.5 h-2.5 w-2.5" />
              Add Transition
            </Button>
          </>
        )}
      </div>

      {/* Visual Diagram */}
      <div className="border-t border-border pt-2">
        <button
          onClick={() => setShowDiagram(!showDiagram)}
          className="mb-1.5 flex w-full items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
        >
          {showDiagram ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          State Diagram
        </button>

        {showDiagram && workflow.states.length > 0 && (
          <div className="rounded-md border border-border bg-background p-3">
            <div className="flex flex-wrap gap-2">
              {workflow.states.map((state) => {
                const outgoing = workflow.transitions.filter((t) => t.from === state);
                const isInitial = workflow.initialState === state;
                return (
                  <div key={state} className="space-y-0.5">
                    {/* Node */}
                    <div
                      className={`flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium ${
                        isInitial
                          ? 'border-amber-500 bg-amber-500/10 text-amber-700'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${stateColorMap[state]}`} />
                      {state}
                      {isInitial && <Star className="h-2 w-2 text-amber-500" />}
                    </div>
                    {/* Outgoing edges */}
                    {outgoing.map((t) => (
                      <div
                        key={t.id}
                        className="ml-2 flex items-center gap-0.5 text-[9px] text-muted-foreground"
                      >
                        <ArrowRight className="h-2 w-2" />
                        <span className="font-medium">{t.to}</span>
                        {t.label && (
                          <span className="text-primary/60">({t.label})</span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Power action */}
      <div className="mt-auto border-t border-border pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-full text-[10px] text-muted-foreground"
          onClick={() => {
            if (confirm('Reset workflow to defaults?')) {
              loadWorkflow(createEmptyWorkflow());
            }
          }}
        >
          <Power className="mr-1 h-2.5 w-2.5" />
          Reset to Default
        </Button>
      </div>
    </div>
  );
}
