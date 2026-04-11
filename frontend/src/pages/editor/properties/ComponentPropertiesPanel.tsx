// src/pages/FormEditor/components/ComponentPropertiesPanel.tsx
/**
 * Right-side properties panel that shows settings for the selected component.
 * Auto-shows when a component is selected.
 */
/* eslint-disable react-hooks/static-components */

import { useFormStore } from '@/form/store/form.store';
import { useShallow } from 'zustand/react/shallow';
import { getComponentPropsRenderer } from '@/form/registry/componentRegistry';
import { Settings2, EyeOff } from 'lucide-react';
import { useMemo } from 'react';
import { inp } from '@/form/components/ComponentRender.Helper';

// function supportsHidden(props: unknown): boolean {
//   if (!props || typeof props !== 'object') return false;
//   return 'hidden' in (props as object);
// }

export function ComponentPropertiesPanel() {
  const activeComponentId = useFormStore((s) => s.activeComponentId);
  const activePageId = useFormStore((s) => s.activePageId);
  const updateComponentProps = useFormStore((s) => s.updateComponentProps);
  const component = useFormStore(
    useShallow((s) =>
      activeComponentId ? s.components[activeComponentId] : null
    )
  );

  const SettingsRenderer = useMemo(() => {
    if (!component) return null;
    return getComponentPropsRenderer(component.id);
  }, [component]);

  // Nothing selected
  if (!component && !activePageId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
        <Settings2 className="h-6 w-6 text-muted-foreground/20" />
        <p className="text-xs text-muted-foreground/40">
          Select a component to edit its properties
        </p>
      </div>
    );
  }

  // Page selected
  if (activePageId && !component) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <PageProperties pageId={activePageId} />
      </div>
    );
  }

  // Component selected
  if (!component) return null;

  const hiddenByDefault =
    ((component.props as unknown as Record<string, unknown>)
      ?.hiddenByDefault as boolean | undefined) === true;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Component type badge */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase">
          {component.metadata.label}
        </span>
      </div>

      {/* Label editor */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Label
        </label>
        <LabelEditor
          instanceId={component.instanceId}
          label={component.metadata.label}
        />
      </div>

      {/* Component settings renderer */}
      {SettingsRenderer && (
        <div className="border-t border-border pt-3">
          <SettingsRenderer
            instanceId={component.instanceId}
            metadata={component.metadata}
            props={component.props}
            validation={component.validation}
          />
        </div>
      )}

      {/* {supportsHidden(component.props) && (
        <div className="border-t border-border pt-3">
          <label className="flex cursor-pointer items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <EyeOff className="h-3 w-3" />
              Hidden by default
            </span>
            <input
              type="checkbox"
              checked={hiddenByDefault}
              onChange={(e) =>
                updateComponentProps(component.instanceId, {
                  hidden: e.target.checked,
                })
              }
            />
          </label>
          {hiddenByDefault && (
            <p className="mt-1 text-[10px] text-muted-foreground/50">
              This component starts hidden. Use Logic rules to show it.
            </p>
          )}
        </div>
      )} */}

      <div className="border-t border-border pt-3">
        <label className="flex cursor-pointer items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <EyeOff className="h-3 w-3" />
            Hidden by default
          </span>
          <input
            type="checkbox"
            checked={hiddenByDefault}
            onChange={(e) =>
              updateComponentProps(component.instanceId, {
                hiddenByDefault: e.target.checked,
              })
            }
            className="accent-primary"
          />
        </label>
        {hiddenByDefault && (
          <p className="mt-1 text-[10px] text-muted-foreground/50">
            This component starts hidden. Use Logic rules to show it.
          </p>
        )}
      </div>

      {/* Instance ID (debug) */}
      <div className="mt-auto border-t border-border pt-3">
        <p className="font-mono text-[10px] break-all text-muted-foreground/30">
          {component.instanceId}
        </p>
      </div>
    </div>
  );
}

function LabelEditor({
  instanceId,
  label,
}: {
  instanceId: string;
  label: string;
}) {
  const updateLabel = useFormStore((s) => s.updateComponentMetadata);
  return (
    <input
      value={label}
      onChange={(e) => updateLabel(instanceId, { label: e.target.value })}
      className="w-full border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
    />
  );
}

function PageProperties({ pageId }: { pageId: string }) {
  const page = useFormStore((s) => s.pages[pageId]);
  const pages = useFormStore((s) => s.pages);

  const orderedPageIds = useFormStore((s) => s.form?.pages || []);

  const updatePageTitle = useFormStore((s) => s.updatePageTitle);
  const updatePageDesc = useFormStore((s) => s.updatePageDesc);
  const updatePageNextPage = useFormStore((s) => s.updatePageNextPage);

  if (!page) return null;

  const currentIndex = orderedPageIds.indexOf(pageId);
  const isTerminal = page.isTerminal;
  const sequentialNextId = orderedPageIds[currentIndex + 1];
  if (!sequentialNextId) {
    console.log('faaahh!!!');
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase">
          Page Properties
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Title
        </label>
        <input
          value={page.title || ''}
          onChange={(e) => updatePageTitle(pageId, e.target.value)}
          placeholder="Page title"
          className="w-full border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Description
        </label>
        <textarea
          value={page.description || ''}
          onChange={(e) => updatePageDesc(pageId, e.target.value)}
          placeholder="Page description"
          rows={3}
          className="w-full resize-y border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="mt-2 mb-4 flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          After this page
        </label>

        {isTerminal ? (
          // The last page has no routing options.
          <div className="w-full cursor-not-allowed border border-border/50 bg-muted/30 px-2 py-1.5 text-sm text-muted-foreground select-none">
            Submit Form
          </div>
        ) : (
          <select
            // Fallback to the sequential ID if nextPageId is undefined
            value={page.defaultNextPageId || sequentialNextId || ''}
            onChange={(e) => updatePageNextPage(pageId, e.target.value)}
            className={inp}
          >
            {orderedPageIds.map((optId, idx) => {
              // Prevent a page from logically routing to itself
              if (optId === pageId) return null;

              const optPage = pages[optId];
              const fallbackName = `Page ${idx + 1}`;
              const displayName = optPage?.title || fallbackName;

              // Add a visual indicator in the dropdown for the default sequential path
              const isSequential = optId === sequentialNextId;

              return (
                <option key={optId} value={optId}>
                  {isSequential
                    ? `Continue to next (${displayName})`
                    : `Jump to ${displayName}`}
                </option>
              );
            })}
          </select>
        )}
      </div>
    </>
  );
}
