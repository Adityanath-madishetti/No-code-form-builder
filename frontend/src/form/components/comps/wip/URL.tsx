import { useFormStore } from '@/form/store/form.store';
import type {
  BaseComponentProps,
  ComponentMetadata,
  TextValidation,
  RendererProps,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import { inp, lbl } from '../ComponentRender.Helper';
import { useFormContext } from 'react-hook-form';
import { useFormMode } from '@/form/context/FormModeContext';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface URLProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createURLComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<URLProps>
) => {
  return createComponent(
    ComponentIDs.URL,
    instanceId,
    metadata,
    {
      questionText: 'Enter a URL',
      placeholder: 'https://example.com',
      defaultValue: '',
      hiddenByDefault: false,
      ...props,
    },
    {
      required: false,
      // Robust URL validation pattern
      pattern:
        '^https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)$',
    } as TextValidation
  );
};

export function URLRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<URLProps, TextValidation>) {
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
            type="url"
            placeholder={props.placeholder || 'https://example.com'}
            defaultValue={props.defaultValue}
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
                    message:
                      'Please enter a valid URL (e.g., https://example.com)',
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
          type="url"
          readOnly
          defaultValue={props.defaultValue}
          placeholder={props.placeholder || 'https://example.com'}
          disabled
        />
      </CardContent>
    </Card>
  );
}

export function URLPropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<URLProps, TextValidation>) {
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
            type="url"
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
        <label className={lbl}>Minimum Length</label>
        <input
          type="number"
          min="0"
          value={validation?.minLength ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              minLength: val === '' ? undefined : parseInt(val, 10),
            });
          }}
          className={inp}
          placeholder="e.g., 10"
        />
      </div>

      <div>
        <label className={lbl}>Maximum Length</label>
        <input
          type="number"
          min="0"
          value={validation?.maxLength ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              maxLength: val === '' ? undefined : parseInt(val, 10),
            });
          }}
          className={inp}
          placeholder="e.g., 255"
        />
      </div>

      {/* <div>
        <label className={lbl}>Regex Pattern</label>
        <input
          type="text"
          value={validation?.pattern ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              pattern: val === '' ? undefined : val,
            });
          }}
          className={inp}
          placeholder="e.g., ^https?:\/\/..."
          title="Enter a valid regular expression"
        />
      </div> */}
    </div>
  );
}
