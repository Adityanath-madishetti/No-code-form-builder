// src/form/registry/componentRegistry.ts

import type { ComponentType } from 'react';
import {
  ComponentIDs,
  type ComponentID,
  type ComponentRenderer,
  type FormComponent,
  type SerializedComponent,
  type BasicValidation,
  type TextValidation,
  type NumericValidation,
  type NoValidation,
} from '../components/base';

import { PlaceholderSettingsRenderer } from '../components/PlaceholderRenderer';

// Layout
import {
  createHeaderComponent,
  HeaderRenderer,
  HeaderPropsRenderer,
  type HeaderProps,
} from '../components/comps/layout/Heading';

import {
  createTextBoxComponent,
  TextBoxComponentRenderer,
  TextBoxComponentPropsRenderer,
  type TextBoxProps,
} from '../components/comps/layout/TextBox';

import {
  createLineDividerComponent,
  LineDividerRenderer,
  LineDividerPropsRenderer,
  type LineDividerProps,
} from '../components/comps/layout/LineDivider';

// Text Inputs
import {
  createSingleLineInputComponent,
  SingleLineInputRenderer,
  SingleLineInputPropsRenderer,
  type SingleLineInputProps,
} from '../components/comps/text-input/SingleLineText';

import {
  createMultiLineInputComponent,
  MultiLineInputRenderer,
  MultiLineInputPropsRenderer,
  type MultiLineInputProps,
} from '../components/comps/text-input/MultiLineText';

// Numeric
import {
  createNumberComponent,
  NumberRenderer,
  NumberPropsRenderer,
  type NumberProps,
} from '../components/comps/numeric-input/Number';

import {
  createDecimalComponent,
  DecimalRenderer,
  DecimalPropsRenderer,
  type DecimalProps,
} from '../components/comps/numeric-input/Decimal';

// Selection
import {
  createRadioComponent,
  RadioComponentRenderer,
  RadioComponentPropsRenderer,
  type RadioProps,
} from '../components/comps/selection/Radio';

import {
  createCheckboxComponent,
  CheckboxComponentRenderer,
  CheckboxComponentPropsRenderer,
  type CheckboxProps,
} from '../components/comps/selection/Checkbox';

import {
  createDropdownComponent,
  DropdownComponentRenderer,
  DropdownComponentPropsRenderer,
  type DropdownProps,
} from '../components/comps/selection/Dropdown';

/* ─────────────────────────────
   TYPE MAPS
───────────────────────────── */
export type ComponentPropsMap = {
  [ComponentIDs.TextBox]: TextBoxProps;
  [ComponentIDs.Header]: HeaderProps;
  [ComponentIDs.LineDivider]: LineDividerProps;

  [ComponentIDs.SingleLineInput]: SingleLineInputProps;
  [ComponentIDs.MultiLineInput]: MultiLineInputProps;

  [ComponentIDs.Number]: NumberProps;
  [ComponentIDs.Decimal]: DecimalProps;

  [ComponentIDs.Checkbox]: CheckboxProps;
  [ComponentIDs.Dropdown]: DropdownProps;
  [ComponentIDs.Radio]: RadioProps;
};

export type ComponentValidationMap = {
  [ComponentIDs.TextBox]: NoValidation;
  [ComponentIDs.Header]: NoValidation;
  [ComponentIDs.LineDivider]: NoValidation;

  [ComponentIDs.SingleLineInput]: TextValidation;
  [ComponentIDs.MultiLineInput]: TextValidation;

  [ComponentIDs.Number]: NumericValidation;
  [ComponentIDs.Decimal]: NumericValidation;

  [ComponentIDs.Checkbox]: BasicValidation;
  [ComponentIDs.Dropdown]: BasicValidation;
  [ComponentIDs.Radio]: BasicValidation;
};

/* ─────────────────────────────
   HELPERS
───────────────────────────── */

