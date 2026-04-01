// src/form/components/InputRenderer.tsx
import type { RendererProps } from './base';
import type { InputProps, InputValidation } from './input';
import { useFormStore } from '../store/formStore';
import { Input as ShadInput } from '@/components/ui/input';
import { Checkbox as ShadCheckbox } from '@/components/ui/checkbox';
import { Input as HeroInput } from '@heroui/react';
import { Card as HeroCard } from '@heroui/react';
import { ComponentPropTitle } from './ComponentRender.Helper';
import {
  RichTextEditor,
  sharedProseClasses,
} from '@/components/RichTextEditor';

import { FormThemeProvider } from '@/form/theme/FormThemeProvider';

export const InputComponentRenderer = ({
  instanceId,
  props,
  validation,
}: RendererProps<InputProps, InputValidation>) => {
  return (
    <FormThemeProvider>
      <HeroCard className="w-full">
        <HeroCard.Content className="space-y-2 text-foreground">
          {props.questionText && (
            <div
              className={sharedProseClasses}
              dangerouslySetInnerHTML={{ __html: props.questionText }}
            />
          )}
          <HeroInput
            type="text"
            name={instanceId}
            placeholder={props.placeholder}
            defaultValue={props.defaultValue}
            className="w-full px-4 border-3 border-border"
            required={validation.required}
            minLength={validation.minLength}
            maxLength={validation.maxLength}
          />
        </HeroCard.Content>
      </HeroCard>
    </FormThemeProvider>
  );
};

export const InputComponentPropsRenderer = ({
  instanceId,
  props,
  validation,
}: RendererProps<InputProps, InputValidation>) => {
  const updateComponentProps = useFormStore((s) => s.updateComponentProps);
  const updateComponentValidation = useFormStore(
    (s) => s.updateComponentValidation
  );

  const toggleRequiredValidation = () => {
    updateComponentValidation(instanceId, { required: !validation?.required });
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
        <ComponentPropTitle title="Placeholder" />
        <ShadInput
          type="text"
          value={props.placeholder || ''}
          onChange={(e) =>
            updateComponentProps(instanceId, { placeholder: e.target.value })
          }
          placeholder="Enter placeholder text"
        />
      </div>
      <div className="space-y-2">
        <ComponentPropTitle title="Default Value" />
        <ShadInput
          type="text"
          value={props.defaultValue || ''}
          onChange={(e) =>
            updateComponentProps(instanceId, { defaultValue: e.target.value })
          }
          placeholder="Enter default value"
        />
      </div>

      <div className="space-y-2">
        <ComponentPropTitle title="Required" />
        <ShadCheckbox
          checked={validation.required}
          onCheckedChange={toggleRequiredValidation}
          title="Set as default selected"
        />
      </div>
    </div>
  );
};
