import { api } from './api';
import type { FormTheme } from '@/form/components/base';

export interface ThemeTemplateData {
  themeId: string;
  name: string;
  theme: FormTheme;
  createdBy: string;
  sharedWith: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  creatorEmail?: string;
}

export async function fetchThemes(): Promise<ThemeTemplateData[]> {
  const res = await api.get<{ themes: ThemeTemplateData[] }>('/api/themes');
  return res.themes;
}

export async function addTheme(
  name: string,
  theme: FormTheme
): Promise<ThemeTemplateData> {
  const res = await api.post<{ theme: ThemeTemplateData }>('/api/themes', {
    name,
    theme,
  });
  return res.theme;
}

export async function updateTheme(
  themeId: string,
  updates: {
    name?: string;
    sharedWith?: string[];
    isPublic?: boolean;
    theme?: FormTheme;
  }
): Promise<ThemeTemplateData> {
  const res = await api.patch<{ theme: ThemeTemplateData }>(
    `/api/themes/${themeId}`,
    updates
  );
  return res.theme;
}

export async function deleteTheme(themeId: string): Promise<void> {
  await api.delete(`/api/themes/${themeId}`);
}
