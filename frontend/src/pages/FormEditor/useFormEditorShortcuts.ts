import { useEffect, useRef } from 'react';
import { useFormStore } from '@/form/store/form.store';
import type { SidebarPanelId } from './components/EditorSidebar';

export type FormEditorView = 'canvas' | 'logic' | 'workflow' | 'formProperties' | 'theming';

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  if (target.closest('[contenteditable="true"]')) return true;
  return false;
}

function isInsideOverlay(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return !!(
    target.closest('[role="dialog"]') ||
    target.closest('[role="alertdialog"]') ||
    target.closest('[data-slot="popover-content"]')
  );
}

function isModKey(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey;
}

function focusSidebarSearch() {
  const el = document.querySelector<HTMLInputElement>(
    '[data-sidebar-search]'
  );
  el?.focus();
  el?.select();
}

function focusActiveComponentInput(instanceId: string): boolean {
  const root = document.querySelector<HTMLElement>(
    `[data-component-instance-id="${instanceId}"]`
  );
  if (!root) return false;
  const input = root.querySelector<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement
  >(
    'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"]'
  );
  if (!input) return false;
  input.focus();
  if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
    input.select();
  }
  return true;
}

export interface UseFormEditorShortcutsParams {
  enabled: boolean;
  formLoaded: boolean;
  formId: string | undefined;
  saving: boolean;
  publishing: boolean;
  currentPageIndex: number;
  totalPages: number;
  setCurrentPageIndex: (newPageIndex: number) => void;
  activePanel: SidebarPanelId | null;
  setActivePanel: (p: SidebarPanelId | null) => void;
  editorView: FormEditorView;
  setEditorView: (v: FormEditorView) => void;
  setShowDebug: React.Dispatch<React.SetStateAction<boolean>>;
  hasSelection: boolean;
  onSave: () => boolean | Promise<boolean>;
  onPreview: () => void;
  onOpenShortcutsHelp: () => void;
}

