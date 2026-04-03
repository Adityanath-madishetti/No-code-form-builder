// src/form/registry/componentRegistry.ts
/**
 * Component Registry — unified mapping of ComponentID → renderers, factories, catalog.
 *
 * Existing 5 components keep their custom renderers.
 * New components use PlaceholderRenderer until custom renderers are built.
 */

import type { ComponentType } from 'react';
import { ComponentIDs } from '../components/base';
import type { ComponentID, RendererProps } from '../components/base';
import type { FormComponent, SerializedComponent } from '../components/base';

import { PlaceholderSettingsRenderer } from '../components/PlaceholderRenderer';

import type {
  BasicValidation,
  TextValidation,
  NumericValidation,
  NoValidation,
} from '../components/base';

// ------------------------------------------------------------------------------------------------
//
//
// ------------------------------------------------------------------------------------------------
import {
  type TextBoxProps,
  type TextBoxValidation,
  createTextBoxComponent,
  TextBoxComponentRenderer,
  TextBoxComponentPropsRenderer,
} from '../components/comps/TextBox';

import {
  type HeaderProps,
  createHeaderComponent,
  HeaderRenderer,
  HeaderPropsRenderer,
} from '../components/comps/Header';

import {
  type LineDividerProps,
  createLineDividerComponent,
  LineDividerRenderer,
  LineDividerPropsRenderer,
} from '../components/comps/LineDivider';

import {
  type SingleLineInputProps,
  createSingleLineInputComponent,
  SingleLineInputRenderer,
  SingleLineInputPropsRenderer,
} from '../components/comps/SingleLineInput';

import {
  type MultiLineInputProps,
  createMultiLineInputComponent,
  MultiLineInputRenderer,
  MultiLineInputPropsRenderer,
} from '../components/comps/MultiLineInput';

import {
  type EmailProps,
  createEmailComponent,
  EmailRenderer,
  EmailPropsRenderer,
} from '../components/comps/Email';

import {
  type PhoneProps,
  createPhoneComponent,
  PhoneRenderer,
  PhonePropsRenderer,
} from '../components/comps/Phone';

import {
  type NumberProps,
  createNumberComponent,
  NumberRenderer,
  NumberPropsRenderer,
} from '../components/comps/Number';

import {
  type DecimalProps,
  createDecimalComponent,
  DecimalRenderer,
  DecimalPropsRenderer,
} from '../components/comps/Decimal';

import {
  type URLProps,
  createURLComponent,
  URLRenderer,
  URLPropsRenderer,
} from '../components/comps/URL';

import {
  type DateProps,
  createDateComponent,
  DateRenderer,
  DatePropsRenderer,
} from '../components/comps/Date';

import {
  type TimeProps,
  createTimeComponent,
  TimeRenderer,
  TimePropsRenderer,
} from '../components/comps/Time';

import {
  type CheckboxProps,
  createCheckboxComponent,
  CheckboxComponentRenderer,
  CheckboxComponentPropsRenderer,
} from '../components/comps/Checkbox';

import {
  type DropdownProps,
  createDropdownComponent,
  DropdownComponentRenderer,
  DropdownComponentPropsRenderer,
} from '../components/comps/Dropdown';

import {
  type RadioProps,
  createRadioComponent,
  RadioComponentRenderer,
  RadioComponentPropsRenderer,
} from '../components/comps/Radio';

// ------------------------------------------------------------------------------------------------
//
//
// ------------------------------------------------------------------------------------------------

import {
  ColumnLayoutRenderer,
  FileUploadRenderer,
  ImageUploadRenderer,
  SingleChoiceGridRenderer,
  MultiChoiceGridRenderer,
  MatrixTableRenderer,
  RatingScaleRenderer,
  RatingScalePropsRenderer,
  LinearScaleRenderer,
  LinearScalePropsRenderer,
  SliderRenderer,
  SliderPropsRenderer,
  AddressBlockRenderer,
  AddressBlockPropsRenderer,
  NameBlockRenderer,
  NameBlockPropsRenderer,
  ColorPickerRenderer,
  SignatureRenderer,
  LocationRenderer,
  LocationPropsRenderer,
  ToggleRenderer,
  RichTextInputRenderer,
  CaptchaRenderer,
} from '../components/NewComponentRenderers';

