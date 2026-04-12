import { useFormStore } from '@/form/store/form.store';
import type {
  BaseComponentProps,
  ComponentMetadata,
  NumericValidation,
  RendererProps,
} from '../../base';
import { ComponentIDs, createComponent } from '../../base';

import { inp, lbl } from '../../ComponentRender.Helper';
import { useFormContext } from 'react-hook-form';
import { useFormMode } from '@/form/context/FormModeContext';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface NumberProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createNumberComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<NumberProps>
) => {
  return createComponent(
    ComponentIDs.Number,
    instanceId,
    metadata,
    {
      questionText: 'Enter a number',
      placeholder: '0',
      defaultValue: '',
      hiddenByDefault: false,
      ...props,
    },
    {
      required: false,
      min: undefined,
      max: undefined,
    } as NumericValidation
  );
};

export function NumberRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<NumberProps, NumericValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();

  if (formMode === 'view' && formContext) {
    const {
      register,
      formState: { errors },
    } = formContext;

    return (
      <Card>
        <CardContent className="space-y-3">
          <Label htmlFor={instanceId} className="block text-base font-semibold">
            {props.questionText}
          </Label>
          <Input
            id={instanceId}
            type="number"
            placeholder={props.placeholder || '0'}
            defaultValue={props.defaultValue}
            {...register(instanceId, {
              required: validation?.required ? 'This field is required' : false,
              valueAsNumber: true, // Crucial for correct min/max evaluation
              min:
                validation?.min !== undefined
                  ? {
                      value: validation.min,
                      message: `Value must be at least ${validation.min}`,
                    }
                  : undefined,
              max:
                validation?.max !== undefined
                  ? {
                      value: validation.max,
                      message: `Value must be no more than ${validation.max}`,
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

  return (
    <Card>
      <CardContent className="space-y-3">
        <Label className="block text-base font-semibold">
          {props.questionText}
        </Label>
        <Input
          type="number"
          readOnly
          value={props.defaultValue}
          placeholder={props.placeholder || '0'}
          disabled
        />
      </CardContent>
    </Card>
  );
}

export function NumberPropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<NumberProps, NumericValidation>) {
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
            type="number"
            value={props.defaultValue || ''}
            onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
            className={inp}
          />
        </div>
      </div>

      <div className="pt-1">
        <label className="flex items-center justify-between text-xs text-muted-foreground">
          Required
          <input
            type="checkbox"
            checked={!!validation?.required}
            onChange={() => uv(instanceId, { required: !validation?.required })}
            className="accent-primary"
          />
        </label>
      </div>

      <div>
        <label className={lbl}>Minimum Value</label>
        <input
          type="number"
          value={validation?.min ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              min: val === '' ? undefined : Number(val),
            });
          }}
          className={inp}
          placeholder="e.g., 0"
        />
      </div>

      <div>
        <label className={lbl}>Maximum Value</label>
        <input
          type="number"
          value={validation?.max ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              max: val === '' ? undefined : Number(val),
            });
          }}
          className={inp}
          placeholder="e.g., 100"
        />
      </div>
    </div>
  );
}
