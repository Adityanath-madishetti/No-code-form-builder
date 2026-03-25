import { loadFromJSON } from '@/form/store/formStore';

loadFromJSON({
  form: {
    id: 'form-1',
    name: 'My Form',
    themeID: null,
    pages: [
      'page-1',
      'page-2',
      'page-3',
      'page-4',
      'page-5',
      'page-6',
      'page-7',
      'page-8',
      'page-9',
      'page-10',
    ],
    metadata: {
      description: 'A sample form loaded from JSON.',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      version: 1,
    },
  },
  pages: [
    {
      id: 'page-1',
      children: ['text-box-instance-1', 'input-instance-1'],
      isTerminal: false,
    },
    { id: 'page-2', children: ['instance-1'], isTerminal: false },
    { id: 'page-3', children: [], isTerminal: false },
    { id: 'page-4', children: [], isTerminal: false },
    { id: 'page-5', children: [], isTerminal: false },
    { id: 'page-6', children: [], isTerminal: false },
    { id: 'page-7', children: [], isTerminal: false },
    { id: 'page-8', children: [], isTerminal: false },
    { id: 'page-9', children: [], isTerminal: false },
    { id: 'page-10', children: [], isTerminal: true },
  ],
  components: [
    {
      id: 'Dummy',
      instanceId: 'instance-1',
      name: 'DummyComponent',
      metadata: { label: 'Hello World', description: 'A dummy field.' },
      props: { text: 'This is a dummy component.' },
      // children: [],
    },
    {
      id: 'TextBox',
      instanceId: 'text-box-instance-1',
      name: 'TextBoxComponent',
      metadata: { label: 'Static Text', description: 'A static text box.' },
      props: {
        text: 'Mirror, mirror on the wall, who’s the fairest of them all?',
      },
      // children: [],
    },
    {
      id: 'Input',
      instanceId: 'input-instance-1',
      name: 'InputComponent',
      metadata: {
        label: 'Input Fieldfdsf',
        description: 'A simple text input field for user input.',
      },
      props: {
        placeholder: 'Thou, O Queen, art the fairest in the land.',
        defaultValue: '',
      },
      // children: [],
    },
  ],
});

import { printFormJSON } from '@/form/store/formStore';

printFormJSON();

// src/FormEditor.tsx
import { useFormStore, type FormDragData } from '@/form/store/formStore';
import { FormCanvas } from './components/FormCanvas';
import { SidePanel } from './components/SidePanel';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';

import {
  componentRenderers,
  type AnyFormComponent,
} from '@/form/registry/componentRegistry';
import type { ComponentID, ComponentMetadata } from '@/form/components/base';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

import {
  TEMP_COMPONENT_PLACEHOLDER_ID,
  TEMP_PAGE_PLACEHOLDER_ID,
} from '@/form/utils/DndUtils';
import {
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_CATALOG_PAGE_ID,
  DRAG_COMPONENT_ID,
  DRAG_PAGE_ID,
} from '@/form/utils/DndUtils';

