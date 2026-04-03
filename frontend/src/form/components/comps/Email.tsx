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

export interface EmailProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createEmailComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<EmailProps>
) =>
  createComponent(
    ComponentIDs.Email,
    instanceId,
    metadata,
    {
      questionText: '<p>Email address</p>',
      placeholder: 'user@example.com',
      defaultValue: '',
      hidden: false,
      ...props,
    },
    {
      required: false,
      pattern: '^[^@]+@[^@]+\\.[^@]+$',
    } as TextValidation
  );

export function EmailRenderer({
  instanceId,
  props,
}: RendererProps<EmailProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <input
        type="email"
        value={props.defaultValue}
        onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
        placeholder={props.placeholder || 'user@example.com'}
        className={inp}
      />
    </Card>
  );
}

export function EmailPropsRenderer({
  instanceId,
  props,
}: RendererProps<EmailProps, NoValidation>) {
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
