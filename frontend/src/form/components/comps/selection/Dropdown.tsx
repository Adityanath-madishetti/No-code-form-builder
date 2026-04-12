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

import { useFormContext } from 'react-hook-form';
import { useFormMode } from '@/form/context/FormModeContext';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Controller } from 'react-hook-form';

export interface DropdownOption {
  id: string;
  value: string;
}

export interface DropdownProps extends BaseComponentProps {
  questionText?: string;
  placeholder?: string;
  options: DropdownOption[];
  defaultValue?: string;
  shuffleOptions: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createDropdownComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<DropdownProps>
): FormComponent<'Dropdown', DropdownProps, BasicValidation> => {
  return createComponent(
    ComponentIDs.Dropdown,
    instanceId,
    metadata,
    {
      questionText: 'Please select an option from the list',
      placeholder: 'Select an option',
      options: [
        { id: crypto.randomUUID(), value: 'Option 1' },
        { id: crypto.randomUUID(), value: 'Option 2' },
      ],
      hiddenByDefault: false,
      shuffleOptions: false,
      ...props,
    },
    { required: false } as BasicValidation
  );
};

export function DropdownComponentRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<DropdownProps, BasicValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();

  const [shuffledOptions] = useState(() => {
    const opts = props.options || [];
    if (props.shuffleOptions) {
      return [...opts].sort(() => Math.random() - 0.5);
    }
    return opts;
  });

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
              <Select
                onValueChange={field.onChange}
                // Radix Select uses `undefined` to trigger the placeholder when no value is selected
                value={field.value || undefined}
                defaultValue={props.defaultValue || undefined}
              >
                <SelectTrigger className="mb-0 w-full">
                  <SelectValue
                    placeholder={props.placeholder || 'Select an option...'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {shuffledOptions.map((option) => (
                    <SelectItem key={option.id} value={option.value}>
                      {option.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
        <Label className="block text-base font-semibold">
          {props.questionText}
        </Label>
        <Select disabled defaultValue={props.defaultValue || undefined}>
          <SelectTrigger className="w-full opacity-70">
            <SelectValue
              placeholder={props.placeholder || 'Select an option...'}
            />
          </SelectTrigger>
          <SelectContent>
            {(props.options || []).map((option) => (
              <SelectItem key={option.id} value={option.value}>
                {option.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

export function DropdownComponentPropsRenderer({
  props,
  instanceId,
  validation,
}: RendererProps<DropdownProps, BasicValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  const uv = useFormStore((s) => s.updateComponentValidation);

  const handleAddOption = () => {
    const newOption: DropdownOption = {
      id: crypto.randomUUID(),
      value: `Option ${(props.options?.length || 0) + 1}`,
    };
    u(instanceId, { options: [...(props.options || []), newOption] });
  };

  const handleUpdateOption = (
    id: string,
    key: keyof DropdownOption,
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
      <div>
        <label className={lbl}>Placeholder</label>
        <input
          type="text"
          value={props.placeholder || ''}
          onChange={(e) => u(instanceId, { placeholder: e.target.value })}
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
