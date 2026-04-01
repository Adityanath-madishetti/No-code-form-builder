// src/pages/FormEditor/components/WorkflowPanel.tsx
import { GitBranch } from 'lucide-react';

export function WorkflowPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
      <GitBranch className="h-8 w-8 opacity-30" />
      <div>
        <p className="text-sm font-medium">Workflow builder</p>
        <p className="mt-1 text-xs opacity-70">
          Post-submission automations and integrations coming soon.
        </p>
      </div>
    </div>
  );
}
