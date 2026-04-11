import { useFormStore } from '@/form/store/form.store';

export function EditorDragOverlay() {
  const activeDragData = useFormStore((s) => s.activeDragData);

  if (!activeDragData) return null;

  return <div>Drag Preview</div>; // paste your overlay logic here
}