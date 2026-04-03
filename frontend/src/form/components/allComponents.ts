// src/form/components/allComponents.ts
/**
 * Bulk definition file for all new components.
 * Each component has a Props type, Validation type, and create factory.
 * Renderers are handled separately via the generic PlaceholderRenderer.
 */

import type { ComponentMetadata, FormComponent, ComponentID } from './base';
import { ComponentIDs } from './base';

// ── Generic create helper ──
function createComponent<T extends ComponentID, P, V>(
  id: T,
  instanceId: string,
  metadata: ComponentMetadata,
  props: P,
  validation: V
): FormComponent<T, P, V> {
  return { id, instanceId, metadata, children: [], props, validation };
}

// ── Shared validation types ──
export interface BasicValidation {
  required: boolean;
}

export interface TextValidation extends BasicValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface NumericValidation extends BasicValidation {
  min?: number;
  max?: number;
}

export interface NoValidation {
  proxy: number; // placeholder
}

// ── Shared props base ──
export interface BaseComponentProps {
  hidden: boolean; // Hidden by default = false
}

// ========================================================================================
//  LAYOUT COMPONENTS
// ========================================================================================

// ── Header ──
export interface HeaderProps extends BaseComponentProps {
  text: string;
  level: 'h1' | 'h2' | 'h3' | 'h4';
}
export const createHeaderComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<HeaderProps>
) =>
  createComponent(
    ComponentIDs.Header,
    instanceId,
    metadata,
    { text: 'Heading', level: 'h2' as const, hidden: false, ...props },
    { proxy: 0 } as NoValidation
  );

// ── Line Divider ──
export interface LineDividerProps extends BaseComponentProps {
  style: 'solid' | 'dashed' | 'dotted';
  thickness: number;
}
export const createLineDividerComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<LineDividerProps>
) =>
  createComponent(
    ComponentIDs.LineDivider,
    instanceId,
    metadata,
    { style: 'solid' as const, thickness: 1, hidden: false, ...props },
    { proxy: 0 } as NoValidation
  );

// ── Column Layout ──
export interface ColumnLayoutProps extends BaseComponentProps {
  columns: number;
  gap: number;
}
export const createColumnLayoutComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<ColumnLayoutProps>
) =>
  createComponent(
    ComponentIDs.ColumnLayout,
    instanceId,
    metadata,
    { columns: 2, gap: 16, hidden: false, ...props },
    { proxy: 0 } as NoValidation
  );

// ========================================================================================
//  TEXT INPUT COMPONENTS
// ========================================================================================

// ── Single-line Text (Input) ──
export interface InputProps extends BaseComponentProps {
  type?: string;
  questionText?: string;
  placeholder?: string;
  defaultValue?: string;
}

// export interface InputValidation {
//   required: boolean;
//   minLength: number;
//   maxLength?: number;
// }

export const createInputComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props: InputProps,
  validation: TextValidation
): FormComponent<'Input', InputProps, TextValidation> => ({
  id: ComponentIDs.SingleLineInput,
  instanceId,
  metadata,
  children: [],
  props,
  validation,
});

// ── Multi-line Text ──
export interface MultiLineInputProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
  rows: number;
}
export const createMultiLineInputComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<MultiLineInputProps>
) =>
  createComponent(
    ComponentIDs.MultiLineInput,
    instanceId,
    metadata,
    {
      questionText: '<p>Enter your response</p>',
      placeholder: '',
      defaultValue: '',
      rows: 4,
      hidden: false,
      ...props,
    },
    { required: false, minLength: 0 } as TextValidation
  );

// ── Email ──
export interface EmailProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
}
export const createEmailComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<EmailProps>
) =>
  createComponent(
    ComponentIDs.Email,
    instanceId,
    metadata,
    {
      questionText: '<p>Email address</p>',
      placeholder: 'user@example.com',
      defaultValue: '',
      hidden: false,
      ...props,
    },
    {
      required: false,
      pattern: '^[^@]+@[^@]+\\.[^@]+$',
    } as TextValidation
  );

