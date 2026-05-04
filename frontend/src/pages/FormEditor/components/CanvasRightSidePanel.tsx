'use client';

import * as React from 'react';
import {
  Settings,
  Form,
  Component,
  Palette,
  Zap,
  Layers,
  LayoutTemplate,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Resizable } from 're-resizable';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { FormPropertiesPanel } from './FormPropertiesPanel';

import { FormFileExplorer } from './FormExplorerPanel';
import { ComponentCatalogPanel } from './ComponentCatalogPanel';
import { GroupCatalogPanel } from './GroupCatalogPanel';
import { TemplateCatalogPanel } from './TemplateCatalogPanel';

import { ThemePanel } from './ThemePanel';
import { LogicPanel } from './LogicPanel';
import { FluxorisWorkflowPanel } from './FluxorisWorkflowPanel';

// --- 1. Data Structure Interface ---
export interface TabItem {
  id: string;
  title: string;
  icon: React.ElementType;
  content: React.ReactNode;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSidebarTabs(tabs: TabItem[], defaultTabId?: string) {
  const [activeTabId, setActiveTabId] = React.useState<string>(
    defaultTabId || tabs[0]?.id
  );

  const [isOpen, setIsOpen] = React.useState(true);

  const activeTab = React.useMemo(() => {
    return tabs.find((t) => t.id === activeTabId) || tabs[0];
  }, [activeTabId, tabs]);

  const handleTabClick = React.useCallback(
    (id: string) => {
      if (isOpen && activeTabId === id) {
        setIsOpen(false); // Close if clicking the already active tab
      } else {
        setActiveTabId(id);
        setIsOpen(true); // Switch tab and ensure panel is open
      }
    },
    [isOpen, activeTabId]
  );

  return { tabs, activeTabId, activeTab, isOpen, handleTabClick };
}

// --- 3. The Sliding Panel (Pure React/Tailwind) ---
function SlidingPanel({ activeTab }: { activeTab: TabItem }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-r bg-background">
      <div className="flex-1 overflow-y-auto">{activeTab.content}</div>
    </div>
  );
}

// --- 4. The Fixed Activity Bar (Icons) ---
function ActivityBar({
  tabs,
  activeTabId,
  isOpen,
  handleTabClick,
}: {
  tabs: TabItem[];
  activeTabId: string;
  isOpen: boolean;
  handleTabClick: (id: string) => void;
}) {
  return (
    <aside className="z-20 flex w-14 shrink-0 flex-col items-center border-l bg-background py-2">
      <div className="flex w-full flex-col items-center gap-[6px] px-2">
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id && isOpen;
          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
                    // Active: Solid background, white icon. Inactive: transparent background, grey icon.
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-primary'
                  )}
                >
                  <tab.icon className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="left"
                sideOffset={14}
                className="font-medium"
              >
                {tab.title}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </aside>
  );
}

// --- 5. Mock Data & Standalone Layout ---
const TABS_DATA: TabItem[] = [
  {
    id: 'formExplorer',
    title: 'Form Explorer',
    icon: Form,
    content: <FormFileExplorer />,
  },
  {
    id: 'formLogic',
    title: 'Form Logic',
    icon: Zap,
    content: <LogicPanel />,
  },
  {
    id: 'formTheme',
    title: 'Form Theme',
    icon: Palette,
    content: <ThemePanel />,
  },
  {
    id: 'workflows',
    title: 'Fluxoris Workflows',
    icon: GitBranch,
    content: <FluxorisWorkflowPanel />,
  },
  {
    id: 'componentsCatalog',
    title: 'Components Catalog',
    icon: Component,
    content: <ComponentCatalogPanel />,
  },
  {
    id: 'groupsCatalog',
    title: 'Groups Catalog',
    icon: Layers,
    content: <GroupCatalogPanel />,
  },
  {
    id: 'templatesCatalog',
    title: 'Templates Catalog',
    icon: LayoutTemplate,
    content: <TemplateCatalogPanel />,
  },
  {
    id: 'formSettings',
    title: 'Form Settings',
    icon: Settings,
    content: <FormPropertiesPanel />,
  },
];

export default function SidebarLayout() {
  const { tabs, activeTabId, activeTab, isOpen, handleTabClick } =
    useSidebarTabs(TABS_DATA);

  return (
    // Standard flex container. Shrink-0 prevents it from being crushed by the canvas.
    <div className="flex h-full shrink-0 bg-background">
      {/* Conditionally render the resizable panel. If closed, it vanishes completely. */}
      {isOpen && (
        <Resizable
          defaultSize={{ width: 400, height: '100%' }}
          minWidth={250}
          maxWidth={600}
          enable={{ left: true }} // Only allow dragging from the left edge
          className="z-10 flex shrink-0 border-l border-l-1 bg-background"
          handleClasses={{
            left: 'hover:bg-primary/30 active:bg-primary/50 transition-colors z-50 cursor-col-resize',
          }}
          handleStyles={{
            left: { width: '4px', left: '-2px' },
          }}
        >
          <SlidingPanel activeTab={activeTab} />
        </Resizable>
      )}

      <ActivityBar
        tabs={tabs}
        activeTabId={activeTabId}
        isOpen={isOpen}
        handleTabClick={handleTabClick}
      />
    </div>
  );
}
