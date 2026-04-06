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

export interface LinearScaleProps extends BaseComponentProps {
  questionText: string;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
}

export interface LinearScaleValidation extends BasicValidation {
  minRating?: number;
  maxRating?: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createLinearScaleComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<LinearScaleProps>
) =>
  createComponent(
    ComponentIDs.LinearScale,
    instanceId,
    metadata,
    {
      questionText: 'How would you rate this?',
      min: 1,
      max: 10,
      minLabel: 'Low',
      maxLabel: 'High',
      hiddenByDefault: false,
      ...props,
    },
    { 
      required: false,
      minRating: undefined,
      maxRating: undefined,
    } as LinearScaleValidation
  );

export function LinearScaleRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<LinearScaleProps, LinearScaleValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();
  const count = (props.max || 10) - (props.min || 1) + 1;

  // --- View Mode (Live Form with Validation) ---
  if (formMode === 'view' && formContext) {
    if (!formContext) {
      console.error('LinearScaleRenderer is not wrapped in a FormProvider.');
      return null;
    }

    const {
      register,
      watch,
      formState: { errors },
    } = formContext;

    // Watch the current value to highlight the selected box
    const selectedValue = Number(watch(instanceId));

    return (
      <Card className="rounded-none shadow-none">
        <Q html={props.questionText} />
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {props.minLabel}
          </span>
          <div className="flex flex-1 gap-0.5">
            {Array.from({ length: count }, (_, i) => {
              const val = props.min + i;
              const isSelected = selectedValue === val;

              return (
                <label
                  key={val}
                  className={`flex h-8 flex-1 cursor-pointer items-center justify-center border text-xs font-medium transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-foreground hover:border-primary hover:bg-primary/5'
                  }`}
                >
                  <input
                    type="radio"
                    value={val}
                    className="sr-only" // Visually hidden radio button
                    {...register(instanceId, {
                      required: validation?.required ? 'Please select a rating' : false,
                      validate: (value) => {
                        const numVal = Number(value);
                        if (validation?.minRating && numVal < validation.minRating) {
                          return `Rating must be at least ${validation.minRating}`;
                        }
                        if (validation?.maxRating && numVal > validation.maxRating) {
                          return `Rating cannot exceed ${validation.maxRating}`;
                        }
                        return true;
                      },
                    })}
                  />
                  {val}
                </label>
              );
            })}
          </div>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {props.maxLabel}
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
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {props.minLabel}
        </span>
        <div className="flex flex-1 gap-0.5">
          {Array.from({ length: count }, (_, i) => (
            <div
              key={i}
              className="flex h-8 flex-1 items-center justify-center border border-border text-xs font-medium text-foreground transition-colors"
            >
              {props.min + i}
            </div>
          ))}
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {props.maxLabel}
        </span>
      </div>
    </Card>
  );
}

export function LinearScalePropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<LinearScaleProps, LinearScaleValidation>) {
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
          <label className={lbl}>Scale Start (Min)</label>
          <input
            type="number"
            value={props.min}
            onChange={(e) => u(instanceId, { min: Number(e.target.value) })}
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>Scale End (Max)</label>
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
          <label className={lbl}>Min Label</label>
          <input
            type="text"
            value={props.minLabel || ''}
            onChange={(e) => u(instanceId, { minLabel: e.target.value })}
            className={inp}
            placeholder="e.g., Strongly Disagree"
          />
        </div>
        <div>
          <label className={lbl}>Max Label</label>
          <input
            type="text"
            value={props.maxLabel || ''}
            onChange={(e) => u(instanceId, { maxLabel: e.target.value })}
            className={inp}
            placeholder="e.g., Strongly Agree"
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
        <label className={lbl}>Minimum Rating Allowed</label>
        <input
          type="number"
          min={props.min}
          max={props.max}
          value={validation?.minRating ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              minRating: val === '' ? undefined : parseInt(val, 10),
            });
          }}
          className={inp}
          placeholder={`e.g., ${props.min}`}
        />
      </div>

      <div>
        <label className={lbl}>Maximum Rating Allowed</label>
        <input
          type="number"
          min={props.min}
          max={props.max}
          value={validation?.maxRating ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              maxRating: val === '' ? undefined : parseInt(val, 10),
            });
          }}
          className={inp}
          placeholder={`e.g., ${props.max}`}
        />
      </div>
    </div>
  );
}