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

// // src/form/renderer/editRenderer/RenderForm.tsx
// import {
//   componentRenderers,
//   type AnyFormComponent,
// } from '@/form/registry/componentRegistry';
// import { useFormMode } from '@/form/context/FormModeContext';
// import {
//   SelectableComponent,
//   SelectablePage,
// } from '@/form/renderer/SelectableWrapper';
// import type { PageID } from '@/form/components/base';
// import { useShallow } from 'zustand/react/shallow';
// import { useFormStore, formSelectors } from '@/form/store/formStore';
// import { Card } from '@heroui/react';
// import { useDroppable } from '@dnd-kit/react';
// import {
//   DRAG_CATALOG_PAGE_ID,
//   TEMP_PAGE_PLACEHOLDER_ID,
//   DRAG_CATALOG_COMPONENT_ID,
//   DRAG_COMPONENT_ID,
//   DRAG_PAGE_ID,
// } from '@/form/utils/DndUtils';

// type RenderableComponent =
//   | AnyFormComponent
//   | { id: 'Placeholder'; [key: string]: unknown };

// export const RenderComponent = ({
//   component,
//   pageId,
//   index,
// }: {
//   component: RenderableComponent;
//   pageId: PageID;
//   index: number;
// }) => {
//   const mode = useFormMode();

//   if ((component.id as string) === 'Placeholder') {
//     return (
//       <div className="flex h-20 w-full items-center justify-center rounded-lg transition-all duration-200">
//         <span className="text-primary">Drop Component?</span>
//       </div>
//     );
//   }

//   const validComponent = component as AnyFormComponent;
//   const Renderer = componentRenderers[validComponent.id];

//   if (!Renderer)
//     return <div className="text-sm text-default-500">No renderer</div>;

//   const rendered = (
//     <Renderer
//       metadata={validComponent.metadata}
//       // @ts-expect-error - forget for now
//       props={validComponent.props}
//       instanceId={validComponent.instanceId}
//     />
//   );

//   return mode === 'edit' ? (
//     <SelectableComponent component={validComponent} pageId={pageId} index={index}>
//       {rendered}
//     </SelectableComponent>
//   ) : (
//     rendered
//   );
// };

// export const RenderPage = ({
//   pageId,
//   index,
// }: {
//   pageId: PageID;
//   index: number;
// }) => {
//   const mode = useFormMode();
//   const componentIds = useFormStore(useShallow((s) => s.pages[pageId]?.children ?? []));
//   const components = useFormStore(
//     useShallow((s) => componentIds.map((id) => s.components[id]).filter(Boolean))
//   );

//   const { ref: contentDropRef } = useDroppable({
//     id: `content-drop-${pageId}`,
//     accept: [DRAG_COMPONENT_ID, DRAG_CATALOG_COMPONENT_ID],
//     data: { type: DRAG_PAGE_ID, pageId: pageId },
//   });

//   const { ref: pagePlaceholderRef } = useDroppable({
//     id: `page-placeholder-drop`,
//     accept: [DRAG_CATALOG_PAGE_ID],
//     data: { type: DRAG_PAGE_ID, pageId: TEMP_PAGE_PLACEHOLDER_ID },
//   });

//   if (pageId === TEMP_PAGE_PLACEHOLDER_ID) {
//     return (
//       <Card.Content
//         ref={mode === 'edit' ? pagePlaceholderRef : undefined}
//         className="m-6 flex h-6 items-center justify-center rounded-lg"
//       >
//         <span className="text-primary">Drop New Page Here</span>
//       </Card.Content>
//     );
//   }

//   const rendered = (
//     <Card.Content ref={mode === 'edit' ? contentDropRef : undefined}>
//       <div className={`relative flex min-h-[50px] flex-col gap-3 ${mode === 'edit' ? 'pt-10' : ''}`}>
//         <div
//           className={`pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-default-500 transition-opacity duration-200 ${
//             componentIds.length === 0 ? 'opacity-100' : 'opacity-0'
//           }`}
//         >
//           Empty Page
//         </div>
//         {components.map((component, idx) => (
//           <RenderComponent key={component.instanceId} component={component} pageId={pageId} index={idx} />
//         ))}
//       </div>
//     </Card.Content>
//   );

//   return mode === 'edit' ? (
//     <SelectablePage pageId={pageId} index={index}>
//       {rendered}
//     </SelectablePage>
//   ) : (
//     rendered
//   );
// };

// export const RenderForm = () => {
//   const form = useFormStore(formSelectors.form);
//   if (!form) {
//     return (
//       <Card>
//         <Card.Content>
//           <h3 className="text-lg font-semibold">No form loaded.</h3>
//         </Card.Content>
//       </Card>
//     );
//   }

//   return (
//     <Card className="mx-auto w-full max-w-xl">
//       <Card.Header className="flex flex-col items-start gap-1 pb-0 pt-6 px-6">
//         <h2 className="text-2xl font-bold">{form.name}</h2>
//         {form.metadata.description && (
//           <p className="text-sm text-default-500">{form.metadata.description}</p>
//         )}
//       </Card.Header>
//       <Card.Content className="flex flex-col gap-6 p-6">
//         {form.pages.map((page, index) => (
//           <RenderPage key={page} pageId={page} index={index} />
//         ))}
//       </Card.Content>
//     </Card>
//   );
// };
