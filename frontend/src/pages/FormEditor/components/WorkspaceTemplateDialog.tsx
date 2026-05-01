import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchFormTemplates,
  createFormFromTemplate,
  type FormTemplateData,
} from '@/lib/formTemplateApi';
import { AllTemplatesDialog } from '@/pages/Dashboard/components/TemplatesSection';
import { toast } from 'sonner';

export function WorkspaceTemplateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<FormTemplateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (open && templates.length === 0 && !loading && !error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      fetchFormTemplates()
        .then((res) => setTemplates(res))
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }, [open, templates.length, loading, error]);

  const handleUse = async (id: string) => {
    setCreatingTemplateId(id);
    try {
      const { formId } = await createFormFromTemplate(id);
      onOpenChange(false);
      navigate(`/form-builder/${formId}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(err?.message || 'Failed to open template');
    } finally {
      setCreatingTemplateId(null);
    }
  };

  return (
    <AllTemplatesDialog
      open={open}
      onOpenChange={onOpenChange}
      templates={templates}
      loading={loading}
      error={error}
      creatingTemplateId={creatingTemplateId}
      onUse={handleUse}
    />
  );
}
