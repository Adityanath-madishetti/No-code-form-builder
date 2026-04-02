// src/form/components/NewComponentRenderers.tsx
/**
 * Functional renderers for all new components — boxy, flat design.
 */
import type { RendererProps } from './base';
import { useFormStore } from '../store/formStore';
import {
  Star,
  Heart,
  Circle,
  Upload,
  Image as ImageIcon,
  MapPin,
  PenTool,
  ShieldCheck,
  Plus,
  Trash2,
} from 'lucide-react';
import type {
  HeaderProps,
  LineDividerProps,
  ColumnLayoutProps,
  InputProps,
  InputValidation,
  MultiLineInputProps,
  EmailProps,
  PhoneProps,
  NumberProps,
  DecimalProps,
  URLProps,
  DateProps,
  TimeProps,
  FileUploadProps,
  ImageUploadProps,
  SingleChoiceGridProps,
  MultiChoiceGridProps,
  MatrixTableProps,
  RatingScaleProps,
  LinearScaleProps,
  SliderProps,
  AddressBlockProps,
  NameBlockProps,
  ColorPickerProps,
  SignatureProps,
  LocationProps,
  ToggleProps,
  RichTextInputProps,
  CaptchaProps,
  NoValidation,
  BasicValidation,
  TextValidation,
  NumericValidation,
  CheckboxProps,
  CheckboxOption,
  CheckboxValidation,
  DropdownProps,
  DropdownOption,
  DropdownValidation,
  RadioProps,
  RadioOption,
  RadioValidation,
} from './allComponents';

// ── Shared question text ──
function Q({ html }: { html?: string }) {
  if (!html) return null;
  const plain = html.replace(/<[^>]*>/g, '').trim();
  if (!plain) return null;
  return <p className="mb-2 text-sm font-medium text-foreground">{plain}</p>;
}

