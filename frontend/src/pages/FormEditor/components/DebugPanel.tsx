// src/pages/FormEditor/components/DebugPanel.tsx
import { useFormStore } from '@/form/store/form.store';
import { serializeFormFromState } from '@/form/store/formSerialization';
import { useMemo, useState } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';

export function DebugPanel() {
  const form = useFormStore((s) => s.form);
  const pages = useFormStore((s) => s.pages);
  const components = useFormStore((s) => s.components);
  const [copied, setCopied] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { json, error } = useMemo(() => {
    void refreshKey;
    try {
      if (!form) throw new Error('No form loaded');
      const serialized = serializeFormFromState({ form, pages, components });
      return { json: JSON.stringify(serialized, null, 2), error: null as string | null };
    } catch (e) {
      return { json: '', error: String(e) };
    }
  }, [components, form, pages, refreshKey]);

  const handleCopy = () => {
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Header actions */}
      <div className="flex items-center gap-2">
        <span className="flex-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Form JSON
        </span>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleCopy}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Copy JSON"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {error ? (
        <div className="rounded-md bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-muted/60 p-3">
          <pre className="text-[11px] leading-relaxed text-foreground/80 whitespace-pre-wrap break-all">
            {json}
          </pre>
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground/50">
        Debug only — removed at release
      </p>
    </div>
  );
}
