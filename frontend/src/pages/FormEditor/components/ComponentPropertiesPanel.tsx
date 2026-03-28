// src/pages/FormEditor/components/ComponentPropertiesPanel.tsx
import { useFormStore, formSelectors } from '@/form/store/formStore';
import { getComponentPropsRenderer } from '@/form/registry/componentRegistry';
import { RenderPageProps } from '@/form/renderer/editRenderer/RenderPage';

export function ComponentPropertiesPanel() {
  const activeComponent = useFormStore(formSelectors.activeComponent);
  const activePage = useFormStore(formSelectors.activePage);

  if (activeComponent && activePage) {
    console.warn(
      '[ComponentPropertiesPanel] Both activeComponent and activePage are set simultaneously:',
      {
        activeComponent,
        activePage,
      }
    );
  }

  const PropsRenderer = activeComponent
    ? getComponentPropsRenderer(activeComponent.id)
    : null;

  if (!activeComponent && !activePage) {
    return (
      <div className="flex h-40 flex-col items-center justify-center text-center text-muted-foreground">
        <p className="text-sm">
          Select a page/component on the canvas to edit its properties.
        </p>
      </div>
    );
  }

  if (activePage) {
    return (
      <div className="">
        <RenderPageProps pageId={activePage.id} />
      </div>
    );
  }

  if (activeComponent) {
    return (
      <div className="">
        {PropsRenderer ? (
          // eslint-disable-next-line react-hooks/static-components
          <PropsRenderer
            props={activeComponent.props}
            validation={activeComponent.validation}
            instanceId={activeComponent.instanceId}
            metadata={activeComponent.metadata}
          />
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No properties panel available for {activeComponent.id}.
          </p>
        )}
      </div>
    );
  }
}
