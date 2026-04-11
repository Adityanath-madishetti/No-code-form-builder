import { DragDropProvider, DragOverlay } from '@dnd-kit/react';
import { useFormDragHandlers } from '@/form/hooks/useFormDragHandlers';
import { FormEditorLayout } from './FormEditorLayout';
import { EditorDragOverlay } from './overlays/EditorDragOverlay';
import { useFormEditorController } from './hooks/useFormEditorController';

export function FormEditorShell({ formId }: { formId: string }) {
  const controller = useFormEditorController(formId);
  const { onDragStart, onDragOver, onDragEnd } = useFormDragHandlers();

  return (
    <DragDropProvider
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <FormEditorLayout controller={controller} />

      <DragOverlay dropAnimation={null}>
        <EditorDragOverlay />
      </DragOverlay>
    </DragDropProvider>
  );
}