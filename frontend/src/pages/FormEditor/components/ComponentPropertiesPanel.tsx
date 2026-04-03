// src/pages/FormEditor/components/ComponentPropertiesPanel.tsx
/**
 * Right-side properties panel that shows settings for the selected component.
 * Auto-shows when a component is selected.
 */
import { useFormStore } from '@/form/store/formStore';
import { useShallow } from 'zustand/react/shallow';
import { getComponentPropsRenderer } from '@/form/registry/componentRegistry';
import { Settings2 } from 'lucide-react';

function supportsOptionShuffle(props: unknown): boolean {
  if (!props || typeof props !== 'object') return false;
  const anyProps = props as Record<string, unknown>;
  const optionLike =
    Array.isArray(anyProps.options) ||
    Array.isArray(anyProps.columns) ||
    Array.isArray(anyProps.rows);
  return optionLike;
}

export function ComponentPropertiesPanel() {
  const activeComponentId = useFormStore((s) => s.activeComponentId);
  const activePageId = useFormStore((s) => s.activePageId);
  const component = useFormStore(
    useShallow((s) =>
      activeComponentId ? s.components[activeComponentId] : null
    )
  );

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

  const SettingsRenderer = getComponentPropsRenderer(component.id);
  const updateComponentProps = useFormStore((s) => s.updateComponentProps);
  const optionShuffleEnabled =
    ((component.props as Record<string, unknown>)?.shuffleOptions as
      | boolean
      | undefined) === true;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Component type badge */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          {component.metadata.label}
        </span>
      </div>

      {/* Label editor */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Label
        </label>
        <LabelEditor instanceId={component.instanceId} label={component.metadata.label} />
      </div>

      {/* Component settings renderer */}
      {SettingsRenderer && (
        <div className="border-t border-border pt-3">
          {/* eslint-disable-next-line react-hooks/static-components */}
          <SettingsRenderer
            instanceId={component.instanceId}
            metadata={component.metadata}
            props={component.props}
            validation={component.validation}
          />
        </div>
      )}

      {supportsOptionShuffle(component.props) && (
        <div className="border-t border-border pt-3">
          <label className="flex items-center justify-between text-xs text-muted-foreground">
            Option Shuffling
            <input
              type="checkbox"
              checked={optionShuffleEnabled}
              onChange={(e) =>
                updateComponentProps(component.instanceId, {
                  shuffleOptions: e.target.checked,
                })
              }
            />
          </label>
        </div>
      )}

      {/* Instance ID (debug) */}
      <div className="mt-auto border-t border-border pt-3">
        <p className="text-[10px] font-mono text-muted-foreground/30 break-all">
          {component.instanceId}
        </p>
      </div>
    </div>
  );
}

function LabelEditor({ instanceId, label }: { instanceId: string; label: string }) {
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
  const updatePageTitle = useFormStore((s) => s.updatePageTitle);
  const updatePageDesc = useFormStore((s) => s.updatePageDesc);

  if (!page) return null;

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Page Properties
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Title</label>
        <input
          value={page.title || ''}
          onChange={(e) => updatePageTitle(pageId, e.target.value)}
          placeholder="Page title"
          className="w-full border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Description</label>
        <textarea
          value={page.description || ''}
          onChange={(e) => updatePageDesc(pageId, e.target.value)}
          placeholder="Page description"
          rows={3}
          className="w-full border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary resize-y"
        />
      </div>
    </>
  );
}