// ── New component factories ──
import {
  createColumnLayoutComponent,
  createFileUploadComponent,
  createImageUploadComponent,
  createSingleChoiceGridComponent,
  createMultiChoiceGridComponent,
  createMatrixTableComponent,
  createRatingScaleComponent,
  createLinearScaleComponent,
  createSliderComponent,
  createAddressBlockComponent,
  createNameBlockComponent,
  createColorPickerComponent,
  createSignatureComponent,
  createLocationComponent,
  createToggleComponent,
  createRichTextInputComponent,
  createCaptchaComponent,
} from '../components/allComponents';

import type {
  ColumnLayoutProps,
  FileUploadProps,
  ImageUploadProps,
  SingleChoiceGridProps,
  MultiChoiceGridProps,
  MatrixTableProps,
  RatingScaleProps,
  LinearScaleProps,
  SliderProps,
  AddressBlockProps,
  NameBlockProps,
  ColorPickerProps,
  SignatureProps,
  LocationProps,
  ToggleProps,
  RichTextInputProps,
  CaptchaProps,
} from '../components/allComponents';

// ── Type maps ──

export type ComponentPropsMap = {
  [ComponentIDs.TextBox]: TextBoxProps;
  [ComponentIDs.SingleLineInput]: SingleLineInputProps;
  [ComponentIDs.Radio]: RadioProps;
  [ComponentIDs.Checkbox]: CheckboxProps;
  [ComponentIDs.Dropdown]: DropdownProps;
  [ComponentIDs.Header]: HeaderProps;
  [ComponentIDs.LineDivider]: LineDividerProps;
  [ComponentIDs.ColumnLayout]: ColumnLayoutProps;
  [ComponentIDs.MultiLineInput]: MultiLineInputProps;
  [ComponentIDs.Email]: EmailProps;
  [ComponentIDs.Phone]: PhoneProps;
  [ComponentIDs.Number]: NumberProps;
  [ComponentIDs.Decimal]: DecimalProps;
  [ComponentIDs.URL]: URLProps;
  [ComponentIDs.Date]: DateProps;
  [ComponentIDs.Time]: TimeProps;
  [ComponentIDs.FileUpload]: FileUploadProps;
  [ComponentIDs.ImageUpload]: ImageUploadProps;
  [ComponentIDs.SingleChoiceGrid]: SingleChoiceGridProps;
  [ComponentIDs.MultiChoiceGrid]: MultiChoiceGridProps;
  [ComponentIDs.MatrixTable]: MatrixTableProps;
  [ComponentIDs.RatingScale]: RatingScaleProps;
  [ComponentIDs.LinearScale]: LinearScaleProps;
  [ComponentIDs.Slider]: SliderProps;
  [ComponentIDs.AddressBlock]: AddressBlockProps;
  [ComponentIDs.NameBlock]: NameBlockProps;
  [ComponentIDs.ColorPicker]: ColorPickerProps;
  [ComponentIDs.Signature]: SignatureProps;
  [ComponentIDs.Location]: LocationProps;
  [ComponentIDs.Toggle]: ToggleProps;
  [ComponentIDs.RichTextInput]: RichTextInputProps;
  [ComponentIDs.Captcha]: CaptchaProps;
};