export function useFormEditorShortcuts(opts: UseFormEditorShortcutsParams) {
  const optsRef = useRef(opts);

  useEffect(() => {
    optsRef.current = opts;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const o = optsRef.current;
      if (!o.enabled) return;

      const mod = isModKey(e);
      const editable = isEditableElement(e.target);

      // ── Save ─────────────────────────────────────────────────────────
      if (mod && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        if (!o.formLoaded || !o.formId) return;
        e.preventDefault();
        if (!o.saving) void o.onSave();
        return;
      }

      // ── Redo (Ctrl/Cmd+Shift+Z or Ctrl+Y) before plain Ctrl+Z ──────────
      if (
        mod &&
        e.shiftKey &&
        (e.key === 'z' || e.key === 'Z') &&
        !editable
      ) {
        e.preventDefault();
        useFormStore.getState().redo();
        return;
      }
      if (mod && !e.shiftKey && (e.key === 'y' || e.key === 'Y') && !editable) {
        e.preventDefault();
        useFormStore.getState().redo();
        return;
      }

      // ── Undo (Ctrl/Cmd+Z) ─────────────────────────────────────────────
      if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        if (!editable) {
          e.preventDefault();
          useFormStore.getState().undo();
        }
        return;
      }

      // ── Copy component ────────────────────────────────────────────────
      if (mod && !e.shiftKey && (e.key === 'c' || e.key === 'C')) {
        if (!editable && o.editorView === 'canvas') {
          const id = useFormStore.getState().activeComponentId;
          if (id) {
            const json =
              useFormStore.getState().serializeComponentForClipboard(id);
            if (json) {
              e.preventDefault();
              void navigator.clipboard.writeText(json);
            }
          }
        }
        return;
      }

      // ── Paste component (only when clipboard has our payload) ──────────
      if (mod && !e.shiftKey && (e.key === 'v' || e.key === 'V')) {
        if (!editable && o.editorView === 'canvas') {
          void navigator.clipboard.readText().then((text) => {
            if (!text.includes('"t":"ncfb"')) return;
            const form = useFormStore.getState().form;
            const pageId = form?.pages[o.currentPageIndex];
            if (pageId) {
              useFormStore.getState().pasteComponentData(pageId, text);
            }
          });
        }
        return;
      }

      // ── Preview (extra) ───────────────────────────────────────────────
      if (mod && e.shiftKey && (e.key === 'e' || e.key === 'E')) {
        if (!o.formId || editable) return;
        e.preventDefault();
        if (!o.publishing && !o.saving) o.onPreview();
        return;
      }

      // ── Shortcuts help popover ────────────────────────────────────────
      if (mod && e.key === '/') {
        e.preventDefault();
        o.onOpenShortcutsHelp();
        return;
      }

      // ── Toggle left sidebar ───────────────────────────────────────────
      if (mod && !e.shiftKey && (e.key === 'b' || e.key === 'B')) {
        if (editable) return;
        e.preventDefault();
        o.setActivePanel(o.activePanel ? null : 'components');
        return;
      }

      // ── Focus sidebar search (open Components if needed) ───────────────
      if (mod && !e.shiftKey && (e.key === 'f' || e.key === 'F')) {
        if (editable) return;
        e.preventDefault();
        if (!o.activePanel) o.setActivePanel('components');
        else if (o.activePanel !== 'components') o.setActivePanel('components');
        requestAnimationFrame(() => focusSidebarSearch());
        return;
      }

      // ── Open sidebar panels (Ctrl/Cmd+Shift+*) ────────────────────────
      if (mod && e.shiftKey && !e.altKey) {
        const k = e.key.toLowerCase();
        const panelMap: Record<string, SidebarPanelId> = {
          c: 'components',
          t: 'templates',
          m: 'theme',
          l: 'logic',
          w: 'workflow',
        };
        const panel = panelMap[k];
        if (panel) {
          if (editable) return;
          e.preventDefault();
          o.setActivePanel(panel);
          return;
        }
      }

      // ── Open AI assistant (Ctrl/Cmd+L) ────────────────────────────────
      if (mod && !e.shiftKey && !e.altKey && (e.key === 'l' || e.key === 'L')) {
        if (editable) return;
        e.preventDefault();
        o.setActivePanel('ai');
        return;
      }

      // ── Toggle properties (backslash) ─────────────────────────────────
      if (
        mod &&
        !e.shiftKey &&
        (e.key === '\\' || e.code === 'Backslash' || e.code === 'IntlBackslash')
      ) {
        if (editable || !o.hasSelection) return;
        e.preventDefault();
        useFormStore.getState().togglePropertiesPanel();
        return;
      }

      // ── Debug panel ───────────────────────────────────────────────────
      if (mod && e.altKey && !e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        if (editable) return;
        e.preventDefault();
        o.setShowDebug((d) => !d);
        return;
      }

      // ── Multi-page navigation ─────────────────────────────────────────

      // TODO: correct this
      // if (
      //   (mod && e.key === '[') ||
      //   (e.altKey && !mod && !e.shiftKey && e.key === 'ArrowLeft')
      // ) {
      //   if (editable || o.editorView !== 'canvas' || o.totalPages <= 1) return;
      //   e.preventDefault();
      //   o.setCurrentPageIndex((i) => Math.max(0, i - 1));
      //   return;
      // }
      // if (
      //   (mod && e.key === ']') ||
      //   (e.altKey && !mod && !e.shiftKey && e.key === 'ArrowRight')
      // ) {
      //   if (editable || o.editorView !== 'canvas' || o.totalPages <= 1) return;
      //   e.preventDefault();
      //   o.setCurrentPageIndex((i) => Math.min(o.totalPages - 1, i + 1));
      //   return;
      // }

      // ── Editor views: 1=Builder 2=Properties 3=Logic 4=Workflow ───────
      if (mod && !e.shiftKey && !e.altKey && ['1', '2', '3', '4'].includes(e.key)) {
        if (editable) return;
        e.preventDefault();
        const map: Record<string, FormEditorView> = {
          '1': 'canvas',
          '2': 'formProperties',
          '3': 'logic',
          '4': 'workflow',
        };
        o.setEditorView(map[e.key]!);
        return;
      }

      // ── Canvas-only component shortcuts ───────────────────────────────
      if (o.editorView === 'canvas' && !editable) {
        const store = useFormStore.getState();
        const form = store.form;
        const pageId = form?.pages[o.currentPageIndex];
        const children = pageId ? (store.pages[pageId]?.children ?? []) : [];
        const activeId = store.activeComponentId;

        // Select next / previous component
        if (e.key === 'ArrowDown' && !e.shiftKey) {
          e.preventDefault();
          if (children.length === 0) return;
          if (!activeId) {
            store.setActiveComponent(children[0]);
            return;
          }
          const i = children.indexOf(activeId);
          if (i !== -1 && i + 1 < children.length) {
            store.setActiveComponent(children[i + 1]);
          }
          return;
        }
        if (e.key === 'ArrowUp' && !e.shiftKey) {
          if (!activeId) return;
          e.preventDefault();
          const i = children.indexOf(activeId);
          if (i > 0) store.setActiveComponent(children[i - 1]);
          return;
        }

        // Move component up / down
        if (e.shiftKey && e.key === 'ArrowDown' && pageId && activeId) {
          e.preventDefault();
          const i = children.indexOf(activeId);
          if (i !== -1 && i + 1 < children.length) {
            // moveComponent uses insertion index semantics for same-page moves
            store.moveComponent(pageId, i, pageId, i + 2);
          }
          return;
        }
        if (e.shiftKey && e.key === 'ArrowUp' && pageId && activeId) {
          e.preventDefault();
          const i = children.indexOf(activeId);
          if (i > 0) {
            store.moveComponent(pageId, i, pageId, i - 1);
          }
          return;
        }

        // Enter — open properties
        if (e.key === 'Enter' && activeId) {
          e.preventDefault();
          store.setActiveComponent(activeId);
          store.openPropertiesPanel();
          return;
        }

        // "/" — jump to first editable input inside selected component
        if (e.key === '/' && activeId) {
          e.preventDefault();
          void requestAnimationFrame(() => {
            focusActiveComponentInput(activeId);
          });
          return;
        }

        // E — open settings / properties
        if (!mod && (e.key === 'e' || e.key === 'E') && activeId) {
          e.preventDefault();
          store.openPropertiesPanel();
          return;
        }

        // Space — toggle collapse
        if (e.key === ' ' && activeId) {
          e.preventDefault();
          store.toggleComponentCollapsed(activeId);
          return;
        }

        // Collapse / expand with arrows
        if (e.key === 'ArrowLeft' && !e.shiftKey && activeId) {
          e.preventDefault();
          store.setComponentCollapsed(activeId, true);
          return;
        }
        if (e.key === 'ArrowRight' && !e.shiftKey && activeId) {
          e.preventDefault();
          store.setComponentCollapsed(activeId, false);
          return;
        }

        // Duplicate
        if (mod && !e.shiftKey && !e.altKey && (e.key === 'd' || e.key === 'D')) {
          if (!activeId) return;
          e.preventDefault();
          store.duplicateComponent(activeId);
          return;
        }

        // Delete (not Backspace — reserved for text)
        if (e.key === 'Delete' && activeId) {
          e.preventDefault();
          store.removeComponent(activeId);
          return;
        }
      }

      // ── Escape ───────────────────────────────────────────────────────
      if (e.key === 'Escape') {
        if (isInsideOverlay(e.target)) return;
        const store = useFormStore.getState();

        if (store.showPropertiesPanel) {
          e.preventDefault();
          store.closePropertiesPanel();
          return;
        }

        if (
          o.editorView === 'logic' ||
          o.editorView === 'workflow' ||
          o.editorView === 'formProperties'
        ) {
          e.preventDefault();
          o.setEditorView('canvas');
          return;
        }

        if (store.activeComponentId || store.activePageId) {
          e.preventDefault();
          store.setActiveComponent(null);
          store.setActivePage(null);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
