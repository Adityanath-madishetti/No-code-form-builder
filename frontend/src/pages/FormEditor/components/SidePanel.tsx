// src/pages/FormEditor/components/SidePanel.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFormStore } from '@/form/store/formStore';

import { ComponentPropertiesPanel } from './ComponentPropertiesPanel';
import { ComponentCatalogPanel } from './ComponentCatalogPanel';

export function SidePanel() {
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

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-muted">
        <TabsContent value="overview" className="mt-0 p-4">
          {/* Overview content */}
        </TabsContent>

        <TabsContent value="properties" className="mt-0 p-4">
          <ComponentPropertiesPanel />
        </TabsContent>

        <TabsContent value="components" className="mt-0 p-4">
          <ComponentCatalogPanel />
        </TabsContent>
      </div>
    </Tabs>
  );
}
