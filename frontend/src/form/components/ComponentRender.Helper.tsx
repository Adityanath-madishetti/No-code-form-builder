import { Label } from '@/components/ui/label';

export const ComponentPropTitle = ({ title }: { title: string }) => {
  return (
    <Label className="mb-1 block text-sm font-medium text-muted-foreground">
      {title}
    </Label>
  );
};

export const inp =
  'w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/40 transition-colors';
export const lbl = 'text-[11px] font-medium text-muted-foreground mb-1 block';

export function Q({ html }: { html?: string }) {
  if (!html) return null;
  const plain = html.replace(/<[^>]*>/g, '').trim();
  if (!plain) return null;
  return <p className="mb-2 text-sm font-medium text-foreground">{plain}</p>;
}

// ── Shared card ──
export function Card({
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