// ── Phone ──
export interface PhoneProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
  countryCode: string;
}
export const createPhoneComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<PhoneProps>
) =>
  createComponent(
    ComponentIDs.Phone,
    instanceId,
    metadata,
    {
      questionText: '<p>Phone number</p>',
      placeholder: '+1 (555) 000-0000',
      defaultValue: '',
      countryCode: '+1',
      hidden: false,
      ...props,
    },
    { required: false } as TextValidation
  );

// ── Number ──
export interface NumberProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
}
export const createNumberComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<NumberProps>
) =>
  createComponent(
    ComponentIDs.Number,
    instanceId,
    metadata,
    {
      questionText: '<p>Enter a number</p>',
      placeholder: '0',
      defaultValue: '',
      hidden: false,
      ...props,
    },
    {
      required: false,
      hidden: false,
      min: undefined,
      max: undefined,
    } as NumericValidation
  );

// ── Decimal ──
export interface DecimalProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
  precision: number;
}
export const createDecimalComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<DecimalProps>
) =>
  createComponent(
    ComponentIDs.Decimal,
    instanceId,
    metadata,
    {
      questionText: '<p>Enter a decimal value</p>',
      placeholder: '0.00',
      defaultValue: '',
      precision: 2,
      hidden: false,
      ...props,
    },
    {
      required: false,
      min: undefined,
      max: undefined,
    } as NumericValidation
  );

// ── URL ──
export interface URLProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
}
export const createURLComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<URLProps>
) =>
  createComponent(
    ComponentIDs.URL,
    instanceId,
    metadata,
    {
      questionText: '<p>Enter a URL</p>',
      placeholder: 'https://example.com',
      defaultValue: '',
      hidden: false,
      ...props,
    },
    { required: false, pattern: '^https?://' } as TextValidation
  );

// ========================================================================================
//  DATE & TIME
// ========================================================================================

