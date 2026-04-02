// src/form/renderer/TextBoxComponentRenderer.tsx
import type { RendererProps } from './base';
import type { TextBoxProps, TextBoxValidation } from './textBox';
import { useFormStore } from '../store/formStore';
import { ComponentPropTitle } from './ComponentRender.Helper';
import {
  RichTextEditor,
  sharedProseClasses,
} from '@/components/RichTextEditor';

import { FormThemeProvider } from '@/form/theme/FormThemeProvider';

export const TextBoxComponentRenderer = ({
  props,
}: RendererProps<TextBoxProps, TextBoxValidation>) => {
  return (
    <FormThemeProvider>
      <div className="w-full border border-border bg-card shadow-sm">
        <div className="p-6 text-foreground">
          <div
            className={sharedProseClasses}
            dangerouslySetInnerHTML={{ __html: props.text }}
          />
        </div>
      </div>
    </FormThemeProvider>
  );
};

export const TextBoxComponentPropsRenderer = ({
  props,
  instanceId,
}: RendererProps<TextBoxProps, TextBoxValidation>) => {
  const updateComponentProps = useFormStore((s) => s.updateComponentProps);

  return (
    <div className="w-full space-y-2">
      <ComponentPropTitle title="Text Content" />
      <RichTextEditor
        value={props.text || ''}
        onChange={(newHTML) =>
          updateComponentProps(instanceId, { text: newHTML })
        }
      />
    </div>
  );
};
