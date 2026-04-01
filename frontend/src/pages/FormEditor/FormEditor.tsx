import { loadFromJSON } from '@/form/store/formStore';

loadFromJSON({
  form: {
    id: 'form-1',
    name: 'My Form',
    theme: {
      color: 'default',
      mode: 'dark',
      headingFont: {
        family: 'Inter',
      },
      bodyFont: {
        family: 'Inter',
      },
    },
    pages: ['page-1', 'page-2', 'page-3'],
    metadata: {
      description:
        '<p><strong><em>Octopussy and The Living Daylights</em></strong> (sometimes published as <strong><em>Octopussy</em></strong>) is the fourteenth and final <a target="_blank" rel="noopener noreferrer" href="https://en.wikipedia.org/wiki/James_Bond">James Bond</a> book written by <a target="_blank" rel="noopener noreferrer" href="https://en.wikipedia.org/wiki/Ian_Fleming">Ian Fleming</a>. The book is a collection of short stories published in the United Kingdom by <a target="_blank" rel="noopener noreferrer" href="https://en.wikipedia.org/wiki/Jonathan_Cape">Jonathan Cape</a> on 23 June 1966, after Fleming\'s death in August 1964.</p>',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2026-03-31T18:36:26.096Z',
      version: 1,
    },
  },
  pages: [
    {
      id: 'page-1',
      title: 'some shit?',
      description: '',
      children: [
        'text-box-instance-1',
        'input-instance-1',
        'instance-02e36714-000f-4ef8-9a6d-002d89a979db',
      ],
      isTerminal: false,
    },
    {
      id: 'page-2',
      children: ['instance-b0ce6b23-0ebc-412b-b706-2f35b2632040'],
      isTerminal: false,
    },
    {
      id: 'page-3',
      children: ['instance-33f094df-b72f-4de5-9799-bb698658a042'],
      isTerminal: true,
    },
  ],
  components: [
    {
      id: 'Textbox',
      instanceId: 'text-box-instance-1',
      metadata: {
        label: 'Static Text',
        description: 'A static text box.',
      },
      props: {
        text: '<h1>Lorem Ipsum</h1><p></p><p><strong><em>Lorem ipsum</em></strong> dolor sit amet, consectetur adipiscing elit, <em>sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam</em>, quis nostrud <u>exercitation ullamco laboris</u> nisi ut aliquip ex ea commodo consequat. </p><p>Duis <mark>aute irure dolor</mark> in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint <s>occaecat cupidatat non proident</s>, sunt in culpa qui officia deserunt mollit anim id est laborum.</p><p></p><p>And as always, x<sup>2</sup> is not the answer lol.</p><blockquote><p>Those who die, die.</p><p>~ Kǒng Fūzǐ, probably</p></blockquote><p></p>',
      },
      validation: {
        proxy: 0,
      },
    },
    {
      id: 'Input',
      instanceId: 'input-instance-1',
      metadata: {
        label: 'Input Fieldfdsf',
        description: 'A simple text input field for user input.',
      },
      props: {
        questionText: '<p>Write the answer...</p>',
        placeholder: 'Thou, O Queen, art the fairest in the land.',
        defaultValue: '',
      },
      validation: {
        required: false,
        minLength: 0,
        maxLength: 4096,
      },
    },
    {
      id: 'Radio',
      instanceId: 'instance-02e36714-000f-4ef8-9a6d-002d89a979db',
      metadata: {
        label: 'Single Choice Question',
      },
      props: {
        questionText: '<p>Select an option</p>',
        layout: 'vertical',
        options: [
          {
            id: '7830f79e-f7ab-4bc4-8566-2d9794346b0c',
            label: 'Option 1',
            value: 'option-1',
          },
          {
            id: '7830f79e-f7ab-4bc4-8566-2d9794346b0d',
            label: 'Option 2',
            value: 'option-2',
          },
        ],
      },
      validation: {
        required: false,
      },
    },
    {
      id: 'Checkbox',
      instanceId: 'instance-b0ce6b23-0ebc-412b-b706-2f35b2632040',
      metadata: {
        label: 'Multiple Choice Question',
      },
      props: {
        questionText: '<p>Select all that apply...</p>',
        layout: 'vertical',
        defaultValues: [],
        options: [
          {
            id: '1962533f-5c1b-4ec9-acd4-5f2c23c2d66f',
            label: 'Option 1',
            value: 'option-1',
          },
          {
            id: '8e0dd932-304f-41a8-a90a-11ac01fd3d6f',
            label: 'Option 2',
            value: 'option-2',
          },
        ],
      },
      validation: {
        required: false,
      },
    },
    {
      id: 'Dropdown',
      instanceId: 'instance-33f094df-b72f-4de5-9799-bb698658a042',
      metadata: {
        label: 'Dropdown Selection',
      },
      props: {
        questionText: '<p>Please select an option from the list</p>',
        placeholder: 'Select an option',
        options: [
          {
            id: '0f543e95-091e-4d1a-9d79-701404c8e1e2',
            label: 'Option 1',
            value: 'option-1',
          },
          {
            id: 'e442a71d-a8f0-44df-a0ef-a37efb9128dd',
            label: 'Option 2',
            value: 'option-2',
          },
        ],
      },
      validation: {
        requred: false,
      },
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
  const setActiveComponent = store.setActiveComponent;
  const setActivePage = store.setActivePage;

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
            className="relative h-auto w-full flex-1 overflow-y-auto"
            onClick={() => {
              setActiveComponent(null);
              setActivePage(null);
            }}
          >
            <FormCanvas />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          defaultSize="25%"
          minSize="1%"
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
                    instanceId={previewData.instanceId}
                    metadata={previewData.metadata}
                    // Note - some type safety issue
                    // @ts-expect-error - forget for now
                    props={previewData.props}
                    // @ts-expect-error - forget for now
                    validation={previewData.validation}
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
                    instanceId={existingComponent.instanceId}
                    metadata={existingComponent.metadata}
                    // Note - some type safety issue, bs basically
                    // @ts-expect-error - forget for now
                    props={existingComponent.props}
                    // @ts-expect-error - forget for now
                    validation={existingComponent.validation}
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
