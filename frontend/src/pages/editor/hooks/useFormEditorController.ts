import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFormStore } from '@/form/store/form.store';
import { useLogicStore } from '@/form/logic/logic.store';
import { useTheme } from '@/components/theme-provider';
import { createNewVersion, saveFormVersion } from '@/lib/formApi';

export function useFormEditorController(formId: string) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme: editorTheme, setTheme: setEditorTheme } = useTheme();

  // FORM STORE
  const form = useFormStore((s) => s.form);
  const pages = useFormStore((s) => s.pages);
  const components = useFormStore((s) => s.components);

  const addPage = useFormStore((s) => s.addPage);
  const setActiveComponent = useFormStore((s) => s.setActiveComponent);
  const setActivePage = useFormStore((s) => s.setActivePage);
  const clearSelectedComponents = useFormStore((s) => s.clearSelectedComponents);

  const activeComponentId = useFormStore((s) => s.activeComponentId);
  const activePageId = useFormStore((s) => s.activePageId);

  const showPropertiesPanel = useFormStore((s) => s.showPropertiesPanel);
  const togglePropertiesPanel = useFormStore((s) => s.togglePropertiesPanel);

  const currentVersion = useFormStore((s) => s.currentVersion);
  const setCurrentVersion = useFormStore((s) => s.setCurrentVersion);

  // LOGIC STORE
  const logicActiveRuleId = useLogicStore((s) => s.activeRuleId);
  const logicActiveFormulaId = useLogicStore((s) => s.activeFormulaId);

  // STATE
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [editorView, setEditorView] = useState<
    'canvas' | 'logic' | 'workflow' | 'formProperties' | 'theming'
  >('canvas');

  const [activePanel, setActivePanel] = useState<any>('components');

  const [showDebug, setShowDebug] = useState(false);
  const [showProperties, setShowProperties] = useState(true);

  const [leftWidth, setLeftWidth] = useState<number | string>('20%');
  const [rightWidth, setRightWidth] = useState(340);
  const [debugWidth, setDebugWidth] = useState(400);

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const totalPages = form?.pages?.length ?? 0;
  const hasSelection = !!activeComponentId || !!activePageId;

  // -------------------------
  // EFFECTS
  // -------------------------

  // Clamp page index
  useEffect(() => {
    if (totalPages > 0 && currentPageIndex >= totalPages) {
      setCurrentPageIndex(totalPages - 1);
    }
  }, [currentPageIndex, totalPages]);

  // Update tab title
  useEffect(() => {
    document.title = form?.name
      ? `${form.name} — Form Builder`
      : 'Editor — Form Builder';
  }, [form?.name]);

  // Auto show properties
  useEffect(() => {
    if (activeComponentId || activePageId) {
      setShowProperties(true);
    } else {
      setShowProperties(false);
    }
  }, [activeComponentId, activePageId]);

  // Sync with store toggle
  useEffect(() => {
    setShowProperties(showPropertiesPanel);
  }, [showPropertiesPanel]);

  // Auto switch to logic
  useEffect(() => {
    if (logicActiveRuleId || logicActiveFormulaId) {
      setEditorView('logic');
    }
  }, [logicActiveRuleId, logicActiveFormulaId]);

  // -------------------------
  // HANDLERS
  // -------------------------

  const handleAddPage = useCallback(() => {
    addPage();
    setCurrentPageIndex(totalPages);
  }, [addPage, totalPages]);

  const handleCanvasClick = useCallback(() => {
    setActiveComponent(null);
    setActivePage(null);
    clearSelectedComponents();
  }, [clearSelectedComponents, setActiveComponent, setActivePage]);

  const handleSave = useCallback(async () => {
    if (!formId || !form) return false;

    setSaving(true);

    try {
      const version = await createNewVersion(formId);
      setCurrentVersion(version);

      const logic = useLogicStore.getState();

      await saveFormVersion(
        formId,
        version,
        form,
        pages,
        components,
        user?.uid || 'unknown',
        logic.rules,
        logic.formulas,
        logic.componentShuffleStacks
      );

      return true;
    } catch (err) {
      console.error('Save failed:', err);
      return false;
    } finally {
      setSaving(false);
    }
  }, [components, form, formId, pages, setCurrentVersion, user?.uid]);

  const navigateHome = () => {
    navigate('/');
  };

  const handleNavigatePage = (page: number) => {
    setCurrentPageIndex(page - 1);
  };

  // -------------------------
  // RETURN
  // -------------------------

  return {
    state: {
      formId,
      form,
      totalPages,
      currentVersion,

      currentPageIndex,
      editorView,
      activePanel,

      showDebug,
      showProperties,

      leftWidth,
      rightWidth,
      debugWidth,

      shortcutsOpen,
      saving,
      publishing,

      hasSelection,
      editorTheme,
    },

    actions: {
      // navigation
      navigateHome,

      // setters
      setCurrentPageIndex,
      setEditorView,
      setActivePanel,
      setShowDebug,
      setShowProperties,
      setLeftWidth,
      setRightWidth,
      setDebugWidth,
      setShortcutsOpen,
      setPublishing,
      setEditorTheme,

      // handlers
      handleAddPage,
      handleCanvasClick,
      handleSave,
      handleNavigatePage,

      togglePropertiesPanel,
    },

    shortcuts: {
      enabled: Boolean(formId),
      formLoaded: true,
      saving,
      publishing,
      currentPageIndex,
      totalPages,
      activePanel,
      editorView,
      hasSelection,
    },
  };
}