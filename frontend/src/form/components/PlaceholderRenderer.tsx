// src/form/components/PlaceholderRenderer.tsx
/**
 * Generic placeholder renderer used for new components that don't yet have
 * a full custom renderer. Renders the component's label + basic props display.
 */
import type { RendererProps } from './base';

interface GenericProps {
  questionText?: string;
  text?: string;
  title?: string;
  placeholder?: string;
  [key: string]: unknown;
}

export function PlaceholderRenderer({
  metadata,
  props,
}: RendererProps<GenericProps, unknown>) {
  const label = metadata.label || 'Component';
  const question =
    props.questionText || props.text || props.title || '';

  // Strip HTML tags for plain display
  const plainQuestion = question.replace(/<[^>]*>/g, '').trim();

  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </p>
      {plainQuestion && (
        <p className="mt-1 text-sm text-foreground/70">{plainQuestion}</p>
      )}
      {props.placeholder && (
        <div className="mt-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          {props.placeholder}
        </div>
      )}
    </div>
  );
}

// Reusable no-op settings renderer
export function PlaceholderSettingsRenderer({ metadata }: RendererProps<unknown, unknown>) {
  return (
    <p className="text-sm text-muted-foreground italic">
      Settings for {metadata.label} coming soon.
    </p>
  );
}
