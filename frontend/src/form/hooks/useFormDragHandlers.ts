// src/form/hooks/useFormDragHandlers.ts
import { useFormStore, type FormDragData } from '@/form/store/form.store';
import { DRAG_COMPONENT_ID, DRAG_PAGE_ID } from '@/form/utils/DndUtils';

/**
 * Handles all Drag and Drop interactions for reordering Native items.
 * (e.g. moving existing components up/down or moving existing pages).
 */
export function useFormDragHandlers() {
  const setActiveDragData = useFormStore((s) => s.setActiveDragData);
  const pages = useFormStore((s) => s.pages);
  const moveComponent = useFormStore((s) => s.moveComponent);
  const reorderPages = useFormStore((s) => s.reorderPages);
  const form = useFormStore((s) => s.form);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDragStart = (event: any) => {
    const dragData = (event.operation.source?.data as FormDragData) || null;
    setActiveDragData(dragData);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDragOver = (event: any) => {
    const { source, target } = event.operation;

    if (!target || !source) return;

    const sourceData = source.data;
    const targetData = target.data;

    // ==========================================
    // MOVE EXISTING COMPONENTS OVER CANAVAS
    // ==========================================
    if (sourceData?.type === DRAG_COMPONENT_ID) {
      const instanceId = sourceData.instanceId;
      const currentPage = Object.values(pages).find((p) =>
        p.children.includes(instanceId)
      );

      if (!currentPage) return;

      const currentPageId = currentPage.id;
      const currentIndex = currentPage.children.indexOf(instanceId);

      let targetPageId = null;
      let targetIndex = -1;

      if (targetData?.type === DRAG_COMPONENT_ID) {
        targetPageId = targetData.pageId;
        targetIndex = pages[targetPageId].children.indexOf(
          targetData.instanceId
        );
      } else if (targetData?.type === DRAG_PAGE_ID) {
        targetPageId = targetData.pageId;
        targetIndex = pages[targetPageId].children.length;
      }

      if (targetPageId) {
        const finalIndex =
          targetIndex !== -1
            ? targetIndex
            : pages[targetPageId].children.length;

        // Allow movement if crossing pages OR if reordering within the same page
        if (currentPageId !== targetPageId || currentIndex !== finalIndex) {
          moveComponent(currentPageId, currentIndex, targetPageId, finalIndex);
        }
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDragEnd = (event: any) => {
    setActiveDragData(null);

    const { operation, canceled } = event;
    const { source, target } = operation;

    if (canceled || !target) return;

    const sourceData = source?.data;
    const targetData = target?.data;

    if (!sourceData || !targetData) return;

    // ==========================================
    // FINALIZE PAGE REORDERING
    // ==========================================
    if (sourceData.type === DRAG_PAGE_ID && targetData.type === DRAG_PAGE_ID) {
      if (!form) return;

      const fromIndex = form.pages.indexOf(sourceData.pageId);
      const toIndex = form.pages.indexOf(targetData.pageId);

      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        reorderPages(fromIndex, toIndex);
      }
      return;
    }

    // ==========================================
    // FINALIZE COMPONENT REORDERING
    // ==========================================
    if (sourceData.type === DRAG_COMPONENT_ID) {
      const instanceId = sourceData.instanceId;
      const currentPage = Object.values(pages).find((p) =>
        p.children.includes(instanceId)
      );

      if (!currentPage) return;

      const currentPageId = currentPage.id;
      const currentIndex = currentPage.children.indexOf(instanceId);

      let targetPageId = null;
      let targetIndex = -1;

      if (targetData.type === DRAG_COMPONENT_ID) {
        targetPageId = targetData.pageId;
        targetIndex = pages[targetPageId].children.indexOf(
          targetData.instanceId
        );
      } else if (targetData.type === DRAG_PAGE_ID) {
        targetPageId = targetData.pageId;
        targetIndex = pages[targetPageId].children.length;
      }

      if (
        targetPageId === currentPageId &&
        currentIndex !== targetIndex &&
        targetIndex !== -1
      ) {
        moveComponent(currentPageId, currentIndex, currentPageId, targetIndex);
      }
    }
  };

  return { onDragStart, onDragOver, onDragEnd };
}
