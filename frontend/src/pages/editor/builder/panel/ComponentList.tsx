/**
 * ComponentListPanel — shows a scrollable tree of all components on the current page.
 * Clicking a component selects it; the active component is highlighted.
 */

import { useFormStore } from '@/form/store/form.store';
import { useShallow } from 'zustand/react/shallow';
import { COMPONENT_ICONS } from '../ComponentCatalogWindow';
import { AlignLeft, GripVertical, Trash2 } from 'lucide-react';
import { getComponentDisplayName } from '@/form/registry/componentRegistry.helpers';

interface ComponentListPanelProps {
  pageId: string | null;
  pageIndex?: number;
}

export function ComponentListPanel({
  pageId,
  pageIndex,
}: ComponentListPanelProps) {
  const form = useFormStore((s) => s.form);
  const resolvedPageId =
    pageId ?? (pageIndex != null ? (form?.pages[pageIndex] ?? null) : null);
  const page = useFormStore(
    useShallow((s) => (resolvedPageId ? s.pages[resolvedPageId] : null))
  );
  const components = useFormStore((s) => s.components);
  const activeComponentId = useFormStore((s) => s.activeComponentId);
  const setActiveComponent = useFormStore((s) => s.setActiveComponent);
  const setActivePage = useFormStore((s) => s.setActivePage);
  const removeComponent = useFormStore((s) => s.removeComponent);

  if (!page || page.children.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1.5 p-4 text-center">
        <p className="text-[11px] text-muted-foreground/40">
          No components yet
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 p-1.5">
      {page.children.map((instanceId) => {
        const comp = components[instanceId];
        if (!comp) return null;

        const isActive = activeComponentId === instanceId;
        const Icon = COMPONENT_ICONS[comp.id] ?? AlignLeft;
        const displayName =
          comp.metadata.label || getComponentDisplayName(comp.id);

        return (
          <button
            key={instanceId}
            onClick={() => {
              setActiveComponent(instanceId);
              setActivePage(null);
            }}
            className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {/* <GripVertical className="h-3 w-3 shrink-0 opacity-30" /> */}
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate">{displayName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeComponent(instanceId);
              }}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </button>
        );
      })}
    </div>
  );
}
