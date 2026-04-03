import { useFormStore } from '@/form/store/formStore';
import type {
  BasicValidation,
  ComponentMetadata,
  RendererProps,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import type { BaseComponentProps, NoValidation } from '../base';
import { inp, lbl, Card, Q } from '../ComponentRender.Helper';

export interface DateProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  includeTime: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createDateComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<DateProps>
) =>
  createComponent(
    ComponentIDs.Date,
    instanceId,
    metadata,
    {
      questionText: '<p>Select a date</p>',
      placeholder: 'YYYY-MM-DD',
      includeTime: false,
      hidden: false,
      ...props,
    },
    { required: false } as BasicValidation
  );

export function DateRenderer({
  props,
}: RendererProps<DateProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <input
        type={props.includeTime ? 'datetime-local' : 'date'}
        className={inp}
      />
    </Card>
  );
}

export function DatePropsRenderer({
  instanceId,
  props,
}: RendererProps<DateProps, NoValidation>) {
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
          checked={props.includeTime}
          onChange={(e) => u(instanceId, { includeTime: e.target.checked })}
          className="accent-primary"
        />
        Include Time
      </label>
    </div>
  );
}
