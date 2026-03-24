// src/pages/FormEditor/components/SidePanel.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFormStore, formSelectors } from '@/form/store/formStore';
import { getComponentPropsRenderer } from '@/form/registry/componentRegistry';

import { ComponentCatalog } from './ComponentCatalog';

export function SidePanel() {
  const selectedComponent = useFormStore(formSelectors.selectedComponent);

  const PropsRenderer = selectedComponent
    ? getComponentPropsRenderer(selectedComponent.id)
    : null;

  const activeTab = useFormStore((s) => s.activeSidePanelTab);
  const setActiveTab = useFormStore((s) => s.setActiveSidePanelTab);

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex h-full w-full flex-col gap-4"
    >
      <TabsList className="w-full justify-start">
        <TabsTrigger
          value="overview"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
        >
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="properties"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
        >
          Properties
        </TabsTrigger>
        <TabsTrigger
          value="components"
          className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
        >
          Components
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-y-auto rounded-xl bg-muted">
        <TabsContent value="overview" className="mt-0 p-4">
          {/* Overview content */}
        </TabsContent>

        <TabsContent value="properties" className="mt-0 p-4">
          {selectedComponent ? (
            <div className="space-y-4">
              <h3 className="border-b pb-2 text-lg font-semibold">
                Editing: {selectedComponent.id}
              </h3>

              {PropsRenderer ? (
                // eslint-disable-next-line react-hooks/static-components
                <PropsRenderer
                  props={selectedComponent.props as never}
                  instanceId={selectedComponent.instanceId}
                  metadata={selectedComponent.metadata}
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No properties panel available for {selectedComponent.id}.
                </p>
              )}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center text-center text-muted-foreground">
              <p className="text-sm">
                Select a component on the canvas to edit its properties.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="components" className="mt-0">
          <ComponentCatalog />
        </TabsContent>
      </div>
    </Tabs>
  );
}
