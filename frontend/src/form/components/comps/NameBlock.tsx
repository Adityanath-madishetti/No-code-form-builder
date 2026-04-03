// src/form/components/textBox.ts
import type { ComponentMetadata } from '../base';
import { ComponentIDs } from '../base';
import type { FormComponent } from '../base';

import type { RendererProps } from '../base';
import { useFormStore } from '@/form/store/formStore';
import { ComponentPropTitle } from '../ComponentRender.Helper';
import {
  RichTextEditor,
  sharedProseClasses,
} from '@/components/RichTextEditor';

import { FormThemeProvider } from '@/form/theme/FormThemeProvider';

export interface TextBoxProps {
  text: string;
  hidden: boolean;
}

export interface TextBoxValidation {
  proxy: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createTextBoxComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props: TextBoxProps,
  validation: TextBoxValidation
): FormComponent<'Textbox', TextBoxProps, TextBoxValidation> => ({
  id: ComponentIDs.TextBox,
  instanceId,
  metadata,
  children: [],
  props,
  validation,
});
export type TextBoxComponent = ReturnType<typeof createTextBoxComponent>;

export const TextBoxComponentRenderer = ({
  props,
}: RendererProps<TextBoxProps, TextBoxValidation>) => {
  return (
    <FormThemeProvider>
      <div className="w-full border border-border">
        <div className="p-4 text-foreground">
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
