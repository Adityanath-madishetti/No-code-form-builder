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

export interface DecimalProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
  precision: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createDecimalComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<DecimalProps>
) =>
  createComponent(
    ComponentIDs.Decimal,
    instanceId,
    metadata,
    {
      questionText: '<p>Enter a decimal value</p>',
      placeholder: '0.00',
      defaultValue: '',
      precision: 2,
      hidden: false,
      ...props,
    },
    {
      required: false,
      min: undefined,
      max: undefined,
    } as NumericValidation
  );

export function DecimalRenderer({
  instanceId,
  props,
}: RendererProps<DecimalProps, NumericValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <input
        type="number"
        step={`0.${'0'.repeat((props.precision || 2) - 1)}1`}
        value={props.defaultValue}
        onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
        placeholder={props.placeholder || '0.00'}
        className={inp}
      />
    </Card>
  );
}

export function DecimalPropsRenderer({
  instanceId,
  props,
}: RendererProps<DecimalProps, NoValidation>) {
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
        <label className={lbl}>Decimal Precision</label>
        <input
          type="number"
          min={1}
          max={10}
          value={props.precision || 2}
          onChange={(e) => u(instanceId, { precision: Number(e.target.value) })}
          className={inp}
        />
      </div>
    </div>
  );
}
