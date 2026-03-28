// src/form/hooks/useFormDragHandlers.ts
import { useFormStore, type FormDragData } from '@/form/store/formStore';
import {
  TEMP_COMPONENT_PLACEHOLDER_ID,
  TEMP_PAGE_PLACEHOLDER_ID,
  DRAG_CATALOG_COMPONENT_ID,
  DRAG_CATALOG_PAGE_ID,
  DRAG_COMPONENT_ID,
  DRAG_PAGE_ID,
} from '@/form/utils/DndUtils';
import type { ComponentID, ComponentMetadata } from '@/form/components/base';
import type { AnyFormComponent } from '@/form/registry/componentRegistry';

export function useFormDragHandlers() {
  const store = useFormStore();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDragStart = (event: any) => {
    const dragData = (event.operation.source?.data as FormDragData) || null;
    console.log('[DND-Start] Drag initiated.', {
      sourceData: dragData,
      rawEvent: event,
    });

    store.setActiveDragData(dragData);
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
    if (sourceData?.type === DRAG_CATALOG_COMPONENT_ID) {
      console.log('[DND-Over] Handling catalog component gap creation...');
      let targetPageId = null;
      let targetIndex = -1;

      if (targetData?.type === DRAG_COMPONENT_ID) {
        targetPageId = targetData.pageId;
        targetIndex = store.pages[targetPageId].children.indexOf(
          targetData.instanceId
        );
        console.log(
          `[DND-Over] Target is a Component. PageId: ${targetPageId}, TargetIndex: ${targetIndex}`
        );
      } else if (targetData?.type === DRAG_PAGE_ID) {
        targetPageId = targetData.pageId;
        targetIndex = store.pages[targetPageId].children.length;
        console.log(
          `[DND-Over] Target is a Page. PageId: ${targetPageId}, TargetIndex (End of page): ${targetIndex}`
        );
      }

      if (targetPageId) {
        if (!store.components[TEMP_COMPONENT_PLACEHOLDER_ID]) {
          const injectIndex =
            targetIndex !== -1
              ? targetIndex
              : store.pages[targetPageId].children.length;
          console.log(
            `[DND-Over] Injecting NEW component gap placeholder at index ${injectIndex} on page ${targetPageId}`
          );

          // Inject the Gap
          store.addComponent(
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
          const currentPage = Object.values(store.pages).find((p) =>
            p.children.includes(TEMP_COMPONENT_PLACEHOLDER_ID)
          );

          if (currentPage) {
            const currentIndex = currentPage.children.indexOf(
              TEMP_COMPONENT_PLACEHOLDER_ID
            );
            const finalIndex =
              targetIndex !== -1
                ? targetIndex
                : store.pages[targetPageId].children.length;

            if (
              currentPage.id !== targetPageId ||
              currentIndex !== finalIndex
            ) {
              console.log(
                `[DND-Over] Moving EXISTING component gap from Page ${currentPage.id}[${currentIndex}] to Page ${targetPageId}[${finalIndex}]`
              );
              store.moveComponent(
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
        targetIndex = store.form!.pages.indexOf(targetData.pageId);
        console.log(`[DND-Over] Target resolved to index: ${targetIndex}`);
      }

      if (targetIndex !== -1) {
        if (!store.pages[TEMP_PAGE_PLACEHOLDER_ID]) {
          console.log(
            `[DND-Over] Injecting NEW page gap placeholder at index ${targetIndex}`
          );
          store.addPage(targetIndex, TEMP_PAGE_PLACEHOLDER_ID);
        } else {
          const currentIndex = store.form!.pages.indexOf(
            TEMP_PAGE_PLACEHOLDER_ID
          );
          if (currentIndex !== -1 && currentIndex !== targetIndex) {
            console.log(
              `[DND-Over] Moving EXISTING page gap from index ${currentIndex} to index ${targetIndex}`
            );
            store.reorderPages(currentIndex, targetIndex);
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
      const currentPage = Object.values(store.pages).find((p) =>
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
        targetIndex = store.pages[targetPageId].children.indexOf(
          targetData.instanceId
        );
      } else if (targetData?.type === DRAG_PAGE_ID) {
        targetPageId = targetData.pageId;
        targetIndex = store.pages[targetPageId].children.length;
      }

      console.log(
        `[DND-Over] Native Move Check: SourcePageId: ${currentPageId}, TargetPageId: ${targetPageId}`
      );

      if (targetPageId && currentPageId !== targetPageId) {
        const finalIndex =
          targetIndex !== -1
            ? targetIndex
            : store.pages[targetPageId].children.length;
        console.log(
          `[DND-Over] Moving component ${instanceId} across pages: Page ${currentPageId} -> Page ${targetPageId} at index ${finalIndex}`
        );

        store.moveComponent(
          currentPageId,
          currentIndex,
          targetPageId,
          finalIndex
        );
      } else {
        console.log(
          '[DND-Over] Component is staying on the same page during over phase. Handling in onDragEnd if dropped.'
        );
      }
    }

    console.groupEnd();
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onDragEnd = (event: any) => {
    console.group('[DND-End] Drag operation ended');
    store.setActiveDragData(null);

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
      if (store.components[TEMP_COMPONENT_PLACEHOLDER_ID]) {
        console.log('[DND-End] Cleanup: Removing component gap placeholder.');
        store.removeComponent(TEMP_COMPONENT_PLACEHOLDER_ID);
      }
      if (store.pages[TEMP_PAGE_PLACEHOLDER_ID]) {
        console.log('[DND-End] Cleanup: Removing page gap placeholder.');
        store.removePage(TEMP_PAGE_PLACEHOLDER_ID);
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
      if (store.components[TEMP_COMPONENT_PLACEHOLDER_ID]) {
        const currentPage = Object.values(store.pages).find((p) =>
          p.children.includes(TEMP_COMPONENT_PLACEHOLDER_ID)
        );

        if (currentPage) {
          const finalIndex = currentPage.children.indexOf(
            TEMP_COMPONENT_PLACEHOLDER_ID
          );
          console.log(
            `[DND-End] Dropping Catalog Component. Swapping placeholder on Page ${currentPage.id} at index ${finalIndex} with real component.`
          );

          store.removeComponent(TEMP_COMPONENT_PLACEHOLDER_ID);

          const realId = `instance-${crypto.randomUUID()}`;
          const realComponent = sourceData.entry.create(realId);

          console.log(`[DND-End] Generated new component ID: ${realId}`);
          store.addComponent(currentPage.id, realComponent, finalIndex);
          store.setActiveComponent(realId);
          store.refreshCatalog();
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
      if (store.pages[TEMP_PAGE_PLACEHOLDER_ID]) {
        const finalIndex = store.form!.pages.indexOf(TEMP_PAGE_PLACEHOLDER_ID);
        console.log(
          `[DND-End] Dropping Catalog Page. Swapping placeholder at index ${finalIndex} with real page.`
        );

        store.removePage(TEMP_PAGE_PLACEHOLDER_ID);
        const realId = store.addPage(finalIndex);
        console.log(
          `[DND-End] Successfully created new page with ID: ${realId}`
        );

        store.refreshCatalog();
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
      const form = store.form;
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
        store.reorderPages(fromIndex, toIndex);
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
      const currentPage = Object.values(store.pages).find((p) =>
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
        targetIndex = store.pages[targetPageId].children.indexOf(
          targetData.instanceId
        );
      } else if (targetData.type === DRAG_PAGE_ID) {
        targetPageId = targetData.pageId;
        targetIndex = store.pages[targetPageId].children.length;
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
        store.moveComponent(
          currentPageId,
          currentIndex,
          currentPageId,
          targetIndex
        );
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
