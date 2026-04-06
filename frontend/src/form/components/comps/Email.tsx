import { useFormStore } from '@/form/store/formStore';
import type {
  BaseComponentProps,
  ComponentMetadata,
  TextValidation,
  RendererProps,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import { inp, lbl, Card, Q } from '../ComponentRender.Helper';
import { useFormContext } from 'react-hook-form';
import { useFormMode } from '@/form/context/FormModeContext';

export interface EmailProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createEmailComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<EmailProps>
) =>
  createComponent(
    ComponentIDs.Email,
    instanceId,
    metadata,
    {
      questionText: 'Email address',
      placeholder: 'user@example.com',
      defaultValue: '',
      hiddenByDefault: false,
      ...props,
    },
    {
      required: false,
      pattern: '^[^@]+@[^@]+\\.[^@]+$',
    } as TextValidation
  );

export function EmailRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<EmailProps, TextValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();

  // --- View Mode (Live Form with Validation) ---
  if (formMode === 'view' && formContext) {
    if (!formContext) {
      console.error('EmailRenderer is not wrapped in a FormProvider.');
      return null;
    }

    const {
      register,
      formState: { errors },
    } = formContext;

    return (
      <Card className="rounded-none shadow-none">
        <Q html={props.questionText} />
        <input
          type="email"
          placeholder={props.placeholder || 'user@example.com'}
          defaultValue={props.defaultValue}
          className={inp}
          {...register(instanceId, {
            required: validation?.required ? 'This field is required' : false,
            minLength: validation?.minLength
              ? {
                  value: validation.minLength,
                  message: `Minimum ${validation.minLength} characters`,
                }
              : undefined,
            maxLength: validation?.maxLength
              ? {
                  value: validation.maxLength,
                  message: `Maximum ${validation.maxLength} characters`,
                }
              : undefined,
            pattern: validation?.pattern
              ? {
                  value: new RegExp(validation.pattern),
                  message: 'Invalid email format',
                }
              : undefined,
          })}
        />
        {errors[instanceId] && (
          <p className="mt-1 text-sm text-red-500">
            {errors[instanceId]?.message as string}
          </p>
        )}
      </Card>
    );
  }

  // --- Builder Mode (Static/Preview) ---
  return (
    <Card className="rounded-none shadow-none">
      <Q html={props.questionText} />
      <input
        type="email"
        defaultValue={props.defaultValue}
        placeholder={props.placeholder || 'user@example.com'}
        className={inp}
      />
    </Card>
  );
}

export function EmailPropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<EmailProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  const uv = useFormStore((s) => s.updateComponentValidation);

  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Question Text</label>
        <input
          type="text"
          value={props.questionText || ''}
          onChange={(e) => u(instanceId, { questionText: e.target.value })}
          className={inp}
        />
      </div>
      <div>
        <label className={lbl}>Placeholder</label>
        <input
          type="text"
          value={props.placeholder || ''}
          onChange={(e) => u(instanceId, { placeholder: e.target.value })}
          className={inp}
        />
      </div>
      <div>
        <label className={lbl}>Default Value</label>
        <input
          type="text"
          value={props.defaultValue || ''}
          onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
          className={inp}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={!!validation?.required}
          onChange={() => uv(instanceId, { required: !validation?.required })}
          className="accent-primary"
        />
        Required
      </label>

      <div>
        <label className={lbl}>Minimum Length</label>
        <input
          type="number"
          min="0"
          value={validation?.minLength ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              minLength: val === '' ? undefined : parseInt(val, 10),
            });
          }}
          className={inp}
          placeholder="e.g., 0"
        />
      </div>

      <div>
        <label className={lbl}>Maximum Length</label>
        <input
          type="number"
          min="0"
          value={validation?.maxLength ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              maxLength: val === '' ? undefined : parseInt(val, 10),
            });
          }}
          className={inp}
          placeholder="e.g., 255"
        />
      </div>
    </div>
  );
}
