// src/form/components/RadioRenderer.tsx
import { useFormStore } from '../store/formStore';
import type { RendererProps } from './base';
import type { RadioProps, RadioOption, RadioValidation } from './radio';
import { ComponentPropTitle } from './ComponentRender.Helper';
import {
  RichTextEditor,
  sharedProseClasses,
} from '@/components/RichTextEditor';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

import { FormThemeProvider } from '@/form/theme/FormThemeProvider';

export const RadioComponentRenderer = ({
  props,
  instanceId,
}: RendererProps<RadioProps, RadioValidation>) => {
  const isHorizontal = props.layout === 'horizontal';

  return (
    <FormThemeProvider>
      <div className="w-full border border-border bg-card shadow-sm pointer-events-auto">
        <div className="p-6 text-foreground space-y-4">
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
            {(props.options || []).map((option) => (
              <div key={option.id} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`radio-${instanceId}-${option.id}`}
                  name={instanceId}
                  value={option.value}
                  defaultChecked={props.defaultValue === option.value}
                  className="h-4 w-4 bg-background border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <Label
                  htmlFor={`radio-${instanceId}-${option.id}`}
                  className="font-normal cursor-pointer text-sm"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </FormThemeProvider>
  );
};

export const RadioComponentPropsRenderer = ({
  props,
  instanceId,
}: RendererProps<RadioProps, RadioValidation>) => {
  const updateComponentProps = useFormStore((s) => s.updateComponentProps);

  const handleAddOption = () => {
    const newOption: RadioOption = {
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
    key: keyof RadioOption,
    val: string
  ) => {
    const updated = (props.options || []).map((opt) =>
      opt.id === id ? { ...opt, [key]: val } : opt
    );
    updateComponentProps(instanceId, { options: updated });
  };

  const handleRemoveOption = (id: string) => {
    const updated = (props.options || []).filter((opt) => opt.id !== id);
    updateComponentProps(instanceId, { options: updated });
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Rich Text Question Input */}
      <div className="space-y-2">
        <ComponentPropTitle title="Question Text" />
        <RichTextEditor
          value={props.questionText || ''}
          onChange={(html) =>
            updateComponentProps(instanceId, { questionText: html })
          }
        />
      </div>

      {/* 2. Options List Manager */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <ComponentPropTitle title="Choices" />
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
              <Input
                placeholder="Label (Visible)"
                value={option.label}
                onChange={(e) =>
                  handleUpdateOption(option.id, 'label', e.target.value)
                }
                className="flex-1"
              />
              <Input
                placeholder="Value (Hidden)"
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
            <div className="border border-dashed p-4 text-center text-sm text-muted-foreground">
              No choices added.
            </div>
          )}
        </div>
      </div>

      {/* 3. Settings (Default Value & Layout) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <ComponentPropTitle title="Default Value" />
          <Select
            value={props.defaultValue || 'none'}
            onValueChange={(val) =>
              updateComponentProps(instanceId, {
                defaultValue: val === 'none' ? undefined : val,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select default..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {(props.options || []).map((opt) => (
                <SelectItem key={opt.id} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
    </div>
  );
};
