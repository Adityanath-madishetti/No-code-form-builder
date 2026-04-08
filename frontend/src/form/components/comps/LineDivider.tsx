// src/form/components/textBox.ts
import { nanoid } from 'nanoid';
import type {
  BaseComponentProps,
  ComponentMetadata,
  NoValidation,
  RendererProps,
} from '../base';
import { ComponentIDs, createComponent } from '../base';
import { inp, lbl } from '../ComponentRender.Helper';

import { useFormStore } from '@/form/store/form.store';

export interface LineDividerProps extends BaseComponentProps {
  style: 'solid' | 'dashed' | 'dotted';
  thickness: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createLineDividerComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<LineDividerProps>
) => {
  metadata.label = `${metadata.label} ${nanoid(12)}`;
  return createComponent(
    ComponentIDs.LineDivider,
    instanceId,
    metadata,
    { style: 'solid' as const, thickness: 1, hiddenByDefault: false, ...props },
    { proxy: 0 } as NoValidation
  );
};

// export type LineDividerComponent = ReturnType<
//   typeof createLineDividerComponent
// >;

export function LineDividerRenderer({
  props,
}: RendererProps<LineDividerProps, NoValidation>) {
  return (
    <div className="py-3">
      <hr
        className="border-border"
        style={{
          borderTopWidth: `${props.thickness}px`,
          borderStyle: props.style,
        }}
      />
    </div>
  );
}

export function LineDividerPropsRenderer({
  instanceId,
  props,
}: RendererProps<LineDividerProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Style</label>
        <select
          value={props.style}
          onChange={(e) => u(instanceId, { style: e.target.value })}
          className={inp}
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>
      <div>
        <label className={lbl}>Thickness ({props.thickness}px)</label>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={props.thickness}
          onChange={(e) => u(instanceId, { thickness: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>
    </div>
  );
}
