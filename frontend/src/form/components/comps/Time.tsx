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

export interface TimeProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  format24h: boolean;
  defaultValue?: string;
}

export interface TimeValidation extends BasicValidation {
  minTime?: string;
  maxTime?: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createTimeComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<TimeProps>
) => {
  metadata.label = `${metadata.label} ${nanoid(12)}`;
  return createComponent(
    ComponentIDs.Time,
    instanceId,
    metadata,
    {
      questionText: 'Select a time',
      placeholder: 'HH:MM',
      format24h: false,
      defaultValue: '',
      hiddenByDefault: false,
      ...props,
    },
    {
      required: false,
      minTime: undefined,
      maxTime: undefined,
    } as TimeValidation
  );
};

export function TimeRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<TimeProps, TimeValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();

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
            type="time"
            defaultValue={props.defaultValue}
            {...register(instanceId, {
              required: validation?.required ? 'This field is required' : false,
              min: validation?.minTime
                ? {
                    value: validation.minTime,
                    message: `Time must be at or after ${validation.minTime}`,
                  }
                : undefined,
              max: validation?.maxTime
                ? {
                    value: validation.maxTime,
                    message: `Time must be at or before ${validation.maxTime}`,
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
          type="time"
          readOnly
          defaultValue={props.defaultValue}
          className="opacity-70"
          disabled
        />
      </CardContent>
    </Card>
  );
}

export function TimePropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<TimeProps, TimeValidation>) {
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

      <div className="grid grid-cols-2 gap-4">
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
            type="time"
            value={props.defaultValue || ''}
            onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
            className={inp}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={props.format24h}
          onChange={(e) => u(instanceId, { format24h: e.target.checked })}
          className="accent-primary"
        />
        24-hour format
      </label>

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
        <label className={lbl}>Minimum Time</label>
        <input
          type="time"
          defaultValue={validation?.minTime ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              minTime: val === '' ? undefined : val,
            });
          }}
          className={inp}
        />
      </div>

      <div>
        <label className={lbl}>Maximum Time</label>
        <input
          type="time"
          defaultValue={validation?.maxTime ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              maxTime: val === '' ? undefined : val,
            });
          }}
          className={inp}
        />
      </div>
    </div>
  );
}
