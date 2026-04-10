import { useFormStore } from '@/form/store/form.store';
import type {
  BasicValidation,
  ComponentMetadata,
  RendererProps,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import type { BaseComponentProps } from '../base';
import { inp, lbl } from '../ComponentRender.Helper';
import { useFormContext } from 'react-hook-form';
import { useFormMode } from '@/form/context/FormModeContext';
import { nanoid } from 'nanoid';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  metadata.label = `${metadata.label} ${nanoid(12)}`;
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
    const {
      register,
      formState: { errors },
    } = formContext;

    return (
      <Card>
        <CardContent className="space-y-3">
          <Label
            htmlFor={instanceId}
            className="block text-base font-semibold"
            dangerouslySetInnerHTML={{ __html: props.questionText }}
          />
          <Input
            id={instanceId}
            type={inputType}
            defaultValue={props.defaultValue}
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
            <p className="text-[0.8rem] font-medium text-destructive">
              {errors[instanceId]?.message as string}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // --- Builder Mode (Static/Preview) ---
  return (
    <Card>
      <CardContent className="space-y-3">
        <Label
          className="block text-base font-semibold"
          dangerouslySetInnerHTML={{ __html: props.questionText }}
        />
        <Input
          type={inputType}
          readOnly
          defaultValue={props.defaultValue}
          className="opacity-70"
          disabled // Prevents interaction in the builder canvas
        />
      </CardContent>
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
