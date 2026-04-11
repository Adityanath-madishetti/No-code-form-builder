import { useParams } from 'react-router-dom';
import { FormEditorLoader } from './FormEditorLoader';

export default function FormEditorPage() {
  const { formId = '' } = useParams<{ formId: string }>();
  return <FormEditorLoader formId={formId} />;
}