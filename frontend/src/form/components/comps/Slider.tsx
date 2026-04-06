import { useFormStore } from '@/form/store/formStore';
import type {
  BaseComponentProps,
  BasicValidation,
  ComponentMetadata,
  RendererProps,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import { inp, lbl, Card, Q } from '../ComponentRender.Helper';
import { useFormContext } from 'react-hook-form';
import { useFormMode } from '@/form/context/FormModeContext';

export interface SliderProps extends BaseComponentProps {
  questionText: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export interface SliderValidation extends BasicValidation {
  minValue?: number;
  maxValue?: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createSliderComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<SliderProps>
) =>
  createComponent(
    ComponentIDs.Slider,
    instanceId,
    metadata,
    {
      questionText: 'Adjust the slider',
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 50,
      hiddenByDefault: false,
      ...props,
    },
    {
      required: false,
      minValue: undefined,
      maxValue: undefined,
    } as SliderValidation
  );

export function SliderRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<SliderProps, SliderValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();

  // --- View Mode (Live Form with Validation) ---
  if (formMode === 'view' && formContext) {
    if (!formContext) {
      console.error('SliderRenderer is not wrapped in a FormProvider.');
      return null;
    }

    const {
      register,
      watch,
      formState: { errors },
    } = formContext;

    // Watch the current value so we can display it dynamically
    const currentValue = watch(instanceId) ?? props.defaultValue;

    return (
      <Card className="rounded-none shadow-none">
        <Q html={props.questionText} />
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground">{props.min}</span>
          <input
            type="range"
            min={props.min}
            max={props.max}
            step={props.step}
            defaultValue={props.defaultValue}
            className="flex-1 accent-primary"
            {...register(instanceId, {
              required: validation?.required ? 'This field is required' : false,
              valueAsNumber: true,
              min:
                validation?.minValue !== undefined
                  ? {
                      value: validation.minValue,
                      message: `Value must be at least ${validation.minValue}`,
                    }
                  : undefined,
              max:
                validation?.maxValue !== undefined
                  ? {
                      value: validation.maxValue,
                      message: `Value cannot exceed ${validation.maxValue}`,
                    }
                  : undefined,
            })}
          />
          <span className="text-[10px] text-muted-foreground">{props.max}</span>
          <span className="w-8 text-center text-sm font-semibold">
            {currentValue}
          </span>
        </div>
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
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground">{props.min}</span>
        <input
          type="range"
          min={props.min}
          max={props.max}
          step={props.step}
          value={props.defaultValue}
          disabled // Prevents interaction in the builder canvas
          className="flex-1 accent-primary opacity-70"
        />
        <span className="text-[10px] text-muted-foreground">{props.max}</span>
        <span className="w-8 text-center text-sm font-semibold">
          {props.defaultValue}
        </span>
      </div>
    </Card>
  );
}

export function SliderPropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<SliderProps, SliderValidation>) {
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
          <label className={lbl}>Min</label>
          <input
            type="number"
            value={props.min}
            onChange={(e) => u(instanceId, { min: Number(e.target.value) })}
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>Max</label>
          <input
            type="number"
            value={props.max}
            onChange={(e) => u(instanceId, { max: Number(e.target.value) })}
            className={inp}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Step</label>
          <input
            type="number"
            min={0.1} // Prevent 0 step which breaks the slider
            value={props.step}
            onChange={(e) => u(instanceId, { step: Number(e.target.value) })}
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>Default Value</label>
          <input
            type="number"
            min={props.min}
            max={props.max}
            step={props.step}
            value={props.defaultValue}
            onChange={(e) =>
              u(instanceId, { defaultValue: Number(e.target.value) })
            }
            className={inp}
          />
        </div>
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
        <label className={lbl}>Minimum Allowed Value</label>
        <input
          type="number"
          min={props.min}
          max={props.max}
          value={validation?.minValue ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              minValue: val === '' ? undefined : Number(val),
            });
          }}
          className={inp}
          placeholder={`e.g., ${props.min}`}
        />
      </div>

      <div>
        <label className={lbl}>Maximum Allowed Value</label>
        <input
          type="number"
          min={props.min}
          max={props.max}
          value={validation?.maxValue ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              maxValue: val === '' ? undefined : Number(val),
            });
          }}
          className={inp}
          placeholder={`e.g., ${props.max}`}
        />
      </div>
    </div>
  );
}
