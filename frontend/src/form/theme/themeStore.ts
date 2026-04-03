// src/form/theme/themeStore.ts
/**
 * Theme Editor UI State
 * Manages the ephemeral UI state for the theming page —
 * active section, selected page for per-page overrides, etc.
 */

import { create } from 'zustand';
import type { PageID } from '../components/base';

export type ThemeTab = 'global' | 'page';
export type ThemeSection = 'colors' | 'background' | 'layout' | 'componentProps';
export type BackgroundSubTab = 'solid' | 'gradient' | 'image' | 'pattern';

interface ThemeUIState {
  activeTab: ThemeTab;
  expandedSections: Set<ThemeSection>;
  backgroundSubTab: BackgroundSubTab;
  selectedPageId: PageID | null;
}

interface ThemeUIActions {
  setActiveTab: (tab: ThemeTab) => void;
  toggleSection: (section: ThemeSection) => void;
  setBackgroundSubTab: (tab: BackgroundSubTab) => void;
  setSelectedPageId: (pageId: PageID | null) => void;
}

export type ThemeUIStore = ThemeUIState & ThemeUIActions;

export const useThemeUIStore = create<ThemeUIStore>()((set) => ({
  activeTab: 'global',
  expandedSections: new Set<ThemeSection>(['colors', 'background', 'layout', 'componentProps']),
  backgroundSubTab: 'solid',
  selectedPageId: null,

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
}));
