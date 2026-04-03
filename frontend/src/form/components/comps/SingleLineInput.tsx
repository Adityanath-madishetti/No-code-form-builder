import type {
  BaseComponentProps,
  ComponentMetadata,
  TextValidation,
} from '../base';
import { ComponentIDs } from '../base';
import type { FormComponent } from '../base';

import type { RendererProps } from '../base';
import { useFormStore } from '@/form/store/formStore';

import { inp, lbl, Card, Q } from '../ComponentRender.Helper';

export interface SingleLineInputProps extends BaseComponentProps {
  type?: string;
  questionText?: string;
  placeholder?: string;
  defaultValue?: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createSingleLineInputComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props: SingleLineInputProps,
  validation: TextValidation
): FormComponent<'Input', SingleLineInputProps, TextValidation> => ({
  id: ComponentIDs.SingleLineInput,
  instanceId,
  metadata,
  children: [],
  props,
  validation,
});

export function SingleLineInputRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<SingleLineInputProps, TextValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <input
        type="text"
        name={instanceId}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        className={inp}
        required={validation.required}
        minLength={validation.minLength}
        maxLength={validation.maxLength}
      />
    </Card>
  );
}

export function SingleLineInputPropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<SingleLineInputProps, TextValidation>) {
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
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={validation.required}
          onChange={() => uv(instanceId, { required: !validation.required })}
          className="accent-primary"
        />
        Required
      </label>
    </div>
  );
}
