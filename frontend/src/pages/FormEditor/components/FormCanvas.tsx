// src/pages/FormEditor/components/FormCanvas.tsx
import { FormModeProvider } from '@/form/context/FormModeContext';
import { RenderForm } from '@/form/renderer/editRenderer/RenderForm';
import { FormThemeProvider } from '@/form/theme/FormThemeProvider';

export function FormCanvas() {
  return (
    <FormThemeProvider>
      <FormModeProvider value="edit">
        <div className="min-h-full w-full">
          <RenderForm />
        </div>
      </FormModeProvider>
    </FormThemeProvider>
  );
}
