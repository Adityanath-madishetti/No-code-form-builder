import type {
  BaseComponentProps,
  ComponentMetadata,
  NoValidation,
  NumericValidation,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import type { RendererProps } from '../base';
import { useFormStore } from '@/form/store/formStore';

import { inp, lbl, Card, Q } from '../ComponentRender.Helper';

export interface NumberProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createNumberComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<NumberProps>
) =>
  createComponent(
    ComponentIDs.Number,
    instanceId,
    metadata,
    {
      questionText: '<p>Enter a number</p>',
      placeholder: '0',
      defaultValue: '',
      hidden: false,
      ...props,
    },
    {
      required: false,
      hidden: false,
      min: undefined,
      max: undefined,
    } as NumericValidation
  );

export function NumberRenderer({
  instanceId,
  props,
}: RendererProps<NumberProps, NumericValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <input
        type="number"
        value={props.defaultValue}
        onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
        placeholder={props.placeholder || '0'}
        className={inp}
      />
    </Card>
  );
}

export function NumberPropsRenderer({
  instanceId,
  props,
}: RendererProps<NumberProps, NoValidation>) {
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
    </div>
  );
}
