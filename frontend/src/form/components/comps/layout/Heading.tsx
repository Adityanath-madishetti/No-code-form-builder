import { useFormStore } from '@/form/store/form.store';
import type { ComponentMetadata, RendererProps } from '../../base';
import { ComponentIDs, createComponent } from '../../base';

import type { BaseComponentProps, NoValidation } from '../../base';
import { inp, lbl } from '../../ComponentRender.Helper';
import type { JSX } from 'react';

export interface HeaderProps extends BaseComponentProps {
  text: string;
  level: 'h1' | 'h2' | 'h3' | 'h4';
}

// eslint-disable-next-line react-refresh/only-export-components
export const createHeaderComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<HeaderProps>
) => {
  return createComponent(
    ComponentIDs.Header,
    instanceId,
    metadata,
    { text: 'Heading', level: 'h2' as const, hiddenByDefault: false, ...props },
    { proxy: 0 } as NoValidation
  );
};

export function HeaderRenderer({
  instanceId,
  props,
}: RendererProps<HeaderProps, NoValidation>) {
  // Official shadcn/ui typography classes
  const typographyClasses: Record<string, string> = {
    h1: 'scroll-m-20 text-5xl font-extrabold tracking-tight lg:text-5xl',
    h2: 'scroll-m-20 text-4xl font-semibold  tracking-tight first:mt-0',
    h3: 'scroll-m-20 text-3xl font-semibold  tracking-tight',
    h4: 'scroll-m-20 text-2xl font-semibold  tracking-tight',
  };

  // Dynamically resolve the semantic tag, defaulting to h2
  const Tag = (
    props.level && typographyClasses[props.level] ? props.level : 'h2'
  ) as keyof JSX.IntrinsicElements;

  const className = typographyClasses[Tag as string];

  return (
    <div className="py-2">
      <Tag id={instanceId} className={className}>
        {props.text}
      </Tag>
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
