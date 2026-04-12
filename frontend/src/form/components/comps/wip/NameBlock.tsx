import { useFormStore } from '@/form/store/form.store';
import type {
  BaseComponentProps,
  BasicValidation,
  ComponentMetadata,
  RendererProps,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import { inp, lbl } from '../ComponentRender.Helper';
import { useFormContext } from 'react-hook-form';
import { useFormMode } from '@/form/context/FormModeContext';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface NameBlockProps extends BaseComponentProps {
  questionText: string;
  showMiddleName: boolean;
  showPrefix: boolean;
  showSuffix: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createNameBlockComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<NameBlockProps>
) => {
  return createComponent(
    ComponentIDs.NameBlock,
    instanceId,
    metadata,
    {
      questionText: 'Enter your name',
      showMiddleName: false,
      showPrefix: false,
      showSuffix: false,
      hiddenByDefault: false,
      ...props,
    },
    { required: false } as BasicValidation
  );
};

export function NameBlockRenderer({
  instanceId, // Added this since we need it for RHF
  props,
  validation,
}: RendererProps<NameBlockProps, BasicValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();

  // --- View Mode (Live Form with Validation) ---
  if (formMode === 'view' && formContext) {
    const {
      register,
      formState: { errors },
    } = formContext;

    const isRequired = validation?.required;

    // Because we use dot notation, RHF groups the errors into an object under the instanceId
    const nameErrors = errors[instanceId] as
      | Record<string, { message?: string }>
      | undefined;

    return (
      <Card>
        <CardContent className="space-y-3">
          <Label className="block text-base font-semibold">
            {props.questionText}
          </Label>
          <div className="flex flex-col gap-4">
            {props.showPrefix && (
              <div className="w-1/3 min-w-[120px] space-y-1.5">
                <Label htmlFor={`${instanceId}_prefix`}>Prefix</Label>
                {/* Note the dot notation: instanceId.prefix */}
                <Input
                  id={`${instanceId}_prefix`}
                  placeholder="Mr/Ms/Dr"
                  {...register(`${instanceId}.prefix`)}
                />
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor={`${instanceId}_firstName`}>First Name</Label>
                <Input
                  id={`${instanceId}_firstName`}
                  placeholder="First"
                  {...register(`${instanceId}.firstName`, {
                    required: isRequired ? 'First name is required' : false,
                  })}
                />
                {nameErrors?.firstName?.message && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    {nameErrors.firstName.message}
                  </p>
                )}
              </div>

              {props.showMiddleName && (
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`${instanceId}_middleName`}>
                    Middle Name
                  </Label>
                  <Input
                    id={`${instanceId}_middleName`}
                    placeholder="Middle"
                    {...register(`${instanceId}.middleName`)}
                  />
                </div>
              )}

              <div className="flex-1 space-y-1.5">
                <Label htmlFor={`${instanceId}_lastName`}>Last Name</Label>
                <Input
                  id={`${instanceId}_lastName`}
                  placeholder="Last"
                  {...register(`${instanceId}.lastName`, {
                    required: isRequired ? 'Last name is required' : false,
                  })}
                />
                {nameErrors?.lastName?.message && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    {nameErrors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {props.showSuffix && (
              <div className="w-1/3 min-w-[120px] space-y-1.5">
                <Label htmlFor={`${instanceId}_suffix`}>Suffix</Label>
                <Input
                  id={`${instanceId}_suffix`}
                  placeholder="Jr/Sr"
                  {...register(`${instanceId}.suffix`)}
                />
              </div>
            )}
          </div>
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
        <div className="pointer-events-none flex flex-col gap-4 opacity-70">
          {props.showPrefix && (
            <div className="w-1/3 min-w-[120px] space-y-1.5">
              <Label>Prefix</Label>
              <Input readOnly placeholder="Mr/Ms/Dr" />
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1 space-y-1.5">
              <Label>First Name</Label>
              <Input readOnly placeholder="First" />
            </div>

            {props.showMiddleName && (
              <div className="flex-1 space-y-1.5">
                <Label>Middle Name</Label>
                <Input readOnly placeholder="Middle" />
              </div>
            )}

            <div className="flex-1 space-y-1.5">
              <Label>Last Name</Label>
              <Input readOnly placeholder="Last" />
            </div>
          </div>

          {props.showSuffix && (
            <div className="w-1/3 min-w-[120px] space-y-1.5">
              <Label>Suffix</Label>
              <Input readOnly placeholder="Jr/Sr" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
export function NameBlockPropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<NameBlockProps, BasicValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  const uv = useFormStore((s) => s.updateComponentValidation);
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
      <div className="space-y-3 pt-2">
        <label className="flex items-center justify-between text-xs text-muted-foreground">
          Show Prefix
          <input
            type="checkbox"
            checked={props.showPrefix}
            onChange={(e) => u(instanceId, { showPrefix: e.target.checked })}
            className="accent-primary"
          />
        </label>

        <label className="flex items-center justify-between text-xs text-muted-foreground">
          Show Middle Name
          <input
            type="checkbox"
            checked={props.showMiddleName}
            onChange={(e) =>
              u(instanceId, { showMiddleName: e.target.checked })
            }
            className="accent-primary"
          />
        </label>

        <label className="flex items-center justify-between text-xs text-muted-foreground">
          Show Suffix
          <input
            type="checkbox"
            checked={props.showSuffix}
            onChange={(e) => u(instanceId, { showSuffix: e.target.checked })}
            className="accent-primary"
          />
        </label>
      </div>
      <div className="pt-1">
        <label className="flex items-center justify-between text-xs text-muted-foreground">
          Required (Applies to all visible fields)
          <input
            type="checkbox"
            checked={!!validation?.required}
            onChange={() => uv(instanceId, { required: !validation?.required })}
            className="accent-primary"
          />
        </label>
      </div>
    </div>
  );
}
