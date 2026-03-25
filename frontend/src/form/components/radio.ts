// src/form/components/radio.ts
/**
 * Radio Component
 * ------------------------------------------------------------------------------------------------
 * A single-select input component that allows users to choose exactly one option
 * from a list of predefined choices.
 *
 * Features:
 * - Single selection (`defaultValue`)
 * - Configurable options (label + value pairs)
 * - Optional rich-text question/description (`questionText`)
 * - Layout control: vertical (stacked) or horizontal (inline)
 *
 * Notes:
 * - Only one option can be selected at a time
 * - `value` is used for storage/submission, `label` is displayed to users
 * - If `defaultValue` is undefined, no option is pre-selected
 * - Prefer over Dropdown when visibility of all options improves usability
 * - Rendering is handled separately via `RadioComponentRenderer`
 *
 * ------------------------------------------------------------------------------------------------
 */

import type { FormComponent } from '../registry/componentRegistry';
import type { ComponentMetadata } from './base';
import { ComponentIDs } from './base';

export interface RadioOption {
  id: string;
  label: string;
  value: string;
}

export interface RadioProps {
  questionText?: string;
  options: RadioOption[];
  defaultValue?: string;
  layout?: 'vertical' | 'horizontal';
}

export const createRadioComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props: RadioProps
): FormComponent => ({
    id: ComponentIDs.Radio,
    instanceId,
    name:'RadioComponent',
    metadata,
    children: [],
    props
});

export type RadioComponent = ReturnType<typeof createRadioComponent>;
