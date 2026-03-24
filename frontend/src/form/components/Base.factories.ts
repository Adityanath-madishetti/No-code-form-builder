// src/form/components/Base.factories.ts
import type {
  BaseFormComponent,
  ComponentID,
  ComponentMetadata,
  FormID,
  FormMetadata,
  FormPage,
  PageID,
  InstanceID,
} from './Base';

export function createBaseFormComponent<P>(
  id: ComponentID,
  instanceId: InstanceID,
  name: string,
  metadata: ComponentMetadata,
  props: P
): BaseFormComponent<P> {
  return { id, instanceId, name, metadata, props, children: [] };
}

export function createFormPage(id: PageID): FormPage {
  return { id, children: [], isTerminal: true };
}

export function createForm(
  id: FormID,
  name: string,
  metadata?: Partial<FormMetadata>,
  themeID: string | null = null
) {
  const now = new Date().toISOString();
  return {
    id,
    name,
    themeID,
    pages: [] as PageID[],
    metadata: {
      createdAt: now,
      updatedAt: now,
      version: 1,
      ...metadata,
    },
  };
}
