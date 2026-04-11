import type { ComponentType } from 'react';

import type { ComponentID, ComponentRenderer } from '../components/base';
import {
  type ComponentPropsMap,
  type ComponentValidationMap,
  registry,
  type TypedFormComponent,
  type TypedSerializedComponent,
} from './componentRegistry';

export function getComponentRenderer<K extends ComponentID>(
  id: K
): ComponentRenderer<ComponentPropsMap[K], ComponentValidationMap[K]> | null {
  return registry[id].renderers.main;
}

export function getComponentPropsRenderer<K extends ComponentID>(
  id: K
):
  | ComponentRenderer<ComponentPropsMap[K], ComponentValidationMap[K]>
  | ComponentType<unknown>
  | null {
  return registry[id].renderers.settings;
}

export function getComponentDisplayName<K extends ComponentID>(id: K): string {
  return registry[id].catalog.label;
}

export function createComponent<K extends ComponentID>(
  id: K,
  instanceId: string
): TypedFormComponent<K> {
  return registry[id].create(instanceId);
}

export function serializeComponent<K extends ComponentID>(
  component: TypedFormComponent<K>
): TypedSerializedComponent<K> {
  return {
    id: component.id,
    instanceId: component.instanceId,
    metadata: component.metadata,
    props: component.props,
    validation: component.validation,
  };
}

export function deserializeComponent<K extends ComponentID>(
  json: TypedSerializedComponent<K>
): TypedFormComponent<K> {
  return registry[json.id].deserialize(json);
}

export const componentRenderers: {
  [K in ComponentID]: ComponentRenderer<
    ComponentPropsMap[K],
    ComponentValidationMap[K]
  > | null;
} = Object.fromEntries(
  Object.entries(registry).map(([key, entry]) => [key, entry.renderers.main])
) as {
  [K in ComponentID]: ComponentRenderer<
    ComponentPropsMap[K],
    ComponentValidationMap[K]
  > | null;
};
