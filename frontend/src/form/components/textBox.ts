// src/form/components/textBox.ts
/**
 * TextBox Component
 * ------------------------------------------------------------------------------------------------
 * A read-only content component used to display static or formatted text
 * within a form.
 *
 * Features:
 * - Rich text support (HTML via RichTextEditor)
 * - Fully customizable content (headings, lists, links, etc.)
 * - Styled consistently using shared prose classes
 *
 * Notes:
 * - This is a **view-only** component (no user input)
 * - Content is stored as sanitized HTML
 * - Ideal for improving form clarity and UX without adding interactivity
 * - Rendering is handled via `TextBoxComponentRenderer`
 *
 * ------------------------------------------------------------------------------------------------
 */

import type { ComponentMetadata } from './base';
import { ComponentIDs } from './base';
import type { FormComponent } from '@/form/components/base';

export interface TextBoxProps {
  text: string;
  hidden: boolean;
}

export interface TextBoxValidation {
  proxy: number;
}

export const createTextBoxComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props: TextBoxProps,
  validation: TextBoxValidation
): FormComponent<'Textbox', TextBoxProps, TextBoxValidation> => ({
  id: ComponentIDs.TextBox,
  instanceId,
  metadata,
  children: [],
  props,
  validation,
});
export type TextBoxComponent = ReturnType<typeof createTextBoxComponent>;
