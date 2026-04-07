import type {
  BaseComponentProps,
  ComponentMetadata,
  TextValidation,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import type { RendererProps } from '../base';
import { useFormStore } from '@/form/store/formStore';

import { inp, lbl, Card, Q } from '../ComponentRender.Helper';

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
) =>
  createComponent(
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

export function MultiLineInputRenderer({
  instanceId,
  props,
}: RendererProps<MultiLineInputProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <textarea
        value={props.defaultValue}
        onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
        placeholder={props.placeholder || 'Type your answer...'}
        rows={props.rows || 3}
        className={inp + ' resize-y'}
      />
    </Card>
  );
}

export function MultiLineInputPropsRenderer({
  instanceId,
  props,
}: RendererProps<MultiLineInputProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
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
      <div>
        <label className={lbl}>Rows</label>
        <input
          type="number"
          min={1}
          max={20}
          value={props.rows || 4}
          onChange={(e) => u(instanceId, { rows: Number(e.target.value) })}
          className={inp}
        />
      </div>
    </div>
  );
}
