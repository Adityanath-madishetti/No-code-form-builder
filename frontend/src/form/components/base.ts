// src/form/components/base.ts
/**
 * Form Component System - Base Types
 * ------------------------------------------------------------------------------------------------
 * This file defines the foundational type system for a schema-driven form builder.
 *
 * Design Goals:
 * - Strongly typed component registry
 * - Serializable form structure (for storage, transport, versioning)
 * - Decoupled rendering (UI) from data model
 * - Support for dynamic / nested components
 * - Extensible for new component types without modifying core logic
 *
 * Architecture Overview:
 * - A `Form` contains multiple `FormPage`s
 * - Each `FormPage` contains an ordered list of component `InstanceID`s
 * - Each component is represented by a `BaseFormComponent` instance
 * - Rendering is handled separately via `RendererProps`
 *
 * Key Concepts:
 * - `ComponentID`: Identifies the type of component (Input, Checkbox, etc.)
 * - `InstanceID`: Unique identifier for a specific instance in the form tree
 * - `props`: Strongly-typed configuration specific to each component
 * - `children`: Enables composition / nesting of components
 *
 * ------------------------------------------------------------------------------------------------
 * Typical Flow:
 *
 * 1. Define component types (via `ComponentIDs`)
 * 2. Store instances as `BaseFormComponent<P>`
 * 3. Maintain layout using `FormPage.children`
 * 4. Render via a component registry using `RendererProps`
 *
 * ------------------------------------------------------------------------------------------------
 * Notes:
 * - This layer is purely structural (no UI logic)
 * - Designed to work with state stores (e.g., Zustand) and renderer registries
 * - Enables features like persistence, undo/redo, and collaborative editing
 *
 * ------------------------------------------------------------------------------------------------
 */

// ------------------------------------------------------------------------------------------------
//
// Component Model
//
// ------------------------------------------------------------------------------------------------

/**
 * Enum-like mapping of all supported component types.
 *
 * Extend this object to introduce new components into the system.
 * Acts as the canonical source of truth for component type IDs.
 */
export const ComponentIDs = {
  // ── Existing ──
  TextBox: 'Textbox',
  Input: 'Input',
  Radio: 'Radio',
  Checkbox: 'Checkbox',
  Dropdown: 'Dropdown',

  // ── Layout ──
  Header: 'Header',
  SectionDivider: 'SectionDivider',
  LineDivider: 'LineDivider',
  ColumnLayout: 'ColumnLayout',

  // ── Text Inputs ──
  MultiLineText: 'MultiLineText',
  Email: 'Email',
  Phone: 'Phone',
  Number: 'Number',
  Decimal: 'Decimal',
  URL: 'URL',

  // ── Date & Time ──
  Date: 'Date',
  Time: 'Time',

  // ── File / Media ──
  FileUpload: 'FileUpload',
  ImageUpload: 'ImageUpload',

  // ── Selection / Grids ──
  SingleChoiceGrid: 'SingleChoiceGrid',
  MultiChoiceGrid: 'MultiChoiceGrid',
  MatrixTable: 'MatrixTable',

  // ── Scales ──
  RatingScale: 'RatingScale',
  LinearScale: 'LinearScale',
  Slider: 'Slider',

  // ── Composite / Blocks ──
  AddressBlock: 'AddressBlock',
  NameBlock: 'NameBlock',

  // ── Specialty ──
  ColorPicker: 'ColorPicker',
  Signature: 'Signature',
  Location: 'Location',

  // ── Extra (suggested) ──
  PasswordInput: 'PasswordInput',
  Toggle: 'Toggle',
  RichTextInput: 'RichTextInput',
  Payment: 'Payment',
  Captcha: 'Captcha',
} as const;

export type ComponentID = (typeof ComponentIDs)[keyof typeof ComponentIDs];
export type InstanceID = string;
export type PageID = string;
export type FormID = string;
export type ThemeID = string;
export type FormVisibility = 'public' | 'private' | 'link-only';
export type CollectEmailMode = 'none' | 'optional' | 'required';
export type SubmissionPolicy =
  | 'none'
  | 'edit_only'
  | 'resubmit_only'
  | 'edit_and_resubmit';

export interface ComponentMetadata {
  label: string;
  description?: string;
  // isLocked?: boolean;
  // group: 'layout' | 'input' | 'selection';
}

/**
 * Props passed to a renderer for a specific component instance.
 *
 * Separates rendering concerns from the underlying data model.
 */
export interface RendererProps<P, V> {
  instanceId: InstanceID;
  metadata: ComponentMetadata;
  props: P;
  validation: V;
}

/**
 * Represents a component instance within the form tree.
 * Uses generics so the base layer doesn't need to know about specific component props.
 */
export interface FormComponent<
  T extends ComponentID = ComponentID,
  P = unknown,
  V = unknown,
> {
  id: T;
  instanceId: InstanceID;
  metadata: ComponentMetadata;
  props: P;
  validation: V;
  children: InstanceID[];
}

/**
 * The serializable version of a component (strips out runtime/tree data if needed).
 */
export interface SerializedComponent<
  T extends ComponentID = ComponentID,
  P = unknown,
  V = unknown,
> {
  id: T;
  instanceId: InstanceID;
  metadata: ComponentMetadata;
  props: P;
  validation: V;
}

export interface FormPage {
  readonly id: PageID;
  title?: string;
  description?: string;
  children: InstanceID[];
  isTerminal: boolean;
}

// ------------------------------------------------------------------------------------------------
//
// Form Model
//
// ------------------------------------------------------------------------------------------------

export interface FormMetadata {
  description?: string;
  createdAt: string;
  updatedAt: string;
  authorId?: string;
  version?: number;
}

import type { formFontName, formThemeColor, formThemeMode } from '../theme/formTheme';

export interface Font {
  family: formFontName;
}

export interface FormTheme {
  color: formThemeColor;
  mode: formThemeMode;
  headingFont: Font;
  bodyFont: Font;
}

export interface AccessIdentity {
  uid?: string;
  email: string;
}

export interface FormAccess {
  visibility: FormVisibility;
  editors: AccessIdentity[];
  reviewers: AccessIdentity[];
  viewers: AccessIdentity[];
}

export interface FormSettings {
  submissionLimit: number | null;
  closeDate: string | null;
  collectEmailMode: CollectEmailMode;
  submissionPolicy: SubmissionPolicy;
  canViewOwnSubmission: boolean;
  confirmationMessage: string;
}

/**
 * The root container for a form.
 * Manages form-level settings, metadata, and the ordered list of pages.
 */
export interface Form {
  readonly id: FormID;
  name: string;
  theme: FormTheme | null;
  metadata: FormMetadata;
  access: FormAccess;
  settings: FormSettings;
  pages: PageID[];
}
