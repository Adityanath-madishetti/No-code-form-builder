import { useFormStore } from '@/form/store/form.store';
import type {
  BasicValidation,
  ComponentMetadata,
  FormComponent,
  RendererProps,
} from '../../base';
import { ComponentIDs, createComponent } from '../../base';

import type { BaseComponentProps } from '../../base';
import { inp, lbl } from '../../ComponentRender.Helper';
import { Plus, Trash2 } from 'lucide-react';

import { useFormContext, Controller } from 'react-hook-form';
import { useState } from 'react';
import { useFormMode } from '@/form/context/FormModeContext';
import { nanoid } from 'nanoid';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface RadioOption {
  id: string;
  value: string;
}

export interface RadioProps extends BaseComponentProps {
  questionText?: string;
  options: RadioOption[];
  defaultValue?: string;
  layout?: 'vertical' | 'horizontal';
  shuffleOptions: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createRadioComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<RadioProps>
): FormComponent<'Radio', RadioProps, BasicValidation> => {
  metadata.label = `${metadata.label} ${nanoid(12)}`;
  return createComponent(
    ComponentIDs.Radio,
    instanceId,
    metadata,
    {
      questionText: 'Select an option',
      layout: 'vertical',
      options: [
        { id: crypto.randomUUID(), value: 'Option 1' },
        { id: crypto.randomUUID(), value: 'Option 2' },
      ],
      hiddenByDefault: false,
      shuffleOptions: false,
      ...props,
    },
    {
      required: false,
    } as BasicValidation
  );
};

export function RadioComponentRenderer({
  props,
  instanceId,
  validation,
}: RendererProps<RadioProps, BasicValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();
  const isHorizontal = props.layout === 'horizontal';

  const [shuffledOptions] = useState(() => {
    const opts = props.options || [];
    if (props.shuffleOptions) {
      return [...opts].sort(() => Math.random() - 0.5);
    }
    return opts;
  });

  // Layout classes for the radio group container
  const layoutClasses = isHorizontal
    ? 'flex flex-row flex-wrap gap-4'
    : 'flex flex-col gap-2';

  if (formMode === 'view' && formContext) {
    const {
      control,
      formState: { errors },
    } = formContext;

    return (
      <Card>
        <CardContent className="space-y-3">
          <Label htmlFor={instanceId} className="block text-base font-semibold">
            {props.questionText}
          </Label>

          <Controller
            control={control}
            name={instanceId}
            defaultValue={props.defaultValue || ''}
            rules={{
              required: validation?.required ? 'This field is required' : false,
            }}
            render={({ field }) => (
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className={layoutClasses}
              >
                {shuffledOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={option.value}
                      id={`${instanceId}-${option.id}`}
                    />
                    <Label
                      htmlFor={`${instanceId}-${option.id}`}
                      className="cursor-pointer font-normal"
                    >
                      {option.value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          />

          {errors[instanceId] && (
            <p className="text-[0.8rem] font-medium text-destructive">
              {errors[instanceId]?.message as string}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <Label htmlFor={instanceId} className="block text-base font-semibold">
          {props.questionText}
        </Label>
        <RadioGroup
          // defaultValue={props.defaultValue}
          className={layoutClasses}
          disabled
        >
          {(props.options || []).map((option) => (
            <div
              key={option.id}
              className="flex items-center space-x-2 opacity-70"
            >
              <RadioGroupItem
                value={option.value}
                id={`builder-${instanceId}-${option.id}`}
              />
              <Label
                htmlFor={`builder-${instanceId}-${option.id}`}
                className="cursor-pointer font-normal"
              >
                {option.value}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

export function RadioComponentPropsRenderer({
  props,
  instanceId,
  validation,
}: RendererProps<RadioProps, BasicValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  const uv = useFormStore((s) => s.updateComponentValidation); // Added for validation updates

  const handleAddOption = () => {
    const newOption: RadioOption = {
      id: crypto.randomUUID(),
      // label: `Option ${(props.options?.length || 0) + 1}`,
      value: `Option ${(props.options?.length || 0) + 1}`,
    };
    u(instanceId, { options: [...(props.options || []), newOption] });
  };

  const handleUpdateOption = (
    id: string,
    key: keyof RadioOption,
    val: string
  ) => {
    const updated = (props.options || []).map((opt) =>
      opt.id === id ? { ...opt, [key]: val } : opt
    );
    u(instanceId, { options: updated });
  };

  const handleRemoveOption = (id: string) => {
    const updated = (props.options || []).filter((opt) => opt.id !== id);
    u(instanceId, { options: updated });
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
            {/* <input
              placeholder="Label"
              value={option.label}
              onChange={(e) =>
                handleUpdateOption(option.id, 'label', e.target.value)
              }
              className={inp + ' flex-1'}
            /> */}
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Default Value</label>
          <select
            value={props.defaultValue || 'none'}
            onChange={(e) =>
              u(instanceId, {
                defaultValue:
                  e.target.value === 'none' ? undefined : e.target.value,
              })
            }
            className={inp}
          >
            <option value="none">None</option>
            {(props.options || []).map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>Layout</label>
          <select
            value={props.layout || 'vertical'}
            onChange={(e) =>
              u(instanceId, {
                layout: e.target.value as 'vertical' | 'horizontal',
              })
            }
            className={inp}
          >
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
          </select>
        </div>
      </div>

      <div className="pt-1">
        <label className="flex items-center justify-between text-xs text-muted-foreground">
          Option Shuffling
          <input
            type="checkbox"
            checked={props.shuffleOptions}
            onChange={(e) =>
              u(instanceId, {
                shuffleOptions: e.target.checked,
              })
            }
          />
        </label>
      </div>

      {/* Added Required Validation Toggle */}
      <div className="pt-1">
        <label className="flex items-center justify-between text-xs text-muted-foreground">
          Required
          <input
            type="checkbox"
            checked={!!validation?.required}
            onChange={() => uv(instanceId, { required: !validation?.required })}
            className="accent-primary"
          />
        </label>
      </div>
    </div>
  );
}
