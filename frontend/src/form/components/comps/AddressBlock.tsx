import { useFormStore } from '@/form/store/form.store';
import type {
  BaseComponentProps,
  BasicValidation,
  ComponentMetadata,
  RendererProps,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import { inp, lbl, Card, Q } from '../ComponentRender.Helper';
import { useFormContext } from 'react-hook-form';
import { useFormMode } from '@/form/context/FormModeContext';
import { nanoid } from 'nanoid';

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
  metadata.label = `${metadata.label} ${nanoid(12)}`;
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

  // --- View Mode (Live Form with Validation) ---
  if (formMode === 'view' && formContext) {
    if (!formContext) {
      console.error('AddressBlockRenderer is not wrapped in a FormProvider.');
      return null;
    }

    const {
      register,
      formState: { errors },
    } = formContext;

    const isRequired = validation?.required;

    return (
      <Card className="rounded-none shadow-none">
        <Q html={props.questionText} />
        <div className="flex flex-col gap-3">
          <div>
            <label className={lbl}>Address Line 1</label>
            <input
              placeholder="123 Main St"
              className={inp}
              {...register(`${instanceId}_line1`, {
                required: isRequired ? 'Address Line 1 is required' : false,
              })}
            />
            {errors[`${instanceId}_line1`] && (
              <p className="mt-1 text-xs text-red-500">
                {errors[`${instanceId}_line1`]?.message as string}
              </p>
            )}
          </div>

          {props.showLine2 && (
            <div>
              <label className={lbl}>Address Line 2</label>
              <input
                placeholder="Apt, Suite, Unit"
                className={inp}
                {...register(`${instanceId}_line2`)} // Line 2 is rarely required
              />
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label className={lbl}>City</label>
              <input
                placeholder="City"
                className={inp}
                {...register(`${instanceId}_city`, {
                  required: isRequired ? 'City is required' : false,
                })}
              />
              {errors[`${instanceId}_city`] && (
                <p className="mt-1 text-xs text-red-500">
                  {errors[`${instanceId}_city`]?.message as string}
                </p>
              )}
            </div>

            {props.showState && (
              <div className="flex-1">
                <label className={lbl}>State / Province</label>
                <input
                  placeholder="State"
                  className={inp}
                  {...register(`${instanceId}_state`, {
                    required: isRequired ? 'State is required' : false,
                  })}
                />
                {errors[`${instanceId}_state`] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors[`${instanceId}_state`]?.message as string}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {props.showZip && (
              <div className="flex-1">
                <label className={lbl}>ZIP / Postal Code</label>
                <input
                  placeholder="ZIP Code"
                  className={inp}
                  {...register(`${instanceId}_zip`, {
                    required: isRequired ? 'ZIP Code is required' : false,
                  })}
                />
                {errors[`${instanceId}_zip`] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors[`${instanceId}_zip`]?.message as string}
                  </p>
                )}
              </div>
            )}

            {props.showCountry && (
              <div className="flex-1">
                <label className={lbl}>Country</label>
                <input
                  placeholder="Country"
                  className={inp}
                  {...register(`${instanceId}_country`, {
                    required: isRequired ? 'Country is required' : false,
                  })}
                />
                {errors[`${instanceId}_country`] && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors[`${instanceId}_country`]?.message as string}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // --- Builder Mode (Static/Preview) ---
  return (
    <Card className="rounded-none shadow-none">
      <Q html={props.questionText} />
      <div className="pointer-events-none flex flex-col gap-3 opacity-90">
        <div>
          <label className={lbl}>Address Line 1</label>
          <input readOnly placeholder="123 Main St" className={inp} />
        </div>
        {props.showLine2 && (
          <div>
            <label className={lbl}>Address Line 2</label>
            <input readOnly placeholder="Apt, Suite, Unit" className={inp} />
          </div>
        )}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className={lbl}>City</label>
            <input readOnly placeholder="City" className={inp} />
          </div>
          {props.showState && (
            <div className="flex-1">
              <label className={lbl}>State / Province</label>
              <input readOnly placeholder="State" className={inp} />
            </div>
          )}
        </div>
        <div className="flex gap-3">
          {props.showZip && (
            <div className="flex-1">
              <label className={lbl}>ZIP / Postal Code</label>
              <input readOnly placeholder="ZIP Code" className={inp} />
            </div>
          )}
          {props.showCountry && (
            <div className="flex-1">
              <label className={lbl}>Country</label>
              <input readOnly placeholder="Country" className={inp} />
            </div>
          )}
        </div>
      </div>
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
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={props.showLine2}
            onChange={(e) => u(instanceId, { showLine2: e.target.checked })}
            className="accent-primary"
          />
          Show Address Line 2
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={props.showState}
            onChange={(e) => u(instanceId, { showState: e.target.checked })}
            className="accent-primary"
          />
          Show State / Province
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={props.showZip}
            onChange={(e) => u(instanceId, { showZip: e.target.checked })}
            className="accent-primary"
          />
          Show ZIP / Postal Code
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={props.showCountry}
            onChange={(e) => u(instanceId, { showCountry: e.target.checked })}
            className="accent-primary"
          />
          Show Country
        </label>
      </div>

      <hr className="border-border" />

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={!!validation?.required}
          onChange={() => uv(instanceId, { required: !validation?.required })}
          className="accent-primary"
        />
        Required (Applies to all visible fields)
      </label>
    </div>
  );
}
