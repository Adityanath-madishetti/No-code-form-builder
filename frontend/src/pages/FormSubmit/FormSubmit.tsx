/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PublicFormData } from '@/form/renderer/viewRenderer/types';
import { useRuntimeFormStore } from '@/form/renderer/viewRenderer/useRuntimeFormStore';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { FormRunner } from '@/form/renderer/viewRenderer/FormRunner';

export default function FormSubmit() {
  const { formId } = useParams<{ formId: string }>();
  const [globalFormError, setGlobalFormError] = useState('');
  const [globalFormLoading, setGlobalFormLoading] = useState(true);

  const { initRuntimeForm } = useRuntimeFormStore();

  useEffect(() => {
    if (!formId) return;
    api
      .get<PublicFormData>(`/api/forms/${formId}/public`)
      .then((res) => {
        console.log('shitres', res);
        initRuntimeForm(res);

        //   if (user?.email) setEmail(user.email);
      })
      .catch((err) => setGlobalFormError(err.message || 'Form not found'))
      .finally(() => setGlobalFormLoading(false));
  }, [formId, initRuntimeForm]);

  return (
    <div className='mx-auto max-w-3xl'>
      <FormRunner></FormRunner>
    </div>
  );
}
