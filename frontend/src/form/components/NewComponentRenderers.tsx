// src/form/components/NewComponentRenderers.tsx
/**
 * Functional renderers for all new components — boxy, flat design.
 */
import type { RendererProps } from './base';
import { useFormStore } from '../store/formStore';
import {
  Upload,
  Image as ImageIcon,
  MapPin,
  PenTool,
  ShieldCheck,
} from 'lucide-react';

import type { BasicValidation, NoValidation } from './base';

import type {
  ColumnLayoutProps,
  FileUploadProps,
  ImageUploadProps,
  SingleChoiceGridProps,
  MultiChoiceGridProps,
  MatrixTableProps,
  NameBlockProps,
  ColorPickerProps,
  SignatureProps,
  LocationProps,
  ToggleProps,
  RichTextInputProps,
  CaptchaProps,
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

// ════════════════════════════════════════
//  DATE & TIME
// ════════════════════════════════════════

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

// ════════════════════════════════════════
//  RADIO
// ════════════════════════════════════════

// ════════════════════════════════════════
//  DROPDOWN
// ════════════════════════════════════════

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

// ════════════════════════════════════════
//  BLOCKS
// ════════════════════════════════════════


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
