// src/form/components/dummy.ts

/**
 * Dummy component: for testing and demonstration purposes only.
 * Not intended for production use.
 */

export interface DummyProps {
  text: string;
}

import type { FormComponent } from '../registry/componentRegistry';
import type { ComponentMetadata } from './base';
import { ComponentIDs } from './base';

export const createDummyComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props: DummyProps
): FormComponent => ({
  id: ComponentIDs.Dummy,
  instanceId,
  name: 'DummyComponent',
  metadata,
  children: [],
  props,
});

export type DummyComponent = ReturnType<typeof createDummyComponent>;
