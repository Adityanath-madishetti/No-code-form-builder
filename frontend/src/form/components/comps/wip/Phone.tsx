import { useFormStore } from '@/form/store/form.store';
import type {
  BaseComponentProps,
  ComponentMetadata,
  TextValidation,
  RendererProps,
} from '../base';
import { ComponentIDs, createComponent } from '../base';

import { inp, lbl } from '../ComponentRender.Helper';
import { Controller, useFormContext } from 'react-hook-form';
import { useFormMode } from '@/form/context/FormModeContext';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useState } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const COUNTRY_DIAL_CODES = [
  { name: 'Null', code: '', dialCode: '0' },
  { name: 'United States', code: 'US', dialCode: '+1' },
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
) => {
  return createComponent(
    ComponentIDs.Phone,
    instanceId,
    metadata,
    {
      questionText: 'Phone number',
      placeholder: '99xxx xxxxx',
      defaultValue: '',
      countryCode: '',
      hiddenByDefault: false,
      ...props,
    },
    {
      required: false,
      pattern: '^\\+?[0-9\\-\\(\\)\\s]{7,15}$', // Generic phone regex allowing digits, spaces, dashes, parentheses
    } as TextValidation
  );
};

export function PhoneRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<PhoneProps, TextValidation>) {
  const formMode = useFormMode();
  const formContext = useFormContext();

  // Start with empty strings instead of defaulting to +1
  const [code, setCode] = useState(props.countryCode || '');
  const [num, setNum] = useState(props.defaultValue || '');

  if (formMode === 'view' && formContext) {
    const {
      control,
      formState: { errors },
    } = formContext;

    // Determine initial stitched value safely
    const initialRHFValue =
      props.countryCode || props.defaultValue
        ? `${props.countryCode || ''} ${props.defaultValue || ''}`.trim()
        : '';

    return (
      <Card>
        <CardContent className="space-y-3">
          <Label htmlFor={instanceId} className="block text-base font-semibold">
            {props.questionText}
          </Label>

          <Controller
            control={control}
            name={instanceId}
            defaultValue={initialRHFValue}
            rules={{
              required: validation?.required ? 'This field is required' : false,
              pattern: validation?.pattern
                ? {
                    value: new RegExp(validation.pattern),
                    message: 'Invalid phone number format',
                  }
                : undefined,
            }}
            render={({ field }) => {
              const handleCodeChange = (newCode: string) => {
                setCode(newCode);
                // If both are empty, output empty string so `required: false` passes validation
                if (!newCode && !num) {
                  field.onChange('');
                } else {
                  field.onChange(`${newCode} ${num}`.trim());
                }
              };

              const handleNumChange = (
                e: React.ChangeEvent<HTMLInputElement>
              ) => {
                const newNum = e.target.value;
                setNum(newNum);
                // If both are empty, output empty string so `required: false` passes validation
                if (!code && !newNum) {
                  field.onChange('');
                } else {
                  field.onChange(`${code} ${newNum}`.trim());
                }
              };

              return (
                <div className="flex gap-2">
                  <Select
                    value={code || undefined} // undefined forces the Radix placeholder to show
                    onValueChange={handleCodeChange}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_DIAL_CODES.map((country) => (
                        <SelectItem key={country.code} value={country.dialCode}>
                          {country.code} ({country.dialCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    id={instanceId}
                    type="tel"
                    value={num}
                    onChange={handleNumChange}
                    onBlur={field.onBlur}
                    placeholder={props.placeholder || '(555) 000-0000'}
                    className="flex-1"
                  />
                </div>
              );
            }}
          />

          {errors[instanceId] && (
            <p className="text-[0.8rem] font-medium text-destructive">
              {errors[instanceId]?.message as string}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Builder Mode
  return (
    <Card>
      <CardContent className="space-y-3">
        <Label className="block text-base font-semibold">
          {props.questionText}
        </Label>
        <div className="flex gap-2">
          <Select disabled value={props.countryCode || undefined}>
            <SelectTrigger className="w-[140px] opacity-70">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              {COUNTRY_DIAL_CODES.map((country) => (
                <SelectItem key={country.code} value={country.dialCode}>
                  {country.code} ({country.dialCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="tel"
            readOnly
            value={props.defaultValue}
            placeholder={props.placeholder || '(555) 000-0000'}
            className="flex-1"
            disabled
          />
        </div>
      </CardContent>
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

      <div className="pt-1">
        <label className="flex items-center justify-between text-xs text-muted-foreground">
          Required
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
