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
) => {
  metadata.label = `${metadata.label} ${nanoid(12)}`;
  return createComponent(
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
};

export function LinearScaleRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<LinearScaleProps, LinearScaleValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();
  const count = (props.max || 10) - (props.min || 1) + 1;

  if (formMode === 'view' && formContext) {
    const {
      register,
      watch,
      formState: { errors },
    } = formContext;

    const selectedValue = Number(watch(instanceId));

    return (
      <Card>
        <CardContent className="space-y-3">
          <Label htmlFor={instanceId} className="block text-base font-semibold">
            {props.questionText}
          </Label>
          <div className="flex items-center gap-2">
            {props.minLabel && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {props.minLabel}
              </span>
            )}
            <div className="flex flex-1 gap-1">
              {Array.from({ length: count }, (_, i) => {
                const val = props.min + i;
                const isSelected = selectedValue === val;

                return (
                  <label
                    key={val}
                    className={`flex h-9 flex-1 cursor-pointer items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow'
                        : 'border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <input
                      type="radio"
                      value={val}
                      className="sr-only" // Visually hidden radio button
                      {...register(instanceId, {
                        required: validation?.required
                          ? 'Please select a rating'
                          : false,
                        validate: (value) => {
                          const numVal = Number(value);
                          if (
                            validation?.minRating &&
                            numVal < validation.minRating
                          ) {
                            return `Rating must be at least ${validation.minRating}`;
                          }
                          if (
                            validation?.maxRating &&
                            numVal > validation.maxRating
                          ) {
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
            {props.maxLabel && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {props.maxLabel}
              </span>
            )}
          </div>
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
        <div className="flex items-center gap-2 opacity-70">
          {props.minLabel && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {props.minLabel}
            </span>
          )}
          <div className="flex flex-1 gap-1">
            {Array.from({ length: count }, (_, i) => (
              <div
                key={i}
                className="flex h-9 flex-1 items-center justify-center rounded-md border border-input bg-transparent text-sm font-medium text-foreground transition-colors"
              >
                {props.min + i}
              </div>
            ))}
          </div>
          {props.maxLabel && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {props.maxLabel}
            </span>
          )}
        </div>
      </CardContent>
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
