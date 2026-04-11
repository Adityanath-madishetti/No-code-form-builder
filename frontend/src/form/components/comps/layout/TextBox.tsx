// src/form/components/textBox.ts
import type {
  BaseComponentProps,
  BasicValidation,
  ComponentMetadata,
} from '../../base';

import { ComponentIDs, createComponent } from '../../base';
import type { FormComponent } from '../../base';

import type { RendererProps } from '../../base';
import { useFormStore } from '@/form/store/form.store';
import { ComponentPropTitle } from '../../ComponentRender.Helper';
import {
  RichTextEditor,
  sharedProseClasses,
} from '@/components/RichTextEditor';

import { nanoid } from 'nanoid';
import { Card, CardContent } from '@/components/ui/card';

export interface TextBoxProps extends BaseComponentProps {
  text: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createTextBoxComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<TextBoxProps>
): FormComponent<'Textbox', TextBoxProps, BasicValidation> => {
  metadata.label = `${metadata.label} ${nanoid(12)}`;
  return createComponent(
    ComponentIDs.TextBox,
    instanceId,
    metadata,
    {
      text: '',
      hiddenByDefault: false,
      ...props,
    },
    { required: false } as BasicValidation
  );
};
export type TextBoxComponent = ReturnType<typeof createTextBoxComponent>;

export const TextBoxComponentRenderer = ({
  props,
}: RendererProps<TextBoxProps, BasicValidation>) => {
  return (
    <Card>
      <CardContent className="">
        <div
          className={sharedProseClasses}
          dangerouslySetInnerHTML={{ __html: props.text }}
        />
      </CardContent>
    </Card>
  );
};

export const TextBoxComponentPropsRenderer = ({
  props,
  instanceId,
}: RendererProps<TextBoxProps, BasicValidation>) => {
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