export type ComponentValidationMap = {
  [ComponentIDs.TextBox]: TextBoxValidation;
  [ComponentIDs.SingleLineInput]: TextValidation;
  [ComponentIDs.Radio]: BasicValidation;
  [ComponentIDs.Checkbox]: BasicValidation;
  [ComponentIDs.Dropdown]: BasicValidation;
  [ComponentIDs.Header]: NoValidation;
  [ComponentIDs.LineDivider]: NoValidation;
  [ComponentIDs.ColumnLayout]: NoValidation;
  [ComponentIDs.MultiLineInput]: TextValidation;
  [ComponentIDs.Email]: TextValidation;
  [ComponentIDs.Phone]: TextValidation;
  [ComponentIDs.Number]: NumericValidation;
  [ComponentIDs.Decimal]: NumericValidation;
  [ComponentIDs.URL]: TextValidation;
  [ComponentIDs.Date]: BasicValidation;
  [ComponentIDs.Time]: BasicValidation;
  [ComponentIDs.FileUpload]: BasicValidation;
  [ComponentIDs.ImageUpload]: BasicValidation;
  [ComponentIDs.SingleChoiceGrid]: BasicValidation;
  [ComponentIDs.MultiChoiceGrid]: BasicValidation;
  [ComponentIDs.MatrixTable]: BasicValidation;
  [ComponentIDs.RatingScale]: BasicValidation;
  [ComponentIDs.LinearScale]: BasicValidation;
  [ComponentIDs.Slider]: BasicValidation;
  [ComponentIDs.AddressBlock]: BasicValidation;
  [ComponentIDs.NameBlock]: BasicValidation;
  [ComponentIDs.ColorPicker]: BasicValidation;
  [ComponentIDs.Signature]: BasicValidation;
  [ComponentIDs.Location]: BasicValidation;
  [ComponentIDs.Toggle]: BasicValidation;
  [ComponentIDs.RichTextInput]: BasicValidation;
  [ComponentIDs.Captcha]: NoValidation;
};

// ── Union types ──

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ComponentRenderer<TProps = any, TValidation = any> = ComponentType<
  RendererProps<TProps, TValidation>
>;

// ── Registry entry type ──

export interface ComponentRegistryEntry<T extends ComponentID> {
  id: T;
  catalog: { label: string; description: string; category: string };
  renderers: {
    main: ComponentRenderer<
      ComponentPropsMap[T],
      ComponentValidationMap[T]
    > | null;
    settings: ComponentRenderer<
      ComponentPropsMap[T],
      ComponentValidationMap[T]
    > | null;
  };
  create: (instanceId: string) => FormComponent<T, ComponentPropsMap[T]>;
  deserialize: (
    json: SerializedComponent<
      T,
      ComponentPropsMap[T],
      ComponentValidationMap[T]
    >
  ) => FormComponent<T, ComponentPropsMap[T], ComponentValidationMap[T]>;
}

// ── Internal registry ──

type Registry = { [K in ComponentID]: ComponentRegistryEntry<K> };

// Helper to make a quick entry for new components
function makeEntry<T extends ComponentID>(
  id: T,
  label: string,
  description: string,
  category: string,
  createFn: (
    instanceId: string,
    metadata: { label: string }
  ) => FormComponent<T, ComponentPropsMap[T]>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mainRenderer: ComponentRenderer<any, any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settingsRenderer?: ComponentRenderer<any, any>
): ComponentRegistryEntry<T> {
  return {
    id,
    catalog: { label, description, category },
    renderers: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      main: mainRenderer as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      settings: (settingsRenderer || PlaceholderSettingsRenderer) as any,
    },
    create: (instanceId) => createFn(instanceId, { label }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deserialize: (json: any) => ({
      id: json.id,
      instanceId: json.instanceId,
      metadata: json.metadata,
      children: [],
      props: json.props,
      validation: json.validation,
    }),
  };
}

