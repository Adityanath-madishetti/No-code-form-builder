// src/form/components/input.ts
/**
 * Input Component
 * ------------------------------------------------------------------------------------------------
 * A basic single-line text input field for capturing user input.
 *
 * Features:
 * - Simple text entry (`placeholder`, `defaultValue`)
 * - Lightweight and minimal UI
 * - Fully controlled via form state
 *
 * Notes:
 * - Designed to be minimal; validation (e.g., required, min/max length)
 *   should be handled at a higher level
 * - `defaultValue` sets the initial value but does not enforce control
 * - Extendable for specialized inputs (email, number, password, etc.)
 * - Rendering is handled via `InputComponentRenderer`
 *
 * ------------------------------------------------------------------------------------------------
 */

import type { ComponentMetadata } from './base';
import { ComponentIDs } from './base';
import type { FormComponent } from '../registry/componentRegistry';

export interface InputProps {
  placeholder?: string;
  defaultValue?: string;
  // Add more props as needed (e.g., min/max length, validation rules)
}

export const createInputComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props: InputProps
): FormComponent => ({
  id: ComponentIDs.Input,
  instanceId,
  name: 'InputComponent',
  metadata,
  children: [],
  props,
});

export type InputComponent = ReturnType<typeof createInputComponent>;
