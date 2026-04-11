// src/form/hooks/useFormDragHandlers.ts
import { useFormStore, type FormDragData } from '@/form/store/form.store';
import {
  TEMP_COMPONENT_PLACEHOLDER_ID,
  TEMP_PAGE_PLACEHOLDER_ID,
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_CATALOG_PAGE_ID,
  DRAG_CATALOG_GROUP_ID,
  DRAG_COMPONENT_ID,
  DRAG_PAGE_ID,
} from '@/form/utils/DndUtils';
import type { ComponentID, ComponentMetadata } from '@/form/components/base';
import type { AnyFormComponent } from '@/form/registry/componentRegistry';

export function useFormDragHandlers() {
  const setActiveDragData = useFormStore((s) => s.setActiveDragData);
  const pages = useFormStore((s) => s.pages);
  const components = useFormStore((s) => s.components);
  const addComponent = useFormStore((s) => s.addComponent);
  const moveComponent = useFormStore((s) => s.moveComponent);
  const addPage = useFormStore((s) => s.addPage);
  const reorderPages = useFormStore((s) => s.reorderPages);
  const form = useFormStore((s) => s.form);
  const removePage = useFormStore((s) => s.removePage);
  const removeComponent = useFormStore((s) => s.removeComponent);
  const setActiveComponent = useFormStore((s) => s.setActiveComponent);
  const setActivePage = useFormStore((s) => s.setActivePage);
  const refreshCatalog = useFormStore((s) => s.refreshCatalog);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDragStart = (event: any) => {
    const dragData = (event.operation.source?.data as FormDragData) || null;
    console.log('[DND-Start] Drag initiated.', {
      sourceData: dragData,
      rawEvent: event,
    });

    setActiveDragData(dragData);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDragOver = (event: any) => {
    const { source, target } = event.operation;

    if (!target || !source) {
      // Commented out to prevent console spam during rapid movements over empty areas
      // console.log('[DND-Over] Missing target or source. Bailing out.');
      return;
    }

    const sourceData = source.data;
    const targetData = target.data;

    console.groupCollapsed(
      `[DND-Over] Dragging ${sourceData?.type} over ${targetData?.type || 'unknown'}`
    );
    console.log('[DND-Over] Data state:', { sourceData, targetData });

    // ==========================================
    // CREATE COMPONENT GAPS
    // ==========================================
    if (
      sourceData?.type === DRAG_CATALOG_COMPONENT_ID ||
      sourceData?.type === DRAG_CATALOG_GROUP_ID
    ) {
      console.log(
        '[DND-Over] Handling catalog component/group gap creation...'
      );
      let targetPageId = null;
      let targetIndex = -1;

      if (targetData?.type === DRAG_COMPONENT_ID) {
        targetPageId = targetData.pageId;
        targetIndex = pages[targetPageId].children.indexOf(
          targetData.instanceId
        );
        console.log(
          `[DND-Over] Target is a Component. PageId: ${targetPageId}, TargetIndex: ${targetIndex}`
        );
      } else if (targetData?.type === DRAG_PAGE_ID) {
        targetPageId = targetData.pageId;
        targetIndex = pages[targetPageId].children.length;
        console.log(
          `[DND-Over] Target is a Page. PageId: ${targetPageId}, TargetIndex (End of page): ${targetIndex}`
        );
      }

      if (targetPageId) {
        if (!components[TEMP_COMPONENT_PLACEHOLDER_ID]) {
          const injectIndex =
            targetIndex !== -1
              ? targetIndex
              : pages[targetPageId].children.length;
          console.log(
            `[DND-Over] Injecting NEW component gap placeholder at index ${injectIndex} on page ${targetPageId}`
          );

          // Inject the Gap
          addComponent(
            targetPageId,
            {
              id: 'Placeholder' as ComponentID,
              instanceId: TEMP_COMPONENT_PLACEHOLDER_ID,
              name: 'Gap',
              metadata: {} as ComponentMetadata,
              props: {},
              validation: {},
              children: [],
            } as unknown as AnyFormComponent,
            injectIndex
          );
        } else {
          // Move the Gap smoothly
          const currentPage = Object.values(pages).find((p) =>
            p.children.includes(TEMP_COMPONENT_PLACEHOLDER_ID)
          );

          if (currentPage) {
            const currentIndex = currentPage.children.indexOf(
              TEMP_COMPONENT_PLACEHOLDER_ID
            );
            const finalIndex =
              targetIndex !== -1
                ? targetIndex
                : pages[targetPageId].children.length;

            if (
              currentPage.id !== targetPageId ||
              currentIndex !== finalIndex
            ) {
              console.log(
                `[DND-Over] Moving EXISTING component gap from Page ${currentPage.id}[${currentIndex}] to Page ${targetPageId}[${finalIndex}]`
              );
              moveComponent(
                currentPage.id,
                currentIndex,
                targetPageId,
                finalIndex
              );
            } else {
              console.log(
                '[DND-Over] Component gap is already in the correct position. No move needed.'
              );
            }
          } else {
            console.warn(
              '[DND-Over] Placeholder component exists in store but is missing from page children!'
            );
          }
        }
      }
    }

    // ==========================================
    // CREATE PAGE GAPS
    // ==========================================
    if (sourceData?.type === DRAG_CATALOG_PAGE_ID) {
      console.log('[DND-Over] Handling catalog page gap creation...');
      let targetIndex = -1;

      if (
        targetData?.type === DRAG_PAGE_ID ||
        targetData?.type === DRAG_COMPONENT_ID
      ) {
        if (targetData.pageId === TEMP_PAGE_PLACEHOLDER_ID) {
          console.groupEnd();
          return;
        }
        targetIndex = form!.pages.indexOf(targetData.pageId);
        console.log(`[DND-Over] Target resolved to index: ${targetIndex}`);
      }

      if (targetIndex !== -1) {
        if (!pages[TEMP_PAGE_PLACEHOLDER_ID]) {
          console.log(
            `[DND-Over] Injecting NEW page gap placeholder at index ${targetIndex}`
          );
          addPage(targetIndex, TEMP_PAGE_PLACEHOLDER_ID);
        } else {
          const currentIndex = form!.pages.indexOf(TEMP_PAGE_PLACEHOLDER_ID);
          if (currentIndex !== -1 && currentIndex !== targetIndex) {
            console.log(
              `[DND-Over] Moving EXISTING page gap from index ${currentIndex} to index ${targetIndex}`
            );
            reorderPages(currentIndex, targetIndex);
          } else {
            console.log(
              '[DND-Over] Page gap is already in the correct position.'
            );
          }
        }
      }
    }

    // ==========================================
    // MOVE EXISTING COMPONENTS NATIVELY
    // ==========================================
    if (sourceData?.type === DRAG_COMPONENT_ID) {
      console.log('[DND-Over] Handling native existing component movement...');
      const instanceId = sourceData.instanceId;
      const currentPage = Object.values(pages).find((p) =>
        p.children.includes(instanceId)
      );

      if (!currentPage) {
        console.warn(
          `[DND-Over] Native Move: Could not find page containing instance ${instanceId}`
        );
        console.groupEnd();
        return;
      }

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

      console.log(
        `[DND-Over] Native Move Check: SourcePageId: ${currentPageId}, TargetPageId: ${targetPageId}`
      );

      if (targetPageId) {
        const finalIndex =
          targetIndex !== -1
            ? targetIndex
            : pages[targetPageId].children.length;

        // Allow movement if crossing pages OR if reordering within the same page
        if (currentPageId !== targetPageId || currentIndex !== finalIndex) {
          console.log(
            `[DND-Over] Moving component ${instanceId}: Page ${currentPageId}[${currentIndex}] -> Page ${targetPageId}[${finalIndex}]`
          );

          moveComponent(currentPageId, currentIndex, targetPageId, finalIndex);
        } else {
          console.log(
            '[DND-Over] Component is already in the correct position.'
          );
        }
      }
    }

    console.groupEnd();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDragEnd = (event: any) => {
    console.group('[DND-End] Drag operation ended');
    setActiveDragData(null);

    const { operation, canceled } = event;
    const { source, target } = operation;

    console.log(
      `[DND-End] Event Status - Canceled: ${canceled}, HasTarget: ${!!target}`
    );

    // CLEANUP: If cancelled or dropped outside, delete the gaps!
    if (canceled || !target) {
      console.log(
        '[DND-End] Drag canceled or no valid target drop. Executing cleanup phase.'
      );
      if (components[TEMP_COMPONENT_PLACEHOLDER_ID]) {
        console.log('[DND-End] Cleanup: Removing component gap placeholder.');
        removeComponent(TEMP_COMPONENT_PLACEHOLDER_ID);
      }
      if (pages[TEMP_PAGE_PLACEHOLDER_ID]) {
        console.log('[DND-End] Cleanup: Removing page gap placeholder.');
        removePage(TEMP_PAGE_PLACEHOLDER_ID);
      }
      console.groupEnd();
      return;
    }

    const sourceData = source?.data;
    const targetData = target?.data;

    if (!sourceData || !targetData) {
      console.warn(
        '[DND-End] Missing sourceData or targetData despite having a target.',
        { source, target }
      );
      console.groupEnd();
      return;
    }

    console.log(
      `[DND-End] Resolving drop for SourceType: ${sourceData.type}, TargetType: ${targetData.type}`
    );

    // DROP COMPONENT: Swap the Gap for the Real Component
    if (sourceData.type === DRAG_CATALOG_COMPONENT_ID) {
      if (components[TEMP_COMPONENT_PLACEHOLDER_ID]) {
        const currentPage = Object.values(pages).find((p) =>
          p.children.includes(TEMP_COMPONENT_PLACEHOLDER_ID)
        );

        if (currentPage) {
          const finalIndex = currentPage.children.indexOf(
            TEMP_COMPONENT_PLACEHOLDER_ID
          );
          console.log(
            `[DND-End] Dropping Catalog Component. Swapping placeholder on Page ${currentPage.id} at index ${finalIndex} with real component.`
          );

          removeComponent(TEMP_COMPONENT_PLACEHOLDER_ID);

          const realId = `instance-${crypto.randomUUID()}`;
          const realComponent = sourceData.entry.create(realId);

          console.log(`[DND-End] Generated new component ID: ${realId}`);
          addComponent(currentPage.id, realComponent, finalIndex);
          setActiveComponent(realId);
          setActivePage(null);
          refreshCatalog();
        } else {
          console.warn(
            '[DND-End] Component placeholder exists but page parent could not be found!'
          );
        }
      } else {
        console.warn(
          '[DND-End] Expected a component placeholder to swap, but none was found in store.'
        );
      }
      console.groupEnd();
      return;
    }

    // DROP GROUP: Swap the Gap for the Group Components
    if (sourceData.type === DRAG_CATALOG_GROUP_ID) {
      if (components[TEMP_COMPONENT_PLACEHOLDER_ID]) {
        const currentPage = Object.values(pages).find((p) =>
          p.children.includes(TEMP_COMPONENT_PLACEHOLDER_ID)
        );

        if (currentPage) {
          const finalIndex = currentPage.children.indexOf(
            TEMP_COMPONENT_PLACEHOLDER_ID
          );
          console.log(
            `[DND-End] Dropping Catalog Group. Swapping placeholder on Page ${currentPage.id} at index ${finalIndex} with group components.`
          );

          removeComponent(TEMP_COMPONENT_PLACEHOLDER_ID);

          const group = sourceData.group;
          const insertedComponentIds: string[] = [];

          group.components.forEach((c: AnyFormComponent, i: number) => {
            const realId = `${c.id}-${crypto.randomUUID()}`;
            const clonedComponent = JSON.parse(JSON.stringify(c));
            clonedComponent.instanceId = realId;
            addComponent(currentPage.id, clonedComponent, finalIndex + i);
            insertedComponentIds.push(realId);
          });

          if (insertedComponentIds.length > 0) {
            setActiveComponent(insertedComponentIds[0]);
          }
          refreshCatalog();
        } else {
          console.warn(
            '[DND-End] Component placeholder exists but page parent could not be found!'
          );
        }
      } else {
        console.warn(
          '[DND-End] Expected a component placeholder to swap, but none was found in store.'
        );
      }
      console.groupEnd();
      return;
    }

    // DROP PAGE: Swap the Gap for the Real Page
    if (sourceData.type === DRAG_CATALOG_PAGE_ID) {
      if (pages[TEMP_PAGE_PLACEHOLDER_ID]) {
        const finalIndex = form!.pages.indexOf(TEMP_PAGE_PLACEHOLDER_ID);
        console.log(
          `[DND-End] Dropping Catalog Page. Swapping placeholder at index ${finalIndex} with real page.`
        );

        removePage(TEMP_PAGE_PLACEHOLDER_ID);
        const realId = addPage(finalIndex);
        console.log(
          `[DND-End] Successfully created new page with ID: ${realId}`
        );

        refreshCatalog();
      } else {
        console.warn(
          '[DND-End] Expected a page placeholder to swap, but none was found in store.'
        );
      }
      console.groupEnd();
      return;
    }

    // FINALIZE EXISTING PAGES/COMPONENTS
    if (sourceData.type === DRAG_PAGE_ID && targetData.type === DRAG_PAGE_ID) {
      if (!form) {
        console.error('[DND-End] Form state missing during page reorder!');
        console.groupEnd();
        return;
      }

      const fromIndex = form.pages.indexOf(sourceData.pageId);
      const toIndex = form.pages.indexOf(targetData.pageId);

      console.log(
        `[DND-End] Reordering existing pages. From index ${fromIndex} to ${toIndex}.`
      );

      if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
        reorderPages(fromIndex, toIndex);
        console.log('[DND-End] Page reorder complete.');
      } else {
        console.log(
          '[DND-End] Page reorder aborted. Invalid indices or pages did not move.'
        );
      }
      console.groupEnd();
      return;
    }

    if (sourceData.type === DRAG_COMPONENT_ID) {
      const instanceId = sourceData.instanceId;
      const currentPage = Object.values(pages).find((p) =>
        p.children.includes(instanceId)
      );

      if (!currentPage) {
        console.warn(
          `[DND-End] Native Component Move: Could not find page containing instance ${instanceId}`
        );
        console.groupEnd();
        return;
      }

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

      console.log(
        `[DND-End] Finalizing component move within same page. Instance: ${instanceId}. SourceIndex: ${currentIndex}, TargetIndex: ${targetIndex}`
      );

      if (
        targetPageId === currentPageId &&
        currentIndex !== targetIndex &&
        targetIndex !== -1
      ) {
        console.log(`[DND-End] Executing same-page component move.`);
        moveComponent(currentPageId, currentIndex, currentPageId, targetIndex);
      } else {
        console.log(
          `[DND-End] Component move skipped (Conditions not met: Either different page, same index, or invalid target index).`
        );
      }
    }

    console.groupEnd();
  };

  return { onDragStart, onDragOver, onDragEnd };
}