export default function FormEditor() {
  const store = useFormStore();
  const selectComponent = store.selectComponent;
  const selectPage = store.setActivePage;

  const activeDragData = store.activeDragData;

  return (
    <DragDropProvider
      onDragStart={(event) => {
        store.setActiveDragData(
          (event.operation.source?.data as FormDragData) || null
        );
      }}
      onDragOver={(event) => {
        const { source, target } = event.operation;
        if (!target || !source) return;

        const sourceData = source.data;
        const targetData = target.data;

        // ==========================================
        // CREATE COMPONENT GAPS
        // ==========================================
        if (sourceData?.type === DRAG_CATALOG_COMPONENT_ID) {
          let targetPageId = null;
          let targetIndex = -1;

          if (targetData?.type === DRAG_COMPONENT_ID) {
            targetPageId = targetData.pageId;
            targetIndex = store.pages[targetPageId].children.indexOf(
              targetData.instanceId
            );
          } else if (targetData?.type === DRAG_PAGE_ID) {
            targetPageId = targetData.pageId;
            targetIndex = store.pages[targetPageId].children.length;
          }

          if (targetPageId) {
            if (!store.components[TEMP_COMPONENT_PLACEHOLDER_ID]) {
              // Inject the Gap
              store.addComponent(
                targetPageId,
                {
                  id: 'Placeholder' as ComponentID,
                  instanceId: TEMP_COMPONENT_PLACEHOLDER_ID,
                  name: 'Gap',
                  metadata: {} as ComponentMetadata,
                  props: {},
                  children: [],
                } as AnyFormComponent,
                targetIndex !== -1
                  ? targetIndex
                  : store.pages[targetPageId].children.length
              );
            } else {
              // Move the Gap smoothly
              const currentPage = Object.values(store.pages).find((p) =>
                p.children.includes(TEMP_COMPONENT_PLACEHOLDER_ID)
              );
              if (currentPage) {
                const currentIndex = currentPage.children.indexOf(
                  TEMP_COMPONENT_PLACEHOLDER_ID
                );
                const finalIndex =
                  targetIndex !== -1
                    ? targetIndex
                    : store.pages[targetPageId].children.length;
                if (
                  currentPage.id !== targetPageId ||
                  currentIndex !== finalIndex
                ) {
                  store.moveComponent(
                    currentPage.id,
                    currentIndex,
                    targetPageId,
                    finalIndex
                  );
                }
              }
            }
          }
        }

        // ==========================================
        // CREATE PAGE GAPS
        // ==========================================
        if (sourceData?.type === DRAG_CATALOG_PAGE_ID) {
          let targetIndex = -1;
          if (
            targetData?.type === DRAG_PAGE_ID ||
            targetData?.type === DRAG_COMPONENT_ID
          ) {
            targetIndex = store.form!.pages.indexOf(targetData.pageId);
          }

          if (targetIndex !== -1) {
            if (!store.pages[TEMP_PAGE_PLACEHOLDER_ID]) {
              store.addPage(targetIndex, TEMP_PAGE_PLACEHOLDER_ID);
            } else {
              const currentIndex = store.form!.pages.indexOf(
                TEMP_PAGE_PLACEHOLDER_ID
              );
              if (currentIndex !== -1 && currentIndex !== targetIndex) {
                store.reorderPages(currentIndex, targetIndex);
              }
            }
          }
        }

        // ==========================================
        // MOVE EXISTING COMPONENTS NATIVELY
        // ==========================================
        if (sourceData?.type === DRAG_COMPONENT_ID) {
          const instanceId = sourceData.instanceId;
          const currentPage = Object.values(store.pages).find((p) =>
            p.children.includes(instanceId)
          );
          if (!currentPage) return;
          const currentPageId = currentPage.id;
          const currentIndex = currentPage.children.indexOf(instanceId);

          let targetPageId = null;
          let targetIndex = -1;

          if (targetData?.type === DRAG_COMPONENT_ID) {
            targetPageId = targetData.pageId;
            targetIndex = store.pages[targetPageId].children.indexOf(
              targetData.instanceId
            );
          } else if (targetData?.type === DRAG_PAGE_ID) {
            targetPageId = targetData.pageId;
            targetIndex = store.pages[targetPageId].children.length;
          }

          if (targetPageId && currentPageId !== targetPageId) {
            store.moveComponent(
              currentPageId,
              currentIndex,
              targetPageId,
              targetIndex !== -1
                ? targetIndex
                : store.pages[targetPageId].children.length
            );
          }
        }
      }}
      onDragEnd={(event) => {
        // setActiveDragData(null);
        store.setActiveDragData(null);
        const { operation, canceled } = event;
        const { source, target } = operation;

        // CLEANUP: If cancelled or dropped outside, delete the gaps!
        if (canceled || !target) {
          if (store.components[TEMP_COMPONENT_PLACEHOLDER_ID])
            store.removeComponent(TEMP_COMPONENT_PLACEHOLDER_ID);
          if (store.pages[TEMP_PAGE_PLACEHOLDER_ID])
            store.removePage(TEMP_PAGE_PLACEHOLDER_ID);
          return;
        }

        const sourceData = source?.data;
        const targetData = target?.data;
        if (!sourceData || !targetData) return;

        // DROP COMPONENT: Swap the Gap for the Real Component
        if (sourceData.type === DRAG_CATALOG_COMPONENT_ID) {
          if (store.components[TEMP_COMPONENT_PLACEHOLDER_ID]) {
            const currentPage = Object.values(store.pages).find((p) =>
              p.children.includes(TEMP_COMPONENT_PLACEHOLDER_ID)
            );
            if (currentPage) {
              const finalIndex = currentPage.children.indexOf(
                TEMP_COMPONENT_PLACEHOLDER_ID
              );
              store.removeComponent(TEMP_COMPONENT_PLACEHOLDER_ID);

              const realId = `instance-${crypto.randomUUID()}`;
              const realComponent = sourceData.entry.create(realId);
              store.addComponent(currentPage.id, realComponent, finalIndex);
              store.selectComponent(realId);

              store.refreshCatalog();
            }
          }
          return;
        }

        // DROP PAGE: Swap the Gap for the Real Page
        if (sourceData.type === DRAG_CATALOG_PAGE_ID) {
          if (store.pages[TEMP_PAGE_PLACEHOLDER_ID]) {
            const finalIndex = store.form!.pages.indexOf(
              TEMP_PAGE_PLACEHOLDER_ID
            );
            store.removePage(TEMP_PAGE_PLACEHOLDER_ID);
            const realId = store.addPage(finalIndex);
            console.log(realId);

            store.refreshCatalog();
          }
          return;
        }

        // FINALIZE EXISTING PAGES/COMPONENTS
        if (
          sourceData.type === DRAG_PAGE_ID &&
          targetData.type === DRAG_PAGE_ID
        ) {
          const form = store.form;
          if (!form) return;
          const fromIndex = form.pages.indexOf(sourceData.pageId);
          const toIndex = form.pages.indexOf(targetData.pageId);
          if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
            store.reorderPages(fromIndex, toIndex);
          }
          return;
        }

        if (sourceData.type === DRAG_COMPONENT_ID) {
          const instanceId = sourceData.instanceId;
          const currentPage = Object.values(store.pages).find((p) =>
            p.children.includes(instanceId)
          );
          if (!currentPage) return;
          const currentPageId = currentPage.id;
          const currentIndex = currentPage.children.indexOf(instanceId);

          let targetPageId = null;
          let targetIndex = -1;

          if (targetData.type === DRAG_COMPONENT_ID) {
            targetPageId = targetData.pageId;
            targetIndex = store.pages[targetPageId].children.indexOf(
              targetData.instanceId
            );
          } else if (targetData.type === DRAG_PAGE_ID) {
            targetPageId = targetData.pageId;
            targetIndex = store.pages[targetPageId].children.length;
          }

          if (
            targetPageId === currentPageId &&
            currentIndex !== targetIndex &&
            targetIndex !== -1
          ) {
            store.moveComponent(
              currentPageId,
              currentIndex,
              currentPageId,
              targetIndex
            );
          }
        }
      }}
    >
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-screen w-full overflow-hidden bg-muted/20"
      >
        <ResizablePanel
          defaultSize="75%"
          minSize="40%"
          className="flex min-h-0 flex-col"
        >
          <div
            className="relative w-full flex-1 overflow-y-auto pt-10 pb-20"
            onClick={() => {
              selectComponent(null);
              selectPage(null);
            }}
          >
            <FormCanvas />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          defaultSize="25%"
          minSize="20%"
          maxSize="50%"
          className="flex min-h-0 flex-col"
        >
          <div className="z-10 flex w-full flex-1 flex-col overflow-y-auto p-6">
            <SidePanel />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      <DragOverlay dropAnimation={null}>
        {/* ==========================================
            SCENARIO 1: DRAGGING FROM THE SIDEBAR CATALOG
            (Generates fresh default data via entry.create)
            ========================================== */}
        {activeDragData?.type === DRAG_CATALOG_COMPONENT_ID &&
          (() => {
            const entry = activeDragData.entry;
            const Renderer =
              componentRenderers[entry.id as keyof typeof componentRenderers];
            const previewData = entry.create('__preview__');

            return (
              <div>
                {Renderer && (
                  <Renderer
                    metadata={previewData.metadata}
                    props={previewData.props}
                    instanceId={previewData.instanceId}
                  />
                )}
              </div>
            );
          })()}

        {/* ==========================================
            SCENARIO 2: DRAGGING AN EXISTING FORM COMPONENT
            (Pulls the exact saved data from Zustand)
            ========================================== */}
        {activeDragData?.type === DRAG_COMPONENT_ID &&
          (() => {
            // Grab the ACTUAL component data from your store!
            const existingComponent =
              store.components[activeDragData.instanceId];
            if (!existingComponent) return null;

            const Renderer =
              componentRenderers[
                existingComponent.id as keyof typeof componentRenderers
              ];

            return (
              <div>
                {Renderer && (
                  <Renderer
                    metadata={existingComponent.metadata}
                    props={existingComponent.props}
                    instanceId={existingComponent.instanceId}
                  />
                )}
              </div>
            );
          })()}

        {/* ==========================================
            SCENARIO 3: DRAGGING A NEW PAGE
            ========================================== */}
        {activeDragData?.type === DRAG_CATALOG_PAGE_ID && (
          <div className="pointer-events-none w-[500px] opacity-90">
            <div className="flex h-32 items-center justify-center rounded-xl border-2 bg-card">
              Drop to create New Page
            </div>
          </div>
        )}
      </DragOverlay>
    </DragDropProvider>
  );
}
