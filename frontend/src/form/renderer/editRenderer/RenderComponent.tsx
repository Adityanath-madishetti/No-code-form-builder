// src/form/renderer/editRenderer/RenderComponent.tsx
import {
  componentRenderers,
  type AnyFormComponent,
} from '@/form/registry/componentRegistry';
import { useFormMode } from '@/form/context/FormModeContext';
import { SelectableComponent } from '@/form/renderer/SelectableWrapper';
import type { PageID } from '@/form/components/base';

type RenderableComponent =
  | AnyFormComponent
  | { id: 'Placeholder'; [key: string]: unknown };

export const RenderComponent = ({
  component,
  pageId,
  index,
}: {
  component: RenderableComponent;
  pageId: PageID;
  index: number;
}) => {
  const mode = useFormMode();

  // ------------------------------------------
  // CATCH THE PLACEHOLDER GAP
  // ------------------------------------------
  if ((component.id as string) === 'Placeholder') {
    return (
      <div className="flex h-20 w-full items-center justify-center rounded-lg transition-all duration-200">
        <span className="text-primary">Drop Component?</span>
      </div>
    );
  }

  const validComponent = component as AnyFormComponent;

  const Renderer = componentRenderers[validComponent.id];
  if (!Renderer)
    return <div className="text-sm text-muted-foreground">No renderer</div>;

  const rendered = (
    <Renderer
      metadata={validComponent.metadata}
      // Note - some type safety issue
      // @ts-expect-error - forget for now
      props={validComponent.props}
      // @ts-expect-error - forget for now
      validation={validComponent.validation}
      instanceId={validComponent.instanceId}
    />
  );

  return mode === 'edit' ? (
    <SelectableComponent
      component={validComponent}
      pageId={pageId}
      index={index}
    >
      {rendered}
    </SelectableComponent>
  ) : (
    rendered
  );
};