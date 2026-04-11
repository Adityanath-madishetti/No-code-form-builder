import { FormEditorShell } from './FormEditorShell';
import { useFormEditorHydration } from '../hooks/useFormEditorHydration';

export function FormEditorLoader({ formId }: { formId: string }) {
  const { formLoaded } = useFormEditorHydration(formId);

  if (!formLoaded) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return <FormEditorShell formId={formId} />;
}