// src/pages/FormEditor/components/AIPanel.tsx
import { Sparkles } from 'lucide-react';

export function AIPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
      <Sparkles className="h-8 w-8 opacity-30" />
      <div>
        <p className="text-sm font-medium">AI Assistant</p>
        <p className="mt-1 text-xs opacity-70">
          Generate and edit forms using natural language — coming soon.
        </p>
      </div>
    </div>
  );
}
