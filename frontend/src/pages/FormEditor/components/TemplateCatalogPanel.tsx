// src/pages/FormEditor/components/TemplateCatalogPanel.tsx
import { Layers } from 'lucide-react';

export function TemplateCatalogPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
      <Layers className="h-8 w-8 opacity-30" />
      <div>
        <p className="text-sm font-medium">No templates yet</p>
        <p className="mt-1 text-xs opacity-70">
          Save a custom component group to reuse it here.
        </p>
      </div>
    </div>
  );
}
