// src/form/components/Base.tsx
export type ComponentID = string;
export type InstanceID = string; 

export interface ComponentMetadata {
  label: string;
  description?: string;
  // isLocked?: boolean;
  group: 'layout' | 'input' | 'selection';
}

/**
 * Abstract Base for all Form Components
 */
export abstract class BaseFormComponent<P = unknown> {
  public readonly id: ComponentID; // maybe unused
  public readonly instanceId: InstanceID;
  public name: string;
  public metadata: ComponentMetadata;
  // public children: InstanceID[];
  public props: P; // Component-specific props (e.g., placeholder, min/max)

  constructor(
    id: ComponentID, 
    instanceId: InstanceID, 
    name: string, 
    metadata: ComponentMetadata, 
    props: P
  ) {
    this.id = id;
    this.instanceId = instanceId;
    this.name = name;
    this.metadata = metadata;
    this.props = props;
    // this.children = [];
  }

  /**
   * Returns the specific shadcn/ui template name or component key.
   * The Rendering Subsystem will use this to look up the React component.
   */
  abstract getTemplateKey(): string;

  /**
   * Helper to serialize the component to the underlying JSON storage.
   */
  toJSON() {
    return {
      id: this.id,
      instanceId: this.instanceId, 
      name: this.name,
      type: this.getTemplateKey(),
      metadata: this.metadata,
      props: this.props,
      // children: this.children,
    };
  }
}

//=================================================================================================
//
//
//
//
//=================================================================================================

export type PageID = string;

/**
 * Represents a single page in a multi-step form.
 * Acts as a node in a doubly linked list to manage form navigation.
 */
export class FormPage {
  public readonly id: PageID;
  public children: InstanceID[]; 
  public isTerminal: boolean; // True if this is the last page (default)
  
  public nextPageId: PageID | null;
  public previousPageId: PageID | null;

  constructor(id: PageID) {
    this.id = id;
    this.children = [];
    this.isTerminal = true;
    
    this.nextPageId = null;
    this.previousPageId = null;
  }

  /**
   * Helper to serialize the page to the underlying JSON storage.
   */
  toJSON() {
    return {
      id: this.id,
      children: this.children,
      isTerminal: this.isTerminal,
      nextPageId: this.nextPageId,
      previousPageId: this.previousPageId,
    };
  }
}

//=================================================================================================
//
//
//
//
//=================================================================================================

export type FormID = string;
export type ThemeID = string;

export interface FormMetadata {
  description?: string;
  createdAt: string;
  updatedAt: string;
  authorId?: string;
  version?: number;
}

/**
 * The root container for a form.
 * Manages form-level settings, metadata, and the ordered list of pages.
 */
export class Form {
  public readonly id: FormID;
  public name: string;
  public themeID: ThemeID | null;
  public metadata: FormMetadata;
  public pages: PageID[];

  constructor(
    id: FormID,
    name: string,
    metadata?: Partial<FormMetadata>,
    themeID: ThemeID | null = null
  ) {
    this.id = id;
    this.name = name;
    this.themeID = themeID;
    this.pages = [];
    
    // Set default metadata while allowing overrides
    const now = new Date().toISOString();
    this.metadata = {
      createdAt: now,
      updatedAt: now,
      version: 1,
      ...metadata,
    };
  }

  /**
   * Helper to serialize the form schema to the underlying JSON storage.
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      themeID: this.themeID,
      metadata: this.metadata,
      pages: this.pages,
    };
  }
}

