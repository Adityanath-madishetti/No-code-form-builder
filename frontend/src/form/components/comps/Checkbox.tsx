import { useFormStore } from '@/form/store/formStore';
import type {
  BasicValidation,
  ComponentMetadata,
  FormComponent,
  RendererProps,
} from '../base';
import { ComponentIDs } from '../base';

import type { BaseComponentProps } from '../base';
import { inp, lbl, Card, Q } from '../ComponentRender.Helper';
import { Plus, Trash2 } from 'lucide-react';

export interface CheckboxOption {
  id: string;
  label: string;
  value: string;
}

export interface CheckboxProps extends BaseComponentProps {
  questionText?: string;
  options: CheckboxOption[];
  defaultValues?: string[];
  layout?: 'vertical' | 'horizontal';
}

// export interface CheckboxValidation {
//   required: boolean;
// }

// eslint-disable-next-line react-refresh/only-export-components
export const createCheckboxComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props: CheckboxProps,
  validation: BasicValidation
): FormComponent<'Checkbox', CheckboxProps, BasicValidation> => ({
  id: ComponentIDs.Checkbox,
  instanceId,
  metadata,
  children: [],
  props,
  validation,
});

export function CheckboxComponentRenderer({
  props,
  instanceId,
}: RendererProps<CheckboxProps, BasicValidation>) {
  const isHorizontal = props.layout === 'horizontal';
  return (
    <Card>
      <Q html={props.questionText} />
      <div
        className={`flex ${
          isHorizontal ? 'flex-row flex-wrap gap-4' : 'flex-col gap-2'
        }`}
      >
        {(props.options || []).map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
          >
            <input
              type="checkbox"
              name={instanceId}
              value={option.value}
              defaultChecked={(props.defaultValues || []).includes(
                option.value
              )}
              className="accent-primary"
            />
            {option.label}
          </label>
        ))}
      </div>
    </Card>
  );
}

export function CheckboxComponentPropsRenderer({
  props,
  instanceId,
}: RendererProps<CheckboxProps, BasicValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);

  const handleAddOption = () => {
    const newOption: CheckboxOption = {
      id: crypto.randomUUID(),
      label: `Option ${(props.options?.length || 0) + 1}`,
      value: `option-${(props.options?.length || 0) + 1}`,
    };
    u(instanceId, { options: [...(props.options || []), newOption] });
  };

  const handleUpdateOption = (
    id: string,
    key: keyof CheckboxOption,
    val: string
  ) => {
    const updated = (props.options || []).map((opt) =>
      opt.id === id ? { ...opt, [key]: val } : opt
    );
    u(instanceId, { options: updated });
  };

  const handleRemoveOption = (id: string) => {
    const updated = (props.options || []).filter((opt) => opt.id !== id);
    const removedValue = (props.options || []).find(
      (opt) => opt.id === id
    )?.value;
    const newDefaults = (props.defaultValues || []).filter(
      (v) => v !== removedValue
    );
    u(instanceId, { options: updated, defaultValues: newDefaults });
  };

  const toggleDefaultValue = (value: string) => {
    const current = props.defaultValues || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    u(instanceId, { defaultValues: updated });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Question Text</label>
        <input
          type="text"
          value={props.questionText || ''}
          onChange={(e) => u(instanceId, { questionText: e.target.value })}
          className={inp}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={lbl}>Options</label>
          <button
            type="button"
            onClick={handleAddOption}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {(props.options || []).map((option) => (
          <div key={option.id} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={(props.defaultValues || []).includes(option.value)}
              onChange={() => toggleDefaultValue(option.value)}
              className="accent-primary"
              title="Default selected"
            />
            <input
              placeholder="Label"
              value={option.label}
              onChange={(e) =>
                handleUpdateOption(option.id, 'label', e.target.value)
              }
              className={inp + ' flex-1'}
            />
            <input
              placeholder="Value"
              value={option.value}
              onChange={(e) =>
                handleUpdateOption(option.id, 'value', e.target.value)
              }
              className={inp + ' flex-1'}
            />
            <button
              type="button"
              onClick={() => handleRemoveOption(option.id)}
              className="p-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {(!props.options || props.options.length === 0) && (
          <div className="border border-dashed border-border/40 p-3 text-center text-xs text-muted-foreground/50">
            No options added.
          </div>
        )}
      </div>

      <div>
        <label className={lbl}>Layout</label>
        <select
          value={props.layout || 'vertical'}
          onChange={(e) => u(instanceId, { layout: e.target.value })}
          className={inp}
        >
          <option value="vertical">Vertical</option>
          <option value="horizontal">Horizontal</option>
        </select>
      </div>
    </div>
  );
}
