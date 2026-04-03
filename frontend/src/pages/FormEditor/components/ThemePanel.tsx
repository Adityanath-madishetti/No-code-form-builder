// src/pages/FormEditor/components/ThemePanel.tsx
import { Palette, ArrowRight } from 'lucide-react';

/**
 * Sidebar placeholder that directs users to the full theming page.
 * The actual theming is done in the ThemingPage view.
 */
export function ThemePanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-muted-foreground">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
        <Palette className="h-7 w-7 text-purple-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Theme Editor</p>
        <p className="mt-1 max-w-[200px] text-xs opacity-70">
          Customize colors, backgrounds, layouts, and component styles for your
          form.
        </p>
      </div>
      <p className="flex items-center gap-1 text-xs font-medium text-primary">
        Click &ldquo;Theme&rdquo; in the top bar
        <ArrowRight className="h-3 w-3" />
      </p>
    </div>
  );
}
