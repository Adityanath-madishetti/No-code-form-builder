// src/form/theme/themeStore.ts
/**
 * Theme Editor UI State
 * Manages the ephemeral UI state for the theming page —
 * active section, selected page for per-page overrides, etc.
 */

import { create } from 'zustand';
import type { PageID, FormTheme, FormPage } from '../components/base';

export type ThemeTab = 'global' | 'page';
export type ThemeSection =
  | 'colors'
  | 'library'
  | 'background'
  | 'typography'
  | 'layout'
  | 'componentProps';
export type BackgroundSubTab =
  | 'solid'
  | 'gradient'
  | 'mesh'
  | 'image'
  | 'pattern';

interface ThemeUIState {
  activeTab: ThemeTab;
  expandedSections: Set<ThemeSection>;
  backgroundSubTab: BackgroundSubTab;
  selectedPageId: PageID | null;
  primaryColor: string;
  secondaryColor: string;
  isSaveThemeOpen: boolean;
}

interface ThemeUIActions {
  setActiveTab: (tab: ThemeTab) => void;
  toggleSection: (section: ThemeSection) => void;
  setBackgroundSubTab: (tab: BackgroundSubTab) => void;
  setSelectedPageId: (pageId: PageID | null) => void;
  setColors: (primary: string, secondary: string) => void;
  setIsSaveThemeOpen: (open: boolean) => void;
  syncWithTheme: (
    theme?: FormTheme | null,
    pages?: Record<PageID, FormPage>
  ) => void;
}

export type ThemeUIStore = ThemeUIState & ThemeUIActions;

export const useThemeUIStore = create<ThemeUIStore>()((set) => ({
  activeTab: 'global',
  expandedSections: new Set<ThemeSection>([
    'colors',
    'background',
    'typography',
    'layout',
    'componentProps',
  ]),
  backgroundSubTab: 'solid',
  selectedPageId: null,
  primaryColor: '',
  secondaryColor: '',
  isSaveThemeOpen: false,

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleSection: (section) =>
    set((state) => {
      const next = new Set(state.expandedSections);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return { expandedSections: next };
    }),

  setBackgroundSubTab: (tab) => set({ backgroundSubTab: tab }),
  setSelectedPageId: (pageId) => set({ selectedPageId: pageId }),
  setColors: (primary, secondary) =>
    set({ primaryColor: primary, secondaryColor: secondary }),
  setIsSaveThemeOpen: (open) => set({ isSaveThemeOpen: open }),
  syncWithTheme: (theme, pages) => {
    const backgroundType = theme?.background?.type || 'solid';

    // Logic to resolve colors based on tab/page
    set((state) => {
      let pc = theme?.primaryColor || '';
      let sc = theme?.secondaryColor || '';

      if (state.activeTab === 'page' && state.selectedPageId && pages) {
        const overrides = pages[state.selectedPageId]?.themeOverrides;
        if (overrides?.primaryColor) pc = overrides.primaryColor;
        if (overrides?.secondaryColor) sc = overrides.secondaryColor;
      }

      return {
        backgroundSubTab: backgroundType as BackgroundSubTab,
        primaryColor: pc,
        secondaryColor: sc,
      };
    });
  },
}));
