// src/pages/FormEditor/components/FormulaEditor.tsx
/**
 * Formula expression editor with field reference hints.
 * Users type expressions like: {field1} + {field2} * 2
 */
import { useState, useMemo } from 'react';
import { Calculator, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FieldOption {
  id: string;
  label: string;
}

interface FormulaEditorProps {
  expression: string;
  targetId: string;
  fields: FieldOption[];
  targets: { id: string; label: string }[];
  onExpressionChange: (expr: string) => void;
  onTargetChange: (targetId: string) => void;
}

export function FormulaEditor({
  expression,
  targetId,
  fields,
  targets,
  onExpressionChange,
  onTargetChange,
}: FormulaEditorProps) {
  const [showFieldHelper, setShowFieldHelper] = useState(false);

  const referencedFields = useMemo(() => {
    const matches = expression.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    return matches.map((m) => m.slice(1, -1));
  }, [expression]);

  const insertField = (fieldId: string) => {
    onExpressionChange(expression + `{${fieldId}}`);
    setShowFieldHelper(false);
  };

  return (
    <div className="space-y-3">
      {/* Target field */}
      <div>
        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Store result in
        </label>
        <select
          value={targetId}
          onChange={(e) => onTargetChange(e.target.value)}
          className="h-8 w-full rounded border border-input bg-background px-2 text-xs"
        >
          <option value="">Select target field…</option>
          {targets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Expression input */}
      <div>
        <div className="mb-1 flex items-center gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Formula
          </label>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px]"
            onClick={() => setShowFieldHelper(!showFieldHelper)}
          >
            <Calculator className="mr-0.5 h-2.5 w-2.5" />
            Insert field
          </Button>
        </div>

        <textarea
          value={expression}
          onChange={(e) => onExpressionChange(e.target.value)}
          placeholder="e.g. {field_id_1} + {field_id_2} * 2"
          className="h-20 w-full rounded border border-input bg-background px-2 py-1.5 font-mono text-xs resize-none"
        />

        {/* Quick-insert helper */}
        {showFieldHelper && (
          <div className="mt-1 rounded border border-border bg-background p-2 shadow-lg">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground">Click to insert</span>
              <button onClick={() => setShowFieldHelper(false)}>
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {fields.map((f) => (
                <button
                  key={f.id}
                  onClick={() => insertField(f.id)}
                  className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {'{' + f.label + '}'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Referenced fields */}
      {referencedFields.length > 0 && (
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            References
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {referencedFields.map((fId, i) => {
              const field = fields.find((f) => f.id === fId);
              return (
                <span
                  key={i}
                  className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-mono text-violet-600"
                >
                  {field?.label || fId}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
