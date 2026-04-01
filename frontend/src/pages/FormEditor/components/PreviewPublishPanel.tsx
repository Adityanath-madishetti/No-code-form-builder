// src/pages/FormEditor/components/PreviewPublishPanel.tsx
import { Eye } from 'lucide-react';

export function PreviewPublishPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
      <Eye className="h-8 w-8 opacity-30" />
      <div>
        <p className="text-sm font-medium">Preview & Publish</p>
        <p className="mt-1 text-xs opacity-70">
          Preview your form and manage publish settings — coming soon.
        </p>
      </div>
    </div>
  );
}
