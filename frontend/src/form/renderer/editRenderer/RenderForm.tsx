// src/form/renderer/editRenderer/RenderForm.tsx
import { componentRenderers } from '@/form/registry/componentRegistry';
import { useFormMode } from '@/form/context/FormModeContext';
import {
  SelectableComponent,
  SelectablePage,
} from '@/form/renderer/SelectableWrapper';
import type { BaseFormComponent, PageID } from '@/form/components/base';
import { useShallow } from 'zustand/react/shallow';
import { useFormStore, formSelectors } from '@/form/store/formStore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { useDroppable } from '@dnd-kit/react';
import { PAGE_PLACEHOLDER_ID } from '@/pages/FormEditor/FormEditor';

export const RenderComponent = ({
  component,
  pageId,
  index,
}: {
  component: BaseFormComponent<unknown>;
  pageId: PageID;
  index: number;
}) => {
  const mode = useFormMode();

  // ------------------------------------------
  // CATCH THE PLACEHOLDER GAP
  // ------------------------------------------
  if ((component.id as string) === 'Placeholder') {
    return (
      <SelectableComponent component={component} pageId={pageId} index={index}>
        <div className="flex h-20 w-full items-center justify-center rounded-lg transition-all duration-200">
          <span className="text-primary">Drop Component?</span>
        </div>
      </SelectableComponent>
    );
  }

  const Renderer = componentRenderers[component.id];
  if (!Renderer)
    return <div className="text-sm text-muted-foreground">No renderer</div>;

  const rendered = (
    <Renderer
      metadata={component.metadata}
      props={component.props}
      instanceId={component.instanceId}
    />
  );

  return mode === 'edit' ? (
    <SelectableComponent component={component} pageId={pageId} index={index}>
      {rendered}
    </SelectableComponent>
  ) : (
    rendered
  );
};

export const RenderPage = ({
  pageId,
  index,
}: {
  pageId: PageID;
  index: number;
}) => {
  const mode = useFormMode();
  const componentIds = useFormStore(
    useShallow((s) => s.pages[pageId]?.children ?? [])
  );
  const components = useFormStore(
    useShallow((s) =>
      componentIds.map((id) => s.components[id]).filter(Boolean)
    )
  );

  const { ref: contentDropRef } = useDroppable({
    id: `content-drop-${pageId}`,
    accept: ['component', 'catalog-component'],
    data: { type: 'page', pageId: pageId },
  });

  // ==========================================
  // CATCH THE PAGE PLACEHOLDER GAP
  // ==========================================
  if (pageId === PAGE_PLACEHOLDER_ID) {
    return (
      <SelectablePage pageId={pageId} index={index}>
        <CardContent className="m-6 flex h-6 items-center justify-center rounded-lg">
          <span className="text-primary">Drop New Page?</span>
        </CardContent>
      </SelectablePage>
    );
  }

  const rendered = (
    <CardContent ref={mode === 'edit' ? contentDropRef : undefined}>
      <div
        className={`relative flex min-h-[50px] flex-col gap-3 ${mode === 'edit' ? 'pt-10' : ''} `}
      >
        <div
          className={`pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground transition-opacity duration-200 ${componentIds.length === 0 ? 'opacity-100' : 'opacity-0'}`}
        >
          Empty Page
        </div>
        {components.map((component, idx) => (
          <RenderComponent
            key={component.instanceId}
            component={component}
            pageId={pageId}
            index={idx}
          />
        ))}
      </div>
    </CardContent>
  );

  return mode === 'edit' ? (
    <SelectablePage pageId={pageId} index={index}>
      {rendered}
    </SelectablePage>
  ) : (
    rendered
  );
};

export const RenderForm = () => {
  const form = useFormStore(formSelectors.form);
  if (!form) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No form loaded.</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{form.name}</CardTitle>
        {form.metadata.description && (
          <CardDescription>{form.metadata.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {form.pages.map((page, index) => (
          <RenderPage key={page} pageId={page} index={index} />
        ))}
      </CardContent>
    </Card>
  );
};
