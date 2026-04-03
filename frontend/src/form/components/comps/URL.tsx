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
) =>
  createComponent(
    ComponentIDs.URL,
    instanceId,
    metadata,
    {
      questionText: '<p>Enter a URL</p>',
      placeholder: 'https://example.com',
      defaultValue: '',
      hidden: false,
      ...props,
    },
    { required: false, pattern: '^https?://' } as TextValidation
  );

export function URLRenderer({
  instanceId,
  props,
}: RendererProps<URLProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <input
        type="url"
        value={props.defaultValue}
        onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
        placeholder={props.placeholder || 'https://example.com'}
        className={inp}
      />
    </Card>
  );
}

export function URLPropsRenderer({
  instanceId,
  props,
}: RendererProps<URLProps, NoValidation>) {
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