type TypedFormComponent<K extends ComponentID> = FormComponent<
  K,
  ComponentPropsMap[K],
  ComponentValidationMap[K]
>;

type TypedSerializedComponent<K extends ComponentID> = SerializedComponent<
  K,
  ComponentPropsMap[K],
  ComponentValidationMap[K]
>;

type SettingsRenderer<K extends ComponentID> = React.ComponentType<{
  component: FormComponent<
    K,
    ComponentPropsMap[K],
    ComponentValidationMap[K]
  >;
  onChange: (props: ComponentPropsMap[K]) => void;
}>;

type RegistryEntry<K extends ComponentID> = {
  id: K;
  catalog: {
    label: string;
    description: string;
    category: string;
  };
  renderers: {
    main: ComponentRenderer<
      ComponentPropsMap[K],
      ComponentValidationMap[K]
    > | null;

    settings: SettingsRenderer<K> | null;
  };
  create: (instanceId: string) => TypedFormComponent<K>;
  deserialize: (json: TypedSerializedComponent<K>) => TypedFormComponent<K>;
};

type Registry = {
  [K in ComponentID]: RegistryEntry<K>;
};

function makeEntry<K extends ComponentID>(
  id: K,
  label: string,
  description: string,
  category: string,
  createFn: (instanceId: string) => TypedFormComponent<K>,
  renderer: ComponentRenderer<ComponentPropsMap[K], ComponentValidationMap[K]>,
  propsRenderer?: SettingsRenderer<K>
): RegistryEntry<K> {
  return {
    id,
    catalog: { label, description, category },
    renderers: {
      main: renderer,
      settings: propsRenderer ?? PlaceholderSettingsRenderer,
    },
    create: createFn,
    deserialize: (json) => ({
      ...json,
      children: [],
    }),
  };
}

/* ─────────────────────────────
   REGISTRY
───────────────────────────── */
const registry: Registry = {
  [ComponentIDs.TextBox]: makeEntry(
    ComponentIDs.TextBox,
    'Text Box',
    'Static text block',
    'Layout',
    (id) => createTextBoxComponent(id, { label: 'Text Box' }),
    TextBoxComponentRenderer,
    TextBoxComponentPropsRenderer
  ),

  [ComponentIDs.Header]: makeEntry(
    ComponentIDs.Header,
    'Heading',
    'Heading element',
    'Layout',
    (id) => createHeaderComponent(id, { label: 'Heading' }),
    HeaderRenderer,
    HeaderPropsRenderer
  ),

  [ComponentIDs.LineDivider]: makeEntry(
    ComponentIDs.LineDivider,
    'Divider',
    'Horizontal divider',
    'Layout',
    (id) => createLineDividerComponent(id, { label: 'Divider' }),
    LineDividerRenderer,
    LineDividerPropsRenderer
  ),

  [ComponentIDs.SingleLineInput]: makeEntry(
    ComponentIDs.SingleLineInput,
    'Single Line',
    'Single line text input',
    'Text',
    (id) => createSingleLineInputComponent(id, { label: 'Text' }),
    SingleLineInputRenderer,
    SingleLineInputPropsRenderer
  ),

  [ComponentIDs.MultiLineInput]: makeEntry(
    ComponentIDs.MultiLineInput,
    'Multi Line',
    'Textarea input',
    'Text',
    (id) => createMultiLineInputComponent(id, { label: 'Textarea' }),
    MultiLineInputRenderer,
    MultiLineInputPropsRenderer
  ),

  [ComponentIDs.Number]: makeEntry(
    ComponentIDs.Number,
    'Number',
    'Integer input',
    'Numeric',
    (id) => createNumberComponent(id, { label: 'Number' }),
    NumberRenderer,
    NumberPropsRenderer
  ),

  [ComponentIDs.Decimal]: makeEntry(
    ComponentIDs.Decimal,
    'Decimal',
    'Decimal input',
    'Numeric',
    (id) => createDecimalComponent(id, { label: 'Decimal' }),
    DecimalRenderer,
    DecimalPropsRenderer
  ),

  [ComponentIDs.Checkbox]: makeEntry(
    ComponentIDs.Checkbox,
    'Checkbox',
    'Multiple choice',
    'Selection',
    (id) => createCheckboxComponent(id, { label: 'Checkbox' }),
    CheckboxComponentRenderer,
    CheckboxComponentPropsRenderer
  ),

  [ComponentIDs.Dropdown]: makeEntry(
    ComponentIDs.Dropdown,
    'Dropdown',
    'Dropdown select',
    'Selection',
    (id) => createDropdownComponent(id, { label: 'Dropdown' }),
    DropdownComponentRenderer,
    DropdownComponentPropsRenderer
  ),

  [ComponentIDs.Radio]: makeEntry(
    ComponentIDs.Radio,
    'Radio',
    'Single choice',
    'Selection',
    (id) => createRadioComponent(id, { label: 'Radio' }),
    RadioComponentRenderer,
    RadioComponentPropsRenderer
  ),
};

