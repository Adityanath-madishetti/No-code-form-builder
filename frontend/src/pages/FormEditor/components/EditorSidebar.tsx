// src/pages/FormEditor/components/EditorSidebar.tsx
import {
  LayoutGrid,
  Zap,
  // Layers,
  // Palette,
  // Zap,
  // GitBranch,
  // Sparkles,
  // FolderOpen
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type SidebarPanelId =
  | 'components'
  | 'templates'
  | 'theme'
  | 'logic'
  | 'workflow'
  | 'ai'
  | 'groups';

const NAV_ITEMS: {
  id: SidebarPanelId;
  label: string;
  icon: React.ElementType;
}[] = [
    { id: 'components', label: 'Components', icon: LayoutGrid },
    // { id: 'templates', label: 'Templates', icon: Layers },
    // { id: 'theme', label: 'Theme', icon: Palette },
    // { id: 'groups', label: 'Groups', icon: FolderOpen },
    { id: 'logic', label: 'Logic', icon: Zap },
    // { id: 'workflow', label: 'Workflow', icon: GitBranch },
    // { id: 'ai', label: 'AI Assistant', icon: Sparkles },
  ];

interface EditorSidebarProps {
  activePanel: SidebarPanelId | null;
  onPanelChange: (panel: SidebarPanelId | null) => void;
}

export function EditorSidebar({ activePanel, onPanelChange }: EditorSidebarProps) {
  const handleClick = (panelId: SidebarPanelId) => {
    onPanelChange(activePanel === panelId ? null : panelId);
  };

  return (
    <div className="flex h-full w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-background py-3">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const isActive = activePanel === id;
        return (
          <Tooltip key={id} delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleClick(id)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-150 ${isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                aria-label={label}
                aria-pressed={isActive}
              >
                <Icon className="h-[18px] w-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
