// src/form/theme/FormThemeProvider.tsx
import type { ReactNode } from 'react';
import { formSelectors, useFormStore } from '@/form/store/formStore';
import { formThemeColors, formThemeModes } from './formTheme';

export function FormThemeProvider({ children }: { children: ReactNode }) {
  const activeTheme = useFormStore(formSelectors.formTheme);
  const color = activeTheme?.color || formThemeColors.Default;
  const mode = activeTheme?.mode || formThemeModes.Light;

  return (
    <div
      className={`form-theme-${color} ${mode === 'dark' ? 'dark' : 'light'}`}
    >
      {children}
    </div>
  );
}
