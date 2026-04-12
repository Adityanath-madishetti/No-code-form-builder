import { useFormStore } from '@/form/store/form.store';
import type {
  BasicValidation,
  ComponentMetadata,
  RendererProps,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import type { BaseComponentProps } from '../base';
import { inp, lbl, Card, Q } from '../ComponentRender.Helper';
import { useFormContext } from 'react-hook-form';
import { useFormMode } from '@/form/context/FormModeContext';

export interface DateProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  includeTime: boolean;
  defaultValue?: string;
}

export interface DateValidation extends BasicValidation {
  minDate?: string;
  maxDate?: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createDateComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<DateProps>
) => {
  return createComponent(
    ComponentIDs.Date,
    instanceId,
    metadata,
    {
      questionText: 'Select a date',
      placeholder: 'YYYY-MM-DD',
      includeTime: false,
      defaultValue: '',
      hiddenByDefault: false,
      ...props,
    },
    {
      required: false,
      minDate: undefined,
      maxDate: undefined,
    } as DateValidation
  );
};

export function DateRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<DateProps, DateValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();

  const inputType = props.includeTime ? 'datetime-local' : 'date';

  // --- View Mode (Live Form with Validation) ---
  if (formMode === 'view' && formContext) {
    if (!formContext) {
      console.error('DateRenderer is not wrapped in a FormProvider.');
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
          type={inputType}
          defaultValue={props.defaultValue}
          className={inp}
          {...register(instanceId, {
            required: validation?.required ? 'This field is required' : false,
            min: validation?.minDate
              ? {
                  value: validation.minDate,
                  message: `Date must be on or after ${validation.minDate}`,
                }
              : undefined,
            max: validation?.maxDate
              ? {
                  value: validation.maxDate,
                  message: `Date must be on or before ${validation.maxDate}`,
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
        type={inputType}
        readOnly
        defaultValue={props.defaultValue}
        className={inp}
      />
    </Card>
  );
}

export function DatePropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<DateProps, DateValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  const uv = useFormStore((s) => s.updateComponentValidation);

  const inputType = props.includeTime ? 'datetime-local' : 'date';

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

      {/* <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={props.includeTime}
            onChange={(e) => {
              // Clear default/min/max values when toggling time to avoid format mismatches
              u(instanceId, { includeTime: e.target.checked, defaultValue: '' });
              uv(instanceId, { minDate: undefined, maxDate: undefined });
            }}
            className="accent-primary"
          />
          Include Time
        </label>
      </div> */}

      <div>
        <label className={lbl}>Default Value</label>
        <input
          type={inputType}
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
        <label className={lbl}>Minimum Date</label>
        <input
          type={inputType}
          value={validation?.minDate ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              minDate: val === '' ? undefined : val,
            });
          }}
          className={inp}
        />
      </div>

      <div>
        <label className={lbl}>Maximum Date</label>
        <input
          type={inputType}
          value={validation?.maxDate ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              maxDate: val === '' ? undefined : val,
            });
          }}
          className={inp}
        />
      </div>
    </div>
  );
}
