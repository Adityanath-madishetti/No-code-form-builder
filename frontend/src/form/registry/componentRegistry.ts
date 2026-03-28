// src/form/registry/componentRegistry.ts
/**
 * Component Registry
 * ------------------------------------------------------------------------------------------------
 * Central registry that maps component types (`ComponentID`) to their
 * corresponding:
 * - Renderers (main UI + settings panel)
 * - Factory functions (creation + deserialization)
 * - Catalog metadata (for UI listing)
 *
 * Purpose:
 * - Acts as the **single source of truth** for all available form components
 * - Decouples component definitions from rendering and creation logic
 * - Enables dynamic rendering, drag-and-drop, and persistence
 *
 * Architecture:
 * - Each component registers a `ComponentRegistryEntry`
 * - Consumers query the registry instead of hardcoding component logic
 * - Supports extensibility: new components can be added with minimal changes
 *
 * Typical Flow:
 * - Builder UI uses `catalogRegistry` to list available components
 * - On drop -> calls `create(instanceId)`
 * - Renderer resolves via `getComponentRenderer(id)`
 * - Settings panel resolves via `getComponentPropsRenderer(id)`
 * - Saved JSON is restored via `deserializeComponent`
 *
 * ------------------------------------------------------------------------------------------------
 * Notes:
 * - This is a core abstraction layer — keep it simple and declarative
 * - Avoid business logic here; only mapping and wiring
 * - All components MUST be registered here to be usable
 *
 * ------------------------------------------------------------------------------------------------
 */

import type { ComponentType } from 'react';
import { ComponentIDs } from '../components/base';
import type { ComponentID, RendererProps } from '../components/base';
import type { FormComponent, SerializedComponent } from '../components/base';

// ------------------------------------------------------------------------------------------------
import { createTextBoxComponent } from '../components/textBox';
import type { TextBoxProps, TextBoxValidation } from '../components/textBox';
import {
  TextBoxComponentPropsRenderer,
  TextBoxComponentRenderer,
} from '../components/TextBoxRenderer';

import { createInputComponent } from '../components/input';
import type { InputProps, InputValidation } from '../components/input';
import {
  InputComponentPropsRenderer,
  InputComponentRenderer,
} from '../components/InputRenderer';

import { createRadioComponent } from '../components/radio';
import type { RadioProps, RadioValidation } from '../components/radio';
import {
  RadioComponentPropsRenderer,
  RadioComponentRenderer,
} from '../components/RadioRenderer';

import { createCheckboxComponent } from '../components/checkbox';
import type { CheckboxProps, CheckboxValidation } from '../components/checkbox';
import {
  CheckboxComponentPropsRenderer,
  CheckboxComponentRenderer,
} from '../components/CheckboxRenderer';

import { createDropdownComponent } from '../components/dropdown';
import type { DropdownProps, DropdownValidation } from '../components/dropdown';
import {
  DropdownComponentPropsRenderer,
  DropdownComponentRenderer,
} from '../components/DropdownRenderer';
// ------------------------------------------------------------------------------------------------

export type ComponentPropsMap = {
  [ComponentIDs.TextBox]: TextBoxProps;
  [ComponentIDs.Input]: InputProps;
  [ComponentIDs.Radio]: RadioProps;
  [ComponentIDs.Checkbox]: CheckboxProps;
  [ComponentIDs.Dropdown]: DropdownProps;
};

export type ComponentValidationMap = {
  [ComponentIDs.TextBox]: TextBoxValidation;
  [ComponentIDs.Input]: InputValidation;
  [ComponentIDs.Radio]: RadioValidation;
  [ComponentIDs.Checkbox]: CheckboxValidation;
  [ComponentIDs.Dropdown]: DropdownValidation;
};

export type AnyFormComponent = {
  [K in ComponentID]: FormComponent<
    K,
    ComponentPropsMap[K],
    ComponentValidationMap[K]
  >;
}[ComponentID];

export type AnySerializedComponent = {
  [K in ComponentID]: SerializedComponent<
    K,
    ComponentPropsMap[K],
    ComponentValidationMap[K]
  >;
}[ComponentID];

