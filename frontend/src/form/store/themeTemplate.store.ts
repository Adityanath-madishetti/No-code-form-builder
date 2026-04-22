import { create } from 'zustand';
import type { FormTheme } from '../components/base';
import {
  fetchThemes,
  addTheme as apiAddTheme,
  updateTheme as apiUpdateTheme,
  deleteTheme as apiDeleteTheme,
} from '@/lib/themeApi';

export interface ThemeTemplate {
  id: string; // mapped from themeId
  name: string;
  theme: FormTheme;
  createdBy: string;
  sharedWith: string[];
  isPublic: boolean;
  createdAt?: string;
  creatorEmail?: string;
}

interface ThemeTemplateStore {
  themes: ThemeTemplate[];
  isLoading: boolean;
  error: string | null;
  loadThemes: () => Promise<void>;
  addTheme: (name: string, theme: FormTheme) => Promise<void>;
  updateTheme: (
    id: string,
    updates: {
      name?: string;
      sharedWith?: string[];
      isPublic?: boolean;
      theme?: FormTheme;
    }
  ) => Promise<void>;
  removeTheme: (id: string) => Promise<void>;
}

export const useThemeTemplateStore = create<ThemeTemplateStore>((set) => ({
  themes: [],
  isLoading: false,
  error: null,
  loadThemes: async () => {
    set({ isLoading: true, error: null });
    try {
      const dbThemes = await fetchThemes();
      set({
        themes: dbThemes.map((t) => ({
          ...t,
          id: t.themeId,
        })),
        isLoading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  addTheme: async (name, theme) => {
    try {
      const newTheme = await apiAddTheme(name, theme);
      set((state) => ({
        themes: [...state.themes, { ...newTheme, id: newTheme.themeId }],
      }));
    } catch (err) {
      console.error(err);
    }
  },
  updateTheme: async (id, updates) => {
    try {
      const updated = await apiUpdateTheme(id, updates);
      set((state) => ({
        themes: state.themes.map((t) =>
          t.id === id ? { ...updated, id: updated.themeId } : t
        ),
      }));
    } catch (err) {
      console.error(err);
    }
  },
  removeTheme: async (id) => {
    try {
      await apiDeleteTheme(id);
      set((state) => ({
        themes: state.themes.filter((t) => t.id !== id),
      }));
    } catch (err) {
      console.error(err);
    }
  },
}));