// ── Shared card ──
function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-border bg-background p-4 ${className}`}>
      {children}
    </div>
  );
}

// ── Shared input ──
const inp =
  'w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/40 transition-colors';
const lbl = 'text-[11px] font-medium text-muted-foreground mb-1 block';

// ════════════════════════════════════════
//  LAYOUT
// ════════════════════════════════════════

export function HeaderRenderer({
  instanceId,
  props,
}: RendererProps<HeaderProps, NoValidation>) {
  // const u = useFormStore((s) => s.updateComponentProps);
  const sizes: Record<string, string> = {
    h1: 'text-3xl font-bold',
    h2: 'text-2xl font-bold',
    h3: 'text-xl font-semibold',
    h4: 'text-lg font-semibold',
  };
  return (
    <div className="py-1">
      <label
        htmlFor={instanceId}
        className={`w-full bg-transparent outline-none placeholder:text-muted-foreground/20 ${sizes[props.level] || sizes.h2}`}
      >
        {props.text}
      </label>
    </div>
  );
}

export function HeaderPropsRenderer({
  instanceId,
  props,
}: RendererProps<HeaderProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Text</label>
        <input
          type="text"
          value={props.text}
          onChange={(e) => u(instanceId, { text: e.target.value })}
          className={inp}
        />
      </div>
      <div>
        <label className={lbl}>Level</label>
        <select
          value={props.level}
          onChange={(e) => u(instanceId, { level: e.target.value })}
          className={inp}
        >
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>
      </div>
    </div>
  );
}

export function LineDividerRenderer({
  props,
}: RendererProps<LineDividerProps, NoValidation>) {
  return (
    <div className="py-3">
      <hr
        className="border-border"
        style={{
          borderTopWidth: `${props.thickness}px`,
          borderStyle: props.style,
        }}
      />
    </div>
  );
}

export function LineDividerPropsRenderer({
  instanceId,
  props,
}: RendererProps<LineDividerProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Style</label>
        <select
          value={props.style}
          onChange={(e) => u(instanceId, { style: e.target.value })}
          className={inp}
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
        </select>
      </div>
      <div>
        <label className={lbl}>Thickness ({props.thickness}px)</label>
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={props.thickness}
          onChange={(e) => u(instanceId, { thickness: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>
    </div>
  );
}

export function ColumnLayoutRenderer(
  _props: RendererProps<ColumnLayoutProps, NoValidation>
) {
  void _props;
  return (
    <div className="border-2 border-dashed border-border/30 p-4 text-center text-xs text-muted-foreground/40">
      <p className="font-medium">Column Layout</p>
      <p className="mt-0.5">Drag components into columns (coming soon)</p>
    </div>
  );
}

// ════════════════════════════════════════
//  TEXT INPUTS
// ════════════════════════════════════════

export function InputComponentRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<InputProps, InputValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <input
        type="text"
        name={instanceId}
        placeholder={props.placeholder}
        defaultValue={props.defaultValue}
        className={inp}
        required={validation.required}
        minLength={validation.minLength}
        maxLength={validation.maxLength}
      />
    </Card>
  );
}

export function InputComponentPropsRenderer({
  instanceId,
  props,
  validation,
}: RendererProps<InputProps, InputValidation>) {
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
      <div>
        <label className={lbl}>Placeholder</label>
        <input
          type="text"
          value={props.placeholder || ''}
          onChange={(e) => u(instanceId, { placeholder: e.target.value })}
          className={inp}
        />
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
          checked={validation.required}
          onChange={() => uv(instanceId, { required: !validation.required })}
          className="accent-primary"
        />
        Required
      </label>
    </div>
  );
}

export function MultiLineInputRenderer({
  instanceId,
  props,
}: RendererProps<MultiLineInputProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <textarea
        value={props.defaultValue}
        onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
        placeholder={props.placeholder || 'Type your answer...'}
        rows={props.rows || 3}
        className={inp + ' resize-y'}
      />
    </Card>
  );
}

export function MultiLineInputPropsRenderer({
  instanceId,
  props,
}: RendererProps<MultiLineInputProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Placeholder</label>
        <input
          type="text"
          value={props.placeholder || ''}
          onChange={(e) => u(instanceId, { placeholder: e.target.value })}
          className={inp}
        />
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
      <div>
        <label className={lbl}>Rows</label>
        <input
          type="number"
          min={1}
          max={20}
          value={props.rows || 4}
          onChange={(e) => u(instanceId, { rows: Number(e.target.value) })}
          className={inp}
        />
      </div>
    </div>
  );
}

export function EmailRenderer({
  instanceId,
  props,
}: RendererProps<EmailProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <input
        type="email"
        value={props.defaultValue}
        onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
        placeholder={props.placeholder || 'user@example.com'}
        className={inp}
      />
    </Card>
  );
}

export function EmailPropsRenderer({
  instanceId,
  props,
}: RendererProps<EmailProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Placeholder</label>
        <input
          type="text"
          value={props.placeholder || ''}
          onChange={(e) => u(instanceId, { placeholder: e.target.value })}
          className={inp}
        />
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
    </div>
  );
}

export function PhoneRenderer({
  instanceId,
  props,
}: RendererProps<PhoneProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex gap-2">
        <input
          value={props.countryCode}
          onChange={(e) => u(instanceId, { countryCode: e.target.value })}
          className={inp + ' w-16 text-center'}
        />
        <input
          type="tel"
          value={props.defaultValue}
          onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
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
}: RendererProps<PhoneProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Placeholder</label>
        <input
          type="text"
          value={props.placeholder || ''}
          onChange={(e) => u(instanceId, { placeholder: e.target.value })}
          className={inp}
        />
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
      <div>
        <label className={lbl}>Country Code</label>
        <input
          type="text"
          value={props.countryCode || ''}
          onChange={(e) => u(instanceId, { countryCode: e.target.value })}
          className={inp}
        />
      </div>
    </div>
  );
}

export function NumberRenderer({
  instanceId,
  props,
}: RendererProps<NumberProps, NumericValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <input
        type="number"
        value={props.defaultValue}
        onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
        placeholder={props.placeholder || '0'}
        className={inp}
      />
    </Card>
  );
}

export function NumberPropsRenderer({
  instanceId,
  props,
}: RendererProps<NumberProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Placeholder</label>
        <input
          type="text"
          value={props.placeholder || ''}
          onChange={(e) => u(instanceId, { placeholder: e.target.value })}
          className={inp}
        />
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
    </div>
  );
}

export function DecimalRenderer({
  instanceId,
  props,
}: RendererProps<DecimalProps, NumericValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <input
        type="number"
        step={`0.${'0'.repeat((props.precision || 2) - 1)}1`}
        value={props.defaultValue}
        onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
        placeholder={props.placeholder || '0.00'}
        className={inp}
      />
    </Card>
  );
}

export function DecimalPropsRenderer({
  instanceId,
  props,
}: RendererProps<DecimalProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Placeholder</label>
        <input
          type="text"
          value={props.placeholder || ''}
          onChange={(e) => u(instanceId, { placeholder: e.target.value })}
          className={inp}
        />
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
      <div>
        <label className={lbl}>Decimal Precision</label>
        <input
          type="number"
          min={1}
          max={10}
          value={props.precision || 2}
          onChange={(e) => u(instanceId, { precision: Number(e.target.value) })}
          className={inp}
        />
      </div>
    </div>
  );
}

export function URLRenderer({
  instanceId,
  props,
}: RendererProps<URLProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <input
        type="url"
        value={props.defaultValue}
        onChange={(e) => u(instanceId, { defaultValue: e.target.value })}
        placeholder={props.placeholder || 'https://example.com'}
        className={inp}
      />
    </Card>
  );
}

export function URLPropsRenderer({
  instanceId,
  props,
}: RendererProps<URLProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Placeholder</label>
        <input
          type="text"
          value={props.placeholder || ''}
          onChange={(e) => u(instanceId, { placeholder: e.target.value })}
          className={inp}
        />
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
    </div>
  );
}

// ════════════════════════════════════════
//  DATE & TIME
// ════════════════════════════════════════

export function DateRenderer({
  props,
}: RendererProps<DateProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <input
        type={props.includeTime ? 'datetime-local' : 'date'}
        className={inp}
      />
    </Card>
  );
}

export function DatePropsRenderer({
  instanceId,
  props,
}: RendererProps<DateProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Placeholder</label>
        <input
          type="text"
          value={props.placeholder || ''}
          onChange={(e) => u(instanceId, { placeholder: e.target.value })}
          className={inp}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={props.includeTime}
          onChange={(e) => u(instanceId, { includeTime: e.target.checked })}
          className="accent-primary"
        />
        Include Time
      </label>
    </div>
  );
}

export function TimeRenderer({
  props,
}: RendererProps<TimeProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <input type="time" className={inp} />
    </Card>
  );
}

export function TimePropsRenderer({
  instanceId,
  props,
}: RendererProps<TimeProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Placeholder</label>
        <input
          type="text"
          value={props.placeholder || ''}
          onChange={(e) => u(instanceId, { placeholder: e.target.value })}
          className={inp}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={props.format24h}
          onChange={(e) => u(instanceId, { format24h: e.target.checked })}
          className="accent-primary"
        />
        24-hour format
      </label>
    </div>
  );
}

// ════════════════════════════════════════
//  FILE / MEDIA
// ════════════════════════════════════════

export function FileUploadRenderer({
  props,
}: RendererProps<FileUploadProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex flex-col items-center gap-2 border-2 border-dashed border-border/40 bg-muted/10 px-4 py-6 text-center">
        <Upload className="h-5 w-5 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground/50">
          Click or drag · Max {props.maxSizeMB}MB
          {props.multiple ? ' · Multiple' : ''}
        </p>
      </div>
    </Card>
  );
}

export function ImageUploadRenderer({
  props,
}: RendererProps<ImageUploadProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex flex-col items-center gap-2 border-2 border-dashed border-border/40 bg-muted/10 px-4 py-6 text-center">
        <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground/50">
          Upload image · Max {props.maxSizeMB}MB
          {props.multiple ? ' · Multiple' : ''}
        </p>
      </div>
    </Card>
  );
}

// ════════════════════════════════════════
//  CHECKBOX
// ════════════════════════════════════════

export function CheckboxComponentRenderer({
  props,
  instanceId,
}: RendererProps<CheckboxProps, CheckboxValidation>) {
  const isHorizontal = props.layout === 'horizontal';
  return (
    <Card>
      <Q html={props.questionText} />
      <div
        className={`flex ${
          isHorizontal ? 'flex-row flex-wrap gap-4' : 'flex-col gap-2'
        }`}
      >
        {(props.options || []).map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
          >
            <input
              type="checkbox"
              name={instanceId}
              value={option.value}
              defaultChecked={(props.defaultValues || []).includes(
                option.value
              )}
              className="accent-primary"
            />
            {option.label}
          </label>
        ))}
      </div>
    </Card>
  );
}

export function CheckboxComponentPropsRenderer({
  props,
  instanceId,
}: RendererProps<CheckboxProps, CheckboxValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);

  const handleAddOption = () => {
    const newOption: CheckboxOption = {
      id: crypto.randomUUID(),
      label: `Option ${(props.options?.length || 0) + 1}`,
      value: `option-${(props.options?.length || 0) + 1}`,
    };
    u(instanceId, { options: [...(props.options || []), newOption] });
  };

  const handleUpdateOption = (
    id: string,
    key: keyof CheckboxOption,
    val: string
  ) => {
    const updated = (props.options || []).map((opt) =>
      opt.id === id ? { ...opt, [key]: val } : opt
    );
    u(instanceId, { options: updated });
  };

  const handleRemoveOption = (id: string) => {
    const updated = (props.options || []).filter((opt) => opt.id !== id);
    const removedValue = (props.options || []).find(
      (opt) => opt.id === id
    )?.value;
    const newDefaults = (props.defaultValues || []).filter(
      (v) => v !== removedValue
    );
    u(instanceId, { options: updated, defaultValues: newDefaults });
  };

  const toggleDefaultValue = (value: string) => {
    const current = props.defaultValues || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    u(instanceId, { defaultValues: updated });
  };

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={lbl}>Options</label>
          <button
            type="button"
            onClick={handleAddOption}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {(props.options || []).map((option) => (
          <div key={option.id} className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={(props.defaultValues || []).includes(option.value)}
              onChange={() => toggleDefaultValue(option.value)}
              className="accent-primary"
              title="Default selected"
            />
            <input
              placeholder="Label"
              value={option.label}
              onChange={(e) =>
                handleUpdateOption(option.id, 'label', e.target.value)
              }
              className={inp + ' flex-1'}
            />
            <input
              placeholder="Value"
              value={option.value}
              onChange={(e) =>
                handleUpdateOption(option.id, 'value', e.target.value)
              }
              className={inp + ' flex-1'}
            />
            <button
              type="button"
              onClick={() => handleRemoveOption(option.id)}
              className="p-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {(!props.options || props.options.length === 0) && (
          <div className="border border-dashed border-border/40 p-3 text-center text-xs text-muted-foreground/50">
            No options added.
          </div>
        )}
      </div>

      <div>
        <label className={lbl}>Layout</label>
        <select
          value={props.layout || 'vertical'}
          onChange={(e) => u(instanceId, { layout: e.target.value })}
          className={inp}
        >
          <option value="vertical">Vertical</option>
          <option value="horizontal">Horizontal</option>
        </select>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  RADIO
// ════════════════════════════════════════

export function RadioComponentRenderer({
  props,
  instanceId,
}: RendererProps<RadioProps, RadioValidation>) {
  const isHorizontal = props.layout === 'horizontal';
  return (
    <Card>
      <Q html={props.questionText} />
      <div
        className={`flex ${
          isHorizontal ? 'flex-row flex-wrap gap-4' : 'flex-col gap-2'
        }`}
      >
        {(props.options || []).map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-2 text-sm text-foreground"
          >
            <input
              type="radio"
              name={instanceId}
              value={option.value}
              defaultChecked={props.defaultValue === option.value}
              className="accent-primary"
            />
            {option.label}
          </label>
        ))}
      </div>
    </Card>
  );
}

export function RadioComponentPropsRenderer({
  props,
  instanceId,
}: RendererProps<RadioProps, RadioValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);

  const handleAddOption = () => {
    const newOption: RadioOption = {
      id: crypto.randomUUID(),
      label: `Option ${(props.options?.length || 0) + 1}`,
      value: `option-${(props.options?.length || 0) + 1}`,
    };
    u(instanceId, { options: [...(props.options || []), newOption] });
  };

  const handleUpdateOption = (
    id: string,
    key: keyof RadioOption,
    val: string
  ) => {
    const updated = (props.options || []).map((opt) =>
      opt.id === id ? { ...opt, [key]: val } : opt
    );
    u(instanceId, { options: updated });
  };

  const handleRemoveOption = (id: string) => {
    const updated = (props.options || []).filter((opt) => opt.id !== id);
    u(instanceId, { options: updated });
  };

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={lbl}>Options</label>
          <button
            type="button"
            onClick={handleAddOption}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {(props.options || []).map((option) => (
          <div key={option.id} className="flex items-center gap-1.5">
            <input
              placeholder="Label"
              value={option.label}
              onChange={(e) =>
                handleUpdateOption(option.id, 'label', e.target.value)
              }
              className={inp + ' flex-1'}
            />
            <input
              placeholder="Value"
              value={option.value}
              onChange={(e) =>
                handleUpdateOption(option.id, 'value', e.target.value)
              }
              className={inp + ' flex-1'}
            />
            <button
              type="button"
              onClick={() => handleRemoveOption(option.id)}
              className="p-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {(!props.options || props.options.length === 0) && (
          <div className="border border-dashed border-border/40 p-3 text-center text-xs text-muted-foreground/50">
            No options added.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>Default Value</label>
          <select
            value={props.defaultValue || 'none'}
            onChange={(e) =>
              u(instanceId, {
                defaultValue:
                  e.target.value === 'none' ? undefined : e.target.value,
              })
            }
            className={inp}
          >
            <option value="none">None</option>
            {(props.options || []).map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl}>Layout</label>
          <select
            value={props.layout || 'vertical'}
            onChange={(e) =>
              u(instanceId, {
                layout: e.target.value as 'vertical' | 'horizontal',
              })
            }
            className={inp}
          >
            <option value="vertical">Vertical</option>
            <option value="horizontal">Horizontal</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  DROPDOWN
// ════════════════════════════════════════

export function DropdownComponentRenderer({
  props,
}: RendererProps<DropdownProps, DropdownValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <select defaultValue={props.defaultValue || ''} className={inp}>
        <option value="" disabled>
          {props.placeholder || 'Select an option...'}
        </option>
        {(props.options || []).map((option) => (
          <option key={option.id} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Card>
  );
}

export function DropdownComponentPropsRenderer({
  props,
  instanceId,
}: RendererProps<DropdownProps, DropdownValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);

  const handleAddOption = () => {
    const newOption: DropdownOption = {
      id: crypto.randomUUID(),
      label: `Option ${(props.options?.length || 0) + 1}`,
      value: `option-${(props.options?.length || 0) + 1}`,
    };
    u(instanceId, { options: [...(props.options || []), newOption] });
  };

  const handleUpdateOption = (
    id: string,
    key: keyof DropdownOption,
    val: string
  ) => {
    const updated = (props.options || []).map((opt) =>
      opt.id === id ? { ...opt, [key]: val } : opt
    );
    u(instanceId, { options: updated });
  };

  const handleRemoveOption = (id: string) => {
    const updated = (props.options || []).filter((opt) => opt.id !== id);
    u(instanceId, { options: updated });
  };

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
      <div>
        <label className={lbl}>Placeholder</label>
        <input
          type="text"
          value={props.placeholder || ''}
          onChange={(e) => u(instanceId, { placeholder: e.target.value })}
          className={inp}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={lbl}>Options</label>
          <button
            type="button"
            onClick={handleAddOption}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        {(props.options || []).map((option) => (
          <div key={option.id} className="flex items-center gap-1.5">
            <input
              placeholder="Label"
              value={option.label}
              onChange={(e) =>
                handleUpdateOption(option.id, 'label', e.target.value)
              }
              className={inp + ' flex-1'}
            />
            <input
              placeholder="Value"
              value={option.value}
              onChange={(e) =>
                handleUpdateOption(option.id, 'value', e.target.value)
              }
              className={inp + ' flex-1'}
            />
            <button
              type="button"
              onClick={() => handleRemoveOption(option.id)}
              className="p-1 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {(!props.options || props.options.length === 0) && (
          <div className="border border-dashed border-border/40 p-3 text-center text-xs text-muted-foreground/50">
            No options added.
          </div>
        )}
      </div>

      <div>
        <label className={lbl}>Default Value</label>
        <select
          value={props.defaultValue || 'none'}
          onChange={(e) =>
            u(instanceId, {
              defaultValue:
                e.target.value === 'none' ? undefined : e.target.value,
            })
          }
          className={inp}
        >
          <option value="none">None</option>
          {(props.options || []).map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  GRIDS
// ════════════════════════════════════════

export function SingleChoiceGridRenderer({
  props,
}: RendererProps<SingleChoiceGridProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="border-b border-border p-2 text-left text-[11px] font-medium text-muted-foreground" />
            {props.columns.map((c) => (
              <th
                key={c.id}
                className="border-b border-border p-2 text-center text-[11px] font-medium text-muted-foreground"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r) => (
            <tr key={r.id} className="border-b border-border/30">
              <td className="p-2 text-sm">{r.label}</td>
              {props.columns.map((c) => (
                <td key={c.id} className="p-2 text-center">
                  <input
                    type="radio"
                    name={`g-${r.id}`}
                    className="accent-primary"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function MultiChoiceGridRenderer({
  props,
}: RendererProps<MultiChoiceGridProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="border-b border-border p-2 text-left text-[11px] font-medium text-muted-foreground" />
            {props.columns.map((c) => (
              <th
                key={c.id}
                className="border-b border-border p-2 text-center text-[11px] font-medium text-muted-foreground"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r) => (
            <tr key={r.id} className="border-b border-border/30">
              <td className="p-2 text-sm">{r.label}</td>
              {props.columns.map((c) => (
                <td key={c.id} className="p-2 text-center">
                  <input type="checkbox" className="accent-primary" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function MatrixTableRenderer({
  props,
}: RendererProps<MatrixTableProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="border-b border-border p-2 text-left text-[11px] font-medium text-muted-foreground" />
            {props.columns.map((c) => (
              <th
                key={c.id}
                className="border-b border-border p-2 text-center text-[11px] font-medium text-muted-foreground"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r) => (
            <tr key={r.id} className="border-b border-border/30">
              <td className="p-2 text-sm">{r.label}</td>
              {props.columns.map((c) => (
                <td key={c.id} className="p-2">
                  <input
                    type={props.inputType === 'number' ? 'number' : 'text'}
                    placeholder="—"
                    className="w-full border border-border bg-background px-2 py-1 text-center text-sm outline-none focus:border-primary"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ════════════════════════════════════════
//  SCALES
// ════════════════════════════════════════

export function RatingScaleRenderer({
  props,
}: RendererProps<RatingScaleProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex gap-1">
        {Array.from({ length: props.maxRating }, (_, i) => (
          <button
            key={i}
            className="p-0.5 text-muted-foreground/25 transition-colors hover:text-amber-400"
          >
            {props.icon === 'star' && <Star className="h-5 w-5" />}
            {props.icon === 'heart' && <Heart className="h-5 w-5" />}
            {props.icon === 'circle' && <Circle className="h-5 w-5" />}
          </button>
        ))}
      </div>
    </Card>
  );
}

export function RatingScalePropsRenderer({
  instanceId,
  props,
}: RendererProps<RatingScaleProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Max Rating</label>
        <input
          type="number"
          min={1}
          max={10}
          value={props.maxRating}
          onChange={(e) => u(instanceId, { maxRating: Number(e.target.value) })}
          className={inp}
        />
      </div>
      <div>
        <label className={lbl}>Icon</label>
        <select
          value={props.icon}
          onChange={(e) => u(instanceId, { icon: e.target.value })}
          className={inp}
        >
          <option value="star">Star</option>
          <option value="heart">Heart</option>
          <option value="circle">Circle</option>
        </select>
      </div>
    </div>
  );
}

export function LinearScaleRenderer({
  props,
}: RendererProps<LinearScaleProps, BasicValidation>) {
  const count = props.max - props.min + 1;
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {props.minLabel}
        </span>
        <div className="flex flex-1 gap-0.5">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              className="flex h-8 flex-1 items-center justify-center border border-border text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5"
            >
              {props.min + i}
            </button>
          ))}
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {props.maxLabel}
        </span>
      </div>
    </Card>
  );
}

export function LinearScalePropsRenderer({
  instanceId,
  props,
}: RendererProps<LinearScaleProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Min</label>
        <input
          type="number"
          value={props.min}
          onChange={(e) => u(instanceId, { min: Number(e.target.value) })}
          className={inp}
        />
      </div>
      <div>
        <label className={lbl}>Max</label>
        <input
          type="number"
          value={props.max}
          onChange={(e) => u(instanceId, { max: Number(e.target.value) })}
          className={inp}
        />
      </div>
      <div>
        <label className={lbl}>Min Label</label>
        <input
          type="text"
          value={props.minLabel || ''}
          onChange={(e) => u(instanceId, { minLabel: e.target.value })}
          className={inp}
        />
      </div>
      <div>
        <label className={lbl}>Max Label</label>
        <input
          type="text"
          value={props.maxLabel || ''}
          onChange={(e) => u(instanceId, { maxLabel: e.target.value })}
          className={inp}
        />
      </div>
    </div>
  );
}

export function SliderRenderer({
  instanceId,
  props,
}: RendererProps<SliderProps, BasicValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground">{props.min}</span>
        <input
          type="range"
          min={props.min}
          max={props.max}
          step={props.step}
          value={props.defaultValue}
          onChange={(e) =>
            u(instanceId, { defaultValue: Number(e.target.value) })
          }
          className="flex-1 accent-primary"
        />
        <span className="text-[10px] text-muted-foreground">{props.max}</span>
        <span className="w-8 text-center text-sm font-semibold">
          {props.defaultValue}
        </span>
      </div>
    </Card>
  );
}

export function SliderPropsRenderer({
  instanceId,
  props,
}: RendererProps<SliderProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Min</label>
        <input
          type="number"
          value={props.min}
          onChange={(e) => u(instanceId, { min: Number(e.target.value) })}
          className={inp}
        />
      </div>
      <div>
        <label className={lbl}>Max</label>
        <input
          type="number"
          value={props.max}
          onChange={(e) => u(instanceId, { max: Number(e.target.value) })}
          className={inp}
        />
      </div>
      <div>
        <label className={lbl}>Step</label>
        <input
          type="number"
          min={1}
          value={props.step}
          onChange={(e) => u(instanceId, { step: Number(e.target.value) })}
          className={inp}
        />
      </div>
      <div>
        <label className={lbl}>Default Value</label>
        <input
          type="number"
          value={props.defaultValue}
          onChange={(e) =>
            u(instanceId, { defaultValue: Number(e.target.value) })
          }
          className={inp}
        />
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  BLOCKS
// ════════════════════════════════════════

export function AddressBlockRenderer({
  props,
}: RendererProps<AddressBlockProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex flex-col gap-1.5">
        <div>
          <label className={lbl}>Address Line 1</label>
          <input placeholder="123 Main St" className={inp} />
        </div>
        {props.showLine2 && (
          <div>
            <label className={lbl}>Address Line 2</label>
            <input placeholder="Apt, Suite" className={inp} />
          </div>
        )}
        <div className="flex gap-1.5">
          <div className="flex-1">
            <label className={lbl}>City</label>
            <input placeholder="City" className={inp} />
          </div>
          {props.showState && (
            <div className="flex-1">
              <label className={lbl}>State</label>
              <input placeholder="State" className={inp} />
            </div>
          )}
        </div>
        <div className="flex gap-1.5">
          {props.showZip && (
            <div className="flex-1">
              <label className={lbl}>ZIP</label>
              <input placeholder="ZIP" className={inp} />
            </div>
          )}
          {props.showCountry && (
            <div className="flex-1">
              <label className={lbl}>Country</label>
              <input placeholder="Country" className={inp} />
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
}: RendererProps<AddressBlockProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
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
        Show State
      </label>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={props.showZip}
          onChange={(e) => u(instanceId, { showZip: e.target.checked })}
          className="accent-primary"
        />
        Show ZIP Code
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
  );
}

export function NameBlockRenderer({
  props,
}: RendererProps<NameBlockProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex flex-col gap-1.5">
        {props.showPrefix && (
          <div>
            <label className={lbl}>Prefix</label>
            <input placeholder="Mr/Ms/Dr" className={inp} />
          </div>
        )}
        <div className="flex gap-1.5">
          <div className="flex-1">
            <label className={lbl}>First Name</label>
            <input placeholder="First" className={inp} />
          </div>
          {props.showMiddleName && (
            <div className="flex-1">
              <label className={lbl}>Middle</label>
              <input placeholder="Middle" className={inp} />
            </div>
          )}
          <div className="flex-1">
            <label className={lbl}>Last Name</label>
            <input placeholder="Last" className={inp} />
          </div>
        </div>
        {props.showSuffix && (
          <div>
            <label className={lbl}>Suffix</label>
            <input placeholder="Jr/Sr" className={inp} />
          </div>
        )}
      </div>
    </Card>
  );
}

export function NameBlockPropsRenderer({
  instanceId,
  props,
}: RendererProps<NameBlockProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={props.showPrefix}
          onChange={(e) => u(instanceId, { showPrefix: e.target.checked })}
          className="accent-primary"
        />
        Show Prefix
      </label>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={props.showMiddleName}
          onChange={(e) => u(instanceId, { showMiddleName: e.target.checked })}
          className="accent-primary"
        />
        Show Middle Name
      </label>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={props.showSuffix}
          onChange={(e) => u(instanceId, { showSuffix: e.target.checked })}
          className="accent-primary"
        />
        Show Suffix
      </label>
    </div>
  );
}

// ════════════════════════════════════════
//  SPECIALTY
// ════════════════════════════════════════

export function ColorPickerRenderer({
  instanceId,
  props,
}: RendererProps<ColorPickerProps, BasicValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={props.defaultColor}
          onChange={(e) => u(instanceId, { defaultColor: e.target.value })}
          className="h-9 w-12 cursor-pointer border border-border bg-background"
        />
        <input
          value={props.defaultColor}
          onChange={(e) => u(instanceId, { defaultColor: e.target.value })}
          className={inp + ' flex-1 font-mono'}
        />
      </div>
    </Card>
  );
}

export function SignatureRenderer({
  props,
}: RendererProps<SignatureProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex h-24 flex-col items-center justify-center border-2 border-dashed border-border/30">
        <PenTool className="h-4 w-4 text-muted-foreground/20" />
        <p className="mt-1 text-[10px] text-muted-foreground/30">Sign here</p>
      </div>
    </Card>
  );
}

export function LocationRenderer({
  props,
}: RendererProps<LocationProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex items-center gap-2">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        <input
          type="text"
          placeholder={props.placeholder || 'Search...'}
          className={inp + ' flex-1'}
        />
      </div>
      <div className="mt-2 flex h-24 items-center justify-center border border-border bg-muted/10 text-[10px] text-muted-foreground/30">
        Map
      </div>
    </Card>
  );
}

export function LocationPropsRenderer({
  instanceId,
  props,
}: RendererProps<LocationProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <div className="space-y-4">
      <div>
        <label className={lbl}>Placeholder</label>
        <input
          type="text"
          value={props.placeholder || ''}
          onChange={(e) => u(instanceId, { placeholder: e.target.value })}
          className={inp}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={props.useCurrentLocation}
          onChange={(e) =>
            u(instanceId, { useCurrentLocation: e.target.checked })
          }
          className="accent-primary"
        />
        Enable &quot;Use Current Location&quot; button
      </label>
    </div>
  );
}

export function ToggleRenderer({
  instanceId,
  props,
}: RendererProps<ToggleProps, BasicValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex items-center gap-3">
        <button
          onClick={() => u(instanceId, { defaultValue: !props.defaultValue })}
          className={`relative h-5 w-9 transition-colors ${props.defaultValue ? 'bg-primary' : 'bg-border'}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 bg-white shadow-sm transition-transform ${props.defaultValue ? 'left-[18px]' : 'left-0.5'}`}
          />
        </button>
        <span className="text-sm text-foreground">{props.label}</span>
      </div>
    </Card>
  );
}

export function RichTextInputRenderer({
  props,
}: RendererProps<RichTextInputProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="min-h-[60px] border border-border bg-background p-2">
        <div className="mb-1.5 flex gap-1 border-b border-border pb-1.5">
          <span className="cursor-pointer px-1.5 py-0.5 text-[10px] font-bold hover:bg-muted">
            B
          </span>
          <span className="cursor-pointer px-1.5 py-0.5 text-[10px] italic hover:bg-muted">
            I
          </span>
          <span className="cursor-pointer px-1.5 py-0.5 text-[10px] underline hover:bg-muted">
            U
          </span>
        </div>
        <p className="text-xs text-muted-foreground/40">
          {props.placeholder || 'Type formatted text...'}
        </p>
      </div>
    </Card>
  );
}

export function CaptchaRenderer(
  _props: RendererProps<CaptchaProps, NoValidation>
) {
  void _props;
  return (
    <Card>
      <div className="flex items-center gap-3 border border-border bg-muted/10 p-3">
        <ShieldCheck className="h-5 w-5 text-green-600/40" />
        <div className="flex-1">
          <p className="text-sm font-medium">I'm not a robot</p>
          <p className="text-[10px] text-muted-foreground/50">CAPTCHA</p>
        </div>
        <div className="h-6 w-6 border border-border" />
      </div>
    </Card>
  );
}
