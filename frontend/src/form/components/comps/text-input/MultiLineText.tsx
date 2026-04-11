import type {
  BaseComponentProps,
  ComponentMetadata,
  TextValidation,
} from '../../base';

import { ComponentIDs, createComponent } from '../../base';

import type { RendererProps } from '../../base';
import { useFormStore } from '@/form/store/form.store';

import { inp, lbl } from '../../ComponentRender.Helper';
import { nanoid } from 'nanoid';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFormMode } from '@/form/context/FormModeContext';
import { useFormContext } from 'react-hook-form';

export interface MultiLineInputProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
  rows: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createMultiLineInputComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<MultiLineInputProps>
) => {
  metadata.label = `${metadata.label} ${nanoid(12)}`;
  return createComponent(
    ComponentIDs.MultiLineInput,
    instanceId,
    metadata,
    {
      questionText: 'Enter your response',
      placeholder: '',
      defaultValue: '',
      rows: 4,
      hiddenByDefault: false,
      ...props,
    },
    { required: false, minLength: 0 } as TextValidation
  );
};

export function MultiLineInputRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<MultiLineInputProps, TextValidation>) {
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
          <Label htmlFor={instanceId} className="block text-base font-semibold">
            {props.questionText}
          </Label>
          <Textarea
            id={instanceId}
            placeholder={props.placeholder || 'Type your answer...'}
            defaultValue={props.defaultValue}
            className="resize-y"
            {...register(instanceId, {
              required: validation?.required ? 'This field is required' : false,
              minLength: validation?.minLength
                ? {
                    value: validation.minLength,
                    message: `Minimum ${validation.minLength} characters`,
                  }
                : undefined,
              maxLength: validation?.maxLength
                ? {
                    value: validation.maxLength,
                    message: `Maximum ${validation.maxLength} characters`,
                  }
                : undefined,
              pattern: validation?.pattern
                ? {
                    value: new RegExp(validation.pattern),
                    message: 'Invalid format',
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
        <Label className="block text-base font-semibold">
          {props.questionText}
        </Label>
        <Textarea
          readOnly
          defaultValue={props.defaultValue}
          placeholder={props.placeholder || 'Type your answer...'}
          className="resize-y opacity-70"
          disabled
        />
      </CardContent>
    </Card>
  );
}

export function MultiLineInputPropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<MultiLineInputProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  const uv = useFormStore((s) => s.updateComponentValidation);
  return (
    <div className="space-y-4">
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
          type="text"
          value={props.defaultValue || ''}
          onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
          className={inp}
        />
      </div>
      {/* <div>
        <label className={lbl}>Rows</label>
        <input
          type="number"
          min={1}
          max={20}
          value={props.rows || 4}
          onChange={(e) => u(instanceId, { rows: Number(e.target.value) })}
          className={inp}
        />
      </div> */}
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
    </div>
  );
}
