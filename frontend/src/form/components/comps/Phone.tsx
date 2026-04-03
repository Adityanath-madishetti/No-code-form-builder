import type {
  BaseComponentProps,
  ComponentMetadata,
  NoValidation,
  TextValidation,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import type { RendererProps } from '../base';
import { useFormStore } from '@/form/store/formStore';

import { inp, lbl, Card, Q } from '../ComponentRender.Helper';

export interface PhoneProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
  countryCode: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createPhoneComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<PhoneProps>
) =>
  createComponent(
    ComponentIDs.Phone,
    instanceId,
    metadata,
    {
      questionText: '<p>Phone number</p>',
      placeholder: '+1 (555) 000-0000',
      defaultValue: '',
      countryCode: '+1',
      hidden: false,
      ...props,
    },
    { required: false } as TextValidation
  );

export function PhoneRenderer({
  instanceId,
  props,
}: RendererProps<PhoneProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex gap-2">
        <input
          value={props.countryCode}
          onChange={(e) => u(instanceId, { countryCode: e.target.value })}
          className={inp + ' w-16 text-center'}
        />
        <input
          type="tel"
          value={props.defaultValue}
          onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
          placeholder={props.placeholder || '(555) 000-0000'}
          className={inp + ' flex-1'}
        />
      </div>
    </Card>
  );
}

export function PhonePropsRenderer({
  instanceId,
  props,
}: RendererProps<PhoneProps, NoValidation>) {
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
        <label className={lbl}>Country Code</label>
        <input
          type="text"
          value={props.countryCode || ''}
          onChange={(e) => u(instanceId, { countryCode: e.target.value })}
          className={inp}
        />
      </div>
    </div>
  );
}
