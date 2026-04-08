// src/form/components/textBox.ts
import type {
  BaseComponentProps,
  BasicValidation,
  ComponentMetadata,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import type { RendererProps } from '../base';
import { useFormStore } from '@/form/store/form.store';

import { inp, lbl, Card, Q } from '../ComponentRender.Helper';
import { Circle, Heart, Star } from 'lucide-react';
import { useFormMode } from '@/form/context/FormModeContext';
import { useFormContext } from 'react-hook-form';
import { useState } from 'react';
import { nanoid } from 'nanoid';

export interface RatingScaleProps extends BaseComponentProps {
  questionText: string;
  maxRating: number;
  icon: 'star' | 'heart' | 'circle';
}

export interface RatingScaleValidation extends BasicValidation {
  minRating?: number;
  maxRating?: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createRatingScaleComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<RatingScaleProps>
) => {
  metadata.label = `${metadata.label} ${nanoid(12)}`;
  return createComponent(
    ComponentIDs.RatingScale,
    instanceId,
    metadata,
    {
      questionText: 'Rate this',
      maxRating: 5,
      icon: 'star' as const,
      hiddenByDefault: false,
      ...props,
    },
    {
      required: false,
      minRating: undefined,
      maxRating: undefined,
    } as RatingScaleValidation
  );
};

export function RatingScaleRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<RatingScaleProps, RatingScaleValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();
  const [hoveredRating, setHoveredRating] = useState(0);

  const Icon =
    props.icon === 'heart' ? Heart : props.icon === 'circle' ? Circle : Star;

  // --- View Mode (Live Form with Validation) ---
  if (formMode === 'view' && formContext) {
    if (!formContext) {
      console.error('RatingScaleRenderer is not wrapped in a FormProvider.');
      return null;
    }

    const {
      register,
      watch,
      formState: { errors },
    } = formContext;

    // Watch the current value so we can fill the icons appropriately
    const selectedRating = Number(watch(instanceId)) || 0;

    return (
      <Card className="rounded-none shadow-none">
        <Q html={props.questionText} />
        <div className="flex gap-1" onMouseLeave={() => setHoveredRating(0)}>
          {Array.from({ length: props.maxRating }, (_, i) => {
            const ratingValue = i + 1;
            // Fill icon if it's below or equal to the hovered rating, OR the selected rating
            const isFilled = ratingValue <= (hoveredRating || selectedRating);

            return (
              <label
                key={i}
                className="cursor-pointer p-0.5"
                onMouseEnter={() => setHoveredRating(ratingValue)}
              >
                {/* Visually hidden radio button for accessible RHF integration */}
                <input
                  type="radio"
                  value={ratingValue}
                  className="sr-only"
                  {...register(instanceId, {
                    required: validation?.required
                      ? 'Please select a rating'
                      : false,
                    validate: (val) => {
                      const numVal = Number(val);
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
                <Icon
                  className={`h-6 w-6 transition-colors ${
                    isFilled
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/25'
                  }`}
                />
              </label>
            );
          })}
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
      <div className="flex gap-1">
        {Array.from({ length: props.maxRating }, (_, i) => (
          <div key={i} className="p-0.5 text-muted-foreground/25">
            <Icon className="h-6 w-6" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function RatingScalePropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<RatingScaleProps, RatingScaleValidation>) {
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
          <label className={lbl}>Max Rating (Stars)</label>
          <input
            type="number"
            min={1}
            max={20}
            value={props.maxRating}
            onChange={(e) =>
              u(instanceId, { maxRating: Number(e.target.value) })
            }
            className={inp}
          />
        </div>
        <div>
          <label className={lbl}>Icon Style</label>
          <select
            value={props.icon}
            onChange={(e) =>
              u(instanceId, {
                icon: e.target.value as RatingScaleProps['icon'],
              })
            }
            className={inp}
          >
            <option value="star">Star</option>
            <option value="heart">Heart</option>
            <option value="circle">Circle</option>
          </select>
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
          min="1"
          max={props.maxRating}
          value={validation?.minRating ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              minRating: val === '' ? undefined : parseInt(val, 10),
            });
          }}
          className={inp}
          placeholder="e.g., 1"
        />
      </div>

      <div>
        <label className={lbl}>Maximum Rating Allowed</label>
        <input
          type="number"
          min="1"
          max={props.maxRating}
          value={validation?.maxRating ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              maxRating: val === '' ? undefined : parseInt(val, 10),
            });
          }}
          className={inp}
          placeholder={`e.g., ${props.maxRating}`}
        />
      </div>
    </div>
  );
}
