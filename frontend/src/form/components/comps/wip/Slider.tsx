import { useFormStore } from '@/form/store/form.store';
import type {
  BaseComponentProps,
  BasicValidation,
  ComponentMetadata,
  RendererProps,
} from '../../base';
import { ComponentIDs, createComponent } from '../../base';

import { inp, lbl } from '../../ComponentRender.Helper';
import { useFormContext } from 'react-hook-form';
import { useFormMode } from '@/form/context/FormModeContext';
import { nanoid } from 'nanoid';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Controller } from 'react-hook-form';

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
) => {
  metadata.label = `${metadata.label} ${nanoid(12)}`;
  return createComponent(
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
};

export function SliderRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<SliderProps, SliderValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();

  // Fallback value if nothing is set
  const initialValue = props.defaultValue ?? props.min ?? 0;

  if (formMode === 'view' && formContext) {
    const {
      control,
      formState: { errors },
    } = formContext;

    return (
      <Card>
        <CardContent className="space-y-3">
          <Label
            className="block text-base font-semibold"
            dangerouslySetInnerHTML={{ __html: props.questionText }}
          />

          <Controller
            control={control}
            name={instanceId}
            defaultValue={initialValue}
            rules={{
              required: validation?.required ? 'This field is required' : false,
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
            }}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {props.min}
                </span>
                <Slider
                  min={props.min}
                  max={props.max}
                  step={props.step}
                  // Radix Slider expects an array for its value
                  value={[
                    field.value !== undefined ? field.value : initialValue,
                  ]}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onValueChange={(vals: any[]) => field.onChange(vals[0])}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground">
                  {props.max}
                </span>
                <span className="w-8 text-center text-sm font-semibold">
                  {field.value !== undefined ? field.value : initialValue}
                </span>
              </div>
            )}
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
        <Label
          className="block text-base font-semibold"
          dangerouslySetInnerHTML={{ __html: props.questionText }}
        />
        <div className="flex items-center gap-3 opacity-70">
          <span className="text-xs text-muted-foreground">{props.min}</span>
          <Slider
            min={props.min}
            max={props.max}
            step={props.step}
            defaultValue={[initialValue]}
            disabled
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground">{props.max}</span>
          <span className="w-8 text-center text-sm font-semibold">
            {initialValue}
          </span>
        </div>
      </CardContent>
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

      <div className="pt-1">
        <label className="flex items-center justify-between text-xs text-muted-foreground">
          Required
          <input
            type="checkbox"
            checked={!!validation?.required}
            onChange={() => uv(instanceId, { required: !validation?.required })}
          />
        </label>
      </div>

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
