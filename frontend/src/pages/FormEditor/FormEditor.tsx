import { loadFromJSON } from '@/form/store/formStore';

loadFromJSON({
  form: {
    id: 'form-1',
    name: 'My Form',
    themeID: null,
    pages: ['page-1', 'page-2', 'page-3'],
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
      title: 'some shit?',
      children: ['text-box-instance-1', 'input-instance-1'],
      isTerminal: false,
    },
    { id: 'page-2', children: [], isTerminal: false },
    { id: 'page-3', children: [], isTerminal: true },
  ],
  components: [
    {
      id: 'Textbox',
      instanceId: 'text-box-instance-1',
      metadata: { label: 'Static Text', description: 'A static text box.' },
      props: {
        text: '<h1>Lorem Ipsum</h1><p></p><p><strong><em>Lorem ipsum</em></strong> dolor sit amet, consectetur adipiscing elit, <em>sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam</em>, quis nostrud <u>exercitation ullamco laboris</u> nisi ut aliquip ex ea commodo consequat. </p><p>Duis <mark>aute irure dolor</mark> in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint <s>occaecat cupidatat non proident</s>, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><p></p><p>And as always, x<sup>2</sup> is not the answer lol.</p><blockquote><p>Those who die, die.</p><p>~ Kǒng Fūzǐ, probably</p></blockquote><p></p>',
      },
      // children: [],
    },
    {
      id: 'Input',
      instanceId: 'input-instance-1',
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

// import { printFormJSON } from '@/form/store/formStore';
// printFormJSON();

// src/FormEditor.tsx
import { useFormStore } from '@/form/store/formStore';
import { FormCanvas } from './components/FormCanvas';
import { SidePanel } from './components/SidePanel';
import { DragDropProvider, DragOverlay } from '@dnd-kit/react';

import { componentRenderers } from '@/form/registry/componentRegistry';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

import {
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_CATALOG_PAGE_ID,
  DRAG_COMPONENT_ID,
} from '@/form/utils/DndUtils';

import { useFormDragHandlers } from '@/form/hooks/useFormDragHandlers';

export default function FormEditor() {
  const store = useFormStore();
  const selectComponent = store.selectComponent;
  const selectPage = store.setActivePage;

  const activeDragData = store.activeDragData;

  const { onDragStart, onDragOver, onDragEnd } = useFormDragHandlers();

  return (
    <DragDropProvider
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
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

      {/* DONT MODULARIZE DragOverlay */}
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
                    // Note - some type safety issue
                    // @ts-expect-error - forget for now
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
                    // Note - some type safety issue
                    // @ts-expect-error - forget for now
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
