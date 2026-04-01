// src/form/components/CheckboxRenderer.tsx
import { useFormStore } from '../store/formStore';
import type { RendererProps } from './base';
import type {
  CheckboxProps,
  CheckboxOption,
  CheckboxValidation,
} from './checkbox';
import { ComponentPropTitle } from './ComponentRender.Helper';
import {
  RichTextEditor,
  sharedProseClasses,
} from '@/components/RichTextEditor';

import { Card as HeroCard } from '@heroui/react';
import { Checkbox as ShadCheckbox } from '@/components/ui/checkbox';
import { Checkbox as HeroCheckbox } from '@heroui/react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

import { FormThemeProvider } from '@/form/theme/FormThemeProvider';

export const CheckboxComponentRenderer = ({
  // metadata,
  props,
  instanceId,
}: RendererProps<CheckboxProps, CheckboxValidation>) => {
  const isHorizontal = props.layout === 'horizontal';

  return (
    <FormThemeProvider>
      <HeroCard className="w-full">
        {/* <CardHeader>
        <CardTitle>{metadata.label}</CardTitle>
        {metadata.description && (
          <CardDescription>{metadata.description}</CardDescription>
        )}
      </CardHeader> */}

        <HeroCard.Content className="text-foreground">
          {props.questionText && (
            <div
              className={sharedProseClasses}
              dangerouslySetInnerHTML={{ __html: props.questionText }}
            />
          )}

          <div
            className={`flex ${
              isHorizontal ? 'flex-row flex-wrap gap-6' : 'flex-col space-y-3'
            }`}
          >
            {/* {(props.options || []).map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <ShadCheckbox
                  id={`cb-${option.id}`}
                  name={instanceId}
                  value={option.value}
                  defaultChecked={(props.defaultValues || []).includes(
                    option.value
                  )}
                />
                <Label
                  htmlFor={`cb-${option.id}`}
                  className="cursor-pointer font-normal"
                >
                  {option.label}
                </Label>
              </div>
            ))} */}

            {(props.options || []).map((option) => (
              <HeroCheckbox
                key={option.id}
                value={option.value}
                name={instanceId}
                // classNames={{
                //   label: "text-foreground font-normal",
                // }}
              >
                <HeroCheckbox.Control className="border-2 border-border">
                  <HeroCheckbox.Indicator />
                </HeroCheckbox.Control>
                <HeroCheckbox.Content>
                  <Label>{option.label}</Label>
                </HeroCheckbox.Content>
              </HeroCheckbox>
            ))}
          </div>
        </HeroCard.Content>
      </HeroCard>
    </FormThemeProvider>
  );
};

export const CheckboxComponentPropsRenderer = ({
  props,
  instanceId,
}: RendererProps<CheckboxProps, CheckboxValidation>) => {
  const updateComponentProps = useFormStore((s) => s.updateComponentProps);

  const handleAddOption = () => {
    const newOption: CheckboxOption = {
      id: crypto.randomUUID(),
      label: `Option ${(props.options?.length || 0) + 1}`,
      value: `option-${(props.options?.length || 0) + 1}`,
    };
    updateComponentProps(instanceId, {
      options: [...(props.options || []), newOption],
    });
  };

  const handleUpdateOption = (
    id: string,
    key: keyof CheckboxOption,
    val: string
  ) => {
    const updated = (props.options || []).map((opt) =>
      opt.id === id ? { ...opt, [key]: val } : opt
    );
    updateComponentProps(instanceId, { options: updated });
  };

  const handleRemoveOption = (id: string) => {
    const updated = (props.options || []).filter((opt) => opt.id !== id);
    const removedValue = (props.options || []).find(
      (opt) => opt.id === id
    )?.value;
    const newDefaults = (props.defaultValues || []).filter(
      (v) => v !== removedValue
    );

    updateComponentProps(instanceId, {
      options: updated,
      defaultValues: newDefaults,
    });
  };

  const toggleDefaultValue = (value: string) => {
    const current = props.defaultValues || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateComponentProps(instanceId, { defaultValues: updated });
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <ComponentPropTitle title="Question Text" />
        <RichTextEditor
          value={props.questionText || ''}
          onChange={(html) =>
            updateComponentProps(instanceId, { questionText: html })
          }
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <ComponentPropTitle title="Checkboxes" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddOption}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Option
          </Button>
        </div>

        <div className="space-y-2">
          {(props.options || []).map((option) => (
            <div key={option.id} className="flex items-center gap-2">
              {/* Checkbox to toggle if this option is selected by default */}
              <ShadCheckbox
                checked={(props.defaultValues || []).includes(option.value)}
                onCheckedChange={() => toggleDefaultValue(option.value)}
                title="Set as default selected"
              />
              <Input
                placeholder="Label"
                value={option.label}
                onChange={(e) =>
                  handleUpdateOption(option.id, 'label', e.target.value)
                }
                className="flex-1"
              />
              <Input
                placeholder="Value"
                value={option.value}
                onChange={(e) =>
                  handleUpdateOption(option.id, 'value', e.target.value)
                }
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleRemoveOption(option.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {(!props.options || props.options.length === 0) && (
            <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
              No choices added.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <ComponentPropTitle title="Layout" />
        <Select
          value={props.layout || 'vertical'}
          onValueChange={(val: 'vertical' | 'horizontal') =>
            updateComponentProps(instanceId, { layout: val })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select layout..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vertical">Vertical</SelectItem>
            <SelectItem value="horizontal">Horizontal</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