/**
 * Generic React renderer for a component.
 *
 * Accepts `RendererProps<TProps>` and returns JSX.
 */
export type ComponentRenderer<TProps = unknown, TValidation = unknown> = ComponentType<
  RendererProps<TProps, TValidation>
>;

/**
 * Defines everything required to integrate a component into the system.
 *
 * Responsibilities:
 * - Provide renderers (main + settings)
 * - Define how a component is created
 * - Define how it is deserialized from JSON
 * - Provide catalog metadata for UI
 */
export interface ComponentRegistryEntry<T extends ComponentID> {
  id: T;

  /**
   * Metadata used in the component catalog (drag/drop panel).
   */
  catalog: {
    label: string;
    description: string;
  };

  /**
   * Rendering layer:
   * - `main`: renders inside the form
   * - `settings`: renders inside the editor panel
   */
  renderers: {
    main: ComponentRenderer<ComponentPropsMap[T], ComponentValidationMap[T]> | null;
    settings: ComponentRenderer<ComponentPropsMap[T], ComponentValidationMap[T]> | null;
  };

  /**
   * Factory for creating a fresh component instance.
   */
  create: (instanceId: string) => FormComponent<T, ComponentPropsMap[T]>;

  /**
   * Reconstructs a component from serialized JSON.
   */
  deserialize: (
    json: SerializedComponent<
      T,
      ComponentPropsMap[T],
      ComponentValidationMap[T]
    >
  ) => FormComponent<T, ComponentPropsMap[T], ComponentValidationMap[T]>;
}

// ------------------------------------------------------------------------------------------------
//
// Registry Implementation
//
// ------------------------------------------------------------------------------------------------

type Registry = {
  [K in ComponentID]: ComponentRegistryEntry<K>;
};

/**
 * Internal registry mapping ComponentID -> ComponentRegistryEntry.
 *
 * This is the core lookup table used throughout the system.
 */
const registry: Registry = {
  [ComponentIDs.TextBox]: {
    id: ComponentIDs.TextBox,
    catalog: {
      label: 'Text Box',
      description: 'A single line text input.',
    },
    renderers: {
      main: TextBoxComponentRenderer,
      settings: TextBoxComponentPropsRenderer,
    },
    create: (instanceId) =>
      createTextBoxComponent(
        instanceId,
        { label: 'Text Box' },
        { text: '' },
        { proxy: 0 }
      ),
    deserialize: (json) =>
      createTextBoxComponent(
        json.instanceId,
        json.metadata,
        json.props,
        json.validation
      ),
  },

  [ComponentIDs.Input]: {
    id: ComponentIDs.Input,
    catalog: {
      label: 'Input',
      description: 'A simple text input field for user input.',
    },
    renderers: {
      main: InputComponentRenderer,
      settings: InputComponentPropsRenderer,
    },
    create: (instanceId) =>
      createInputComponent(
        instanceId,
        { label: 'Input Field' },
        {
          questionText: '<p>Write the answer...</p>',
          placeholder: '',
          defaultValue: '',
        },
        {
          required: false,
          minLength: 0,
        }
      ),
    deserialize: (json) =>
      createInputComponent(
        json.instanceId,
        json.metadata,
        json.props,
        json.validation
      ),
  },

  [ComponentIDs.Radio]: {
    id: ComponentIDs.Radio,
    catalog: {
      label: 'Radio',
      description: 'A single choice selection using radio buttons.',
    },
    renderers: {
      main: RadioComponentRenderer,
      settings: RadioComponentPropsRenderer,
    },
    create: (instanceId) =>
      createRadioComponent(
        instanceId,
        { label: 'Single Choice Question' },
        {
          questionText: '<p>Select an option</p>',
          layout: 'vertical',
          options: [
            { id: crypto.randomUUID(), label: 'Option 1', value: 'option-1' },
          ],
        },
        {
          required: false,
        }
      ),
    deserialize: (json) =>
      createRadioComponent(
        json.instanceId,
        json.metadata,
        json.props,
        json.validation
      ),
  },

  [ComponentIDs.Checkbox]: {
    id: ComponentIDs.Checkbox,
    catalog: {
      label: 'Checkboxes',
      description: 'Multiple choice selection using checkboxes.',
    },
    renderers: {
      main: CheckboxComponentRenderer,
      settings: CheckboxComponentPropsRenderer,
    },
    create: (instanceId) =>
      createCheckboxComponent(
        instanceId,
        { label: 'Multiple Choice Question' },
        {
          questionText: '<p>Select all that apply</p>',
          layout: 'vertical',
          defaultValues: [],
          options: [
            { id: crypto.randomUUID(), label: 'Option 1', value: 'option-1' },
            { id: crypto.randomUUID(), label: 'Option 2', value: 'option-2' },
          ],
        },
        {
          required: false,
        }
      ),
    deserialize: (json) =>
      createCheckboxComponent(
        json.instanceId,
        json.metadata,
        json.props,
        json.validation
      ),
  },

  [ComponentIDs.Dropdown]: {
    id: ComponentIDs.Dropdown,
    catalog: {
      label: 'Dropdown',
      description: 'A select menu for choosing a single option.',
    },
    renderers: {
      main: DropdownComponentRenderer,
      settings: DropdownComponentPropsRenderer,
    },
    create: (instanceId) =>
      createDropdownComponent(
        instanceId,
        { label: 'Dropdown Selection' },
        {
          questionText: '<p>Please select an option from the list</p>',
          placeholder: 'Select an option',
          options: [
            { id: crypto.randomUUID(), label: 'Option 1', value: 'option-1' },
            { id: crypto.randomUUID(), label: 'Option 2', value: 'option-2' },
          ],
        },
        {
          requred: false,
        }
      ),
    deserialize: (json) =>
      createDropdownComponent(
        json.instanceId,
        json.metadata,
        json.props,
        json.validation
      ),
  },
};

