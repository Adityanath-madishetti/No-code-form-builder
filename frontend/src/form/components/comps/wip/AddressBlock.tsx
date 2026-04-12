import { useFormStore } from '@/form/store/form.store';
import type {
  BaseComponentProps,
  BasicValidation,
  ComponentMetadata,
  RendererProps,
} from '../../base';
import { ComponentIDs, createComponent } from '../../base';

import { inp, lbl } from '../../ComponentRender.Helper';
import { useFormContext } from 'react-hook-form';
import { useFormMode } from '@/form/context/FormModeContext';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AddressBlockProps extends BaseComponentProps {
  questionText: string;
  showLine2: boolean;
  showState: boolean;
  showZip: boolean;
  showCountry: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createAddressBlockComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<AddressBlockProps>
) => {
  return createComponent(
    ComponentIDs.AddressBlock,
    instanceId,
    metadata,
    {
      questionText: 'Enter your address',
      showLine2: true,
      showState: true,
      showZip: true,
      showCountry: true,
      hiddenByDefault: false,
      ...props,
    },
    { required: false } as BasicValidation
  );
};

export function AddressBlockRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<AddressBlockProps, BasicValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();

  if (formMode === 'view' && formContext) {
    const {
      register,
      formState: { errors },
    } = formContext;

    const isRequired = validation?.required;

    // Because we use dot notation, RHF groups the errors into an object under the instanceId
    const addressErrors = errors[instanceId] as
      | Record<string, { message?: string }>
      | undefined;

    return (
      <Card>
        <CardContent className="space-y-3">
          <Label className="block text-base font-semibold">
            {props.questionText}
          </Label>
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor={`${instanceId}_line1`}>Address Line 1</Label>
              {/* Note the dot notation in register: `${instanceId}.line1` */}
              <Input
                id={`${instanceId}_line1`}
                placeholder="123 Main St"
                {...register(`${instanceId}.line1`, {
                  required: isRequired ? 'Address Line 1 is required' : false,
                })}
              />
              {addressErrors?.line1?.message && (
                <p className="text-[0.8rem] font-medium text-destructive">
                  {addressErrors.line1.message}
                </p>
              )}
            </div>

            {props.showLine2 && (
              <div className="space-y-1.5">
                <Label htmlFor={`${instanceId}_line2`}>Address Line 2</Label>
                <Input
                  id={`${instanceId}_line2`}
                  placeholder="Apt, Suite, Unit"
                  {...register(`${instanceId}.line2`)}
                />
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor={`${instanceId}_city`}>City</Label>
                <Input
                  id={`${instanceId}_city`}
                  placeholder="City"
                  {...register(`${instanceId}.city`, {
                    required: isRequired ? 'City is required' : false,
                  })}
                />
                {addressErrors?.city?.message && (
                  <p className="text-[0.8rem] font-medium text-destructive">
                    {addressErrors.city.message}
                  </p>
                )}
              </div>

              {props.showState && (
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`${instanceId}_state`}>
                    State / Province
                  </Label>
                  <Input
                    id={`${instanceId}_state`}
                    placeholder="State"
                    {...register(`${instanceId}.state`, {
                      required: isRequired ? 'State is required' : false,
                    })}
                  />
                  {addressErrors?.state?.message && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {addressErrors.state.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              {props.showZip && (
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`${instanceId}_zip`}>ZIP / Postal Code</Label>
                  <Input
                    id={`${instanceId}_zip`}
                    placeholder="ZIP Code"
                    {...register(`${instanceId}.zip`, {
                      required: isRequired ? 'ZIP Code is required' : false,
                    })}
                  />
                  {addressErrors?.zip?.message && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {addressErrors.zip.message}
                    </p>
                  )}
                </div>
              )}

              {props.showCountry && (
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`${instanceId}_country`}>Country</Label>
                  <Input
                    id={`${instanceId}_country`}
                    placeholder="Country"
                    {...register(`${instanceId}.country`, {
                      required: isRequired ? 'Country is required' : false,
                    })}
                  />
                  {addressErrors?.country?.message && (
                    <p className="text-[0.8rem] font-medium text-destructive">
                      {addressErrors.country.message}
                    </p>
                  )}
                </div>
              )}
            </div>
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
          <div className="space-y-1.5">
            <Label>Address Line 1</Label>
            <Input readOnly placeholder="123 Main St" />
          </div>
          {props.showLine2 && (
            <div className="space-y-1.5">
              <Label>Address Line 2</Label>
              <Input readOnly placeholder="Apt, Suite, Unit" />
            </div>
          )}
          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <Label>City</Label>
              <Input readOnly placeholder="City" />
            </div>
            {props.showState && (
              <div className="flex-1 space-y-1.5">
                <Label>State / Province</Label>
                <Input readOnly placeholder="State" />
              </div>
            )}
          </div>
          <div className="flex gap-4">
            {props.showZip && (
              <div className="flex-1 space-y-1.5">
                <Label>ZIP / Postal Code</Label>
                <Input readOnly placeholder="ZIP Code" />
              </div>
            )}
            {props.showCountry && (
              <div className="flex-1 space-y-1.5">
                <Label>Country</Label>
                <Input readOnly placeholder="Country" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AddressBlockPropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<AddressBlockProps, BasicValidation>) {
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
          Show Address Line 2
          <input
            type="checkbox"
            checked={props.showLine2}
            onChange={(e) => u(instanceId, { showLine2: e.target.checked })}
            className="accent-primary"
          />
        </label>

        <label className="flex items-center justify-between text-xs text-muted-foreground">
          Show State / Province
          <input
            type="checkbox"
            checked={props.showState}
            onChange={(e) => u(instanceId, { showState: e.target.checked })}
            className="accent-primary"
          />
        </label>

        <label className="flex items-center justify-between text-xs text-muted-foreground">
          Show ZIP / Postal Code
          <input
            type="checkbox"
            checked={props.showZip}
            onChange={(e) => u(instanceId, { showZip: e.target.checked })}
            className="accent-primary"
          />
        </label>

        <label className="flex items-center justify-between text-xs text-muted-foreground">
          Show Country
          <input
            type="checkbox"
            checked={props.showCountry}
            onChange={(e) => u(instanceId, { showCountry: e.target.checked })}
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
