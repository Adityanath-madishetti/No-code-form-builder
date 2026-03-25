# [Deprecated]

# How to Add a New Component

This guide outlines the steps required to add a new component to the form system.  
Refer to the **Dummy component** as a minimal working example.

---

## 1. Define Component Props

Create a new file in `src/form/components/YourComponent.ts`.

Define the props interface for your component:

```ts
export interface YourComponentProps {
  // define your props here
}
```

---

## 2. Create Component Factory

Use `createBaseFormComponent` to define a factory function:

```ts
export const createYourComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props: YourComponentProps
) => {
  return createBaseFormComponent(
    ComponentIDs.YourComponent,
    instanceId,
    'YourComponent',
    metadata,
    props
  );
};

export type YourComponent = ReturnType<typeof createYourComponent>;
```

---

## 3. Add Component ID

Update `ComponentIDs` in `Base.ts`:

```ts
export const ComponentIDs = {
  ...
  YourComponent: 'YourComponent',
} as const;
```

---

## 4. Create Renderers

Create a renderer file:  
`src/form/components/YourComponentRenderer.tsx`

### Main Renderer (Form View)

```tsx
export const YourComponentRenderer = ({
  metadata,
  props,
}: RendererProps<YourComponentProps>) => {
  return (
    <div>
      {/* Render component UI */}
    </div>
  );
};
```

### Props Renderer (Editor Panel)

```tsx
export const YourComponentPropsRenderer = ({
  props,
  instanceId,
}: RendererProps<YourComponentProps>) => {
  const updateComponentProps = useFormStore((s) => s.updateComponentProps);

  return (
    <div>
      {/* Controls to edit props */}
    </div>
  );
};
```

---

## 5. Register in Component Registry

Open:  
`src/form/registry/componentRegistry.ts`

Add your component props to the `ComponentPropsMap`:

```ts
export type ComponentPropsMap = {
  ...
  [ComponentIDs.YourComponent]: YourComponentProps;
};
```

Add to `componentRenderers` (Optional Helper Map)

```ts
export const componentRenderers = {
  ...
  [ComponentIDs.YourComponent]:
    registry[ComponentIDs.YourComponent].renderers.main,
};
```

Add a new entry inside `registry`:

```ts
[ComponentIDs.YourComponent]: {
  id: ComponentIDs.YourComponent,

  catalog: {
    label: 'Your Component',
    description: 'Describe what it does',
  },

  renderers: {
    main: YourComponentRenderer,
    settings: YourComponentPropsRenderer,
  },

  create: (instanceId) =>
    createYourComponent(instanceId, { label: 'Your Component' }, {
      // default props
    }),

  deserialize: (json) =>
    createYourComponent(
      json.instanceId,
      json.metadata,
      json.props
    ),
},
```

---

## 6. (Optional) Add Default Props

Ensure your `create` function includes sensible defaults:

```ts
{
  // example defaults
}
```

---

## 7. Done

Your component will now:
- Appear in the **component catalog**
- Be **draggable / addable**
- Render in the **form canvas**
- Be editable in the **props panel**
- Support **serialization / deserialization**

---

## Summary

To add a component, you always:

1. Define props  
2. Create factory  
3. Add ComponentID  
4. Implement renderers (main + props)  
5. Register in registry  
