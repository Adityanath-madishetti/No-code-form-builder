// src/pages/FormEditor/components/LogicPanel.tsx
import { Zap } from 'lucide-react';

export function LogicPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
      <Zap className="h-8 w-8 opacity-30" />
      <div>
        <p className="text-sm font-medium">Logic rules</p>
        <p className="mt-1 text-xs opacity-70">
          Conditional logic and branching rules coming soon.
        </p>
      </div>
    </div>
  );
}
