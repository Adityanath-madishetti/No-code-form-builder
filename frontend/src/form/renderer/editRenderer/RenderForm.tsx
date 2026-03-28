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
    <div className="mx-auto flex h-auto w-full max-w-3xl flex-col gap-6">
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
      <div className="flex flex-col gap-6">
        {form.pages.map((page, index) => (
          <RenderPage key={page} pageId={page} index={index} />
        ))}
      </div>
    </div>
  );
};

// TODO
export const RenderFormOverview = () => {
  const updateFormMetadata = useFormStore((s) => s.updateFormMetadata);
  const formMetadata = useFormStore(formSelectors.formMetadata);
  const formName = useFormStore((s) => s.form?.name);
  const updateFormName = useFormStore((s) => s.updateFormName);

  return (
    <div className="w-full space-y-2">
      <ComponentPropTitle title="Form Name" />
      <ShadInput
        value={formName}
        onChange={(e) => updateFormName(e.target.value)}
      />

      <ComponentPropTitle title="Form Description" />
      <RichTextEditor
        value={formMetadata?.description || ''}
        onChange={(newHTML) => updateFormMetadata({ description: newHTML })}
      />
    </div>
  );
};