const registry: Registry = {
  // ════════════════════════════════════════════════════════
  //  EXISTING (custom renderers)
  // ════════════════════════════════════════════════════════
  [ComponentIDs.TextBox]: {
    id: ComponentIDs.TextBox,
    catalog: {
      label: 'Text Box',
      description: 'A static rich text block.',
      category: 'Layout',
    },
    renderers: {
      main: TextBoxComponentRenderer,
      settings: TextBoxComponentPropsRenderer,
    },
    create: (instanceId) =>
      createTextBoxComponent(
        instanceId,
        { label: 'Text Box' },
        { text: '', hidden: false },
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
  [ComponentIDs.SingleLineInput]: {
    id: ComponentIDs.SingleLineInput,
    catalog: {
      label: 'Single-line Text',
      description: 'A single-line text input.',
      category: 'Text Inputs',
    },
    renderers: {
      main: SingleLineInputRenderer,
      settings: SingleLineInputPropsRenderer,
    },
    create: (instanceId) =>
      createSingleLineInputComponent(
        instanceId,
        { label: 'Input Field' },
        {
          questionText: 'Write the answer...',
          placeholder: '',
          defaultValue: '',
          hidden: false,
        },
        { required: false, minLength: 0 }
      ),
    deserialize: (json) =>
      createSingleLineInputComponent(
        json.instanceId,
        json.metadata,
        json.props,
        json.validation
      ),
  },
  [ComponentIDs.Radio]: {
    id: ComponentIDs.Radio,
    catalog: {
      label: 'Radio Buttons',
      description: 'Single choice selection.',
      category: 'Selection',
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
          hidden: false,
        },
        { required: false }
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
      description: 'Multiple choice selection.',
      category: 'Selection',
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
          hidden: false,
        },
        { required: false }
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
      description: 'Select from a dropdown list.',
      category: 'Selection',
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
          hidden: false,
        },
        { required: false }
      ),
    deserialize: (json) =>
      createDropdownComponent(
        json.instanceId,
        json.metadata,
        json.props,
        json.validation
      ),
  },

  // ════════════════════════════════════════════════════════
  //  LAYOUT
  // ════════════════════════════════════════════════════════
  [ComponentIDs.Header]: makeEntry(
    ComponentIDs.Header,
    'Header',
    'A heading / title element.',
    'Layout',
    (id, m) => createHeaderComponent(id, m),
    HeaderRenderer,
    HeaderPropsRenderer
  ),

  [ComponentIDs.LineDivider]: makeEntry(
    ComponentIDs.LineDivider,
    'Line Divider',
    'A horizontal line separator.',
    'Layout',
    (id, m) => createLineDividerComponent(id, m),
    LineDividerRenderer,
    LineDividerPropsRenderer
  ),

  [ComponentIDs.ColumnLayout]: makeEntry(
    ComponentIDs.ColumnLayout,
    'Columns',
    'Place components side by side.',
    'Layout',
    (id, m) => createColumnLayoutComponent(id, m),
    ColumnLayoutRenderer
  ),

  // ════════════════════════════════════════════════════════
  //  TEXT INPUTS
  // ════════════════════════════════════════════════════════
  [ComponentIDs.MultiLineInput]: makeEntry(
    ComponentIDs.MultiLineInput,
    'Multi-line Text',
    'A multi-line text area.',
    'Text Inputs',
    (id, m) => createMultiLineInputComponent(id, m),
    MultiLineInputRenderer,
    MultiLineInputPropsRenderer
  ),

  [ComponentIDs.Email]: makeEntry(
    ComponentIDs.Email,
    'Email',
    'An email address input.',
    'Text Inputs',
    (id, m) => createEmailComponent(id, m),
    EmailRenderer,
    EmailPropsRenderer
  ),

  [ComponentIDs.Phone]: makeEntry(
    ComponentIDs.Phone,
    'Phone',
    'A phone number input with country code.',
    'Text Inputs',
    (id, m) => createPhoneComponent(id, m),
    PhoneRenderer,
    PhonePropsRenderer
  ),

  [ComponentIDs.Number]: makeEntry(
    ComponentIDs.Number,
    'Number',
    'An integer number input.',
    'Text Inputs',
    (id, m) => createNumberComponent(id, m),
    NumberRenderer,
    NumberPropsRenderer
  ),

  [ComponentIDs.Decimal]: makeEntry(
    ComponentIDs.Decimal,
    'Decimal',
    'A decimal / floating-point input.',
    'Text Inputs',
    (id, m) => createDecimalComponent(id, m),
    DecimalRenderer,
    DecimalPropsRenderer
  ),

  [ComponentIDs.URL]: makeEntry(
    ComponentIDs.URL,
    'URL',
    'A URL / web address input.',
    'Text Inputs',
    (id, m) => createURLComponent(id, m),
    URLRenderer,
    URLPropsRenderer
  ),

  // ════════════════════════════════════════════════════════
  //  DATE & TIME
  // ════════════════════════════════════════════════════════
  [ComponentIDs.Date]: makeEntry(
    ComponentIDs.Date,
    'Date',
    'A date picker.',
    'Date & Time',
    (id, m) => createDateComponent(id, m),
    DateRenderer,
    DatePropsRenderer
  ),

  [ComponentIDs.Time]: makeEntry(
    ComponentIDs.Time,
    'Time',
    'A time picker.',
    'Date & Time',
    (id, m) => createTimeComponent(id, m),
    TimeRenderer,
    TimePropsRenderer
  ),

  // ════════════════════════════════════════════════════════
  //  FILE / MEDIA
  // ════════════════════════════════════════════════════════
  [ComponentIDs.FileUpload]: makeEntry(
    ComponentIDs.FileUpload,
    'File Upload',
    'Accept file uploads.',
    'File / Media',
    (id, m) => createFileUploadComponent(id, m),
    FileUploadRenderer
  ),

  [ComponentIDs.ImageUpload]: makeEntry(
    ComponentIDs.ImageUpload,
    'Image Upload',
    'Accept image uploads with preview.',
    'File / Media',
    (id, m) => createImageUploadComponent(id, m),
    ImageUploadRenderer
  ),

  // ════════════════════════════════════════════════════════
  //  SELECTION / GRIDS
  // ════════════════════════════════════════════════════════
  [ComponentIDs.SingleChoiceGrid]: makeEntry(
    ComponentIDs.SingleChoiceGrid,
    'Single-choice Grid',
    'Select one answer per row.',
    'Grids & Tables',
    (id, m) => createSingleChoiceGridComponent(id, m),
    SingleChoiceGridRenderer
  ),

  [ComponentIDs.MultiChoiceGrid]: makeEntry(
    ComponentIDs.MultiChoiceGrid,
    'Multi-choice Grid',
    'Select multiple answers per row.',
    'Grids & Tables',
    (id, m) => createMultiChoiceGridComponent(id, m),
    MultiChoiceGridRenderer
  ),

  [ComponentIDs.MatrixTable]: makeEntry(
    ComponentIDs.MatrixTable,
    'Matrix / Table',
    'A table with text/number inputs.',
    'Grids & Tables',
    (id, m) => createMatrixTableComponent(id, m),
    MatrixTableRenderer
  ),

  // ════════════════════════════════════════════════════════
  //  SCALES
  // ════════════════════════════════════════════════════════
  [ComponentIDs.RatingScale]: makeEntry(
    ComponentIDs.RatingScale,
    'Rating Scale',
    'Star / heart / dot rating.',
    'Scales & Sliders',
    (id, m) => createRatingScaleComponent(id, m),
    RatingScaleRenderer,
    RatingScalePropsRenderer
  ),

  [ComponentIDs.LinearScale]: makeEntry(
    ComponentIDs.LinearScale,
    'Linear Scale',
    'A numbered scale (e.g. 1–10).',
    'Scales & Sliders',
    (id, m) => createLinearScaleComponent(id, m),
    LinearScaleRenderer,
    LinearScalePropsRenderer
  ),

  [ComponentIDs.Slider]: makeEntry(
    ComponentIDs.Slider,
    'Slider',
    'A draggable range slider.',
    'Scales & Sliders',
    (id, m) => createSliderComponent(id, m),
    SliderRenderer,
    SliderPropsRenderer
  ),

  // ════════════════════════════════════════════════════════
  //  COMPOSITE / BLOCKS
  // ════════════════════════════════════════════════════════
  [ComponentIDs.AddressBlock]: makeEntry(
    ComponentIDs.AddressBlock,
    'Address Block',
    'A multi-field address input.',
    'Blocks',
    (id, m) => createAddressBlockComponent(id, m),
    AddressBlockRenderer,
    AddressBlockPropsRenderer
  ),

  [ComponentIDs.NameBlock]: makeEntry(
    ComponentIDs.NameBlock,
    'Name Block',
    'First / middle / last name fields.',
    'Blocks',
    (id, m) => createNameBlockComponent(id, m),
    NameBlockRenderer,
    NameBlockPropsRenderer
  ),

  // ════════════════════════════════════════════════════════
  //  SPECIALTY
  // ════════════════════════════════════════════════════════
  [ComponentIDs.ColorPicker]: makeEntry(
    ComponentIDs.ColorPicker,
    'Color Picker',
    'A color selection input.',
    'Specialty',
    (id, m) => createColorPickerComponent(id, m),
    ColorPickerRenderer
  ),

  [ComponentIDs.Signature]: makeEntry(
    ComponentIDs.Signature,
    'Signature',
    'A signature capture pad.',
    'Specialty',
    (id, m) => createSignatureComponent(id, m),
    SignatureRenderer
  ),

  [ComponentIDs.Location]: makeEntry(
    ComponentIDs.Location,
    'Location',
    'A map / location picker.',
    'Specialty',
    (id, m) => createLocationComponent(id, m),
    LocationRenderer,
    LocationPropsRenderer
  ),

  [ComponentIDs.Toggle]: makeEntry(
    ComponentIDs.Toggle,
    'Toggle',
    'An on/off switch.',
    'Specialty',
    (id, m) => createToggleComponent(id, m),
    ToggleRenderer
  ),

  [ComponentIDs.RichTextInput]: makeEntry(
    ComponentIDs.RichTextInput,
    'Rich Text Input',
    'A rich text editor field.',
    'Specialty',
    (id, m) => createRichTextInputComponent(id, m),
    RichTextInputRenderer
  ),

  [ComponentIDs.Captcha]: makeEntry(
    ComponentIDs.Captcha,
    'Captcha',
    'Bot verification challenge.',
    'Specialty',
    (id, m) => createCaptchaComponent(id, m),
    CaptchaRenderer
  ),
};

