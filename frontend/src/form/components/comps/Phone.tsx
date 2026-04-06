import { useFormStore } from '@/form/store/formStore';
import type {
  BaseComponentProps,
  ComponentMetadata,
  TextValidation,
  RendererProps,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import { inp, lbl, Card, Q } from '../ComponentRender.Helper';
import { useFormContext } from 'react-hook-form';
import { useFormMode } from '@/form/context/FormModeContext';

// eslint-disable-next-line react-refresh/only-export-components
export const COUNTRY_DIAL_CODES = [
  { name: 'United States', code: 'US', dialCode: '+1' },
  { name: 'Canada', code: 'CA', dialCode: '+1' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44' },
  { name: 'Australia', code: 'AU', dialCode: '+61' },
  { name: 'India', code: 'IN', dialCode: '+91' },
  { name: 'Germany', code: 'DE', dialCode: '+49' },
  { name: 'France', code: 'FR', dialCode: '+33' },
  { name: 'Japan', code: 'JP', dialCode: '+81' },
  { name: 'China', code: 'CN', dialCode: '+86' },
  { name: 'Brazil', code: 'BR', dialCode: '+55' },
  { name: 'Mexico', code: 'MX', dialCode: '+52' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27' },
  // ... you can expand this with a full list of ISO country codes
];

export interface PhoneProps extends BaseComponentProps {
  questionText: string;
  placeholder: string;
  defaultValue: string;
  countryCode: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const createPhoneComponent = (
  instanceId: string,
  metadata: ComponentMetadata,
  props?: Partial<PhoneProps>
) =>
  createComponent(
    ComponentIDs.Phone,
    instanceId,
    metadata,
    {
      questionText: 'Phone number',
      placeholder: '(555) 000-0000',
      defaultValue: '',
      countryCode: '+1',
      hiddenByDefault: false,
      ...props,
    },
    {
      required: false,
      pattern: '^\\+?[0-9\\-\\(\\)\\s]{7,15}$', // Generic phone regex allowing digits, spaces, dashes, parentheses
    } as TextValidation
  );

export function PhoneRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<PhoneProps, TextValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();

  // --- View Mode (Live Form with Validation) ---
  if (formMode === 'view' && formContext) {
    if (!formContext) {
      console.error('PhoneRenderer is not wrapped in a FormProvider.');
      return null;
    }

    const {
      register,
      formState: { errors },
    } = formContext;

    return (
      <Card className="rounded-none shadow-none">
        <Q html={props.questionText} />
        <div className="flex gap-2">
          <select
            defaultValue={props.countryCode}
            className={`${inp} max-w-[150px] cursor-pointer px-1 text-center`}
            {...register(`${instanceId}_countryCode`)} // Registering this separately
          >
            {COUNTRY_DIAL_CODES.map((country) => (
              <option key={country.code} value={country.dialCode}>
                {country.code} ({country.dialCode})
              </option>
            ))}
          </select>
          <input
            type="tel"
            placeholder={props.placeholder || '(555) 000-0000'}
            defaultValue={props.defaultValue}
            className={inp + ' flex-1'}
            {...register(instanceId, {
              required: validation?.required ? 'This field is required' : false,
              pattern: validation?.pattern
                ? {
                    value: new RegExp(validation.pattern),
                    message: 'Invalid phone number format',
                  }
                : undefined,
            })}
          />
        </div>
        {errors[instanceId] && (
          <p className="mt-1 text-sm text-red-500">
            {errors[instanceId]?.message as string}
          </p>
        )}
      </Card>
    );
  }

  // --- Builder Mode (Static/Preview) ---
  return (
    <Card className="rounded-none shadow-none">
      <Q html={props.questionText} />
      <div className="flex gap-2">
        <select
          value={props.countryCode}
          disabled // Keep it disabled in builder view so it acts as a preview
          className={`${inp} max-w-[150px] cursor-not-allowed px-1 text-center opacity-70`}
        >
          {/* Mapped the options here so the builder shows the full "US (+1)" text */}
          {COUNTRY_DIAL_CODES.map((country) => (
            <option key={country.code} value={country.dialCode}>
              {country.code} ({country.dialCode})
            </option>
          ))}
        </select>
        <input
          type="tel"
          readOnly
          value={props.defaultValue}
          placeholder={props.placeholder || '(555) 000-0000'}
          className={inp + ' flex-1'}
        />
      </div>
    </Card>
  );
}

export function PhonePropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<PhoneProps, TextValidation>) {
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Country Code</label>
          <select
            value={props.countryCode || '+1'}
            onChange={(e) => u(instanceId, { countryCode: e.target.value })}
            className={inp}
          >
            {COUNTRY_DIAL_CODES.map((country) => (
              <option key={country.code} value={country.dialCode}>
                {country.name} ({country.dialCode})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>Placeholder</label>
          <input
            type="text"
            value={props.placeholder || ''}
            onChange={(e) => u(instanceId, { placeholder: e.target.value })}
            className={inp}
          />
        </div>
      </div>

      <div>
        <label className={lbl}>Default Value</label>
        <input
          type="text"
          value={props.defaultValue || ''}
          onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
          className={inp}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={!!validation?.required}
          onChange={() => uv(instanceId, { required: !validation?.required })}
          className="accent-primary"
        />
        Required
      </label>
    </div>
  );
}
