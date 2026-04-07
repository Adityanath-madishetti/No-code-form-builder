// src/pages/FormEditor/components/FormulaEditor.tsx
import { useState, useMemo, useRef, useCallback } from 'react';
import { Calculator, X } from 'lucide-react';
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

  /**
   * Fast lookup for 2-way conversion
   */
  const idToLabel = useMemo(() => new Map(fields.map((f) => [f.id, f.label])), [fields]);
  const labelToId = useMemo(() => new Map(fields.map((f) => [f.label, f.id])), [fields]);

  /**
   * useCallback for stability
   */
  const idsToLabels = useCallback((expr: string) => {
    if (!expr) return '';
    return expr.replace(/\{([^}]+)\}/g, (match, id) => {
      const label = idToLabel.get(id);
      return label ? `{${label}}` : match;
    });
  }, [idToLabel]);

  const labelsToIds = useCallback((expr: string) => {
    if (!expr) return '';
    return expr.replace(/\{([^}]+)\}/g, (match, label) => {
      const id = labelToId.get(label);
      return id ? `{${id}}` : match; 
    });
  }, [labelToId]);

  const displayValue = idsToLabels(expression);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onExpressionChange(labelsToIds(newValue)); 
  };

  const referencedFields = useMemo(() => {
    const matches = expression.match(/\{([^}]+)\}/g);
    if (!matches) return [];
    return matches.map((m) => m.slice(1, -1));
  }, [expression]);

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
        
      // sync with the parent
      onExpressionChange(labelsToIds(newDisplayValue));

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = start + labelToken.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    } else {
      const newDisplayValue = displayValue + labelToken;
      onExpressionChange(labelsToIds(newDisplayValue));
    }
    
    // setShowFieldHelper(false);
  };

  return (
    <div className="space-y-4">
      {/* Target field select */}
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
          ref={textareaRef}
          value={displayValue} 
          onChange={handleTextareaChange}
          placeholder="e.g. {Revenue} + {Costs} * 2"
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

      {/* System Debug / References */}
      {referencedFields.length > 0 && (
        <div className="space-y-2">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              System References (Debug)
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {referencedFields.map((fId, i) => {
                const field = fields.find((f) => f.id === fId);
                const isValid = !!field; 
                
                return (
                  <span
                    key={i}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-mono ${
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
          
          <p className="text-[10px] font-medium text-red-500/90 leading-tight">
            * Important: Field labels must be uniquely named across your form. If multiple fields share the exact same label, this formula may map to the wrong ID.
          </p>
        </div>
      )}
    </div>
  );
}