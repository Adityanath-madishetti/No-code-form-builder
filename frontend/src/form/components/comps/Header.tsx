import { useFormStore } from '@/form/store/formStore';
import type { ComponentMetadata, RendererProps } from '../base';
import { ComponentIDs, createComponent } from '../base';

import type { BaseComponentProps, NoValidation } from '../base';
import { inp, lbl } from '../ComponentRender.Helper';

export interface HeaderProps extends BaseComponentProps {
  text: string;
  level: 'h1' | 'h2' | 'h3' | 'h4';
}

// eslint-disable-next-line react-refresh/only-export-components
export const createHeaderComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<HeaderProps>
) =>
  createComponent(
    ComponentIDs.Header,
    instanceId,
    metadata,
    { text: 'Heading', level: 'h2' as const, hidden: false, ...props },
    { proxy: 0 } as NoValidation
  );

export function HeaderRenderer({
  instanceId,
  props,
}: RendererProps<HeaderProps, NoValidation>) {
  // const u = useFormStore((s) => s.updateComponentProps);
  const sizes: Record<string, string> = {
    h1: 'text-3xl font-bold',
    h2: 'text-2xl font-bold',
    h3: 'text-xl font-semibold',
    h4: 'text-lg font-semibold',
  };
  return (
    <div className="py-1">
      <label
        htmlFor={instanceId}
        className={`w-full bg-transparent outline-none placeholder:text-muted-foreground/20 ${sizes[props.level] || sizes.h2}`}
      >
        {props.text}
      </label>
    </div>
  );
}

export function HeaderPropsRenderer({
  instanceId,
  props,
}: RendererProps<HeaderProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Text</label>
        <input
          type="text"
          value={props.text}
          onChange={(e) => u(instanceId, { text: e.target.value })}
          className={inp}
        />
      </div>
      <div>
        <label className={lbl}>Level</label>
        <select
          value={props.level}
          onChange={(e) => u(instanceId, { level: e.target.value })}
          className={inp}
        >
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>
      </div>
    </div>
  );
}
