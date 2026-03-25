// src/form/components/checkbox.ts
/**
 * Checkbox Component
 * ------------------------------------------------------------------------------------------------
 * A multi-select input component that allows users to choose one or more options
 * from a predefined list.
 *
 * Features:
 * - Supports multiple selections (`defaultValues` as array)
 * - Configurable options (label + value pairs)
 * - Optional rich-text question/description (`questionText`)
 * - Layout control: vertical (stacked) or horizontal (inline)
 *
 * Notes:
 * - Each option is uniquely identified by an `id`
 * - `value` is what gets stored/submitted, `label` is what is displayed
 * - Default selections are controlled via `defaultValues`
 * - Rendering is handled separately via `CheckboxComponentRenderer`
 *
 * ------------------------------------------------------------------------------------------------
 */

import type { FormComponent } from '../registry/componentRegistry';
import type { ComponentMetadata } from './base';
import { ComponentIDs } from './base';

export interface CheckboxOption {
  id: string;
  label: string;
  value: string;
}

export interface CheckboxProps {
  questionText?: string;
  options: CheckboxOption[];
  defaultValues?: string[]; // Note: Array for multiple selections
  layout?: 'vertical' | 'horizontal';
}

export const createCheckboxComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props: CheckboxProps
): FormComponent => ({
  id: ComponentIDs.Checkbox,
  instanceId,
  name: 'CheckboxComponent',
  metadata,
  children: [],
  props,
});

export type CheckboxComponent = ReturnType<typeof createCheckboxComponent>;
