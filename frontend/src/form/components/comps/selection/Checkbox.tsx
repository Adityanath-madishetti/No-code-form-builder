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
import { useFormMode } from '@/form/context/FormModeContext';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface CheckboxOption {
  id: string;
  value: string;
}

export interface CheckboxProps extends BaseComponentProps {
  questionText?: string;
  options: CheckboxOption[];
  defaultValues?: string[];
  layout?: 'vertical' | 'horizontal';
  shuffleOptions: boolean;
}

export interface CheckboxValidation extends BasicValidation {
  minSelected?: number;
  maxSelected?: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createCheckboxComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<CheckboxProps>
): FormComponent<'Checkbox', CheckboxProps, CheckboxValidation> => {
  return createComponent(
    ComponentIDs.Checkbox,
    instanceId,
    metadata,
    {
      questionText: 'Select all that apply',
      layout: 'vertical',
      defaultValues: [],
      options: [
        { id: crypto.randomUUID(), value: 'Option 1' },
        { id: crypto.randomUUID(), value: 'Option 2' },
      ],
      hiddenByDefault: false,
      shuffleOptions: false,
      ...props,
    },
    { required: false } as CheckboxValidation
  );
};

export function CheckboxComponentRenderer({
  props,
  instanceId,
  validation,
}: RendererProps<CheckboxProps, CheckboxValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();
  const isHorizontal = props.layout === 'horizontal';

  // Lazy initialization: Shuffle exactly once on mount, bypasses useEffect/purity issues
  const [shuffledOptions] = useState(() => {
    const opts = props.options || [];
    if (props.shuffleOptions) {
      return [...opts].sort(() => Math.random() - 0.5);
    }
    return opts;
  });

  const layoutClasses = isHorizontal
    ? 'flex flex-row flex-wrap gap-4'
    : 'flex flex-col gap-2';

  // --- View Mode (Live Form with Validation) ---
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
            defaultValue={props.defaultValues || []}
            rules={{
              required: validation?.required
                ? 'Please select at least one option'
                : false,
              validate: (value) => {
                // Ensure value is an array before checking length
                const selectedValues = Array.isArray(value) ? value : [];
                const selectedCount = selectedValues.length;

                if (
                  validation?.minSelected &&
                  selectedCount < validation.minSelected
                ) {
                  return `Please select at least ${validation.minSelected} option(s)`;
                }
                if (
                  validation?.maxSelected &&
                  selectedCount > validation.maxSelected
                ) {
                  return `Please select no more than ${validation.maxSelected} option(s)`;
                }
                return true;
              },
            }}
            render={({ field }) => {
              // Safely handle current selected array
              const currentValues = Array.isArray(field.value)
                ? field.value
                : [];

              return (
                <div className={layoutClasses}>
                  {shuffledOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`${instanceId}-${option.id}`}
                        checked={currentValues.includes(option.value)}
                        onCheckedChange={(checked) => {
                          // Manually manage the array of selected values for RHF
                          return checked
                            ? field.onChange([...currentValues, option.value])
                            : field.onChange(
                                currentValues.filter(
                                  (value) => value !== option.value
                                )
                              );
                        }}
                      />
                      <Label
                        htmlFor={`${instanceId}-${option.id}`}
                        className="cursor-pointer text-sm font-normal"
                      >
                        {option.value}
                      </Label>
                    </div>
                  ))}
                </div>
              );
            }}
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

  // --- Builder Mode (Static/Preview) ---
  return (
    <Card>
      <CardContent className="space-y-3">
        <Label className="block text-base font-semibold">
          {props.questionText}
        </Label>
        <div className={layoutClasses}>
          {(props.options || []).map((option) => (
            <div
              key={option.id}
              className="flex items-center space-x-2 opacity-70"
            >
              <Checkbox
                id={`builder-${instanceId}-${option.id}`}
                checked={(props.defaultValues || []).includes(option.value)}
                disabled
              />
              <Label
                htmlFor={`builder-${instanceId}-${option.id}`}
                className="cursor-pointer text-sm font-normal"
              >
                {option.value}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CheckboxComponentPropsRenderer({
  props,
  instanceId,
  validation,
}: RendererProps<CheckboxProps, CheckboxValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  const uv = useFormStore((s) => s.updateComponentValidation);

  const handleAddOption = () => {
    const newOption: CheckboxOption = {
      id: crypto.randomUUID(),
      value: `Option ${(props.options?.length || 0) + 1}`,
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

      {/* Validation Rules */}
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

      <div>
        <label className={lbl}>Minimum Options Selected</label>
        <input
          type="number"
          min="0"
          value={validation?.minSelected ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              minSelected: val === '' ? undefined : parseInt(val, 10),
            });
          }}
          className={inp}
          placeholder="e.g., 1"
        />
      </div>

      <div>
        <label className={lbl}>Maximum Options Selected</label>
        <input
          type="number"
          min="0"
          value={validation?.maxSelected ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            uv(instanceId, {
              maxSelected: val === '' ? undefined : parseInt(val, 10),
            });
          }}
          className={inp}
          placeholder="e.g., 3"
        />
      </div>
    </div>
  );
}