// ── Date ──
export interface DateProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  includeTime: boolean;
}
export const createDateComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<DateProps>
) =>
  createComponent(
    ComponentIDs.Date,
    instanceId,
    metadata,
    {
      questionText: '<p>Select a date</p>',
      placeholder: 'YYYY-MM-DD',
      includeTime: false,
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ── Time ──
export interface TimeProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  format24h: boolean;
}
export const createTimeComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<TimeProps>
) =>
  createComponent(
    ComponentIDs.Time,
    instanceId,
    metadata,
    {
      questionText: '<p>Select a time</p>',
      placeholder: 'HH:MM',
      format24h: false,
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ========================================================================================
//  FILE / MEDIA
// ========================================================================================

// ── File Upload ──
export interface FileUploadProps extends BaseComponentProps {
  questionText: string;
  accept: string;
  maxSizeMB: number;
  multiple: boolean;
}
export const createFileUploadComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<FileUploadProps>
) =>
  createComponent(
    ComponentIDs.FileUpload,
    instanceId,
    metadata,
    {
      questionText: '<p>Upload a file</p>',
      accept: '*',
      maxSizeMB: 10,
      multiple: false,
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ── Image Upload ──
export interface ImageUploadProps extends BaseComponentProps {
  questionText: string;
  accept: string;
  maxSizeMB: number;
  multiple: boolean;
}
export const createImageUploadComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<ImageUploadProps>
) =>
  createComponent(
    ComponentIDs.ImageUpload,
    instanceId,
    metadata,
    {
      questionText: '<p>Upload an image</p>',
      accept: 'image/*',
      maxSizeMB: 5,
      multiple: false,
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ========================================================================================
//  CHECKBOX
// ========================================================================================

export interface CheckboxOption {
  id: string;
  label: string;
  value: string;
}

export interface CheckboxProps extends BaseComponentProps {
  questionText?: string;
  options: CheckboxOption[];
  defaultValues?: string[];
  layout?: 'vertical' | 'horizontal';
}

// export interface CheckboxValidation {
//   required: boolean;
// }

export const createCheckboxComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props: CheckboxProps,
  validation: BasicValidation
): FormComponent<'Checkbox', CheckboxProps, BasicValidation> => ({
  id: ComponentIDs.Checkbox,
  instanceId,
  metadata,
  children: [],
  props,
  validation,
});

// ========================================================================================
//  DROPDOWN
// ========================================================================================

export interface DropdownOption {
  id: string;
  label: string;
  value: string;
}

export interface DropdownProps extends BaseComponentProps {
  questionText?: string;
  placeholder?: string;
  options: DropdownOption[];
  defaultValue?: string;
}

// export interface DropdownValidation {
//   requred: boolean;
// }

export const createDropdownComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props: DropdownProps,
  validation: BasicValidation
): FormComponent<'Dropdown', DropdownProps, BasicValidation> => ({
  id: ComponentIDs.Dropdown,
  instanceId,
  metadata,
  children: [],
  props,
  validation,
});

// ========================================================================================
//  RADIO
// ========================================================================================

export interface RadioOption {
  id: string;
  label: string;
  value: string;
}

export interface RadioProps extends BaseComponentProps {
  questionText?: string;
  options: RadioOption[];
  defaultValue?: string;
  layout?: 'vertical' | 'horizontal';
}

// export interface RadioValidation {
//   required: boolean;
// }

export const createRadioComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props: RadioProps,
  validation: BasicValidation
): FormComponent<'Radio', RadioProps, BasicValidation> => ({
  id: ComponentIDs.Radio,
  instanceId,
  metadata,
  children: [],
  props,
  validation,
});

// ========================================================================================
//  SELECTION / GRIDS
// ========================================================================================

interface GridOption {
  id: string;
  label: string;
  value: string;
}
interface GridRow {
  id: string;
  label: string;
}

// ── Single Choice Grid ──
export interface SingleChoiceGridProps extends BaseComponentProps {
  questionText: string;
  rows: GridRow[];
  columns: GridOption[];
}
export const createSingleChoiceGridComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<SingleChoiceGridProps>
) =>
  createComponent(
    ComponentIDs.SingleChoiceGrid,
    instanceId,
    metadata,
    {
      questionText: '<p>Select one per row</p>',
      rows: [{ id: crypto.randomUUID(), label: 'Row 1' }],
      columns: [
        { id: crypto.randomUUID(), label: 'Col 1', value: 'col-1' },
        { id: crypto.randomUUID(), label: 'Col 2', value: 'col-2' },
      ],
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ── Multi Choice Grid ──
export interface MultiChoiceGridProps extends BaseComponentProps {
  questionText: string;
  rows: GridRow[];
  columns: GridOption[];
}
export const createMultiChoiceGridComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<MultiChoiceGridProps>
) =>
  createComponent(
    ComponentIDs.MultiChoiceGrid,
    instanceId,
    metadata,
    {
      questionText: '<p>Select all that apply per row</p>',
      rows: [{ id: crypto.randomUUID(), label: 'Row 1' }],
      columns: [
        { id: crypto.randomUUID(), label: 'Col 1', value: 'col-1' },
        { id: crypto.randomUUID(), label: 'Col 2', value: 'col-2' },
      ],
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ── Matrix / Table ──
export interface MatrixTableProps extends BaseComponentProps {
  questionText: string;
  rows: GridRow[];
  columns: GridOption[];
  inputType: 'text' | 'number' | 'dropdown';
}
export const createMatrixTableComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<MatrixTableProps>
) =>
  createComponent(
    ComponentIDs.MatrixTable,
    instanceId,
    metadata,
    {
      questionText: '<p>Fill in the table</p>',
      rows: [{ id: crypto.randomUUID(), label: 'Row 1' }],
      columns: [{ id: crypto.randomUUID(), label: 'Col 1', value: 'col-1' }],
      inputType: 'text' as const,
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ========================================================================================
//  SCALES
// ========================================================================================

// ── Rating Scale ──
export interface RatingScaleProps extends BaseComponentProps {
  questionText: string;
  maxRating: number;
  icon: 'star' | 'heart' | 'circle';
}
export const createRatingScaleComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<RatingScaleProps>
) =>
  createComponent(
    ComponentIDs.RatingScale,
    instanceId,
    metadata,
    {
      questionText: '<p>Rate this</p>',
      maxRating: 5,
      icon: 'star' as const,
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ── Linear Scale ──
export interface LinearScaleProps extends BaseComponentProps {
  questionText: string;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
}
export const createLinearScaleComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<LinearScaleProps>
) =>
  createComponent(
    ComponentIDs.LinearScale,
    instanceId,
    metadata,
    {
      questionText: '<p>How would you rate this?</p>',
      min: 1,
      max: 10,
      minLabel: 'Low',
      maxLabel: 'High',
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ── Slider ──
export interface SliderProps extends BaseComponentProps {
  questionText: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}
export const createSliderComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<SliderProps>
) =>
  createComponent(
    ComponentIDs.Slider,
    instanceId,
    metadata,
    {
      questionText: '<p>Adjust the slider</p>',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 50,
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ========================================================================================
//  COMPOSITE / BLOCKS
// ========================================================================================

// ── Address Block ──
export interface AddressBlockProps extends BaseComponentProps {
  questionText: string;
  showLine2: boolean;
  showState: boolean;
  showZip: boolean;
  showCountry: boolean;
}
export const createAddressBlockComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<AddressBlockProps>
) =>
  createComponent(
    ComponentIDs.AddressBlock,
    instanceId,
    metadata,
    {
      questionText: '<p>Enter your address</p>',
      showLine2: true,
      showState: true,
      showZip: true,
      showCountry: true,
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ── Name Block ──
export interface NameBlockProps extends BaseComponentProps {
  questionText: string;
  showMiddleName: boolean;
  showPrefix: boolean;
  showSuffix: boolean;
}
export const createNameBlockComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<NameBlockProps>
) =>
  createComponent(
    ComponentIDs.NameBlock,
    instanceId,
    metadata,
    {
      questionText: '<p>Enter your name</p>',
      showMiddleName: false,
      showPrefix: false,
      showSuffix: false,
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ========================================================================================
//  SPECIALTY
// ========================================================================================

// ── Color Picker ──
export interface ColorPickerProps extends BaseComponentProps {
  questionText: string;
  defaultColor: string;
}
export const createColorPickerComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<ColorPickerProps>
) =>
  createComponent(
    ComponentIDs.ColorPicker,
    instanceId,
    metadata,
    {
      questionText: '<p>Pick a color</p>',
      defaultColor: '#4f46e5',
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ── Signature ──
export interface SignatureProps extends BaseComponentProps {
  questionText: string;
  penColor: string;
  lineWidth: number;
}
export const createSignatureComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<SignatureProps>
) =>
  createComponent(
    ComponentIDs.Signature,
    instanceId,
    metadata,
    {
      questionText: '<p>Sign here</p>',
      penColor: '#000000',
      lineWidth: 2,
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ── Location ──
export interface LocationProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  useCurrentLocation: boolean;
}
export const createLocationComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<LocationProps>
) =>
  createComponent(
    ComponentIDs.Location,
    instanceId,
    metadata,
    {
      questionText: '<p>Select your location</p>',
      placeholder: 'Search for a place...',
      useCurrentLocation: false,
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ========================================================================================
//  EXTRA (suggested)
// ========================================================================================

// ── Toggle ──
export interface ToggleProps extends BaseComponentProps {
  questionText: string;
  label: string;
  defaultValue: boolean;
}
export const createToggleComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<ToggleProps>
) =>
  createComponent(
    ComponentIDs.Toggle,
    instanceId,
    metadata,
    {
      questionText: '<p>Toggle option</p>',
      label: 'Enable',
      defaultValue: false,
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ── Rich Text Input ──
export interface RichTextInputProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
}
export const createRichTextInputComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<RichTextInputProps>
) =>
  createComponent(
    ComponentIDs.RichTextInput,
    instanceId,
    metadata,
    {
      questionText: '<p>Enter formatted text</p>',
      placeholder: 'Type here...',
      defaultValue: '',
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

// ── Captcha ──
export interface CaptchaProps extends BaseComponentProps {
  questionText: string;
  type: 'recaptcha' | 'hcaptcha' | 'simple';
}
export const createCaptchaComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<CaptchaProps>
) =>
  createComponent(
    ComponentIDs.Captcha,
    instanceId,
    metadata,
    {
      questionText: '<p>Verify you are human</p>',
      type: 'simple' as const,
      hidden: false,
      ...props,
    },
    { proxy: 0 } as NoValidation
  );
