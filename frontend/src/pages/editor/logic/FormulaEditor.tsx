// src/pages/FormEditor/components/FormulaEditor.tsx
// TODO: sanitize the expression input to prevent XSS or other injection attacks.
// Currently we trust that only form builders can edit this, but if we ever expose it to end-users, we need to be careful.
import { useState, useMemo, useRef, useCallback } from 'react';
import { Calculator, X, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FieldOption {
  id: string;
  label: string;
}

interface FormulaEditorProps {
  expression: string; // The system version: e.g., "{field_1} + 2"
  targetId: string;
  fields: FieldOption[];
  targets: { id: string; label: string }[];
  onExpressionChange: (expr: string) => void;
  onTargetChange: (targetId: string) => void;
}

const MAX_HISTORY = 50;

export function FormulaEditor({
  expression,
  targetId,
  fields,
  targets,
  onExpressionChange,
  onTargetChange,
}: FormulaEditorProps) {
  const [showFieldHelper, setShowFieldHelper] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- History Stack State ---
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  // 1. Create lookup maps
  const idToLabel = useMemo(
    () => new Map(fields.map((f) => [f.id, f.label])),
    [fields]
  );
  const labelToId = useMemo(
    () => new Map(fields.map((f) => [f.label, f.id])),
    [fields]
  );

  const idsToLabels = useCallback(
    (expr: string) => {
      if (!expr) return '';
      return expr.replace(/\{([^}]+)\}/g, (match, id) => {
        const label = idToLabel.get(id);
        return label ? `{${label}}` : match;
      });
    },
    [idToLabel]
  );

  const labelsToIds = useCallback(
    (expr: string) => {
      if (!expr) return '';
      return expr.replace(/\{([^}]+)\}/g, (match, label) => {
        const id = labelToId.get(label);
        return id ? `{${id}}` : match;
      });
    },
    [labelToId]
  );

  const displayValue = idsToLabels(expression);

  const commitChange = useCallback(
    (newSystemExpr: string) => {
      if (newSystemExpr === expression) return; // Ignore if no actual change

      setPast((prev) => {
        const newPast = [...prev, expression];
        return newPast.length > MAX_HISTORY ? newPast.slice(1) : newPast;
      });
      setFuture([]); // Typing clears the redo stack
      onExpressionChange(newSystemExpr);
    },
    [expression, onExpressionChange]
  );

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture((prev) => [expression, ...prev]);
    onExpressionChange(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setFuture(newFuture);
    setPast((prev) => [...prev, expression]);
    onExpressionChange(next);
  };

  // 4. Handle Textarea Typing
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    commitChange(labelsToIds(e.target.value));
  };

  const insertField = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;

    const labelToken = `{${field.label}}`;

    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;

      const newDisplayValue =
        displayValue.substring(0, start) +
        labelToken +
        displayValue.substring(end);

      commitChange(labelsToIds(newDisplayValue));

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = start + labelToken.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    } else {
      const newDisplayValue = displayValue + labelToken;
      commitChange(labelsToIds(newDisplayValue));
    }

    setShowFieldHelper(false);
  };

  const referencedFields = useMemo(() => {
    const matches = expression.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    return matches.map((m) => m.slice(1, -1));
  }, [expression]);

  return (
    <div className="space-y-4">
      {/* Target field select */}
      <div>
        <label className="mb-1 block text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
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
        <div className="mb-1 flex items-center justify-between">
          <label className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
            Formula
          </label>

          {/* Toolbar */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5"
              onClick={handleUndo}
              disabled={past.length === 0}
              title="Undo"
            >
              <Undo2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-1.5"
              onClick={handleRedo}
              disabled={future.length === 0}
              title="Redo"
            >
              <Redo2 className="h-3 w-3" />
            </Button>
            <div className="mx-1 h-3 w-[1px] bg-border" /> {/* Divider */}
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
        </div>

        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={handleTextareaChange}
          placeholder="e.g. {Revenue} + {Costs} * 2"
          className="h-20 w-full resize-none rounded border border-input bg-background px-2 py-1.5 font-mono text-xs"
        />

        {/* Quick-insert helper */}
        {showFieldHelper && (
          <div className="mt-1 rounded border border-border bg-background p-2 shadow-lg">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground">
                Click to insert
              </span>
              <button onClick={() => setShowFieldHelper(false)}>
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {fields.map((f) => (
                <button
                  key={f.id}
                  onClick={() => insertField(f.id)}
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  {'{' + f.label + '}'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* System Debug / References */}
      {referencedFields.length > 0 && (
        <div className="space-y-2">
          <div>
            <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              System References (Debug)
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {referencedFields.map((fId, i) => {
                const field = fields.find((f) => f.id === fId);
                const isValid = !!field;

                return (
                  <span
                    key={i}
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                      isValid
                        ? 'bg-violet-500/10 text-violet-600'
                        : 'bg-red-500/10 text-red-600'
                    }`}
                  >
                    {isValid ? `${field.label} [${fId}]` : `Unknown [${fId}]`}
                  </span>
                );
              })}
            </div>
          </div>

          <p className="text-[10px] leading-tight font-medium text-red-500/90">
            * Important: Field labels must be uniquely named across your form.
            If multiple fields share the exact same label, this formula may map
            to the wrong ID.
          </p>
        </div>
      )}
    </div>
  );
}