// ════════════════════════════════════════════════════════
//  PUBLIC HELPERS
// ════════════════════════════════════════════════════════

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

// Flat renderer map (used by DragOverlay etc.)
export const componentRenderers = Object.fromEntries(
  Object.entries(registry).map(([key, entry]) => [key, entry.renderers.main])
) as {
  [K in ComponentID]: ComponentRenderer<
    ComponentPropsMap[K],
    ComponentValidationMap[K]
  > | null;
};

// ════════════════════════════════════════════════════════
//  CATALOG
// ════════════════════════════════════════════════════════

export interface CatalogEntry {
  id: ComponentID;
  label: string;
  description: string;
  category: string;
  create: (instanceId: string) => FormComponent;
}

// ── IDs of components currently enabled in the catalog ──
const ENABLED_CATALOG_IDS: Set<string> = new Set([
  // Layout
  ComponentIDs.Header,
  ComponentIDs.TextBox,
  ComponentIDs.LineDivider,
  // ComponentIDs.ColumnLayout,

  // Text Inputs
  ComponentIDs.SingleLineInput,
  ComponentIDs.MultiLineInput,
  ComponentIDs.Email,
  ComponentIDs.Phone,
  ComponentIDs.Number,
  ComponentIDs.Decimal,
  ComponentIDs.URL,

  // Date & Time
  ComponentIDs.Date,
  ComponentIDs.Time,

  // File / Media
  // ComponentIDs.FileUpload,
  // ComponentIDs.ImageUpload,

  // Selection
  ComponentIDs.Radio,
  ComponentIDs.Checkbox,
  ComponentIDs.Dropdown,
  // ComponentIDs.SingleChoiceGrid,
  // ComponentIDs.MultiChoiceGrid,
  // ComponentIDs.MatrixTable,

  // Scales & Sliders
  ComponentIDs.RatingScale,
  ComponentIDs.LinearScale,
  ComponentIDs.Slider,

  // Blocks
  ComponentIDs.NameBlock,
  ComponentIDs.AddressBlock,

  // Specialty
  // ComponentIDs.ColorPicker,
  // ComponentIDs.Signature,
  // ComponentIDs.Location,
  // ComponentIDs.Toggle,
  // ComponentIDs.RichTextInput,
  // ComponentIDs.Captcha,
]);

export const catalogRegistry: CatalogEntry[] = Object.values(registry)
  .filter((def) => ENABLED_CATALOG_IDS.has(def.id))
  .map((def) => ({
    id: def.id,
    label: def.catalog.label,
    description: def.catalog.description,
    category: def.catalog.category,
    create: def.create,
  }));