// ------------------------------------------------------------------------------------------------
//
// Registry Helpers
//
// ------------------------------------------------------------------------------------------------

export function getComponentRenderer<T extends ComponentID>(
  id: T
): ComponentRenderer<ComponentPropsMap[T], ComponentValidationMap[T]> | null {
  return registry[id]?.renderers.main || null;
}

export function getComponentPropsRenderer<T extends ComponentID>(
  id: T
): ComponentRenderer<ComponentPropsMap[T], ComponentValidationMap[T]> | null {
  return registry[id]?.renderers.settings || null;
}

export function serializeComponent<T extends ComponentID>(
  component: FormComponent
): SerializedComponent<T> {
  return {
    id: component.id as T,
    instanceId: component.instanceId,
    metadata: component.metadata,
    props: component.props as ComponentPropsMap[T],
    validation: component.validation as ComponentValidationMap[T],
  };
}

export function deserializeComponent<T extends ComponentID>(
  json: SerializedComponent<T, ComponentPropsMap[T], ComponentValidationMap[T]>
): FormComponent<T, ComponentPropsMap[T], ComponentValidationMap[T]> {
  return registry[json.id].deserialize(json);
}

/**
 * Flat map of componentID -> main renderer.
 */
export const componentRenderers = {
  [ComponentIDs.TextBox]: registry[ComponentIDs.TextBox].renderers.main,
  [ComponentIDs.Input]: registry[ComponentIDs.Input].renderers.main,
  [ComponentIDs.Radio]: registry[ComponentIDs.Radio].renderers.main,
  [ComponentIDs.Checkbox]: registry[ComponentIDs.Checkbox].renderers.main,
  [ComponentIDs.Dropdown]: registry[ComponentIDs.Dropdown].renderers.main,
};

// ------------------------------------------------------------------------------------------------
// Catalog (Builder UI)
// ------------------------------------------------------------------------------------------------

export interface CatalogEntry {
  id: ComponentID;
  label: string;
  description: string;
  /**
   * Factory used when a component is added (e.g., drag-and-drop).
   */
  create: (instanceId: string) => FormComponent;
}

export const catalogRegistry: CatalogEntry[] = Object.values(registry).map(
  (def) => ({
    id: def.id,
    label: def.catalog.label,
    description: def.catalog.description,
    create: def.create,
  })
);
