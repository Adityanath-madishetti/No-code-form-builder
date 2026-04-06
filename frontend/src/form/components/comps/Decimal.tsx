import { useFormStore } from '@/form/store/formStore';
import type {
  BaseComponentProps,
  ComponentMetadata,
  NumericValidation,
  RendererProps,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import { inp, lbl, Card, Q } from '../ComponentRender.Helper';
import { useFormContext } from 'react-hook-form';
import { useFormMode } from '@/form/context/FormModeContext';

export interface DecimalProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
  precision: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createDecimalComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<DecimalProps>
) =>
  createComponent(
    ComponentIDs.Decimal,
    instanceId,
    metadata,
    {
      questionText: 'Enter a decimal value',
      placeholder: '0.00',
      defaultValue: '',
      precision: 2,
      hiddenByDefault: false,
      ...props,
    },
    {
      required: false,
      min: undefined,
      max: undefined,
    } as NumericValidation
  );

export function DecimalRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<DecimalProps, NumericValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();

  // Dynamic step calculation based on precision (e.g., precision 2 -> 0.01)
  const stepValue = Math.pow(10, -(props.precision || 2));

  // --- View Mode (Live Form with Validation) ---
  if (formMode === 'view' && formContext) {
    if (!formContext) {
      console.error('DecimalRenderer is not wrapped in a FormProvider.');
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
          type="number"
          step={stepValue}
          placeholder={props.placeholder || '0.00'}
          defaultValue={props.defaultValue}
          className={inp}
          {...register(instanceId, {
            required: validation?.required ? 'This field is required' : false,
            valueAsNumber: true,
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
        type="number"
        step={stepValue}
        readOnly
        value={props.defaultValue}
        placeholder={props.placeholder || '0.00'}
        className={inp}
      />
    </Card>
  );
}

export function DecimalPropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<DecimalProps, NumericValidation>) {
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
          <label className={lbl}>Decimal Precision</label>
          <input
            type="number"
            min={1}
            max={10}
            value={props.precision || 2}
            onChange={(e) =>
              u(instanceId, { precision: Number(e.target.value) })
            }
            className={inp}
          />
        </div>
      </div>

      <div>
        <label className={lbl}>Default Value</label>
        <input
          type="number"
          step={Math.pow(10, -(props.precision || 2))}
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
        <label className={lbl}>Minimum Value</label>
        <input
          type="number"
          step={Math.pow(10, -(props.precision || 2))}
          value={validation?.min ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              min: val === '' ? undefined : Number(val),
            });
          }}
          className={inp}
          placeholder="e.g., 0.00"
        />
      </div>

      <div>
        <label className={lbl}>Maximum Value</label>
        <input
          type="number"
          step={Math.pow(10, -(props.precision || 2))}
          value={validation?.max ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              max: val === '' ? undefined : Number(val),
            });
          }}
          className={inp}
          placeholder="e.g., 100.00"
        />
      </div>
    </div>
  );
}
