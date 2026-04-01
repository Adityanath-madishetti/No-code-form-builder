// src/form/renderer/editRenderer/RenderForm.tsx
import { useFormStore, formSelectors } from '@/form/store/formStore';
import { Card as HeroCard } from '@heroui/react';
import { RenderPage } from './RenderPage';
import { ComponentPropTitle } from '@/form/components/ComponentRender.Helper';
import {
  RichTextEditor,
  sharedProseClasses,
} from '@/components/RichTextEditor';
import { Input as ShadInput } from '@/components/ui/input';

import {
  Select as ShadSelect,
  SelectContent as ShadSelectContent,
  SelectItem as ShadSelectItem,
  SelectTrigger as ShadSelectTrigger,
  SelectValue as ShadSelectValue,
} from '@/components/ui/select';

import {
  formFontNames,
  formThemeColors,
  formThemeModes,
  DEFAULT_FORM_THEME,
  type formFontName,
  type formThemeColor,
  type formThemeMode,
} from '@/form/theme/formTheme';

export const RenderForm = () => {
  const form = useFormStore(formSelectors.form);
  if (!form) {
    return (
      <HeroCard>
        <HeroCard.Content>
          <h3 className="text-lg font-semibold">No form loaded.</h3>
        </HeroCard.Content>
      </HeroCard>
    );
  }

  return (
    <form className="mx-auto flex h-auto min-h-screen w-full flex-col gap-6 bg-background p-6 text-foreground">
      {/* 1. The Isolated White Header Region */}
      <HeroCard className="bg-content1 mx-auto w-full max-w-3xl border-none shadow-sm">
        <HeroCard.Header className="flex flex-col items-start gap-3">
          <h2 className="text-6xl tracking-tight text-foreground">
            {form.name}
          </h2>
        </HeroCard.Header>
        <HeroCard.Content>
          {form.metadata.description && (
            <div
              className={sharedProseClasses}
              dangerouslySetInnerHTML={{ __html: form.metadata.description }}
            />
          )}
        </HeroCard.Content>
      </HeroCard>

      {/* 2. The Rendered Pages */}
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        {form.pages.map((page, index) => (
          <RenderPage key={page} pageId={page} index={index} />
        ))}
      </div>
    </form>
  );
};

// // TODO
// export const RenderFormOverview = () => {
//   const updateFormMetadata = useFormStore((s) => s.updateFormMetadata);
//   const formMetadata = useFormStore(formSelectors.formMetadata);
//   const formName = useFormStore((s) => s.form?.name);
//   const updateFormName = useFormStore((s) => s.updateFormName);

//   return (
//     <div className="w-full space-y-2">
//       <ComponentPropTitle title="Form Name" />
//       <ShadInput
//         value={formName}
//         onChange={(e) => updateFormName(e.target.value)}
//       />

//       <ComponentPropTitle title="Form Description" />
//       <RichTextEditor
//         value={formMetadata?.description || ''}
//         onChange={(newHTML) => updateFormMetadata({ description: newHTML })}
//       />
//     </div>
//   );
// };

export const RenderFormOverview = () => {
  const updateFormMetadata = useFormStore((s) => s.updateFormMetadata);
  const formMetadata = useFormStore(formSelectors.formMetadata);
  const formName = useFormStore((s) => s.form?.name);
  const updateFormName = useFormStore((s) => s.updateFormName);

  return (
    <div className="w-full space-y-6">
      <div className="space-y-2">
        <ComponentPropTitle title="Form Name" />
        <ShadInput
          value={formName || ''}
          onChange={(e) => updateFormName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <ComponentPropTitle title="Form Description" />
        <RichTextEditor
          value={formMetadata?.description || ''}
          onChange={(newHTML) => updateFormMetadata({ description: newHTML })}
        />
      </div>

      {/* Theme Options Section */}
      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-sm font-semibold">Theme Settings</h3>
        <RenderFormTheme />
      </div>
    </div>
  );
};

// Extracted Theme Renderer for cleaner organization
const RenderFormTheme = () => {
  // Grab the theme from the store, fallback to default if it hasn't been initialized yet
  const theme = useFormStore(formSelectors.formTheme) || DEFAULT_FORM_THEME;
  const updateFormTheme = useFormStore((s) => s.updateFormTheme);

  // Reusable native select with shadcn-like styling
  const SelectField = ({
    title,
    value,
    options,
    onChange,
  }: {
    title: string;
    value: string;
    options: Record<string, string>;
    onChange: (val: string) => void;
  }) => (
    <div className="space-y-2">
      <ComponentPropTitle title={title} />
      <ShadSelect value={value} onValueChange={onChange}>
        <ShadSelectTrigger className="w-full">
          <ShadSelectValue placeholder="Select an option" />
        </ShadSelectTrigger>
        <ShadSelectContent>
          {Object.entries(options).map(([key, val]) => (
            <ShadSelectItem key={val} value={val}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </ShadSelectItem>
          ))}
        </ShadSelectContent>
      </ShadSelect>
    </div>
  );

  return (
    <div className="space-y-4">
      <SelectField
        title="Color Mode"
        value={theme.mode}
        options={formThemeModes}
        onChange={(val) => updateFormTheme({ mode: val as formThemeMode })}
      />

      <SelectField
        title="Primary Color"
        value={theme.color}
        options={formThemeColors}
        onChange={(val) => updateFormTheme({ color: val as formThemeColor })}
      />

      <SelectField
        title="Heading Font"
        value={theme.headingFont.family}
        options={formFontNames}
        onChange={(val) =>
          updateFormTheme({ headingFont: { family: val as formFontName } })
        }
      />

      <SelectField
        title="Body Font"
        value={theme.bodyFont.family}
        options={formFontNames}
        onChange={(val) =>
          updateFormTheme({ bodyFont: { family: val as formFontName } })
        }
      />
    </div>
  );
};
