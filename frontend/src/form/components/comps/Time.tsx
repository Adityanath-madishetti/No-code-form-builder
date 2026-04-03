import { useFormStore } from '@/form/store/formStore';
import type {
  BasicValidation,
  ComponentMetadata,
  RendererProps,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import type { BaseComponentProps, NoValidation } from '../base';
import { inp, lbl, Card, Q } from '../ComponentRender.Helper';

export interface TimeProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  format24h: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createTimeComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<TimeProps>
) =>
  createComponent(
    ComponentIDs.Time,
    instanceId,
    metadata,
    {
      questionText: '<p>Select a time</p>',
      placeholder: 'HH:MM',
      format24h: false,
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

export function TimeRenderer({
  props,
}: RendererProps<TimeProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <input type="time" className={inp} />
    </Card>
  );
}

export function TimePropsRenderer({
  instanceId,
  props,
}: RendererProps<TimeProps, NoValidation>) {
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
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={props.format24h}
          onChange={(e) => u(instanceId, { format24h: e.target.checked })}
          className="accent-primary"
        />
        24-hour format
      </label>
    </div>
  );
}
