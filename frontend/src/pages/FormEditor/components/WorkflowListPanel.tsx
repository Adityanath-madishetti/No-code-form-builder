import { useMemo } from 'react';
import { GitBranch } from 'lucide-react';
import { useWorkflowStore } from '@/form/workflow/workflowStore';
import { STATE_COLORS } from '@/form/workflow/workflowTypes';

export function WorkflowListPanel() {
  const workflow = useWorkflowStore((s) => s.workflow);

  const stateColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    workflow.states.forEach((s, i) => {
      map[s] = STATE_COLORS[i % STATE_COLORS.length];
    });
    return map;
  }, [workflow.states]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between border border-border/50 bg-background px-2 py-1">
        <span className="text-xs font-semibold">Workflow</span>
        <span className="text-[10px] font-medium text-muted-foreground">
          {workflow.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {workflow.states.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-muted-foreground">
          <GitBranch className="h-8 w-8 opacity-30" />
          <div>
            <p className="text-xs font-medium">No workflow configured</p>
            <p className="mt-1 text-[10px] opacity-70">
              Add workflow states in the Workflow editor (top bar).
            </p>
          </div>
        </div>
      ) : (
        <>
          <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            States ({workflow.states.length})
          </h4>

          <div className="space-y-1">
            {workflow.states.map((state) => (
              <div
                key={state}
                className="flex items-center gap-2 border border-border px-2 py-1"
              >
                <span className={`h-2 w-2 shrink-0 ${stateColorMap[state]}`} />
                <span className="min-w-0 flex-1 truncate text-xs font-medium">
                  {state}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

