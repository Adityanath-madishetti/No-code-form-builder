// src/form/components/DropdownRenderer.tsx
import { useFormStore } from '../store/formStore';
import type { RendererProps } from './base';
import type {
  DropdownProps,
  DropdownOption,
  DropdownValidation,
} from './dropdown';
import { ComponentPropTitle } from './ComponentRender.Helper';
import { RichTextEditor } from '@/components/RichTextEditor';

import { Card as HeroCard } from '@heroui/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select as ShadSelect,
  SelectContent as ShadSelectContent,
  SelectItem as ShadSelectItem,
  SelectTrigger as ShadSelectTrigger,
  SelectValue as ShadSelectValue,
} from '@/components/ui/select';
import { Select as HeroSelect, ListBox as HeroListBox } from '@heroui/react';
import { Plus, Trash2 } from 'lucide-react';

import { FormThemeProvider } from '@/form/theme/FormThemeProvider';

export const DropdownComponentRenderer = ({
  // metadata,
  props,
}: RendererProps<DropdownProps, DropdownValidation>) => {
  return (
    <FormThemeProvider>
      <HeroCard className="w-full">
        {/* <HeroCard.Header>
        <HeroCard.Title>{metadata.label}</HeroCard.Title>
        {metadata.description && (
          <HeroCard.Description>{metadata.description}</HeroCard.Description>
        )}
      </HeroCard.Header> */}

        <HeroCard.Content className="text-foreground">
          {props.questionText && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none break-words"
              dangerouslySetInnerHTML={{ __html: props.questionText }}
            />
          )}

          <HeroSelect
            defaultValue={props.defaultValue}
            placeholder={props.placeholder || 'Select an option...'}
            fullWidth
          >
            <HeroSelect.Trigger className="w-full">
              <HeroSelect.Value />
            </HeroSelect.Trigger>
            <HeroSelect.Popover>
              <HeroListBox>
                {(props.options || []).map((option) => (
                  <HeroListBox.Item key={option.id} textValue={option.value}>
                    {option.label}
                    <HeroListBox.ItemIndicator />
                  </HeroListBox.Item>
                ))}
              </HeroListBox>
            </HeroSelect.Popover>
          </HeroSelect>
        </HeroCard.Content>
      </HeroCard>
    </FormThemeProvider>
  );
};

export const DropdownComponentPropsRenderer = ({
  props,
  instanceId,
}: RendererProps<DropdownProps, DropdownValidation>) => {
  const updateComponentProps = useFormStore((s) => s.updateComponentProps);

  const handleAddOption = () => {
    const newOption: DropdownOption = {
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
    key: keyof DropdownOption,
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
      <div className="space-y-2">
        <ComponentPropTitle title="Question Text" />
        <RichTextEditor
          value={props.questionText || ''}
          onChange={(html) =>
            updateComponentProps(instanceId, { questionText: html })
          }
        />
      </div>

      <div className="space-y-2">
        <ComponentPropTitle title="Placeholder Text" />
        <Input
          value={props.placeholder || ''}
          onChange={(e) =>
            updateComponentProps(instanceId, { placeholder: e.target.value })
          }
          placeholder="Select an option..."
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <ComponentPropTitle title="Dropdown Options" />
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
        </div>
      </div>

      <div className="space-y-2">
        <ComponentPropTitle title="Default Value" />
        <ShadSelect
          value={props.defaultValue || 'none'}
          onValueChange={(val) =>
            updateComponentProps(instanceId, {
              defaultValue: val === 'none' ? undefined : val,
            })
          }
        >
          <ShadSelectTrigger>
            <ShadSelectValue placeholder="Select default..." />
          </ShadSelectTrigger>
          <ShadSelectContent>
            <ShadSelectItem value="none">None</ShadSelectItem>
            {(props.options || []).map((opt) => (
              <ShadSelectItem key={opt.id} value={opt.value}>
                {opt.label}
              </ShadSelectItem>
            ))}
          </ShadSelectContent>
        </ShadSelect>
      </div>
    </div>
  );
};
