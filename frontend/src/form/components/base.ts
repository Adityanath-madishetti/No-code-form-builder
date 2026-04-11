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
  // ── Layout ──
  TextBox: 'Textbox',
  Header: 'Header',
  LineDivider: 'LineDivider',
  // ColumnLayout: 'ColumnLayout',

  // ── Text Inputs ──
  SingleLineInput: 'SingleLineInput',
  MultiLineInput: 'MultiLineInput',

  // ── Numeric ──
  Number: 'Number',
  Decimal: 'Decimal',

  // ── Selection ──
  Radio: 'Radio',
  Checkbox: 'Checkbox',
  Dropdown: 'Dropdown',
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
  themeOverrides?: Partial<FormTheme>;
  defaultNextPageId?: PageID;
  defaultPreviousPageId?: PageID;
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
  metadata: FormMetadata;
  access: FormAccess;
  settings: FormSettings;
  pages: PageID[];
}

//------------------------------------------------------------------------------------------------
// Component Props and Validation
//------------------------------------------------------------------------------------------------

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
  hiddenByDefault: boolean; // Hidden by default = false
}

export function createComponent<T extends ComponentID, P, V>(
  id: T,
  instanceId: string,
  metadata: ComponentMetadata,
  props: P,
  validation: V
): FormComponent<T, P, V> {
  return { id, instanceId, metadata, children: [], props, validation };
}
