import { useEffect, useState } from 'react';
import { useFormStore } from '@/form/store/form.store';
import { useLogicStore } from '@/form/logic/logic.store';

import {
  loadFormVersion,
} from '@/lib/formApi';

export function useFormEditorHydration(formId: string) {
  const loadForm = useFormStore((s) => s.loadForm);
  const initForm = useFormStore((s) => s.initForm);
  const setCurrentVersion = useFormStore((s) => s.setCurrentVersion);

  const [formLoaded, setFormLoaded] = useState(false);

  useEffect(() => {
    if (!formId) return;

    let cancelled = false;
    setFormLoaded(false);

    loadForm(
      {
        id: formId,
        name: '',
        metadata: { createdAt: '', updatedAt: '' },
        theme: null,
        access: {
          visibility: 'private',
          editors: [],
          reviewers: [],
          viewers: [],
        },
        settings: {
          submissionLimit: null,
          closeDate: null,
          collectEmailMode: 'none',
          submissionPolicy: 'none',
          canViewOwnSubmission: false,
          confirmationMessage: 'Thank you!',
        },
        pages: [],
      },
      [],
      [],
      1
    );

    loadFormVersion(formId)
      .then((data) => {
        if (cancelled) return;

        loadForm(data.form, data.pages, data.components, data.version);

        useLogicStore
          .getState()
          .loadRules(data.logicRules, data.logicFormulas, data.logicShuffleStacks);

        setFormLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;

        initForm(formId, 'Untitled Form');
        setCurrentVersion(1);
        setFormLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [formId]);

  return { formLoaded };
}