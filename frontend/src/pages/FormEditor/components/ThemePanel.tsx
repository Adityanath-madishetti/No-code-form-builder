// src/pages/FormEditor/components/ThemePanel.tsx
import { Palette } from 'lucide-react';

export function ThemePanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
      <Palette className="h-8 w-8 opacity-30" />
      <div>
        <p className="text-sm font-medium">Theme editor</p>
        <p className="mt-1 text-xs opacity-70">
          Global, page, and component theming options coming soon.
        </p>
      </div>
    </div>
  );
}
