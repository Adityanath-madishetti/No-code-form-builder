// src/form/components/NewComponentRenderers.tsx
/**
 * Functional renderers for all new components — boxy, flat design.
 */
import type { RendererProps } from './base';
import { useFormStore } from '../store/formStore';
import {
  Star,
  Upload,
  Image as ImageIcon,
  MapPin,
  PenTool,
  ShieldCheck,
} from 'lucide-react';
import type {
  HeaderProps,
  LineDividerProps,
  ColumnLayoutProps,
  MultiLineTextProps,
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
} from './allComponents';

// ── Shared question text ──
function Q({ html }: { html?: string }) {
  if (!html) return null;
  const plain = html.replace(/<[^>]*>/g, '').trim();
  if (!plain) return null;
  return <p className="mb-2 text-sm font-medium text-foreground">{plain}</p>;
}

// ── Shared card ──
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-border bg-background p-4 ${className}`}>
      {children}
    </div>
  );
}

// ── Shared input ──
const inp = 'w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/40 transition-colors';
const lbl = 'text-[11px] font-medium text-muted-foreground mb-1 block';

// ════════════════════════════════════════
//  LAYOUT
// ════════════════════════════════════════

export function HeaderRenderer({ instanceId, props }: RendererProps<HeaderProps, NoValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  const sizes: Record<string, string> = { h1: 'text-3xl font-bold', h2: 'text-2xl font-bold', h3: 'text-xl font-semibold', h4: 'text-lg font-semibold' };
  return (
    <div className="py-1">
      <input
        value={props.text}
        onChange={(e) => u(instanceId, { text: e.target.value })}
        placeholder="Heading..."
        className={`w-full bg-transparent outline-none placeholder:text-muted-foreground/20 ${sizes[props.level] || sizes.h2}`}
      />
    </div>
  );
}

export function LineDividerRenderer({}: RendererProps<LineDividerProps, NoValidation>) {
  return <div className="py-3"><hr className="border-border" /></div>;
}

export function ColumnLayoutRenderer({}: RendererProps<ColumnLayoutProps, NoValidation>) {
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

export function MultiLineTextRenderer({ instanceId, props }: RendererProps<MultiLineTextProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <textarea value={props.defaultValue} onChange={(e) => u(instanceId, { defaultValue: e.target.value })} placeholder={props.placeholder || 'Type your answer...'} rows={props.rows || 3} className={inp + ' resize-y'} />
    </Card>
  );
}

export function EmailRenderer({ instanceId, props }: RendererProps<EmailProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <input type="email" value={props.defaultValue} onChange={(e) => u(instanceId, { defaultValue: e.target.value })} placeholder={props.placeholder || 'user@example.com'} className={inp} />
    </Card>
  );
}

export function PhoneRenderer({ instanceId, props }: RendererProps<PhoneProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex gap-2">
        <input value={props.countryCode} onChange={(e) => u(instanceId, { countryCode: e.target.value })} className={inp + ' w-16 text-center'} />
        <input type="tel" value={props.defaultValue} onChange={(e) => u(instanceId, { defaultValue: e.target.value })} placeholder={props.placeholder || '(555) 000-0000'} className={inp + ' flex-1'} />
      </div>
    </Card>
  );
}

export function NumberRenderer({ instanceId, props }: RendererProps<NumberProps, NumericValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <input type="number" value={props.defaultValue} onChange={(e) => u(instanceId, { defaultValue: e.target.value })} placeholder={props.placeholder || '0'} className={inp} />
    </Card>
  );
}

export function DecimalRenderer({ instanceId, props }: RendererProps<DecimalProps, NumericValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <input type="number" step={`0.${'0'.repeat((props.precision || 2) - 1)}1`} value={props.defaultValue} onChange={(e) => u(instanceId, { defaultValue: e.target.value })} placeholder={props.placeholder || '0.00'} className={inp} />
    </Card>
  );
}

export function URLRenderer({ instanceId, props }: RendererProps<URLProps, TextValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <input type="url" value={props.defaultValue} onChange={(e) => u(instanceId, { defaultValue: e.target.value })} placeholder={props.placeholder || 'https://example.com'} className={inp} />
    </Card>
  );
}

// ════════════════════════════════════════
//  DATE & TIME
// ════════════════════════════════════════

export function DateRenderer({ props }: RendererProps<DateProps, BasicValidation>) {
  return <Card><Q html={props.questionText} /><input type={props.includeTime ? 'datetime-local' : 'date'} className={inp} /></Card>;
}

export function TimeRenderer({ props }: RendererProps<TimeProps, BasicValidation>) {
  return <Card><Q html={props.questionText} /><input type="time" className={inp} /></Card>;
}

// ════════════════════════════════════════
//  FILE / MEDIA
// ════════════════════════════════════════

export function FileUploadRenderer({ props }: RendererProps<FileUploadProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex flex-col items-center gap-2 border-2 border-dashed border-border/40 bg-muted/10 px-4 py-6 text-center">
        <Upload className="h-5 w-5 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground/50">Click or drag · Max {props.maxSizeMB}MB{props.multiple ? ' · Multiple' : ''}</p>
      </div>
    </Card>
  );
}

export function ImageUploadRenderer({ props }: RendererProps<ImageUploadProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex flex-col items-center gap-2 border-2 border-dashed border-border/40 bg-muted/10 px-4 py-6 text-center">
        <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground/50">Upload image · Max {props.maxSizeMB}MB{props.multiple ? ' · Multiple' : ''}</p>
      </div>
    </Card>
  );
}

// ════════════════════════════════════════
//  GRIDS
// ════════════════════════════════════════

export function SingleChoiceGridRenderer({ props }: RendererProps<SingleChoiceGridProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <table className="w-full text-sm">
        <thead><tr>
          <th className="border-b border-border p-2 text-left text-[11px] font-medium text-muted-foreground" />
          {props.columns.map((c) => <th key={c.id} className="border-b border-border p-2 text-center text-[11px] font-medium text-muted-foreground">{c.label}</th>)}
        </tr></thead>
        <tbody>
          {props.rows.map((r) => <tr key={r.id} className="border-b border-border/30">
            <td className="p-2 text-sm">{r.label}</td>
            {props.columns.map((c) => <td key={c.id} className="p-2 text-center"><input type="radio" name={`g-${r.id}`} className="accent-primary" /></td>)}
          </tr>)}
        </tbody>
      </table>
    </Card>
  );
}

export function MultiChoiceGridRenderer({ props }: RendererProps<MultiChoiceGridProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <table className="w-full text-sm">
        <thead><tr>
          <th className="border-b border-border p-2 text-left text-[11px] font-medium text-muted-foreground" />
          {props.columns.map((c) => <th key={c.id} className="border-b border-border p-2 text-center text-[11px] font-medium text-muted-foreground">{c.label}</th>)}
        </tr></thead>
        <tbody>
          {props.rows.map((r) => <tr key={r.id} className="border-b border-border/30">
            <td className="p-2 text-sm">{r.label}</td>
            {props.columns.map((c) => <td key={c.id} className="p-2 text-center"><input type="checkbox" className="accent-primary" /></td>)}
          </tr>)}
        </tbody>
      </table>
    </Card>
  );
}

export function MatrixTableRenderer({ props }: RendererProps<MatrixTableProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <table className="w-full text-sm">
        <thead><tr>
          <th className="border-b border-border p-2 text-left text-[11px] font-medium text-muted-foreground" />
          {props.columns.map((c) => <th key={c.id} className="border-b border-border p-2 text-center text-[11px] font-medium text-muted-foreground">{c.label}</th>)}
        </tr></thead>
        <tbody>
          {props.rows.map((r) => <tr key={r.id} className="border-b border-border/30">
            <td className="p-2 text-sm">{r.label}</td>
            {props.columns.map((c) => <td key={c.id} className="p-2"><input type={props.inputType === 'number' ? 'number' : 'text'} placeholder="—" className="w-full border border-border bg-background px-2 py-1 text-center text-sm outline-none focus:border-primary" /></td>)}
          </tr>)}
        </tbody>
      </table>
    </Card>
  );
}

// ════════════════════════════════════════
//  SCALES
// ════════════════════════════════════════

export function RatingScaleRenderer({ props }: RendererProps<RatingScaleProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex gap-1">
        {Array.from({ length: props.maxRating }, (_, i) => (
          <button key={i} className="p-0.5 text-muted-foreground/25 hover:text-amber-400 transition-colors">
            <Star className="h-5 w-5" />
          </button>
        ))}
      </div>
    </Card>
  );
}

export function LinearScaleRenderer({ props }: RendererProps<LinearScaleProps, BasicValidation>) {
  const count = props.max - props.min + 1;
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground shrink-0">{props.minLabel}</span>
        <div className="flex flex-1 gap-0.5">
          {Array.from({ length: count }, (_, i) => (
            <button key={i} className="flex h-8 flex-1 items-center justify-center border border-border text-xs font-medium text-foreground hover:border-primary hover:bg-primary/5 transition-colors">
              {props.min + i}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0">{props.maxLabel}</span>
      </div>
    </Card>
  );
}

export function SliderRenderer({ instanceId, props }: RendererProps<SliderProps, BasicValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground">{props.min}</span>
        <input type="range" min={props.min} max={props.max} step={props.step} value={props.defaultValue} onChange={(e) => u(instanceId, { defaultValue: Number(e.target.value) })} className="flex-1 accent-primary" />
        <span className="text-[10px] text-muted-foreground">{props.max}</span>
        <span className="w-8 text-center text-sm font-semibold">{props.defaultValue}</span>
      </div>
    </Card>
  );
}

// ════════════════════════════════════════
//  BLOCKS
// ════════════════════════════════════════

export function AddressBlockRenderer({ props }: RendererProps<AddressBlockProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex flex-col gap-1.5">
        <div><label className={lbl}>Address Line 1</label><input placeholder="123 Main St" className={inp} /></div>
        {props.showLine2 && <div><label className={lbl}>Address Line 2</label><input placeholder="Apt, Suite" className={inp} /></div>}
        <div className="flex gap-1.5">
          <div className="flex-1"><label className={lbl}>City</label><input placeholder="City" className={inp} /></div>
          {props.showState && <div className="flex-1"><label className={lbl}>State</label><input placeholder="State" className={inp} /></div>}
        </div>
        <div className="flex gap-1.5">
          {props.showZip && <div className="flex-1"><label className={lbl}>ZIP</label><input placeholder="ZIP" className={inp} /></div>}
          {props.showCountry && <div className="flex-1"><label className={lbl}>Country</label><input placeholder="Country" className={inp} /></div>}
        </div>
      </div>
    </Card>
  );
}

export function NameBlockRenderer({ props }: RendererProps<NameBlockProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex flex-col gap-1.5">
        {props.showPrefix && <div><label className={lbl}>Prefix</label><input placeholder="Mr/Ms/Dr" className={inp} /></div>}
        <div className="flex gap-1.5">
          <div className="flex-1"><label className={lbl}>First Name</label><input placeholder="First" className={inp} /></div>
          {props.showMiddleName && <div className="flex-1"><label className={lbl}>Middle</label><input placeholder="Middle" className={inp} /></div>}
          <div className="flex-1"><label className={lbl}>Last Name</label><input placeholder="Last" className={inp} /></div>
        </div>
        {props.showSuffix && <div><label className={lbl}>Suffix</label><input placeholder="Jr/Sr" className={inp} /></div>}
      </div>
    </Card>
  );
}

// ════════════════════════════════════════
//  SPECIALTY
// ════════════════════════════════════════

export function ColorPickerRenderer({ instanceId, props }: RendererProps<ColorPickerProps, BasicValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex items-center gap-2">
        <input type="color" value={props.defaultColor} onChange={(e) => u(instanceId, { defaultColor: e.target.value })} className="h-9 w-12 cursor-pointer border border-border bg-background" />
        <input value={props.defaultColor} onChange={(e) => u(instanceId, { defaultColor: e.target.value })} className={inp + ' flex-1 font-mono'} />
      </div>
    </Card>
  );
}

export function SignatureRenderer({ props }: RendererProps<SignatureProps, BasicValidation>) {
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

export function LocationRenderer({ props }: RendererProps<LocationProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex items-center gap-2">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
        <input type="text" placeholder={props.placeholder || 'Search...'} className={inp + ' flex-1'} />
      </div>
      <div className="mt-2 h-24 border border-border bg-muted/10 flex items-center justify-center text-[10px] text-muted-foreground/30">Map</div>
    </Card>
  );
}

export function ToggleRenderer({ instanceId, props }: RendererProps<ToggleProps, BasicValidation>) {
  const u = useFormStore((s) => s.updateComponentProps);
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="flex items-center gap-3">
        <button onClick={() => u(instanceId, { defaultValue: !props.defaultValue })} className={`relative h-5 w-9 transition-colors ${props.defaultValue ? 'bg-primary' : 'bg-border'}`}>
          <span className={`absolute top-0.5 h-4 w-4 bg-white shadow-sm transition-transform ${props.defaultValue ? 'left-[18px]' : 'left-0.5'}`} />
        </button>
        <span className="text-sm text-foreground">{props.label}</span>
      </div>
    </Card>
  );
}

export function RichTextInputRenderer({ props }: RendererProps<RichTextInputProps, BasicValidation>) {
  return (
    <Card>
      <Q html={props.questionText} />
      <div className="min-h-[60px] border border-border bg-background p-2">
        <div className="mb-1.5 flex gap-1 border-b border-border pb-1.5">
          <span className="px-1.5 py-0.5 text-[10px] font-bold hover:bg-muted cursor-pointer">B</span>
          <span className="px-1.5 py-0.5 text-[10px] italic hover:bg-muted cursor-pointer">I</span>
          <span className="px-1.5 py-0.5 text-[10px] underline hover:bg-muted cursor-pointer">U</span>
        </div>
        <p className="text-xs text-muted-foreground/40">{props.placeholder || 'Type formatted text...'}</p>
      </div>
    </Card>
  );
}

export function CaptchaRenderer({}: RendererProps<CaptchaProps, NoValidation>) {
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