/* ─────────────────────────────
   REGISTRY ACCESSORS
───────────────────────────── */

export function getComponentRenderer<K extends ComponentID>(
  id: K
): ComponentRenderer<ComponentPropsMap[K], ComponentValidationMap[K]> | null {
  return registry[id].renderers.main;
}

export function getComponentPropsRenderer<K extends ComponentID>(
  id: K
):
  | ComponentRenderer<ComponentPropsMap[K], ComponentValidationMap[K]>
  | ComponentType<unknown>
  | null {
  return registry[id].renderers.settings;
}

export function createComponent<K extends ComponentID>(
  id: K,
  instanceId: string
): TypedFormComponent<K> {
  return registry[id].create(instanceId);
}

export function serializeComponent<K extends ComponentID>(
  component: TypedFormComponent<K>
): TypedSerializedComponent<K> {
  return {
    id: component.id,
    instanceId: component.instanceId,
    metadata: component.metadata,
    props: component.props,
    validation: component.validation,
  };
}

export function deserializeComponent<K extends ComponentID>(
  json: TypedSerializedComponent<K>
): TypedFormComponent<K> {
  return registry[json.id].deserialize(json);
}

/* ─────────────────────────────
   FLAT RENDERER MAP
───────────────────────────── */

export const componentRenderers: {
  [K in ComponentID]: ComponentRenderer<
    ComponentPropsMap[K],
    ComponentValidationMap[K]
  > | null;
} = Object.fromEntries(
  Object.entries(registry).map(([key, entry]) => [key, entry.renderers.main])
) as {
  [K in ComponentID]: ComponentRenderer<
    ComponentPropsMap[K],
    ComponentValidationMap[K]
  > | null;
};

/* ─────────────────────────────
   CATALOG
───────────────────────────── */

export interface CatalogEntry<K extends ComponentID = ComponentID> {
  id: K;
  label: string;
  description: string;
  category: string;
  create: (instanceId: string) => TypedFormComponent<K>;
}

// ── IDs of components currently enabled in the catalog ──
const ENABLED_CATALOG_IDS: ReadonlySet<ComponentID> = new Set<ComponentID>([
  ComponentIDs.Header,
  ComponentIDs.TextBox,
  ComponentIDs.LineDivider,

  ComponentIDs.SingleLineInput,
  ComponentIDs.MultiLineInput,

  ComponentIDs.Number,
  ComponentIDs.Decimal,

  ComponentIDs.Radio,
  ComponentIDs.Checkbox,
  ComponentIDs.Dropdown,
]);

export const catalogRegistry: CatalogEntry[] = (
  Object.values(registry) as RegistryEntry<ComponentID>[]
)
  .filter((def) => ENABLED_CATALOG_IDS.has(def.id))
  .map((def) => ({
    id: def.id,
    label: def.catalog.label,
    description: def.catalog.description,
    category: def.catalog.category,
    create: def.create,
  }));